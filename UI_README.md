# PRD Review System - Interactive Web UI

Beautiful Next.js interface for the multi-agent PRD review system with real-time updates!

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 14 + TypeScript + Tailwind)         │
│  http://localhost:3000                                  │
│                                                         │
│  • Landing page with feature showcase                   │
│  • PRD input with sample data                          │
│  • Persona count selector (8-300)                      │
│  • Real-time progress visualization                     │
│  • Beautiful insights dashboard                        │
│                                                         │
│  Connected via Server-Sent Events (SSE) ──────┐        │
└─────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI + SSE)                               │
│  http://localhost:8000                                  │
│                                                         │
│  • POST /api/review/stream  (SSE streaming)           │
│  • POST /api/review         (non-streaming)            │
│  • GET  /docs               (Swagger docs)             │
│                                                         │
│  Wraps existing LangGraph workflow ──────┐             │
└─────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────┐
│  WORKFLOW (LangGraph + BAML + LangSmith)               │
│                                                         │
│  • Phase 1: Parallel persona reviews                   │
│  • Phase 2: Agent debates (conditional)                │
│  • Phase 3: Insights aggregation                       │
│  • Full observability in LangSmith                     │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start Backend Server

```bash
# From project root
source venv/bin/activate
python api_server.py
```

Server starts on: **http://localhost:8000**
API docs: **http://localhost:8000/docs**

### 2. Start Frontend

```bash
# From project root
cd frontend
npm run dev
```

Frontend runs on: **http://localhost:3000**

### 3. Open Browser

Navigate to **http://localhost:3000**

## Features

### Landing Page
- **Feature showcase**: Highlights of the system
- **Stats grid**: 99.9% type safety, <$1 cost, 5min runtime
- **Demo explanation**: What this is and why it matters

### PRD Input Screen
- **Rich text editor**: Paste your PRD content
- **Sample data**: One-click load of example PRD
- **Persona slider**: Choose 8-300 synthetic reviewers
- **Quick presets**: 8, 50, 100, 300 persona buttons
- **Cost/time estimates**: Real-time calculations
- **Segment preview**: Shows 4 demographic groups

### Progress Visualization
- **Live progress bars**: Persona generation & reviews
- **Phase timeline**: Visual workflow status
- **Current activity**: Real-time updates via SSE
- **Fun facts**: Educational tidbits about the tech stack
- **Animated indicators**: Pulse effects and spinners

### Insights Dashboard
- **Hero metrics**: Total reviews, risk score, sentiment, gaps
- **Executive summary**: AI-generated overview
- **Sentiment breakdown**: Visual bars with percentages
- **Non-obvious insights**: THE GOLD - debate-surfaced findings
- **Top concerns & loved features**: Ranked lists
- **Segment analysis**: Per-segment adoption likelihood
- **Major conflicts**: Trade-offs between user groups
- **Recommendations**: Quick wins & strategic decisions
- **Download report**: Export full JSON results

## UI Components

### `/app/page.tsx`
Main landing page with feature cards and CTA

### `/app/components/PRDReviewDashboard.tsx`
Master component managing state and SSE connection

### `/app/components/PRDInput.tsx`
PRD text editor, persona selector, configuration panel

### `/app/components/ProgressVisualization.tsx`
Real-time progress tracking with timeline and animations

### `/app/components/InsightsDashboard.tsx`
Results visualization with charts, metrics, conflicts

## API Endpoints

### `POST /api/review/stream`
**Streaming endpoint** (SSE)

```typescript
// Request
{
  prd_content: string,
  num_personas: number (4-300)
}

// Response: Server-Sent Events
data: {"type": "progress", "data": {...}}
data: {"type": "persona_generated", "data": {...}}
data: {"type": "review_complete", "data": {...}}
data: {"type": "final_result", "data": {...}}
data: {"type": "complete", "data": {...}}
```

### `POST /api/review`
**Non-streaming endpoint** (batch)

Returns complete insights object when done.

### `GET /`
Health check

### `GET /docs`
Interactive Swagger API documentation

## Real-Time Event Types

| Event Type | Description | Data |
|------------|-------------|------|
| `progress` | General progress update | `{phase, message}` |
| `persona_generated` | Personas created | `{count, total_so_far}` |
| `review_complete` | All reviews done | `{total_reviews, negative_sentiment_pct}` |
| `debate_complete` | Debates finished | `{debates_conducted}` |
| `final_result` | Complete insights | `{insights: {...}}` |
| `complete` | Workflow done | `{message, total_time}` |
| `error` | Something failed | `{error, type}` |

