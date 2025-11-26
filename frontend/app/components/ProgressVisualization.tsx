'use client'

import { useState, useEffect, useRef } from 'react'
import InsightsDashboard from './InsightsDashboard'

interface Persona {
  name: string
  age: number
  occupation: string
  tech_comfort: string
  income_level: string
  pain_points: string[]
  goals: string[]
  preferred_channels: string[]
  quote: string
}

interface Review {
  reviewer_name: string
  overall_sentiment: string
  willingness_to_adopt: string
  key_concerns: string[]
  what_they_loved: string[]
  dealbreakers: string[]
  reasoning: string
  persona_quote: string
}

interface DebatePoint {
  speaker_name: string
  speaker_segment: string
  position: string
  challenges_to: string[]
  supporting_evidence: string
}

interface Debate {
  topic: string
  participants: string[]
  debate_points: DebatePoint[]
  key_insight: string
}

interface ProgressState {
  phase: string
  message: string
  personasGenerated: number
  reviewsCompleted: number
  totalPersonas: number
  currentSegment?: string
  personas: Persona[]
  reviews: Review[]
  debates: Debate[]
}

interface FinalInsights {
  total_reviews: number
  risk_score: number
  executive_summary: string
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
    total: number
  }
  top_concerns: string[]
  critical_gaps: string[]
  most_loved_features: string[]
  common_dealbreakers: string[]
  non_obvious_insights: string[]
  hidden_assumptions: string[]
  major_conflicts: any[]
  segment_insights: any[]
  risk_factors: string[]
  quick_wins: string[]
  strategic_decisions_needed: string[]
}

