# Demo #2: "300 Synthetic Users Reviewed My PRD in 3 Minutes"

[← Back to Main README](README.md) | [← Type-Safe Outputs Guide](TYPE_SAFE_OUTPUTS.md)

---

**Hook**: You're shipping features to users that only exist in your head. Here's how I stopped guessing.

> **Prerequisites**: This guide builds on the personas from the [Type-Safe Outputs Guide](TYPE_SAFE_OUTPUTS.md). Start there if you're new to BAML.

## The Problem

**The Cold Start Paradox**:
- Need users to get feedback
- Need feedback to build the right product
- Need the right product to get users

Result: You ship based on assumptions and vibes, learn expensive lessons in production.

## The Solution

A multi-agent system that simulates a diverse user panel:
- **300+ personas** generated from demographic/behavioral segments
- **Phase 1**: Independent PRD reviews (breadth of perspectives)
- **Phase 2**: Agent debate/deliberation (depth + conflict surfacing)
- **Output**: Aggregated themes, prioritized gaps, sentiment analysis

This doesn't replace real user research - it's your **pre-flight checklist** before you commit resources.

## Architecture: BAML + LangGraph + LangSmith

This demo showcases the power of combining three technologies:

### The Stack
- **BAML**: Type-safe structured outputs (schemas, validation, parsing)
- **LangGraph**: Multi-agent workflow orchestration (state management, conditional routing)
- **LangSmith**: Tracing and observability (debug each agent, track token usage)

### Why This Combination?

**BAML** handles what LLMs are bad at:
- Returning valid, typed data structures
- Consistent schema adherence
- Fixing broken JSON automatically

**LangGraph** handles what we need for multi-agent systems:
- Stateful workflows with conditional logic
- Parallel execution of 300 agents
- Routing between phases based on output
- Human-in-the-loop intervention points

**LangSmith** gives us production-grade observability:
- Trace each of the 300+ agent calls
- Debug which personas found which issues
- Track token usage per phase
- Replay failed agents

### The Workflow (LangGraph State Machine)

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph State Machine                   │
└─────────────────────────────────────────────────────────────┘

   START
     ↓
┌─────────────────────┐
│ Generate Personas   │  BAML: UserPersona schema
│ (Node 1)            │  Output: 300 type-safe personas
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Phase 1: Reviews    │  BAML: PRDReview schema
│ (Node 2 - Parallel) │  300 agents execute in parallel
│ Map-Reduce Pattern  │  LangSmith: Trace all 300 calls
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Conditional Router  │  LangGraph: Route based on sentiment
│ (Conditional Edge)  │  If negative > 30% → Phase 2
└──────────┬──────────┘  If negative < 30% → Skip to Aggregation
           ↓
   ┌───────┴────────┐
   │                │
   ↓                ↓
┌──────────┐   ┌──────────────┐
│ Phase 2  │   │ Skip Debate  │
│ Debate   │   │ (Low Risk)   │
│ (Node 3) │   └──────┬───────┘
└────┬─────┘          │
     │                │
     └────────┬───────┘
              ↓
┌──────────────────────┐
│ Aggregation & Insights│  BAML: AggregatedInsights schema
│ (Node 4)             │  LangSmith: Track final analysis
└──────────┬───────────┘
           ↓
         END
```

### LangGraph State Schema

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from baml_client.types import UserPersona, PRDReview, DebateSession, AggregatedInsights

class WorkflowState(TypedDict):
    """State passed between LangGraph nodes"""
    prd_content: str
    personas: list[UserPersona]
    reviews: list[PRDReview]
    negative_sentiment_pct: float
    debates: list[DebateSession] | None
    final_insights: AggregatedInsights | None
```

### Nodes (Each uses BAML for type safety)

1. **generate_personas**: Scale 4 segments → 300 personas
2. **parallel_reviews**: Map-reduce 300 PRD reviews
3. **facilitate_debates**: Group by segment, run debates
4. **aggregate_insights**: Synthesize final report

### Why Not Just LangChain?

You could do this with LangChain's LCEL, but LangGraph adds:
- **Stateful workflows**: Pass complex state between nodes
- **Conditional routing**: Skip debate if sentiment is positive
- **Parallelism**: 300 agents execute concurrently
- **Checkpointing**: Resume if a phase fails
- **Human-in-the-loop**: Pause before Phase 2 to review
- **Visualization**: See the workflow graph in LangSmith

## Demo Flow

### 1. Persona Generation (from Demo #1)
```python
# Reuse UserPersona schema from Demo #1
# Scale from 4 → 300 personas
personas = generate_personas_at_scale(segments, count=75)
```