## Styling

**Design System:**
- Dark gradient theme (slate-900 → purple-900)
- Purple/pink accent colors
- Glass morphism effects
- Smooth animations and transitions
- Responsive grid layouts

**Tailwind Classes:**
- `bg-gradient-to-br from-slate-900 via-purple-900`
- `border border-slate-700`
- `hover:border-purple-500/50`
- `transition-all transform hover:scale-105`

## Demo Workflow

1. **User lands on homepage**
   - Sees value prop and stats
   - Clicks "Start Review"

2. **PRD Input screen**
   - Either paste PRD or click "Load Sample"
   - Adjust persona slider (default: 50)
   - Click "Start Review 🚀"

3. **Progress screen**
   - Watch personas being generated
   - See reviews complete in real-time
   - Progress bars update live
   - Timeline shows workflow phases

4. **Results dashboard**
   - Risk score prominently displayed
   - Sentiment breakdown with visual bars
   - Non-obvious insights highlighted
   - Segment conflicts shown
   - Download JSON report

## Tech Stack

- **Next.js 14**: App Router, React Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **FastAPI**: Python backend with async support
- **SSE (Server-Sent Events)**: Real-time streaming
- **BAML**: Type-safe LLM outputs
- **LangGraph**: Multi-agent orchestration
- **LangSmith**: Observability and tracing

## Performance

- **Persona generation**: ~2s for 50 personas
- **Reviews**: ~3-5min for 50 personas (parallel)
- **Aggregation**: ~5-10s
- **Total**: ~5min for 50 synthetic users
- **Cost**: ~$0.50-1.00 for 50 personas

## Development Tips

### Hot Reload
Both servers support hot reload:
- **Backend**: Uvicorn auto-reloads on file changes
- **Frontend**: Next.js Turbopack instant refresh

### Debugging
- **Backend logs**: Check terminal running `api_server.py`
- **Frontend logs**: Browser DevTools console
- **LangSmith**: View all LLM calls at https://smith.langchain.com

### CORS
Configured to allow `localhost:3000` → `localhost:8000`

## Future Enhancements

- [ ] WebSocket for even faster updates
- [ ] Real-time review cards appearing one by one
- [ ] Animated debate visualization (chat-like)
- [ ] Charts for sentiment over time
- [ ] Persona detail cards with avatars
- [ ] Export as PDF report
- [ ] Share results via link
- [ ] Save/load previous analyses
- [ ] Compare multiple PRDs side-by-side

## LinkedIn Video Demo Script

**Hook (5s):**
Show landing page, click "Start Review"

**Setup (10s):**
Paste PRD, select 50 personas, show cost estimate

**Action (60s):**
Watch progress bars fill, timeline advance, results appear

**Payoff (30s):**
Highlight non-obvious insights, segment conflicts, risk score

**CTA (15s):**
"Try it yourself - link in description"

## Files Created

```
frontend/
├── app/
│   ├── page.tsx                           # Landing page
│   ├── layout.tsx                         # Root layout
│   ├── globals.css                        # Global styles
│   └── components/
│       ├── PRDReviewDashboard.tsx        # Main dashboard
│       ├── PRDInput.tsx                  # Input screen
│       ├── ProgressVisualization.tsx     # Progress view
│       └── InsightsDashboard.tsx         # Results view
├── package.json
├── tsconfig.json
└── tailwind.config.ts

api_server.py                              # FastAPI backend
requirements.txt                           # Added fastapi, uvicorn, sse-starlette
```

## Troubleshooting

**Backend won't start:**
```bash
# Check Python version (need 3.10+)
python --version

# Reinstall dependencies
pip install -r requirements.txt
```

**Frontend won't start:**
```bash
# Reinstall node modules
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Ensure backend is running on port 8000
- Check CORS middleware in `api_server.py`

**SSE not connecting:**
- Check browser DevTools Network tab
- Look for `/api/review/stream` request
- Ensure EventSource is supported

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI SSE**: https://fastapi.tiangolo.com/advanced/custom-response/
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Tailwind**: https://tailwindcss.com/docs

---

**Built for Demo #2: "300 Synthetic Users Reviewed My PRD"**
LinkedIn Content Series on AI-Powered Product Development
