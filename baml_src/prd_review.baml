//
// Demo #2: PRD Review System - BAML Schemas
//
// This file defines all the type-safe schemas for the multi-agent PRD review workflow:
// - Phase 1: Independent PRD reviews by 300 personas
// - Phase 2: Agent debate and deliberation
// - Phase 3: Aggregation and insights extraction
//

// ============================================================================
// PHASE 1: PRD REVIEW SCHEMAS
// ============================================================================

class PRDReview {
  reviewer_name string @description("Name of the persona reviewer")
  reviewer_segment string @description("Demographic segment (busy_parents, young_professionals, etc)")
  
  // Overall sentiment and adoption willingness
  overall_sentiment "positive" | "neutral" | "negative"
  willingness_to_adopt "definitely" | "probably" | "maybe" | "probably_not" | "definitely_not"
  
  // Specific feedback categories
  key_concerns string[] @description("Main concerns or red flags")
  missing_features string[] @description("Features they expected but didn't see")
  usability_issues string[] @description("UX/UI problems or friction points")
  pricing_concerns string[] @description("Issues with pricing model or tiers")
  accessibility_issues string[] @description("Accessibility or inclusion gaps")
  
  // Qualitative feedback
  what_they_loved string[] @description("Features or aspects they're excited about")
  dealbreakers string[] @description("Issues that would prevent adoption")
  reasoning string @description("2-3 sentence explanation of their overall assessment")
  
  // Persona-specific context
  persona_quote string @description("A quote in their voice expressing their main reaction")
}

function ReviewPRD(
  persona_name: string,
  persona_age: int,
  persona_occupation: string,
  persona_tech_comfort: string,
  persona_pain_points: string[],
  persona_goals: string[],
  persona_segment: string,
  prd_content: string
) -> PRDReview {
  client "anthropic/claude-3-haiku-20240307"
  prompt #"
    You are {{ persona_name }}, a {{ persona_age }}-year-old {{ persona_occupation }}.
    
    YOUR BACKGROUND:
    - Tech comfort level: {{ persona_tech_comfort }}
    - Pain points: {{ persona_pain_points }}
    - Goals: {{ persona_goals }}
    - Demographic segment: {{ persona_segment }}
    
    TASK: Review this Product Requirements Document (PRD) from YOUR perspective as {{ persona_name }}.
    Think about how this product would fit into YOUR life, with YOUR constraints and needs.
    
    === PRD TO REVIEW ===
    {{ prd_content }}
    === END PRD ===
    
    Provide honest, specific feedback. Focus on:
    - What concerns YOU have
    - What features are missing for YOUR needs
    - What would prevent YOU from using this
    - What YOU actually like about it
    
    Be critical but fair. Think from your persona's authentic perspective.
    
    {{ ctx.output_format }}
  "#
}

// Test cases for playground
test ReviewPRD_BusyParent {
  functions [ReviewPRD]
  args {
    persona_name "Sarah Chen"
    persona_age 34
    persona_occupation "Marketing Manager and mother of two"
    persona_tech_comfort "moderate"
    persona_pain_points ["No time to manually track expenses", "Need simple solutions that just work", "Budget constraints with growing family"]
    persona_goals ["Save for kids' education", "Avoid financial stress", "Spend quality time with family"]
    persona_segment "busy_parents"
    prd_content "SmartBudget: Personal finance app with AI-powered categorization. Premium tier: $9.99/month. Includes push notifications for spending alerts, budget tracking, goal setting."
  }
}

test ReviewPRD_TechSavvyProfessional {
  functions [ReviewPRD]
  args {
    persona_name "Alex Rodriguez"
    persona_age 28
    persona_occupation "Software Engineer"
    persona_tech_comfort "high"
    persona_pain_points ["Generic solutions don't fit my workflow", "Want API access and automation", "Need detailed analytics"]
    persona_goals ["Optimize savings rate", "Track investments", "Automate everything"]
    persona_segment "young_professionals"
    prd_content "SmartBudget: Personal finance app with AI-powered categorization. Premium tier: $9.99/month. Includes push notifications for spending alerts, budget tracking, goal setting."
  }
}


// ============================================================================
// PHASE 2: AGENT DEBATE SCHEMAS
// ============================================================================

class DebatePoint {
  speaker_name string @description("Name of the persona making this point")
  speaker_segment string @description("Their demographic segment")
  position string @description("Their stance or argument (1-2 sentences)")
  challenges_to string[] @description("Which other personas' views they're challenging")
  supporting_evidence string @description("Why they believe this (from their perspective)")
}

class ConflictingSurvey {
  topic string @description("What aspect of the PRD has conflicting opinions")
  segment_a string @description("First demographic segment in conflict")
  segment_b string @description("Second demographic segment in conflict")
  segment_a_wants string @description("What segment A needs/wants")
  segment_b_wants string @description("What segment B needs/wants")
  why_it_conflicts string @description("Why these needs are incompatible")
  potential_resolution string @description("Possible way to satisfy both (or acknowledge trade-off)")
}