export default function ProgressVisualization({
  progress,
  insights
}: {
  progress: ProgressState
  insights: FinalInsights | null
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const personaProgress = progress.totalPersonas > 0
    ? (progress.personasGenerated / progress.totalPersonas) * 100
    : 0

  const reviewProgress = progress.totalPersonas > 0
    ? (progress.reviewsCompleted / progress.totalPersonas) * 100
    : 0

  // Don't auto-open drawer - just make button available
  // User can open it manually when ready

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Workflow Timeline */}
      <div className="bg-black/30 backdrop-blur-xl border-2 border-[#ff006e]/30 rounded-2xl p-6 shadow-lg hover:border-[#ff006e] transition-all">
        <h3 className="text-3xl font-[family-name:var(--font-metal)] tracking-tight text-white mb-4 uppercase neon-text-pink">EXECUTION TIMELINE</h3>
        <div className="space-y-3">
          <TimelineStep
            title="Assassin Deployment"
            completed={
              (progress.personasGenerated >= progress.totalPersonas && progress.totalPersonas > 0) ||
              progress.phase === 'persona_generation_complete' ||
              progress.phase.includes('review') ||
              progress.phase.includes('phase1') ||
              progress.phase.includes('debate') ||
              progress.phase === 'aggregating' ||
              progress.phase === 'complete'
            }
            active={progress.phase.includes('persona') && progress.phase !== 'persona_generation_complete'}
          />
          <TimelineStep
            title="Death Match Reviews (Phase 1)"
            completed={
              (progress.reviewsCompleted >= progress.totalPersonas && progress.totalPersonas > 0) ||
              progress.phase === 'reviews_complete' ||
              progress.phase.includes('debate') ||
              progress.phase === 'aggregating' ||
              progress.phase === 'complete'
            }
            active={progress.phase.includes('review') || progress.phase.includes('phase1')}
          />
          <TimelineStep
            title="Agent War (Phase 2)"
            completed={
              progress.phase === 'debate_complete' ||
              progress.phase === 'debate_skipped' ||
              progress.phase === 'aggregating' ||
              progress.phase === 'complete'
            }
            active={progress.phase.includes('debate') && progress.phase !== 'debate_complete' && progress.phase !== 'debate_skipped'}
            skipped={progress.phase === 'debate_skipped'}
          />
          <TimelineStep
            title="Carnage Report (Phase 3)"
            completed={progress.phase === 'complete'}
            active={progress.phase === 'aggregating'}
          />
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Persona Generation */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-6 shadow-lg neon-glow-pink">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black tracking-tight text-white uppercase">Assassins</h3>
            <span className="text-[#ff006e] font-black tabular-nums text-xl neon-text-pink">
              {progress.personasGenerated} / {progress.totalPersonas}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-[#ff006e]/20">
            <div
              className="bg-gradient-to-r from-[#ff006e] to-[#ec008c] h-full transition-all duration-500 ease-out"
              style={{ width: `${personaProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-white font-medium">
            {personaProgress === 100 ? 'Death squad assembled' : 'Deploying assassins...'}
          </p>
        </div>

        {/* Review Progress */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-6 shadow-lg neon-glow-cyan">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black tracking-tight text-white uppercase">Executions</h3>
            <span className="text-[#00d9ff] font-black tabular-nums text-xl neon-text-cyan">
              {progress.reviewsCompleted} / {progress.totalPersonas}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-[#00d9ff]/20">
            <div
              className="bg-gradient-to-r from-[#00d9ff] to-[#00f5ff] h-full transition-all duration-500 ease-out"
              style={{ width: `${reviewProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-white font-medium">
            {reviewProgress === 100 ? 'All ideas murdered' : 'Executing your idea...'}
          </p>
        </div>
      </div>

      {/* Combined Personas + Reviews */}
      {progress.personas.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#ff006e] uppercase tracking-widest">
              DEATH SQUAD & VERDICTS ({progress.personas.length})
            </h3>
            <div className="flex gap-4 items-center">
              {progress.personasGenerated >= progress.totalPersonas && (
                <span className="text-[#00d9ff] font-black text-sm neon-text-cyan">✓ SQUAD DEPLOYED</span>
              )}
              {progress.reviewsCompleted >= progress.totalPersonas && (
                <span className="text-[#ff006e] font-black text-sm neon-text-pink">✓ EXECUTIONS COMPLETE</span>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {progress.personas.map((persona, i) => {
              // Find matching review for this persona
              const review = progress.reviews.find(r => r.reviewer_name === persona.name)
              return (
                <PersonaReviewCard key={i} persona={persona} index={i} review={review} />
              )
            })}
          </div>
        </div>
      )}

      {/* Agent Wars - Show after reviews complete */}
      {progress.debates.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[#a020f0]/30 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-[#a020f0] uppercase tracking-widest">
              AGENT WARS ({progress.debates.length})
            </h3>
            {(progress.phase === 'debate_complete' || progress.phase === 'aggregating' || progress.phase === 'complete') && (
              <span className="text-[#00d9ff] font-black text-sm neon-text-cyan">✓ WAR COMPLETE</span>
            )}
          </div>
          <div className="space-y-8">
            {progress.debates.map((debate, i) => (
              <DebateCard key={i} debate={debate} />
            ))}
          </div>
        </div>
      )}

      {/* Fun Facts */}
      <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-black tracking-tight text-white mb-4 uppercase">Death Stats</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <FactCard
            icon="💀"
            text="Each assassin has unique perspectives to brutally murder your ideas"
          />
          <FactCard
            icon="⚔️"
            text="BAML ensures 99.9% type safety - zero parsing casualties"
          />
          <FactCard
            icon="🔥"
            text="Every execution is traced in LangSmith for maximum carnage visibility"
          />
          <FactCard
            icon="⚡"
            text="Multi-agent warfare surfaces brutal truths that destroy assumptions"
          />
        </div>
      </div>

      {/* Bottom Drawer for Carnage Report */}
      <BottomDrawer
        insights={insights}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(!isDrawerOpen)}
      />
    </div>
  )
}

function TimelineStep({
  title,
  completed,
  active,
  skipped = false
}: {
  title: string
  completed: boolean
  active: boolean
  skipped?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
          completed
            ? 'bg-[#00d9ff]/20 border-[#00d9ff] neon-glow-cyan'
            : active
            ? 'bg-[#ff006e]/20 border-[#ff006e] animate-pulse neon-pulse'
            : skipped
            ? 'bg-gray-800 border-gray-700'
            : 'bg-black border-gray-700'
        }`}
      >
        {completed ? (
          <span className="text-[#00d9ff] text-lg font-black neon-text-cyan">✓</span>
        ) : active ? (
          <span className="text-[#ff006e] text-lg font-black neon-text-pink">⚡</span>
        ) : skipped ? (
          <span className="text-gray-600 text-sm">−</span>
        ) : (
          <span className="text-gray-600 text-sm">○</span>
        )}
      </div>
      <span
        className={`font-bold ${
          completed
            ? 'text-[#00d9ff] neon-text-cyan'
            : active
            ? 'text-[#ff006e] font-black neon-text-pink'
            : skipped
            ? 'text-gray-600 line-through'
            : 'text-gray-500'
        }`}
      >
        {title}
      </span>
    </div>
  )
}

function FactCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 bg-black/50 backdrop-blur-md border border-[#00d9ff]/30 rounded-xl p-3 hover:border-[#00d9ff]/60 transition-all">
      <span className="text-xl">{icon}</span>
      <p className="text-white font-medium">{text}</p>
    </div>
  )
}

function BottomDrawer({
  insights,
  isOpen,
  onClose
}: {
  insights: FinalInsights | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!insights) return null

  return (
    <>
      {/* Floating button when closed */}
      {!isOpen && (
        <button
          onClick={onClose}
          className="fixed bottom-8 right-8 px-8 py-4 bg-gradient-to-r from-[#ff006e] to-[#ec008c] hover:from-[#ec008c] hover:to-[#ff006e] text-white font-[family-name:var(--font-metal)] rounded-full shadow-[0_0_40px_rgba(255,0,110,0.6)] hover:shadow-[0_0_60px_rgba(255,0,110,0.8)] transition-all uppercase tracking-widest text-lg z-50 animate-pulse"
        >
          📊 VIEW CARNAGE REPORT
        </button>
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '85vh' }}
      >
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm -z-10"
            onClick={onClose}
          />
        )}

        {/* Drawer Content */}
        <div className="h-full bg-black border-t-4 border-[#ff006e] shadow-[0_-20px_60px_rgba(255,0,110,0.5)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-8 py-6 border-b border-[#ff006e]/30 bg-black/95 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h2 className="text-5xl font-[family-name:var(--font-bebas)] tracking-tight text-white neon-text-pink uppercase" style={{ letterSpacing: '0.1em' }}>
                  CARNAGE REPORT
                </h2>
                <p className="text-white mt-2 text-lg font-black uppercase tracking-wide">
                  Final destruction summary from all kills
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const json = JSON.stringify(insights, null, 2)
                    const blob = new Blob([json], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'carnage-report.json'
                    a.click()
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-[#00d9ff] to-[#00f5ff] hover:from-[#00f5ff] hover:to-[#00d9ff] text-black font-black rounded-full transition-all uppercase tracking-wide text-sm"
                >
                  ⬇ DOWNLOAD
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-full transition-all uppercase tracking-wide text-sm border border-white/20"
                >
                  ✕ CLOSE
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <InsightsDashboard insights={insights} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function PersonaReviewCard({
  persona,
  index,
  review
}: {
  persona: Persona;
  index: number;
  review?: Review;
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const sentimentColors = {
    positive: { bg: 'bg-[#00d9ff]/20', text: 'text-[#00d9ff]', border: 'border-[#00d9ff]/30' },
    negative: { bg: 'bg-[#ff006e]/20', text: 'text-[#ff006e]', border: 'border-[#ff006e]/30' },
    neutral: { bg: 'bg-[#a020f0]/20', text: 'text-[#a020f0]', border: 'border-[#a020f0]/30' }
  }

  const colors = review ? sentimentColors[review.overall_sentiment as keyof typeof sentimentColors] || sentimentColors.neutral : null

  return (
    <div
      ref={cardRef}
      className={`bg-black/50 backdrop-blur-md border rounded-xl p-4 transition-all ${
        review ? 'border-[#00d9ff]/30 hover:border-[#00d9ff]/60 hover:neon-glow-cyan' : 'border-[#ff006e]/30 hover:border-[#ff006e]/60 hover:neon-glow-pink'
      } ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
      style={{
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transitionDelay: `${index * 0.1}s`
      }}
    >
      {/* Persona Info - Always Visible */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={`https://i.pravatar.cc/80?img=${(index % 70) + 1}`}
          alt={persona.name}
          className="w-12 h-12 rounded-full border-2 border-[#ff006e] shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-black text-base tracking-tight">{persona.name}</h4>
          <p className="text-white text-sm font-bold">{persona.age} • {persona.occupation}</p>
          {review && colors && (
            <div className="flex gap-2 mt-1">
              <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded text-xs font-black border ${colors.border} uppercase`}>
                {review.overall_sentiment}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[#ff006e] uppercase tracking-wider font-black text-xs mb-1.5">Will Destroy For</p>
          <ul className="text-white space-y-1 text-sm">
            {persona.pain_points.map((point, i) => (
              <li key={i} className="leading-relaxed">• {point}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[#00d9ff] uppercase tracking-wider font-black text-xs mb-1.5">Hunting For</p>
          <ul className="text-white space-y-1 text-sm">
            {persona.goals.map((goal, i) => (
              <li key={i} className="leading-relaxed">• {goal}</li>
            ))}
          </ul>
        </div>

        <div className="bg-black border border-[#ff006e]/30 rounded-lg p-2.5 mt-2">
          <p className="text-white text-sm italic leading-relaxed">"{persona.quote}"</p>
        </div>

        <div className="flex gap-2 pt-1">
          <span className="px-2 py-0.5 bg-[#ff006e]/20 text-[#ff006e] rounded text-xs font-black border border-[#ff006e]/30">
            💻 {persona.tech_comfort}
          </span>
          <span className="px-2 py-0.5 bg-[#00d9ff]/20 text-[#00d9ff] rounded text-xs font-black border border-[#00d9ff]/30">
            💰 {persona.income_level}
          </span>
        </div>
      </div>

      {/* Review Section - Collapsible */}
      {review && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left mb-2"
          >
            <span className="text-white font-black text-sm uppercase tracking-wide">
              {isExpanded ? '▼ THEIR VERDICT' : '▶ THEIR VERDICT'}
            </span>
            <span className={`text-sm font-black ${colors?.text}`}>
              {review.willingness_to_adopt}
            </span>
          </button>

          {isExpanded && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-[#ff006e]/20">
                <p className="text-white text-sm leading-relaxed">{review.reasoning}</p>
              </div>

              {review.what_they_loved.length > 0 && (
                <div>
                  <p className="text-[#00d9ff] uppercase tracking-wide font-black text-xs mb-1.5">Loved</p>
                  <ul className="text-white space-y-1 text-sm">
                    {review.what_they_loved.map((item, i) => (
                      <li key={i} className="leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.key_concerns.length > 0 && (
                <div>
                  <p className="text-[#a020f0] uppercase tracking-wide font-black text-xs mb-1.5">Concerns</p>
                  <ul className="text-white space-y-1 text-sm">
                    {review.key_concerns.map((concern, i) => (
                      <li key={i} className="leading-relaxed">• {concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.dealbreakers.length > 0 && (
                <div>
                  <p className="text-[#ff006e] uppercase tracking-wide font-black text-xs mb-1.5">Dealbreakers</p>
                  <ul className="text-white space-y-1 text-sm">
                    {review.dealbreakers.map((deal, i) => (
                      <li key={i} className="leading-relaxed">• {deal}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-[#ff006e]/10 rounded-lg p-2.5 border border-[#ff006e]/30">
                <p className="text-[#ff006e] text-sm italic leading-relaxed">"{review.persona_quote}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Review State */}
      {!review && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white text-sm text-center py-2 font-medium opacity-50">Awaiting verdict...</p>
        </div>
      )}
    </div>
  )
}

function DebateMessage({
  point,
  index,
  isEvenIndex
}: {
  point: DebatePoint;
  index: number;
  isEvenIndex: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, root: messageRef.current?.closest('.overflow-y-auto') }
    )

    if (messageRef.current) {
      observer.observe(messageRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Generate consistent avatar index based on name
  const getAvatarIndex = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash) % 70 + 1
  }

  const avatarIndex = getAvatarIndex(point.speaker_name)

  return (
    <div
      ref={messageRef}
      className={`flex ${isEvenIndex ? 'justify-start' : 'justify-end'} transition-all ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
      style={{
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transitionDelay: `${index * 0.08}s`
      }}
    >
      <div className={`max-w-[85%] flex flex-col gap-1 ${isEvenIndex ? 'items-start' : 'items-end'}`}>
        {/* Avatar + Name */}
        <div className={`flex items-center gap-2 ${isEvenIndex ? '' : 'flex-row-reverse'}`}>
          <img
            src={`https://i.pravatar.cc/80?img=${avatarIndex}`}
            alt={point.speaker_name}
            className="w-8 h-8 rounded-full border-2 border-white/20 flex-shrink-0"
          />
          <div className={`${isEvenIndex ? 'text-left' : 'text-right'}`}>
            <p className="text-white font-black text-base">{point.speaker_name}</p>
            <p className="text-white/40 text-sm">{point.speaker_segment}</p>
          </div>
        </div>

        {/* Message bubble */}
        <div className={`bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-3 ${
          isEvenIndex ? 'rounded-tl-sm' : 'rounded-tr-sm'
        }`}>
          <p className="text-white text-sm leading-relaxed">{point.position}</p>

          {point.supporting_evidence && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-white/60 text-sm leading-relaxed italic">{point.supporting_evidence}</p>
            </div>
          )}

          {point.challenges_to.length > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-white/40 text-xs">↪</span>
              {point.challenges_to.map((name, j) => (
                <span key={j} className="px-2 py-0.5 bg-white/10 text-white/70 rounded text-xs border border-white/20">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DebateCard({ debate }: { debate: Debate }) {
  return (
    <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Debate Header */}
      <div className="bg-black/60 backdrop-blur-md border-b border-white/10 p-4">
        <h4 className="text-white font-black text-lg mb-2">{debate.topic}</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {debate.participants.map((participant, i) => (
            <span key={i} className="px-2 py-1 bg-white/5 backdrop-blur-md border border-white/10 text-white/60 rounded-lg text-sm font-bold">
              {participant}
            </span>
          ))}
        </div>
      </div>

      {/* Chat-style messages - alternating left/right */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-glass">
        {debate.debate_points.map((point, i) => {
          const isEvenIndex = i % 2 === 0
          return (
            <DebateMessage
              key={i}
              point={point}
              index={i}
              isEvenIndex={isEvenIndex}
            />
          )
        })}
      </div>

      {/* Key Insight */}
      <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="text-white/60 uppercase tracking-wide font-black text-xs mb-2">Key Insight</p>
            <p className="text-white text-sm leading-relaxed">{debate.key_insight}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
