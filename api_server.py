"""
FastAPI Backend for PRD Review System
Provides REST API and Server-Sent Events (SSE) streaming for the multi-agent workflow
"""

import json
import asyncio
import os
from typing import AsyncGenerator, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

# Import our existing workflow
from demo2_multi_agent.langgraph_workflow import create_workflow
from demo2_multi_agent.persona_scaling import load_segments, scale_personas, generate_persona_variation


# ============================================================================
# Pydantic Models for API
# ============================================================================

class SegmentConfig(BaseModel):
    """Configuration for a demographic segment"""
    segment_id: str
    count: int = Field(ge=0, le=100, description="Number of personas for this segment")
    # Optional fields for custom segments
    custom_name: str | None = Field(default=None, description="Name for custom segment")
    custom_description: str | None = Field(default=None, description="Description for custom segment")

class PRDReviewRequest(BaseModel):
    """Request to review a PRD"""
    prd_content: str = Field(..., description="The PRD markdown content to review")
    num_personas: int = Field(default=50, ge=4, le=300, description="Number of synthetic personas (4-300)")
    segments: list[SegmentConfig] | None = Field(default=None, description="Optional custom segment distribution")


class StreamEvent(BaseModel):
    """Event sent via SSE stream"""
    type: str  # "progress", "persona_generated", "review_complete", "debate_complete", "final_result", "error"
    timestamp: str
    data: Dict[str, Any]


# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="PRD Review System API",
    description="Multi-agent synthetic user review system with real-time streaming",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Helper Functions
# ============================================================================

async def send_event(event_type: str, data: Dict[str, Any]) -> str:
    """Format SSE event - EventSourceResponse auto-adds 'data:' prefix"""
    event = StreamEvent(
        type=event_type,
        timestamp=datetime.utcnow().isoformat(),
        data=data
    )
    # EventSourceResponse automatically adds "data: " prefix, so we just return the JSON
    return event.model_dump_json()


