"""
LangGraph Workflow for Multi-Agent PRD Review

This implements the complete workflow:
1. Generate personas (or load pre-generated)
2. Phase 1: Parallel PRD reviews (300 personas)
3. Conditional routing: Skip debate if sentiment is good
4. Phase 2: Agent debates (if needed)
5. Aggregation: Extract insights

Uses:
- BAML for type-safe structured outputs
- LangGraph for workflow orchestration
- LangSmith for tracing (optional)
"""

import json
import os
import sys
from typing import List, TypedDict, Annotated, Literal
from operator import add
import time

# LangGraph imports
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# LangSmith tracing
from langsmith import traceable
from langsmith.run_helpers import get_current_run_tree, tracing_context

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# BAML imports
from baml_client import b
from baml_client.types import (
    UserPersona,
    PRDReview,
    DebateSession,
    AggregatedInsights
)

# Local imports
from demo2_multi_agent.persona_scaling import scale_personas, load_segments


# ============================================================================
# STATE DEFINITION
# ============================================================================

class WorkflowState(TypedDict):
    """State passed between LangGraph nodes"""
    
    # Input
    prd_content: str
    personas_count: int
    
    # Generated data
    personas: List[UserPersona]
    reviews: List[PRDReview]
    
    # Intermediate calculations
    negative_sentiment_pct: float
    needs_debate: bool
    
    # Phase 2 (optional)
    debates: List[DebateSession] | None
    
    # Final output
    final_insights: AggregatedInsights | None
    
    # Metadata
    phase1_duration: float
    phase2_duration: float
    total_duration: float


# ============================================================================
# NODE 1: GENERATE PERSONAS
# ============================================================================

@traceable(name="generate_personas_node", metadata={"node": "1", "phase": "setup"})
def generate_personas_node(state: WorkflowState) -> WorkflowState:
    """
    Generate N personas from demographic segments.
    Or load from pre-generated file if available.
    """
    print("\n" + "="*80)
    print("NODE 1: GENERATING PERSONAS")
    print("="*80)
    
    personas_count = state["personas_count"]
    
    # Try to load pre-generated personas first (faster for testing)
    personas_file = f"demo2_multi_agent/generated_personas_{personas_count}.json"
    
    if os.path.exists(personas_file):
        print(f"📂 Loading {personas_count} pre-generated personas from file...")
        with open(personas_file, 'r') as f:
            personas_data = json.load(f)
        
        # Convert to UserPersona objects
        personas = [UserPersona(**p) for p in personas_data]
        print(f"✅ Loaded {len(personas)} personas")
    else:
        print(f"🔧 Generating {personas_count} fresh personas...")
        segments = load_segments()
        personas_per_segment = personas_count // len(segments)
        personas = scale_personas(segments, personas_per_segment)
        
        # Save for next time
        personas_data = [p.model_dump() for p in personas]
        with open(personas_file, 'w') as f:
            json.dump(personas_data, f, indent=2)
        print(f"💾 Saved to {personas_file}")
    
    state["personas"] = personas
    return state


# ============================================================================
# NODE 2: PHASE 1 - PARALLEL PRD REVIEWS
# ============================================================================

