Tuesday | Pillar 1: LLM/GenAI in Production
Topic
"Stop praying your LLM returns valid JSON"
Hook
Your LLM app works 95% of the time. That 5% is why your users don't trust it.
Description
The dirty secret of production LLM apps: structured output is a nightmare. You're writing regex parsers, retry loops, and crossing your fingers. BAML treats prompts like typed functions — define your schema once, get validated outputs every time, test in CI/CD like real software.
Key Points to Hit

The problem: LLMs are probabilistic, but your app needs deterministic interfaces
The pattern: Type-safe contracts between your code and your prompts
The demo: Show a BAML schema → prompt → validated output pipeline
Bonus: Testing prompts in CI (this is huge and underrated)

Video
🖥️ Demo (Screen + audio)

Show a simple BAML function (e.g., ExtractResume or custom)
Run it in the playground
Show the type-safe output in Python/TS
Optional: show a test case running

---

Thursday | Pillar 3: Technical Product Ownership
Topic
"300 synthetic users reviewed my PRD in 3 minutes"
Hook
You're shipping features to users that only exist in your head. Here's how I stopped guessing.
Description
The cold start problem kills products. No users yet? No feedback. So you ship based on assumptions and pray. I built a multi-agent system that solves this: 300+ personas (generated from demographic/behavioral segments) independently review my PRD, then debate each other to surface conflicts and edge cases. Output: aggregated themes, prioritized gaps, and simulated sentiment. It doesn't replace real user research — it gives you superpowers in ambiguity and lets you ship from confidence instead of hope.
Key Points to Hit

The problem: Cold start paralysis → ship on vibes → learn expensive lessons
The solution: Synthetic user panel with two-phase feedback

Phase 1: Independent agent responses (breadth)
Phase 2: Agent debate/deliberation (depth + conflict surfacing)

The output: Themes, prioritized gaps, sentiment score
The nuance: Augments real research, doesn't replace it — this is your pre-flight checklist

Video
🖥️ Demo (Screen + audio)

Show persona generation (segment → system prompt)
Feed in a PRD or feature spec
Show Phase 1: individual agent responses
Show Phase 2: agents debating/challenging each other
Show final output: aggregated gaps + sentiment
Highlight a non-obvious insight it surfaced
