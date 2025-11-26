'use client'

import { useState } from 'react'
import PRDReviewDashboard from './components/PRDReviewDashboard'

export default function Home() {
  const [started, setStarted] = useState(false)

  if (started) {
    return <PRDReviewDashboard onBack={() => setStarted(false)} />
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
          opacity: 0.2,
          zIndex: 1
        }}
      />

      {/* Background - Neon gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Blur filter for neon glow */}
            <filter id="neon-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="50" />
            </filter>

            <linearGradient id="neon-gradient-pink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 0.08 }} />
              <stop offset="100%" style={{ stopColor: '#ec008c', stopOpacity: 0.05 }} />
            </linearGradient>
            <linearGradient id="neon-gradient-cyan" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00d9ff', stopOpacity: 0.07 }} />
              <stop offset="100%" style={{ stopColor: '#00f5ff', stopOpacity: 0.04 }} />
            </linearGradient>
            <linearGradient id="neon-gradient-mix" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 0.06 }} />
              <stop offset="50%" style={{ stopColor: '#a020f0', stopOpacity: 0.05 }} />
              <stop offset="100%" style={{ stopColor: '#00d9ff', stopOpacity: 0.06 }} />
            </linearGradient>
          </defs>

          {/* Neon Blob 1 - Top left pink */}
          <ellipse cx="200" cy="150" rx="350" ry="280" fill="url(#neon-gradient-pink)" filter="url(#neon-blur)">
            <animate attributeName="cx" values="200;250;200" dur="18s" repeatCount="indefinite" />
            <animate attributeName="cy" values="150;200;150" dur="22s" repeatCount="indefinite" />
            <animate attributeName="rx" values="350;380;350" dur="20s" repeatCount="indefinite" />
            <animate attributeName="ry" values="280;260;280" dur="24s" repeatCount="indefinite" />
          </ellipse>

          {/* Neon Blob 2 - Top right cyan */}
          <ellipse cx="1200" cy="180" rx="300" ry="320" fill="url(#neon-gradient-cyan)" filter="url(#neon-blur)">
            <animate attributeName="cx" values="1200;1150;1200" dur="20s" repeatCount="indefinite" />
            <animate attributeName="cy" values="180;220;180" dur="18s" repeatCount="indefinite" />
            <animate attributeName="rx" values="300;280;300" dur="22s" repeatCount="indefinite" />
            <animate attributeName="ry" values="320;340;320" dur="26s" repeatCount="indefinite" />
          </ellipse>

          {/* Neon Blob 3 - Bottom center mixed */}
          <ellipse cx="700" cy="750" rx="400" ry="300" fill="url(#neon-gradient-mix)" filter="url(#neon-blur)">
            <animate attributeName="cx" values="700;750;700" dur="24s" repeatCount="indefinite" />
            <animate attributeName="cy" values="750;700;750" dur="20s" repeatCount="indefinite" />
            <animate attributeName="rx" values="400;420;400" dur="23s" repeatCount="indefinite" />
            <animate attributeName="ry" values="300;320;300" dur="25s" repeatCount="indefinite" />
          </ellipse>

          {/* Neon Blob 4 - Middle accent pink */}
          <ellipse cx="500" cy="450" rx="220" ry="240" fill="url(#neon-gradient-pink)" filter="url(#neon-blur)">
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
          <div className="text-3xl font-[family-name:var(--font-bebas)] tracking-tight text-white neon-text-pink">PRD EXECUTIONER</div>
          <div className="text-sm text-[#00d9ff] font-semibold">BAML + LangGraph + LangSmith</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Hero Section */}
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-8xl font-[family-name:var(--font-metal)] tracking-tight text-white mb-6 leading-tight neon-text-pink" style={{ letterSpacing: '0.05em' }}>
            MURDER YOUR<br />
            BAD IDEAS<br />
            <span className="text-[#00d9ff] neon-text-cyan text-6xl font-[family-name:var(--font-bebas)]">BEFORE YOU BUILD THEM</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed font-bold">
            50–300 synthetic ASSASSINS will BRUTALLY MURDER your idea in minutes.
            Surface hidden conflicts, critical gaps, and brutal truths
            through multi-agent BLOODBATHS.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center px-12 py-5 bg-gradient-to-r from-[#ff006e] to-[#ec008c] hover:from-[#ec008c] hover:to-[#ff006e] text-white text-xl font-[family-name:var(--font-metal)] rounded-full transition-all neon-glow-pink uppercase tracking-widest shadow-[0_0_40px_rgba(255,0,110,0.6)]"
          >
            START EXECUTION
          </button>
          <p className="mt-6 text-sm text-[#00d9ff] font-black">
            NO SIGNUP • NO MERCY • NO SURVIVORS
          </p>
        </div>

        {/* Stats Bar */}
        <div className="py-12 border-y border-[#ff006e]/30">
          <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCard value="99.9%" label="Type-safe" sublabel="BAML outputs" />
            <StatCard value="<$1" label="Per execution" sublabel="50 killers" />
            <StatCard value="5 min" label="Complete" sublabel="Bloodbath" />
            <StatCard value="100%" label="Traceable" sublabel="LangSmith" />
          </div>
        </div>

        {/* Features */}
        <div className="py-20">
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <Feature
              title="DIVERSE EXECUTIONERS"
              description="Four demographic segments with authentic pain points, goals, and behaviors. Each ASSASSIN brings brutal honesty to MASSACRE your ideas."
            />
            <Feature
              title="AGENT WARFARE"
              description="Multi-agent DEATH MATCHES surface conflicts between segments. Watch your IDEAS get OBLITERATED in real-time carnage."
            />
            <Feature
              title="BRUTAL INSIGHTS"
              description="Risk scores, sentiment DESTRUCTION, quick kills, and strategic decisions. Your bad ideas will DIE HERE."
            />
          </div>
        </div>

        {/* Technology */}
        <div className="py-16 border-t border-[#00d9ff]/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-black text-[#ff006e] uppercase tracking-widest mb-8 text-center">
              Powered by
            </h2>
            <div className="grid grid-cols-3 gap-8 text-center">
              <TechCard name="BAML" description="Type-safe LLM outputs" />
              <TechCard name="LangGraph" description="Multi-agent orchestration" />
              <TechCard name="LangSmith" description="Full observability" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-12 text-center text-sm text-gray-500 border-t border-[#ff006e]/20">
          <span className="text-[#00d9ff] font-bold">PRD Executioner</span> - Where bad ideas come to die
        </div>
      </div>
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 border-2 border-[#ff006e]/30 rounded-lg bg-black/30 backdrop-blur-xl hover:border-[#ff006e] transition-all hover:neon-glow-pink hover:shadow-[0_0_40px_rgba(255,0,110,0.6)]">
      <h3 className="text-2xl font-[family-name:var(--font-metal)] text-[#ff006e] mb-4 uppercase tracking-wide neon-text-pink">{title}</h3>
      <p className="text-gray-300 leading-relaxed font-bold">{description}</p>
    </div>
  )
}

function StatCard({ value, label, sublabel }: { value: string; label: string; sublabel: string }) {
  return (
    <div className="text-center">
      <div className="text-6xl font-[family-name:var(--font-bebas)] text-white mb-2 neon-text-pink">{value}</div>
      <div className="text-sm text-[#00d9ff] font-black uppercase tracking-widest">{label}</div>
      <div className="text-xs text-gray-400 mt-1 font-bold">{sublabel}</div>
    </div>
  )
}

function TechCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="p-4 border border-[#00d9ff]/30 rounded-lg bg-black/30 backdrop-blur-xl hover:border-[#00d9ff]/60 transition-all hover:neon-glow-cyan">
      <div className="text-lg font-black text-white mb-2">{name}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </div>
  )
}