@traceable(name="phase1_reviews_node", metadata={"node": "2", "phase": "phase1"})
def phase1_reviews_node(state: WorkflowState) -> WorkflowState:
    """
    Have all personas independently review the PRD.
    This runs in parallel (conceptually - we'll batch for efficiency).
    """
    print("\n" + "="*80)
    print(f"NODE 2: PHASE 1 - INDEPENDENT PRD REVIEWS")
    print("="*80)
    
    start_time = time.time()
    personas = state["personas"]
    prd_content = state["prd_content"]
    
    print(f"Running {len(personas)} parallel reviews...")
    print(f"(This may take a few minutes)")
    print()
    
    reviews = []
    
    for i, persona in enumerate(personas):
        try:
            # Call BAML function for type-safe PRD review
            review: PRDReview = b.ReviewPRD(
                persona_name=persona.name,
                persona_age=persona.age,
                persona_occupation=persona.occupation,
                persona_tech_comfort=persona.tech_comfort,
                persona_pain_points=persona.pain_points,
                persona_goals=persona.goals,
                persona_segment="unknown",  # We'd need to track this
                prd_content=prd_content
            )
            
            reviews.append(review)
            
            # Progress indicator
            if (i + 1) % 10 == 0:
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                remaining = (len(personas) - (i + 1)) / rate
                print(f"  ✓ {i + 1}/{len(personas)} reviews ({elapsed:.1f}s elapsed, ~{remaining:.1f}s remaining)")
        
        except Exception as e:
            print(f"  ✗ Error reviewing as {persona.name}: {e}")
            continue
    
    duration = time.time() - start_time
    state["reviews"] = reviews
    state["phase1_duration"] = duration
    
    # Calculate sentiment breakdown
    negative_count = sum(1 for r in reviews if r.overall_sentiment == "negative")
    negative_pct = (negative_count / len(reviews)) * 100
    state["negative_sentiment_pct"] = negative_pct
    
    print()
    print(f"✅ Phase 1 Complete:")
    print(f"   {len(reviews)} reviews in {duration:.1f}s")
    print(f"   Sentiment: {negative_pct:.1f}% negative")
    
    return state


# ============================================================================
# CONDITIONAL EDGE: SHOULD WE DEBATE?
# ============================================================================

@traceable(name="should_debate_router", metadata={"type": "conditional_edge"})
def should_debate(state: WorkflowState) -> Literal["debate", "skip_debate"]:
    """
    Conditional routing: Run debate if negative sentiment > 30%
    """
    negative_pct = state["negative_sentiment_pct"]
    threshold = 30.0
    
    if negative_pct > threshold:
        print(f"\n🔀 ROUTING: Negative sentiment {negative_pct:.1f}% > {threshold}% → Running debate")
        state["needs_debate"] = True
        return "debate"
    else:
        print(f"\n🔀 ROUTING: Negative sentiment {negative_pct:.1f}% ≤ {threshold}% → Skipping debate")
        state["needs_debate"] = False
        return "skip_debate"


# ============================================================================
# NODE 3: PHASE 2 - AGENT DEBATES
# ============================================================================

@traceable(name="phase2_debates_node", metadata={"node": "3", "phase": "phase2"})
def phase2_debates_node(state: WorkflowState) -> WorkflowState:
    """
    Group personas by segment and facilitate debates.
    Surface conflicts and non-obvious insights.
    """
    print("\n" + "="*80)
    print(f"NODE 3: PHASE 2 - AGENT DEBATES")
    print("="*80)
    
    start_time = time.time()
    reviews = state["reviews"]
    
    # Group reviews by segment (we'd need to track segment info)
    # For now, we'll just create debates on key topics
    
    debate_topics = [
        "Pricing model and tier structure",
        "Notification frequency and customization",
        "Accessibility and inclusion features",
        "Technical complexity vs ease of use"
    ]
    
    debates = []
    
    for topic in debate_topics:
        print(f"\n💬 Debating: {topic}")
        
        # Get a subset of reviews for this topic
        # In production, we'd filter by relevance
        sample_reviews = reviews[:10]  # Just use first 10 for demo
        
        reviews_json = json.dumps([{
            "name": r.reviewer_name,
            "sentiment": r.overall_sentiment,
            "concerns": r.key_concerns,
            "reasoning": r.reasoning
        } for r in sample_reviews], indent=2)
        
        try:
            # Call BAML function for debate facilitation
            debate: DebateSession = b.FacilitateDebate(
                topic=topic,
                segment_name="mixed",
                reviews_json=reviews_json
            )
            
            debates.append(debate)
            print(f"  ✓ Surfaced {len(debate.conflicts_surfaced)} conflicts")
        
        except Exception as e:
            print(f"  ✗ Error facilitating debate: {e}")
            continue
    
    duration = time.time() - start_time
    state["debates"] = debates
    state["phase2_duration"] = duration
    
    print(f"\n✅ Phase 2 Complete:")
    print(f"   {len(debates)} debates in {duration:.1f}s")
    
    return state


@traceable(name="skip_debate_node", metadata={"node": "3_skip", "phase": "phase2_skip"})
def skip_debate_node(state: WorkflowState) -> WorkflowState:
    """Skip debate phase (sentiment is good)"""
    state["debates"] = None
    state["phase2_duration"] = 0
    return state