async def stream_prd_review(
    prd_content: str,
    num_personas: int,
    segment_configs: list[SegmentConfig] | None = None
) -> AsyncGenerator[str, None]:
    """
    Generator that yields SSE events as the workflow progresses
    """
    try:
        # Event 1: Started
        yield await send_event("progress", {
            "phase": "initialization",
            "message": f"Starting PRD review with {num_personas} personas"
        })

        # Load segments and generate personas
        yield await send_event("progress", {
            "phase": "persona_generation",
            "message": "Loading demographic segments..."
        })

        all_segments = load_segments()

        # Build segment distribution
        if segment_configs:
            # Custom distribution from frontend
            segment_distribution = {}
            for config in segment_configs:
                if config.count > 0:  # Only include segments with non-zero count
                    # Check if it's a custom segment
                    if config.segment_id.startswith('custom_'):
                        # Create a generic segment template for custom segments
                        custom_segment = {
                            "segment_id": config.segment_id,
                            "demographic": {
                                "age_range": "18-65",
                                "income_level": "varied",
                                "family_status": "varied",
                                "employment": "varied"
                            },
                            "behavioral": {
                                "tech_savviness": "moderate",
                                "time_constraints": "moderate",
                                "budget_sensitivity": "moderate",
                                "feature_priorities": ["usability", "value", "functionality"]
                            }
                        }

                        # Add custom description if provided
                        if config.custom_name:
                            custom_segment["custom_name"] = config.custom_name
                        if config.custom_description:
                            custom_segment["custom_description"] = config.custom_description

                        segment_distribution[config.segment_id] = {
                            "segment": custom_segment,
                            "count": config.count
                        }
                    else:
                        # Find matching segment from loaded segments
                        matching_segment = next((s for s in all_segments if s['segment_id'] == config.segment_id), None)
                        if matching_segment:
                            segment_distribution[config.segment_id] = {
                                "segment": matching_segment,
                                "count": config.count
                            }

            active_segments = len(segment_distribution)
            yield await send_event("progress", {
                "phase": "persona_generation",
                "message": f"Generating {num_personas} personas across {active_segments} custom segments...",
            })
        else:
            # Default: Even distribution across all segments
            personas_per_segment = num_personas // len(all_segments)
            segment_distribution = {
                seg['segment_id']: {
                    "segment": seg,
                    "count": personas_per_segment
                }
                for seg in all_segments
            }

            yield await send_event("progress", {
                "phase": "persona_generation",
                "message": f"Generating {num_personas} personas across {len(all_segments)} segments...",
            })

        # Generate personas one-by-one for real-time updates
        all_personas = []
        persona_to_segment = {}  # Track which segment each persona belongs to
        variation_index = 0

        for segment_id, config in segment_distribution.items():
            segment = config["segment"]
            count = config["count"]

            yield await send_event("progress", {
                "phase": "persona_generation",
                "message": f"Generating {count} personas for {segment_id}...",
                "segment": segment_id
            })

            for i in range(count):
                # Generate one persona at a time
                persona = generate_persona_variation(segment, variation_index)
                all_personas.append(persona)
                persona_to_segment[persona.name] = segment_id
                variation_index += 1

                # Send update after each persona with full details
                yield await send_event("persona_generated", {
                    "segment": segment_id,
                    "persona": {
                        "name": persona.name,
                        "age": persona.age,
                        "occupation": persona.occupation,
                        "tech_comfort": persona.tech_comfort,
                        "income_level": persona.income_level,
                        "pain_points": persona.pain_points,
                        "goals": persona.goals,
                        "preferred_channels": persona.preferred_channels,
                        "quote": persona.quote
                    },
                    "count": 1,
                    "total_so_far": len(all_personas)
                })

        yield await send_event("progress", {
            "phase": "persona_generation_complete",
            "message": f"Generated {len(all_personas)} personas",
            "total_personas": len(all_personas)
        })

        # Create workflow
        yield await send_event("progress", {
            "phase": "workflow_creation",
            "message": "Initializing LangGraph workflow..."
        })

        workflow_builder = create_workflow()
        workflow = workflow_builder.compile()

        # Run workflow with progress updates
        yield await send_event("progress", {
            "phase": "phase1_reviews",
            "message": f"Phase 1: Running {len(all_personas)} independent PRD reviews..."
        })

        # Initial state
        initial_state = {
            "personas": all_personas,
            "personas_count": len(all_personas),
            "prd_content": prd_content,
            "reviews": [],
            "debates": [],
            "insights": None,
            "negative_sentiment_pct": 0.0
        }

        # Run reviews one-by-one with streaming
        yield await send_event("progress", {
            "phase": "phase1_executing",
            "message": "Running independent reviews...",
        })

        reviews = []
        for i, persona in enumerate(all_personas):
            try:
                # Run single review
                from baml_client import b
                review = b.ReviewPRD(
                    persona_name=persona.name,
                    persona_age=persona.age,
                    persona_occupation=persona.occupation,
                    persona_tech_comfort=persona.tech_comfort,
                    persona_pain_points=persona.pain_points,
                    persona_goals=persona.goals,
                    persona_segment=persona_to_segment.get(persona.name, "unknown"),
                    prd_content=prd_content
                )
                reviews.append(review)

                # Stream each review
                yield await send_event("review_generated", {
                    "reviewer_name": review.reviewer_name,
                    "overall_sentiment": review.overall_sentiment,
                    "willingness_to_adopt": review.willingness_to_adopt,
                    "key_concerns": review.key_concerns or [],
                    "what_they_loved": review.what_they_loved or [],
                    "dealbreakers": review.dealbreakers or [],
                    "reasoning": review.reasoning,
                    "persona_quote": review.persona_quote,
                    "total_so_far": len(reviews)
                })

            except Exception as e:
                print(f"Error reviewing as {persona.name}: {e}")
                continue

        # Calculate sentiment - count both negative AND neutral as "concerning"
        negative_count = sum(1 for r in reviews if r.overall_sentiment == "negative")
        neutral_count = sum(1 for r in reviews if r.overall_sentiment == "neutral")
        concerning_count = negative_count + neutral_count
        negative_sentiment_pct = (negative_count / len(reviews) * 100) if reviews else 0
        concerning_sentiment_pct = (concerning_count / len(reviews) * 100) if reviews else 0

        yield await send_event("review_complete", {
            "total_reviews": len(reviews),
            "negative_sentiment_pct": negative_sentiment_pct
        })

        # Run debates if concerning sentiment (neutral + negative) is high
        debates = []
        # Trigger debates if 20%+ of reviews are neutral or negative
        if concerning_sentiment_pct > 20:
            yield await send_event("progress", {
                "phase": "debates_starting",
                "message": f"Concerning sentiment detected ({concerning_sentiment_pct:.1f}% neutral/negative) - running agent debates...",
            })

            # Group reviews by segment
            segment_reviews = {}
            for review in reviews:
                segment = review.reviewer_segment
                if segment not in segment_reviews:
                    segment_reviews[segment] = []
                segment_reviews[segment].append(review)

            # Run debates for segments with negative/critical feedback
            for segment_id, seg_reviews in segment_reviews.items():
                # Check if this segment has negative or critical reviews
                seg_negative = sum(1 for r in seg_reviews if r.overall_sentiment in ["negative", "neutral"])
                if seg_negative >= 2:  # Need at least 2 reviews with concerns to debate
                    try:
                        yield await send_event("progress", {
                            "phase": "debate_running",
                            "message": f"Running debate for {segment_id} segment...",
                        })

                        # Prepare reviews JSON for this segment
                        seg_reviews_json = json.dumps([{
                            "reviewer_name": r.reviewer_name,
                            "overall_sentiment": r.overall_sentiment,
                            "willingness_to_adopt": r.willingness_to_adopt,
                            "key_concerns": r.key_concerns or [],
                            "missing_features": r.missing_features or [],
                            "what_they_loved": r.what_they_loved or [],
                            "dealbreakers": r.dealbreakers or [],
                            "reasoning": r.reasoning
                        } for r in seg_reviews])

                        # Run debate
                        debate = b.FacilitateDebate(
                            topic=f"PRD concerns and missing features for {segment_id}",
                            segment_name=segment_id,
                            reviews_json=seg_reviews_json
                        )
                        debates.append(debate)

                        # Stream the debate
                        yield await send_event("debate_generated", {
                            "topic": debate.topic,
                            "participants": debate.participants,
                            "debate_points": [
                                {
                                    "speaker_name": dp.speaker_name,
                                    "speaker_segment": dp.speaker_segment,
                                    "position": dp.position,
                                    "challenges_to": dp.challenges_to or [],
                                    "supporting_evidence": dp.supporting_evidence
                                }
                                for dp in debate.debate_points
                            ],
                            "key_insight": debate.key_insight
                        })
                    except Exception as e:
                        print(f"Error running debate for {segment_id}: {e}")
                        continue

            if debates:
                yield await send_event("debate_complete", {
                    "debates_conducted": len(debates)
                })
        else:
            yield await send_event("progress", {
                "phase": "debate_skipped",
                "message": f"Debate phase skipped (sentiment {negative_sentiment_pct:.1f}% < 20% threshold)"
            })

        # Build result object to match workflow output
        result = {
            "reviews": reviews,
            "personas": all_personas,
            "personas_count": len(all_personas),
            "prd_content": prd_content,
            "negative_sentiment_pct": negative_sentiment_pct,
            "debates": debates,
            "final_insights": None
        }

        # Run aggregation to get final insights
        yield await send_event("progress", {
            "phase": "aggregating",
            "message": "Aggregating insights from all reviews...",
        })

        from baml_client import b

        # Convert reviews and debates to JSON for aggregation
        reviews_json = json.dumps([{
            "reviewer_name": r.reviewer_name,
            "overall_sentiment": r.overall_sentiment,
            "willingness_to_adopt": r.willingness_to_adopt,
            "key_concerns": r.key_concerns or [],
            "missing_features": r.missing_features or [],
            "what_they_loved": r.what_they_loved or [],
            "dealbreakers": r.dealbreakers or [],
            "reasoning": r.reasoning
        } for r in reviews])

        # Convert debates to JSON
        debates_json = json.dumps([{
            "topic": d.topic,
            "participants": d.participants,
            "debate_points": [
                {
                    "speaker_name": dp.speaker_name,
                    "speaker_segment": dp.speaker_segment,
                    "position": dp.position,
                    "challenges_to": dp.challenges_to or [],
                    "supporting_evidence": dp.supporting_evidence
                }
                for dp in d.debate_points
            ],
            "key_insight": d.key_insight
        } for d in debates])

        insights = b.AggregateReviews(
            reviews_json=reviews_json,
            debates_json=debates_json,
            total_personas=len(all_personas)
        )

        result["final_insights"] = insights

        # Convert insights to dict - handle None values
        insights_dict = {
            "total_reviews": insights.total_reviews,
            "sentiment_breakdown": {
                "positive": insights.sentiment_breakdown.positive,
                "neutral": insights.sentiment_breakdown.neutral,
                "negative": insights.sentiment_breakdown.negative,
                "total": insights.sentiment_breakdown.total
            },
            "top_concerns": insights.top_concerns or [],
            "critical_gaps": insights.critical_gaps or [],
            "most_loved_features": insights.most_loved_features or [],
            "common_dealbreakers": insights.common_dealbreakers or [],
            "segment_insights": [
                {
                    "segment_name": s.segment_name,
                    "unique_concerns": s.unique_concerns or [],
                    "adoption_likelihood": s.adoption_likelihood,
                    "critical_missing_features": s.critical_missing_features or []
                }
                for s in (insights.segment_insights or [])
            ],
            "major_conflicts": [
                {
                    "topic": c.topic,
                    "segment_a": c.segment_a,
                    "segment_b": c.segment_b,
                    "segment_a_wants": c.segment_a_wants,
                    "segment_b_wants": c.segment_b_wants,
                    "why_it_conflicts": c.why_it_conflicts,
                    "potential_resolution": c.potential_resolution
                }
                for c in (insights.major_conflicts or [])
            ],
            "non_obvious_insights": insights.non_obvious_insights or [],
            "hidden_assumptions": insights.hidden_assumptions or [],
            "risk_score": insights.risk_score,
            "risk_factors": insights.risk_factors or [],
            "quick_wins": insights.quick_wins or [],
            "strategic_decisions_needed": insights.strategic_decisions_needed or [],
            "executive_summary": insights.executive_summary
        }

        # Final result
        yield await send_event("final_result", {
            "insights": insights_dict,
            "reviews_count": len(reviews),
            "debates_count": len(debates)
        })

        yield await send_event("complete", {
            "message": "PRD review complete!",
            "total_time": "N/A"  # TODO: track time
        })

    except Exception as e:
        yield await send_event("error", {
            "error": str(e),
            "type": type(e).__name__
        })