### 2. Phase 1: Independent Reviews
Each persona independently reviews the PRD:
```baml
class PRDReview {
  reviewer_name string
  overall_sentiment "positive" | "neutral" | "negative"
  key_concerns string[]
  missing_features string[]
  usability_issues string[]
  willingness_to_adopt "definitely" | "probably" | "maybe" | "probably_not" | "definitely_not"
  reasoning string
}

function ReviewPRD(persona: UserPersona, prd_content: string) -> PRDReview {
  client "anthropic/claude-3-haiku-20240307"
  prompt #"
    You are {{ persona.name }}, a {{ persona.age }}-year-old {{ persona.occupation }}.
    
    Your background:
    - Tech comfort: {{ persona.tech_comfort }}
    - Pain points: {{ persona.pain_points }}
    - Goals: {{ persona.goals }}
    
    Review this PRD from YOUR perspective:
    {{ prd_content }}
    
    {{ ctx.output_format }}
  "#
}
```

### 3. Phase 2: Agent Debate
Group personas by segment, have them debate conflicting views:
```baml
class DebatePoint {
  speaker_name string
  position string
  reasoning string
  challenges_to string[]  // Which other personas' views they're challenging
}

class DebateSession {
  topic string
  participants string[]
  debate_points DebatePoint[]
  consensus_if_any string?
  unresolved_conflicts string[]
}

function FacilitateDebate(
  topic: string,
  personas: UserPersona[],
  their_reviews: PRDReview[]
) -> DebateSession {
  client "anthropic/claude-3-5-sonnet-20241022"
  prompt #"
    Facilitate a debate between these user personas about: {{ topic }}
    
    Participants:
    {% for persona in personas %}
    - {{ persona.name }}: {{ their_reviews[loop.index0].reasoning }}
    {% endfor %}
    
    Have them challenge each other's assumptions and surface conflicts.
    {{ ctx.output_format }}
  "#
}
```

### 4. Aggregation & Insights
```baml
class AggregatedInsights {
  total_reviews int
  sentiment_breakdown {
    positive int
    neutral int
    negative int
  }
  top_concerns string[]  // Ranked by frequency
  critical_gaps string[]  // Missing features mentioned by multiple segments
  segment_specific_needs {
    segment_name string
    unique_concerns string[]
  }[]
  non_obvious_insights string[]  // Surfaced through debate
  risk_score float @description("0-10, based on negative sentiment + critical gaps")
}

function AggregateReviews(
  reviews: PRDReview[],
  debates: DebateSession[]
) -> AggregatedInsights {
  client "anthropic/claude-3-5-sonnet-20241022"
  prompt #"
    Analyze these PRD reviews and debates to extract insights:
    
    Reviews: {{ reviews }}
    Debates: {{ debates }}
    
    {{ ctx.output_format }}
  "#
}
```

## What You'll See

When you run `python run_demo2.py`:

```
================================================================================
DEMO #2: 300 Synthetic Users Reviewing PRD
================================================================================

Step 1: Generating 300 personas from 4 demographic segments...
[████████████████████████████████████████] 300/300 personas (3.2s)

Step 2: Phase 1 - Independent PRD Reviews...
[████████████████████████████████████████] 300/300 reviews (45.8s)

Sentiment Breakdown:
  Positive:  142 (47%)
  Neutral:    98 (33%)
  Negative:   60 (20%)

Step 3: Phase 2 - Agent Debates (by segment)...
[████████████████████████████████████████] 4/4 debates (12.3s)

Surfaced conflicts:
  ✗ Busy Parents want simplicity, Young Professionals want customization
  ✗ Students need free tier, Retirees need phone support
  ✗ Accessibility requirements conflict with "mobile-first" approach

Step 4: Aggregating Insights...

================================================================================
AGGREGATED INSIGHTS
================================================================================

Top Concerns (mentioned by 30+ personas):
  1. "No offline mode" (89 mentions)
  2. "Unclear pricing tiers" (67 mentions)
  3. "Too many onboarding steps" (54 mentions)

Critical Gaps (across multiple segments):
  - Accessibility features (screen reader, high contrast)
  - Customer support channels (phone, email, chat)
  - Data export functionality

Non-Obvious Insights:
  💡 "Busy Parents" and "Retirees" have opposite needs for notification frequency
  💡 "Free tier" is a blocker for Students but a red flag for Professionals
  💡 The PRD assumes high tech literacy - will alienate 35% of target users

Risk Score: 6.8/10
  High risk due to accessibility gaps and unclear pricing

================================================================================
TIME: 61.3s | TOKENS: ~245,000 | COST: ~$0.74
================================================================================
```

