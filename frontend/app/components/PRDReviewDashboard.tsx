'use client'

import { useState } from 'react'
import PRDInput from './PRDInput'
import ProgressVisualization from './ProgressVisualization'

type Phase = 'input' | 'running'

interface StreamEvent {
  type: string
  timestamp: string
  data: any
}

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

interface SegmentConfig {
  segment_id: string
  name: string
  icon: string
  enabled: boolean
  count: number
}

export default function PRDReviewDashboard({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('input')
  const [prdContent, setPrdContent] = useState('')
  const [numPersonas, setNumPersonas] = useState(50)
  const [segments, setSegments] = useState<SegmentConfig[]>([
    { segment_id: 'busy_parents', name: 'Busy Parents', icon: '', enabled: true, count: 12 },
    { segment_id: 'young_professionals', name: 'Young Professionals', icon: '', enabled: true, count: 13 },
    { segment_id: 'budget_conscious_students', name: 'Students', icon: '', enabled: true, count: 12 },
    { segment_id: 'retirees', name: 'Retirees', icon: '', enabled: true, count: 13 }
  ])

  const [progress, setProgress] = useState<ProgressState>({
    phase: 'idle',
    message: '',
    personasGenerated: 0,
    reviewsCompleted: 0,
    totalPersonas: 0,
    personas: [],
    reviews: [],
    debates: []
  })

  const [insights, setInsights] = useState<FinalInsights | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startReview = async () => {
    if (!prdContent.trim()) {
      alert('Please enter your PRD content')
      return
    }

    setPhase('running')
    setError(null)
    setProgress({
      phase: 'initialization',
      message: 'Starting review...',
      personasGenerated: 0,
      reviewsCompleted: 0,
      totalPersonas: numPersonas,
      personas: [],
      reviews: [],
      debates: []
    })

    try {
      // Only send enabled segments with count > 0, and only the fields the API needs
      const enabledSegments = segments
        .filter(s => s.enabled && s.count > 0)
        .map(s => ({
          segment_id: s.segment_id,
          count: s.count,
          // Include custom name for custom segments
          ...(s.segment_id.startsWith('custom_') ? { custom_name: s.name } : {})
        }))

      const response = await fetch('http://localhost:8000/api/review/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prd_content: prdContent,
          num_personas: numPersonas,
          segments: enabledSegments.length > 0 ? enabledSegments : null
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.substring(6).trim()
              if (jsonStr) {
                const eventData = JSON.parse(jsonStr)
                handleStreamEvent(eventData)
              }
            } catch (parseError) {
              console.error('JSON parse error:', parseError, 'Line:', trimmed)
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setPhase('input')
    }
  }

  const handleStreamEvent = (event: StreamEvent) => {
    console.log('========================================')
    console.log('EVENT TYPE:', event.type)
    console.log('EVENT DATA:', JSON.stringify(event.data, null, 2))
    console.log('FULL EVENT:', JSON.stringify(event, null, 2))
    console.log('========================================')

    switch (event.type) {
      case 'progress':
        setProgress(prev => ({
          ...prev,
          phase: event.data.phase || prev.phase,
          message: event.data.message || prev.message,
          currentSegment: event.data.segment,
          totalPersonas: event.data.total_personas || prev.totalPersonas
        }))
        break

      case 'persona_generated':
        setProgress(prev => ({
          ...prev,
          personasGenerated: event.data.total_so_far || prev.personasGenerated + event.data.count,
          message: `Generated ${event.data.total_so_far} personas`,
          personas: event.data.persona ? [...prev.personas, event.data.persona] : prev.personas
        }))
        break

      case 'review_generated':
        setProgress(prev => ({
          ...prev,
          reviewsCompleted: event.data.total_so_far,
          message: `Completed ${event.data.total_so_far} reviews`,
          reviews: [...prev.reviews, {
            reviewer_name: event.data.reviewer_name,
            overall_sentiment: event.data.overall_sentiment,
            willingness_to_adopt: event.data.willingness_to_adopt,
            key_concerns: event.data.key_concerns,
            what_they_loved: event.data.what_they_loved,
            dealbreakers: event.data.dealbreakers,
            reasoning: event.data.reasoning,
            persona_quote: event.data.persona_quote
          }]
        }))
        break

      case 'review_complete':
        setProgress(prev => ({
          ...prev,
          reviewsCompleted: event.data.total_reviews,
          phase: 'reviews_complete',
          message: `Completed ${event.data.total_reviews} reviews`
        }))
        break

      case 'debate_generated':
        setProgress(prev => ({
          ...prev,
          message: `Running debate: ${event.data.topic}`,
          debates: [...prev.debates, {
            topic: event.data.topic,
            participants: event.data.participants,
            debate_points: event.data.debate_points,
            key_insight: event.data.key_insight
          }]
        }))
        break

      case 'debate_complete':
        setProgress(prev => ({
          ...prev,
          phase: 'debate_complete',
          message: `Agent debates completed (${event.data.debates_conducted} sessions)`
        }))
        break

      case 'final_result':
        console.log('🎉 FINAL INSIGHTS RECEIVED!')
        console.log('Insights object:', JSON.stringify(event.data.insights, null, 2))
        setInsights(event.data.insights)
        // Keep phase as 'running' - don't change to 'complete'
        break

      case 'complete':
        console.log('Review complete!')
        setProgress(prev => ({
          ...prev,
          phase: 'complete',
          message: 'PRD review complete!'
        }))
        break

      case 'error':
        setError(event.data.error)
        setPhase('input')
        break
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fixed Background Image */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://cdn.midjourney.com/5ed83069-cb35-43c3-aac7-79c54770350d/0_2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          zIndex: 1
        }}
      />

      {/* Background - Neon gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Blur filter for neon glow */}
            <filter id="neon-blur-dash">
              <feGaussianBlur in="SourceGraphic" stdDeviation="50" />
            </filter>

            <linearGradient id="neon-gradient-pink-dash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 0.08 }} />
              <stop offset="100%" style={{ stopColor: '#ec008c', stopOpacity: 0.05 }} />
            </linearGradient>
            <linearGradient id="neon-gradient-cyan-dash" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00d9ff', stopOpacity: 0.07 }} />
              <stop offset="100%" style={{ stopColor: '#00f5ff', stopOpacity: 0.04 }} />
            </linearGradient>
            <linearGradient id="neon-gradient-mix-dash" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 0.06 }} />
              <stop offset="50%" style={{ stopColor: '#a020f0', stopOpacity: 0.05 }} />
              <stop offset="100%" style={{ stopColor: '#00d9ff', stopOpacity: 0.06 }} />
            </linearGradient>
          </defs>

          {/* Neon Blob 1 - Top left pink */}
          <ellipse cx="200" cy="150" rx="350" ry="280" fill="url(#neon-gradient-pink-dash)" filter="url(#neon-blur-dash)">
            <animate attributeName="cx" values="200;250;200" dur="18s" repeatCount="indefinite" />
            <animate attributeName="cy" values="150;200;150" dur="22s" repeatCount="indefinite" />
            <animate attributeName="rx" values="350;380;350" dur="20s" repeatCount="indefinite" />
            <animate attributeName="ry" values="280;260;280" dur="24s" repeatCount="indefinite" />
          </ellipse>

          {/* Neon Blob 2 - Top right cyan */}
          <ellipse cx="1200" cy="180" rx="300" ry="320" fill="url(#neon-gradient-cyan-dash)" filter="url(#neon-blur-dash)">
            <animate attributeName="cx" values="1200;1150;1200" dur="20s" repeatCount="indefinite" />
            <animate attributeName="cy" values="180;220;180" dur="18s" repeatCount="indefinite" />
            <animate attributeName="rx" values="300;280;300" dur="22s" repeatCount="indefinite" />
            <animate attributeName="ry" values="320;340;320" dur="26s" repeatCount="indefinite" />
          </ellipse>

          {/* Neon Blob 3 - Bottom center mixed */}
          <ellipse cx="700" cy="750" rx="400" ry="300" fill="url(#neon-gradient-mix-dash)" filter="url(#neon-blur-dash)">
            <animate attributeName="cx" values="700;750;700" dur="24s" repeatCount="indefinite" />
            <animate attributeName="cy" values="750;700;750" dur="20s" repeatCount="indefinite" />
            <animate attributeName="rx" values="400;420;400" dur="23s" repeatCount="indefinite" />
            <animate attributeName="ry" values="300;320;300" dur="25s" repeatCount="indefinite" />
          </ellipse>

          {/* Neon Blob 4 - Middle accent pink */}
          <ellipse cx="500" cy="450" rx="220" ry="240" fill="url(#neon-gradient-pink-dash)" filter="url(#neon-blur-dash)">
            <animate attributeName="cx" values="500;530;500" dur="16s" repeatCount="indefinite" />
            <animate attributeName="cy" values="450;480;450" dur="19s" repeatCount="indefinite" />
            <animate attributeName="rx" values="220;200;220" dur="17s" repeatCount="indefinite" />
            <animate attributeName="ry" values="240;260;240" dur="21s" repeatCount="indefinite" />
          </ellipse>
        </svg>
      </div>

      {/* Nav */}
      <nav className="border-b border-[#ff006e]/20 relative z-10 backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-3xl font-[family-name:var(--font-bebas)] tracking-tight text-white neon-text-pink">🤘 PRD EXECUTIONER</div>
          <button
            onClick={onBack}
            className="text-sm font-black text-[#00d9ff] hover:text-white transition-colors uppercase tracking-widest"
          >
            BACK
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-7xl font-[family-name:var(--font-bebas)] tracking-tight text-white mb-2" style={{ letterSpacing: '0.05em' }}>
            {phase === 'input' && <span className="neon-text-pink">PREPARE FOR EXECUTION</span>}
            {phase === 'running' && (insights ? <span className="neon-text-cyan">EXECUTION COMPLETE</span> : <span className="neon-text-pink">EXECUTING...</span>)}
          </h1>
          <p className="text-gray-300 text-xl font-black mt-4 uppercase tracking-wide">
            {phase === 'input' && 'Enter your PRD and watch it get TORN APART'}
            {phase === 'running' && !insights && 'Your assumptions are being OBLITERATED'}
            {phase === 'running' && insights && 'The CARNAGE is complete'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-[#ff006e]/10 border-2 border-[#ff006e] rounded-lg neon-glow-pink">
            <p className="text-white">
              <span className="font-black text-[#ff006e]">ERROR:</span> {error}
            </p>
          </div>
        )}

        {/* Phase-based rendering */}
        {phase === 'input' && (
          <PRDInput
            prdContent={prdContent}
            setPrdContent={setPrdContent}
            numPersonas={numPersonas}
            setNumPersonas={setNumPersonas}
            segments={segments}
            setSegments={setSegments}
            onStart={startReview}
          />
        )}

        {phase === 'running' && (
          <ProgressVisualization progress={progress} insights={insights} />
        )}
      </div>
    </div>
  )
}