# ============================================================================
# NODE 4: AGGREGATION & INSIGHTS
# ============================================================================

@traceable(name="aggregation_node", metadata={"node": "4", "phase": "aggregation"})
def aggregation_node(state: WorkflowState) -> WorkflowState:
    """
    Aggregate all reviews and debates into actionable insights.
    """
    print("\n" + "="*80)
    print(f"NODE 4: AGGREGATION & INSIGHTS")
    print("="*80)
    
    reviews = state["reviews"]
    debates = state.get("debates", []) or []
    
    # Convert to JSON for BAML function
    reviews_json = json.dumps([{
        "name": r.reviewer_name,
        "segment": r.reviewer_segment,
        "sentiment": r.overall_sentiment,
        "concerns": r.key_concerns,
        "missing_features": r.missing_features,
        "dealbreakers": r.dealbreakers
    } for r in reviews], indent=2)
    
    debates_json = json.dumps([{
        "topic": d.topic,
        "conflicts": [{
            "segment_a": c.segment_a,
            "segment_a_wants": c.segment_a_wants,
            "segment_b": c.segment_b,
            "segment_b_wants": c.segment_b_wants
        } for c in d.conflicts_surfaced]
    } for d in debates], indent=2)
    
    try:
        # Call BAML function for aggregation
        insights: AggregatedInsights = b.AggregateReviews(
            reviews_json=reviews_json,
            debates_json=debates_json,
            total_personas=len(reviews)
        )
        
        state["final_insights"] = insights
        
        print(f"\n✅ Aggregation Complete:")
        print(f"   Risk Score: {insights.risk_score:.1f}/10")
        print(f"   Top {len(insights.top_concerns)} concerns identified")
        print(f"   {len(insights.non_obvious_insights)} non-obvious insights surfaced")
    
    except Exception as e:
        print(f"✗ Error aggregating insights: {e}")
        state["final_insights"] = None
    
    return state


# ============================================================================
# WORKFLOW CONSTRUCTION
# ============================================================================

def create_workflow() -> StateGraph:
    """
    Build the complete LangGraph workflow.
    """
    workflow = StateGraph(WorkflowState)
    
    # Add nodes
    workflow.add_node("generate_personas", generate_personas_node)
    workflow.add_node("phase1_reviews", phase1_reviews_node)
    workflow.add_node("phase2_debates", phase2_debates_node)
    workflow.add_node("skip_debate", skip_debate_node)
    workflow.add_node("aggregation", aggregation_node)
    
    # Add edges
    workflow.set_entry_point("generate_personas")
    workflow.add_edge("generate_personas", "phase1_reviews")
    
    # Conditional edge: debate or skip
    workflow.add_conditional_edges(
        "phase1_reviews",
        should_debate,
        {
            "debate": "phase2_debates",
            "skip_debate": "skip_debate"
        }
    )
    
    # Both paths lead to aggregation
    workflow.add_edge("phase2_debates", "aggregation")
    workflow.add_edge("skip_debate", "aggregation")
    
    # End after aggregation
    workflow.add_edge("aggregation", END)
    
    return workflow


# ============================================================================
# LANGSMITH SETUP
# ============================================================================

def setup_langsmith():
    """
    Configure LangSmith tracing.
    Checks for environment variables and provides setup instructions if missing.
    """
    api_key = os.getenv("LANGCHAIN_API_KEY")
    tracing = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    project = os.getenv("LANGCHAIN_PROJECT", "baml-demo-2-prd-review")

    if tracing and api_key:
        print("✅ LangSmith tracing enabled")
        print(f"   Project: {project}")
        print(f"   View traces: https://smith.langchain.com/")
        return True
    elif tracing and not api_key:
        print("⚠️  LangSmith tracing requested but LANGCHAIN_API_KEY not set")
        print("   Get your key at: https://smith.langchain.com/")
        print("   export LANGCHAIN_API_KEY='your-key-here'")
        return False
    else:
        print("ℹ️  LangSmith tracing disabled (set LANGCHAIN_TRACING_V2=true to enable)")
        return False


# ============================================================================
# MAIN EXECUTION
# ============================================================================