## Key Insights

1. **Scale Matters**: 4 personas show patterns, 300 show statistical significance
2. **Debate > Survey**: Deliberation surfaces conflicts that independent reviews miss
3. **Segment Conflicts**: Features loved by one segment are hated by another
4. **Non-Obvious Insights**: The magic happens in Phase 2 when agents challenge each other
5. **Pre-Flight Checklist**: Catch expensive mistakes before you write code

## File Structure

```
├── demo2_before_baml/           # (Optional) Traditional approach for comparison
├── demo2_multi_agent/
│   ├── prd_review.py            # Main pipeline
│   ├── persona_scaling.py       # Generate 300 from 4 segments
│   └── results/                 # Output JSON with insights
├── baml_src/
│   ├── persona_generation.baml  # From Demo #1
│   ├── prd_review.baml          # Phase 1: Independent reviews
│   ├── agent_debate.baml        # Phase 2: Deliberation
│   └── aggregation.baml         # Insights extraction
├── sample_data/
│   ├── demographic_segments.json # From Demo #1
│   └── sample_prd.md            # Example PRD to review
└── run_demo2.py                 # Demo runner
```

## Demo Script for Video

### Opening Hook (15s)
"You're shipping features to users that only exist in your head. I had 50 synthetic users review my PRD in 5 minutes. Here's what they found - and it completely changed my roadmap."

### The Problem (30s)
"The cold start problem kills products. No users? No feedback. So you ship on assumptions and learn expensive lessons in production. What if you could simulate a diverse user panel - complete with segment conflicts and non-obvious insights - before you write a single line of code?"

### The Demo Setup (30s)
```bash
python run_demo2.py --personas 50
```

Show the command running, then cut to:
- "I'm testing a personal finance app PRD"
- "4 demographic segments: Busy Parents, Young Professionals, Students, Retirees"
- "50 synthetic personas generated with diverse backgrounds"
- "Full LangSmith tracing enabled - we can inspect every agent call"

### The Demo - Phase 1 (1min)
Show the terminal output:
```
NODE 2: PHASE 1 - INDEPENDENT PRD REVIEWS
Running 48 parallel reviews...
  ✓ 10/48 reviews (40.6s elapsed, ~154.4s remaining)
  ✓ 20/48 reviews (80.8s elapsed, ~113.1s remaining)
  ✓ 30/48 reviews (121.7s elapsed, ~73.0s remaining)
  ✓ 40/48 reviews (164.6s elapsed, ~32.9s remaining)

✅ Phase 1 Complete:
   48 reviews in 197.5s
   Sentiment: 0.0% negative
```

**Narration:**
- "Each persona independently reviews the PRD from their perspective"
- "BAML ensures type-safe structured output - every review has the same fields"
- "No JSON parsing errors, no schema validation failures"
- "This is what 99.9% reliability looks like"

### The Demo - Conditional Routing (20s)
```
🔀 ROUTING: Negative sentiment 0.0% ≤ 30.0% → Skipping debate
```

**Narration:**
- "LangGraph's conditional routing: If sentiment is negative, trigger debates"
- "Our PRD scored well, so we skip to aggregation"
- "But if we had >30% negative, agents would debate the conflicts"

### The Demo - Aggregation (1min)
Show the results:
```
🎯 RISK SCORE: 6.5/10
   ⚡ MODERATE RISK - Some issues to address

📊 EXECUTIVE SUMMARY
SmartBudget shows promise but has significant accessibility gaps
and segment-specific needs that aren't addressed. Retirees (60%
adoption) and students (80% adoption) have very different financial
management requirements.

💭 SENTIMENT BREAKDOWN
  Positive:  19 (40%)
  Neutral:   25 (53%)
  Negative:   3 (7%)

⚠️  TOP CONCERNS
  1. Feeling overwhelmed by digital tools
  2. Finding time-saving solutions
  3. Budget constraints
  4. Security/privacy worries
  5. Work-life-family balance
```

### The Insight - The Gold (45s)
Cut to the non-obvious insights:

```
💡 NON-OBVIOUS INSIGHTS (from agent debates)

💡 Accessibility isn't just for disabilities - many older adults
   struggle with technology and would benefit from personalized
   settings and guided support

💡 Retirees on fixed incomes have unique financial management needs
   (retirement income tracking, healthcare expense planning) that
   generic budgeting tools don't address

💡 College students require specialized features like textbook cost
   tracking, financial aid integration, and campus service connections
```