class DebateSession {
  topic string @description("The debate topic or PRD aspect being discussed")
  participants string[] @description("Names of personas participating")
  
  debate_points DebatePoint[] @description("Arguments made during debate")
  conflicts_surfaced ConflictingSurvey[] @description("Incompatible needs identified")
  
  consensus_if_any string? @description("Any agreement reached, or null if unresolved")
  key_insight string @description("Main non-obvious insight from this debate")
}

function FacilitateDebate(
  topic: string,
  segment_name: string,
  reviews_json: string
) -> DebateSession {
  client "anthropic/claude-3-haiku-20240307"
  prompt #"
    You are facilitating a debate between user personas from the "{{ segment_name }}" demographic segment.
    
    DEBATE TOPIC: {{ topic }}
    
    PARTICIPANT REVIEWS:
    {{ reviews_json }}
    
    YOUR TASK:
    1. Identify where these personas from the same segment have DIFFERENT opinions
    2. Have them debate and challenge each other's assumptions
    3. Surface conflicts between different user needs
    4. Extract non-obvious insights that wouldn't emerge from individual reviews
    
    Focus on:
    - Real conflicts (not superficial disagreements)
    - Trade-offs that product team must make
    - Assumptions in the PRD that don't hold for everyone
    - Edge cases that expose design flaws
    
    Simulate a realistic, constructive debate. Let them challenge each other.
    
    {{ ctx.output_format }}
  "#
}


// ============================================================================
// PHASE 3: AGGREGATION & INSIGHTS SCHEMAS
// ============================================================================

class SentimentBreakdown {
  positive int @description("Count of positive reviews")
  neutral int @description("Count of neutral reviews")
  negative int @description("Count of negative reviews")
  total int @description("Total reviews analyzed")
}

class SegmentSpecificNeed {
  segment_name string @description("Demographic segment name")
  unique_concerns string[] @description("Concerns specific to this segment")
  adoption_likelihood float @description("% likely to adopt (0-100)")
  critical_missing_features string[] @description("Features they need that are missing")
}

class AggregatedInsights {
  total_reviews int @description("Number of reviews analyzed")
  
  sentiment_breakdown SentimentBreakdown
  
  // Top-level findings (ranked by frequency/importance)
  top_concerns string[] @description("Most mentioned concerns across all segments (ranked)")
  critical_gaps string[] @description("Missing features mentioned by multiple segments")
  most_loved_features string[] @description("Features that got positive reactions")
  common_dealbreakers string[] @description("Issues that would prevent adoption")
  
  // Segment analysis
  segment_insights SegmentSpecificNeed[] @description("Segment-specific findings")
  
  // Cross-segment conflicts (from debates)
  major_conflicts ConflictingSurvey[] @description("Incompatible needs across segments")
  
  // Non-obvious insights (the gold!)
  non_obvious_insights string[] @description("Insights surfaced through debate that individual reviews missed")
  hidden_assumptions string[] @description("Assumptions in PRD that don't hold for all users")
  
  // Risk assessment
  risk_score float @description("Overall risk score 0-10 based on sentiment + gaps + conflicts")
  risk_factors string[] @description("Main contributors to risk score")
  
  // Recommendations
  quick_wins string[] @description("Easy fixes that would improve sentiment")
  strategic_decisions_needed string[] @description("Trade-offs product team must make")
  
  executive_summary string @description("2-3 sentence summary for leadership")
}

function AggregateReviews(
  reviews_json: string,
  debates_json: string,
  total_personas: int
) -> AggregatedInsights {
  client "anthropic/claude-3-haiku-20240307"
  prompt #"
    You are analyzing feedback from {{ total_personas }} synthetic user personas who reviewed a PRD.
    
    INDIVIDUAL REVIEWS:
    {{ reviews_json }}
    
    DEBATE SESSIONS (conflicts surfaced):
    {{ debates_json }}
    
    YOUR TASK:
    Extract actionable insights for the product team. Focus on:
    
    1. QUANTITATIVE: Count mentions, rank by frequency
    2. QUALITATIVE: Identify patterns and themes
    3. CONFLICTS: Which segment needs clash?
    4. NON-OBVIOUS: What did debates reveal that individual reviews missed?
    5. ACTIONABLE: What should product team do?
    
    CRITICAL: The "non_obvious_insights" field is the most valuable. These should be insights that:
    - Emerged from debate/deliberation (not individual reviews)
    - Challenge assumptions in the PRD
    - Reveal trade-offs the team must make
    - Expose edge cases or blind spots
    
    Calculate risk_score based on:
    - % negative sentiment (higher = more risk)
    - # critical gaps (more = more risk)  
    - # major conflicts (more = more risk)
    - Severity of dealbreakers
    
    Be specific, actionable, and data-driven.
    
    {{ ctx.output_format }}
  "#
}