@traceable(
    name="run_prd_review_workflow",
    metadata={"workflow": "prd_review", "version": "1.0"}
)
def run_workflow(
    prd_content: str,
    personas_count: int = 20,
    enable_checkpointing: bool = False
) -> AggregatedInsights:
    """
    Run the complete PRD review workflow.
    
    Args:
        prd_content: The PRD text to review
        personas_count: Number of personas to generate (default: 20 for testing)
        enable_checkpointing: Enable LangGraph checkpointing (default: False)
    
    Returns:
        AggregatedInsights with complete analysis
    """
    print("\n" + "="*80)
    print("MULTI-AGENT PRD REVIEW WORKFLOW")
    print("="*80)
    print(f"Personas: {personas_count}")
    print(f"Checkpointing: {enable_checkpointing}")

    # Setup LangSmith tracing
    langsmith_enabled = setup_langsmith()

    print("="*80)

    # Add metadata for LangSmith
    run_metadata = {
        "personas_count": personas_count,
        "prd_length": len(prd_content),
        "checkpointing_enabled": enable_checkpointing,
        "langsmith_enabled": langsmith_enabled
    }

    # Get current run and add metadata if tracing
    try:
        current_run = get_current_run_tree()
        if current_run:
            current_run.metadata.update(run_metadata)
            current_run.tags = ["prd-review", "multi-agent", f"personas-{personas_count}"]
    except:
        pass  # LangSmith not enabled, skip

    # Create workflow
    workflow = create_workflow()
    
    # Compile with optional checkpointing
    if enable_checkpointing:
        memory = MemorySaver()
        app = workflow.compile(checkpointer=memory)
    else:
        app = workflow.compile()
    
    # Initial state
    initial_state: WorkflowState = {
        "prd_content": prd_content,
        "personas_count": personas_count,
        "personas": [],
        "reviews": [],
        "negative_sentiment_pct": 0.0,
        "needs_debate": False,
        "debates": None,
        "final_insights": None,
        "phase1_duration": 0.0,
        "phase2_duration": 0.0,
        "total_duration": 0.0
    }
    
    # Run workflow
    start_time = time.time()
    
    if enable_checkpointing:
        config = {"configurable": {"thread_id": "demo-run-1"}}
        final_state = app.invoke(initial_state, config=config)
    else:
        final_state = app.invoke(initial_state)
    
    total_duration = time.time() - start_time
    
    # Print final summary
    print("\n" + "="*80)
    print("WORKFLOW COMPLETE")
    print("="*80)
    print(f"Total duration: {total_duration:.1f}s")
    print(f"  Phase 1 (reviews): {final_state['phase1_duration']:.1f}s")
    print(f"  Phase 2 (debates): {final_state['phase2_duration']:.1f}s")

    # Print LangSmith trace URL if enabled
    if langsmith_enabled:
        try:
            current_run = get_current_run_tree()
            if current_run and current_run.id:
                project = os.getenv("LANGCHAIN_PROJECT", "baml-demo-2-prd-review")
                trace_url = f"https://smith.langchain.com/o/default/projects/p/{project}/r/{current_run.id}"
                print()
                print(f"🔍 View trace in LangSmith:")
                print(f"   {trace_url}")
        except:
            pass

    print("="*80)

    return final_state["final_insights"]


if __name__ == "__main__":
    # Test workflow with sample PRD
    from dotenv import load_dotenv
    load_dotenv()
    
    # Load sample PRD
    with open('sample_data/sample_prd.md', 'r') as f:
        prd_content = f.read()
    
    # Run with small number for testing
    insights = run_workflow(
        prd_content=prd_content,
        personas_count=20,  # Use 300 for production
        enable_checkpointing=False
    )
    
    if insights:
        print("\n" + "="*80)
        print("FINAL INSIGHTS")
        print("="*80)
        print(f"Risk Score: {insights.risk_score}/10")
        print(f"\nExecutive Summary:")
        print(insights.executive_summary)
        print(f"\nTop Concerns:")
        for i, concern in enumerate(insights.top_concerns[:5], 1):
            print(f"  {i}. {concern}")
        print(f"\nNon-Obvious Insights:")
        for insight in insights.non_obvious_insights:
            print(f"  💡 {insight}")