# ============================================================================
# API Routes
# ============================================================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "PRD Review System API",
        "version": "1.0.0"
    }


@app.post("/api/review/stream")
async def review_prd_stream(request: PRDReviewRequest):
    """
    Stream PRD review progress via Server-Sent Events (SSE)

    Returns real-time updates as the multi-agent workflow progresses:
    - Persona generation
    - Review completion
    - Debate sessions
    - Final insights
    """
    return EventSourceResponse(
        stream_prd_review(request.prd_content, request.num_personas, request.segments),
        media_type="text/event-stream"
    )


@app.post("/api/review")
async def review_prd(request: PRDReviewRequest):
    """
    Non-streaming version - returns complete results
    (Useful for testing or batch processing)
    """
    try:
        segments = load_segments()
        personas_per_segment = request.num_personas // len(segments)

        all_personas = scale_personas(segments, personas_per_segment)

        workflow_builder = create_workflow()
        workflow = workflow_builder.compile()

        initial_state = {
            "personas": all_personas,
            "personas_count": len(all_personas),
            "prd_content": request.prd_content,
            "reviews": [],
            "debates": [],
            "insights": None,
            "negative_sentiment_pct": 0.0
        }

        result = workflow.invoke(initial_state)

        # Convert to dict (same as streaming version)
        insights = result["final_insights"]
        insights_dict = {
            "total_reviews": insights.total_reviews,
            "sentiment_breakdown": {
                "positive": insights.sentiment_breakdown.positive,
                "neutral": insights.sentiment_breakdown.neutral,
                "negative": insights.sentiment_breakdown.negative,
                "total": insights.sentiment_breakdown.total
            },
            "top_concerns": insights.top_concerns or [],
            "critical_gaps": insights.critical_gaps or [],
            "most_loved_features": insights.most_loved_features or [],
            "common_dealbreakers": insights.common_dealbreakers or [],
            "segment_insights": [
                {
                    "segment_name": s.segment_name,
                    "unique_concerns": s.unique_concerns or [],
                    "adoption_likelihood": s.adoption_likelihood,
                    "critical_missing_features": s.critical_missing_features or []
                }
                for s in (insights.segment_insights or [])
            ],
            "major_conflicts": [
                {
                    "topic": c.topic,
                    "segment_a": c.segment_a,
                    "segment_b": c.segment_b,
                    "segment_a_wants": c.segment_a_wants,
                    "segment_b_wants": c.segment_b_wants,
                    "why_it_conflicts": c.why_it_conflicts,
                    "potential_resolution": c.potential_resolution
                }
                for c in (insights.major_conflicts or [])
            ],
            "non_obvious_insights": insights.non_obvious_insights or [],
            "hidden_assumptions": insights.hidden_assumptions or [],
            "risk_score": insights.risk_score,
            "risk_factors": insights.risk_factors or [],
            "quick_wins": insights.quick_wins or [],
            "strategic_decisions_needed": insights.strategic_decisions_needed or [],
            "executive_summary": insights.executive_summary
        }

        return {
            "success": True,
            "insights": insights_dict,
            "reviews_count": len(result["reviews"]),
            "debates_count": len(result.get("debates", []))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Check for required API keys
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not found in environment")
        exit(1)

    print("🚀 Starting PRD Review API Server...")
    print("📊 Frontend should connect to: http://localhost:8000")
    print("📝 API docs available at: http://localhost:8000/docs")
    print("🔍 LangSmith tracing:", "ENABLED" if os.getenv("LANGCHAIN_TRACING_V2") else "DISABLED")

    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
