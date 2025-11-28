# PRD Executioner

![PRD Executioner](.github/images/executioner-hero.png)

**Stop shipping features to users that only exist in your head.**

Generate 50-300 synthetic user personas, have them brutally review your PRD, and surface hidden conflicts through multi-agent debates - all in under 5 minutes.

![Tech Stack](https://img.shields.io/badge/BAML-Type--safe-brightgreen) ![LangGraph](https://img.shields.io/badge/LangGraph-Multi--agent-blue) ![LangSmith](https://img.shields.io/badge/LangSmith-Observable-purple)

---

## What is This?

A multi-agent system that simulates a diverse user panel to validate your Product Requirements Documents (PRDs) before you write a single line of code:

- **300+ synthetic personas** generated from demographic/behavioral segments
- **Phase 1**: Independent PRD reviews (breadth of perspectives)
- **Phase 2**: Agent debates (surface conflicts and non-obvious insights)
- **Phase 3**: Aggregated analysis with risk scoring

**This doesn't replace real user research** - it's your **pre-flight checklist** to catch expensive mistakes early.

## Key Features

- **99.9% Type-Safe Outputs**: BAML ensures every LLM response matches your schema
- **Real-Time Web UI**: Watch personas generate and reviews stream in live
- **Multi-Agent Debates**: Surface segment conflicts that interviews miss
- **Full Observability**: LangSmith tracing for every agent call
- **Cost Efficient**: ~$1 for 50 personas, ~$5 for 300 personas

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Anthropic API key

### 1. Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd baml-test

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Set Environment Variables

**Create a `.env` file in the project root:**

```bash
# Copy the example file
cp .env.example .env

# Then edit .env and add your actual API keys
```

**Required variables:**
```bash
# Anthropic API for Claude (required)
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional but recommended:**
```bash
# LangSmith for observability (highly recommended for Demo #2)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=prd-executioner
```

Get your keys:
- Anthropic: https://console.anthropic.com/settings/keys
- LangSmith: https://smith.langchain.com/ (free tier: 5K traces/month)

**Note for BAML Playground users:**
If you want to use `baml-cli dev` playground, also create `baml_src/.env`:
```bash
cp baml_src/.env.example baml_src/.env
# Add your ANTHROPIC_API_KEY
```

### 3. Run the Application

**Option A: Web UI (Recommended)**

```bash
# Terminal 1: Start backend
source venv/bin/activate
python api_server.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

**Option B: Command Line**

```bash
source venv/bin/activate
python run_demo2.py --personas 50
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 14 + TypeScript + Tailwind)         │
│  http://localhost:3000                                  │
│                                                         │
│  • Death metal themed UI (PRD EXECUTIONER 🤘)          │
│  • Real-time progress via Server-Sent Events            │
│  • Interactive insights dashboard                       │
│                                                         │
│  Connected via SSE ──────────────────┐                 │
└─────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI + SSE)                               │
│  http://localhost:8000                                  │
│                                                         │
│  • POST /api/review/stream  (SSE streaming)           │
│  • Wraps LangGraph workflow                            │
│                                                         │
│  LangGraph State Machine ──────────┐                   │
└─────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────┐
│  WORKFLOW (LangGraph + BAML + LangSmith)               │
│                                                         │
│  Node 1: Generate Personas (BAML: UserPersona)         │
│          ↓                                              │
│  Node 2: Parallel Reviews (BAML: PRDReview)            │
│          ↓                                              │
│  Router: If sentiment < 30% negative → Skip debate      │
│          ↓                                              │
│  Node 3: Agent Debates (BAML: DebateSession)           │
│          ↓                                              │
│  Node 4: Aggregate Insights (BAML: AggregatedInsights) │
│                                                         │
│  Full observability in LangSmith                       │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

**Backend:**
- **BAML**: Type-safe LLM outputs with Schema-Aligned Parsing
- **LangGraph**: Multi-agent workflow orchestration
- **LangSmith**: Tracing, debugging, and observability
- **FastAPI**: High-performance async Python API

**Frontend:**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Server-Sent Events**: Real-time streaming updates

## Project Structure

```
├── baml_src/                      # BAML schemas and functions
│   ├── persona_generation.baml    # UserPersona schema
│   ├── prd_review.baml           # PRDReview schema
│   ├── agent_debate.baml         # DebateSession schema
│   └── aggregation.baml          # AggregatedInsights schema
│
├── demo1_before_baml/            # Demo #1: Before BAML
│   └── messy_persona_gen.py      # 368 lines of pain
│
├── demo1_after_baml/             # Demo #1: After BAML
│   └── clean_persona_gen.py      # 120 lines of clean code
│
├── demo2_multi_agent/            # Demo #2: Multi-agent system
│   ├── persona_scaling.py        # Scale 4 segments → N personas
│   ├── prd_review_workflow.py   # LangGraph workflow
│   └── review_runner.py          # CLI runner
│
├── frontend/                      # Next.js web application
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   └── components/
│   │       ├── PRDReviewDashboard.tsx
│   │       ├── PRDInput.tsx
│   │       ├── ProgressVisualization.tsx
│   │       └── InsightsDashboard.tsx
│   └── package.json
│
├── sample_data/
│   ├── demographic_segments.json # 4 user segments
│   └── sample_prd.md            # Example PRD
│
├── api_server.py                 # FastAPI backend with SSE
├── run_demo1.py                  # Demo #1 runner
├── run_demo2.py                  # Demo #2 runner
├── requirements.txt              # Python dependencies
│
├── TYPE_SAFE_OUTPUTS.md         # Type-safe LLM outputs guide
└── MULTI_AGENT_REVIEW.md        # Multi-agent PRD review guide
```

## Demos

This project includes two complementary demos:

### Demo #1: "Stop Praying Your LLM Returns Valid JSON"

**The Problem**: Traditional LLM apps have 95% reliability due to:
- JSON wrapped in markdown
- Invalid field names and types
- Missing required fields
- 300+ lines of parsing/validation code

**The Solution**: BAML's type-safe schemas + Schema-Aligned Parsing

**Results**:
- 95% → 99.9% reliability
- 52% code reduction (368 → 177 lines)
- 32.3% token savings (51.3% on input tokens!)

[Read the Type-Safe Outputs Guide →](TYPE_SAFE_OUTPUTS.md)

### Demo #2: "300 Synthetic Users Reviewed My PRD"

**The Problem**: Cold start paradox - need users to get feedback, need feedback to build right product

**The Solution**: Multi-agent system with:
- 300+ diverse personas across 4 demographic segments
- Independent reviews → Agent debates → Aggregated insights
- Risk scoring, sentiment analysis, conflict detection

**Results**:
- Surface non-obvious insights that interviews miss
- Catch segment conflicts early
- ~5 minutes, <$1 for 50 personas

[Read the Multi-Agent Review Guide →](MULTI_AGENT_REVIEW.md)

## Usage Examples

### Web UI

1. Navigate to http://localhost:3000
2. Click "START EXECUTION"
3. Paste your PRD or click "Load Sample"
4. Configure death squads (demographic segments)
5. Click "BEGIN EXECUTION"
6. Watch real-time progress
7. Review insights dashboard

### Command Line

```bash
# Run with default settings (50 personas)
python run_demo2.py

# Specify persona count
python run_demo2.py --personas 100

# Use custom PRD
python run_demo2.py --prd my_prd.md --personas 50

# Run Demo #1 comparison
python run_demo1.py both
```

### Python API

```python
from baml_client import b
from demo2_multi_agent.prd_review_workflow import run_prd_review

# Generate a single persona
persona = b.GeneratePersona(segment_data="Young professional, tech-savvy...")

# Run full PRD review
results = run_prd_review(
    prd_content="# My Product...",
    num_personas=50
)

print(f"Risk Score: {results.risk_score}/10")
print(f"Top Concerns: {results.top_concerns}")
```

## Key Insights

### Why BAML?
- **Type Safety**: Define schemas once, use everywhere
- **Schema-Aligned Parsing**: Fixes broken LLM outputs automatically
- **Token Efficiency**: Compact schema format saves 50%+ input tokens
- **Testing**: Test prompts in CI like regular code
- **Composability**: Chain typed functions together

### Why LangGraph?
- **Stateful Workflows**: Complex multi-step agent flows
- **Conditional Routing**: Skip debates if sentiment is positive
- **Parallelism**: 300 agents execute concurrently
- **Checkpointing**: Resume if a phase fails
- **Visualization**: See workflow graph in LangSmith

### Why LangSmith?
- **Trace Everything**: All 300+ agent calls in one view
- **Debug Easily**: See which personas found which issues
- **Track Costs**: Per-phase token usage breakdown
- **Replay Failures**: Re-run failed agents
- **Production Ready**: Monitor live deployments

## Performance

| Personas | Time  | Cost   | Use Case |
|----------|-------|--------|----------|
| 8        | ~1min | $0.10  | Quick validation |
| 50       | ~5min | $0.50  | Standard review |
| 100      | ~10min| $1.00  | Deep analysis |
| 300      | ~15min| $3.00  | Production readiness |

All timings include persona generation, parallel reviews, debates, and aggregation.

## Development

### Running Tests

```bash
# Python tests
pytest

# BAML playground
baml-cli dev
```

### Hot Reload

Both servers support hot reload:
- **Backend**: Uvicorn auto-reloads on file changes
- **Frontend**: Next.js Turbopack instant refresh

### Debugging

- **Backend logs**: Terminal running `api_server.py`
- **Frontend logs**: Browser DevTools console
- **LLM traces**: https://smith.langchain.com

## Contributing

This is a demo project showcasing BAML + LangGraph + LangSmith integration. Feel free to fork and adapt for your use cases!

### Ideas for Enhancement

- [ ] WebSocket for faster updates
- [ ] Animated debate visualization
- [ ] Persona avatars and detail cards
- [ ] PDF report export
- [ ] Multi-PRD comparison
- [ ] Historical analysis tracking
- [ ] Custom segment templates
- [ ] Integration with issue trackers

## License

MIT

## Acknowledgments

Built with:
- [BAML](https://boundaryml.com/) - Type-safe LLM framework
- [LangGraph](https://langchain-ai.github.io/langgraph/) - Agent orchestration
- [LangSmith](https://smith.langchain.com/) - LLM observability
- [Anthropic Claude](https://anthropic.com/) - Language models

---

**The Takeaway**: Stop shipping to users that only exist in your head. Simulate a diverse user panel, surface conflicts early, ship with confidence instead of hope.

**Made with 🤘 by engineers who are tired of shipping on vibes**