**Narration:**
- "THIS is the gold. Insights that would NEVER come from individual user interviews"
- "The system identified that retirees need retirement income tracking - not in my PRD"
- "Students need textbook tracking and financial aid integration - completely missed it"
- "These insights emerged from analyzing 50 perspectives simultaneously"

### The Conflict (30s)
Show segment conflicts:
```
⚔️  MAJOR CONFLICTS

• Integration vs Simplicity
  Busy Parents want: Deep integrations with productivity apps
  Retirees want: Simple UI without linking multiple accounts
  Why it conflicts: Security vs convenience trade-off

• Adoption Likelihood
  Students: 80% likely to adopt
  Retirees: 60% likely to adopt
  Gap: Retirees need specialized onboarding
```

**Narration:**
- "See this conflict? Parents want integration, retirees want simplicity"
- "You can't satisfy both with one approach - this is a real product decision"
- "Without this analysis, I'd build for one segment and alienate the other"

### The Tech Stack (30s)
Show LangSmith trace in browser:
- Expand the trace tree showing all 48 review calls
- Click into one review to show the type-safe BAML output
- Show token usage breakdown

**Narration:**
- "This is LangSmith - full observability for all 48 agent calls"
- "Every persona's review is traced and debuggable"
- "BAML guarantees type safety - every field validates"
- "LangGraph orchestrates the workflow with conditional routing"

### The Nuance (30s)
"Now here's the important part: This doesn't replace real user research.

Think of it as your pre-flight checklist:
- ✅ Catch obvious gaps (accessibility, pricing)
- ✅ Surface segment conflicts early
- ✅ Identify non-obvious insights worth validating
- ✅ Prioritize what to test with real users

Then you go validate the top insights with actual users. But you're not flying blind anymore."

### Closing (20s)
"50 synthetic users. 5 minutes. 3 non-obvious insights that changed my roadmap.

Cost? Less than a dollar.

Alternative? Ship blindly and find out in production.

Demo code, full setup, and LangSmith trace - link in description.

This is what pre-flight validation looks like."

## Why This Matters

### Compared to Demo #1
- Demo #1: Reliable persona generation (4 personas)
- Demo #2: Scale + multi-agent deliberation (300 personas + debate)

### Real-World Use Cases
1. **Pre-Launch Validation**: Before building, test PRD with synthetic panel
2. **Feature Prioritization**: See which features resonate across segments
3. **Conflict Detection**: Surface segment-specific needs that clash
4. **Accessibility Audit**: Catch gaps early
5. **Pricing Strategy**: Test different tier structures

### The BAML Advantage
- Type-safe schemas for complex multi-agent flows
- Each phase is a typed function
- Debug individual agents in playground
- Compose agents: ReviewPRD → FacilitateDebate → AggregateReviews
- Test in CI: Catch regression in synthetic feedback

## Setup

### 1. Install Dependencies
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Set Environment Variables

**Create a `.env` file in the project root:**
```bash
# From project root
cp .env.example .env

# Edit .env and add your actual API keys
```

**Required:**
```bash
# Anthropic API for Claude
ANTHROPIC_API_KEY=sk-ant-...
```

**Highly Recommended - LangSmith for tracing:**
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=baml-demo-2-prd-review
```

**Why LangSmith?**
- See all 300+ agent calls in a single trace
- Debug which personas found which issues
- Track token usage by phase
- Replay failed runs
- Free tier: 5K traces/month

**Get your keys:**
- Anthropic: https://console.anthropic.com/settings/keys
- LangSmith: https://smith.langchain.com/

### 3. Run the Demo
```bash
# Run with default settings (300 personas)
python run_demo2.py

# Or specify persona count
python run_demo2.py --personas 100

# Or use your own PRD
python run_demo2.py --prd my_prd.md

# View trace in LangSmith
# URL will be printed after run completes
```

### 4. View in LangSmith UI
After running, you'll see:
- **Trace Tree**: All 300 review calls + 4 debate calls + 1 aggregation
- **Token Usage**: Per-phase breakdown
- **Latency**: Where time is spent (parallel reviews = fast!)
- **Errors**: Which personas failed (if any)
- **Metadata**: Sentiment scores, gap counts, risk score

---

**The Takeaway**: Stop shipping to users that only exist in your head. Simulate a diverse user panel, surface conflicts early, ship with confidence instead of hope.

[← Back to Main README](README.md) | [← Type-Safe Outputs Guide](TYPE_SAFE_OUTPUTS.md)
