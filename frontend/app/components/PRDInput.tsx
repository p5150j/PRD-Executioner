'use client'

interface PRDInputProps {
  prdContent: string
  setPrdContent: (content: string) => void
  numPersonas: number
  setNumPersonas: (num: number) => void
  onStart: () => void
}

const SAMPLE_PRD = `# SmartBudget: Personal Finance App

## Overview
SmartBudget is a mobile-first personal finance app with AI-powered expense categorization.

## Key Features
- **AI Categorization**: Automatically categorize expenses using machine learning
- **Budget Tracking**: Set and track budgets across multiple categories
- **Goal Setting**: Create and monitor savings goals
- **Push Notifications**: Real-time alerts for spending patterns and budget warnings
- **Data Visualization**: Beautiful charts and graphs

## Pricing
- **Free Tier**: Basic budgeting with manual categorization
- **Premium Tier**: $9.99/month
  - AI categorization
  - Unlimited budgets
  - Advanced analytics
  - Priority support

## Target Users
- Busy professionals
- Parents managing family finances
- Students learning financial responsibility
- Retirees on fixed income

## Technical Stack
- React Native (iOS + Android)
- Cloud-based sync
- Bank-level encryption
`

export default function PRDInput({
  prdContent,
  setPrdContent,
  numPersonas,
  setNumPersonas,
  onStart
}: PRDInputProps) {
  const loadSample = () => {
    setPrdContent(SAMPLE_PRD)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: PRD Input */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-6 shadow-lg neon-glow-pink">
          <div className="flex items-center justify-between mb-4">
            <label className="text-white font-black text-lg uppercase tracking-wide">
              YOUR PRD CONTENT
            </label>
            <button
              onClick={loadSample}
              className="text-sm text-[#00d9ff] hover:text-white font-bold uppercase tracking-wide"
            >
              Load Sample
            </button>
          </div>

          <textarea
            value={prdContent}
            onChange={(e) => setPrdContent(e.target.value)}
            placeholder="Paste your PRD here... prepare for brutal honesty..."
            className="w-full h-[500px] bg-black/50 backdrop-blur-md text-white border border-[#00d9ff]/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#ff006e] focus:border-[#ff006e] font-mono text-sm resize-none placeholder:text-gray-500"
          />

          <p className="mt-3 text-gray-400 text-sm">
            <span className="font-black text-[#ff006e]">WARNING:</span> Include features, pricing, target users, and assumptions.
            More detail = more carnage.
          </p>
        </div>
      </div>

      {/* Right: Configuration */}
      <div className="space-y-6">
        {/* Persona Count */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-6 shadow-lg neon-glow-cyan">
          <label className="text-white font-[family-name:var(--font-metal)] text-2xl block mb-4 uppercase tracking-wide">
            ASSASSIN COUNT
          </label>

          <div className="space-y-4">
            {/* Slider */}
            <div>
              <input
                type="range"
                min="8"
                max="300"
                step="1"
                value={numPersonas}
                onChange={(e) => setNumPersonas(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff006e]"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span className="font-bold">8</span>
                <span className="text-3xl font-black text-[#ff006e] neon-text-pink">{numPersonas}</span>
                <span className="font-bold">300</span>
              </div>
            </div>

            {/* Quick Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[8, 50, 100, 300].map(count => (
                <button
                  key={count}
                  onClick={() => setNumPersonas(count)}
                  className={`px-3 py-2 rounded-lg text-sm font-black transition-all uppercase ${
                    numPersonas === count
                      ? 'bg-gradient-to-r from-[#ff006e] to-[#ec008c] text-white shadow-md neon-glow-pink'
                      : 'bg-black/40 backdrop-blur-md text-gray-400 border border-[#00d9ff]/20 hover:border-[#00d9ff]/50'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Estimate */}
            <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 space-y-1 border border-[#ff006e]/30">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Execution Time:</span>
                <span className="text-white font-black">
                  {numPersonas <= 50 ? '~5 min' : numPersonas <= 100 ? '~10 min' : '~15 min'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Cost to Kill:</span>
                <span className="text-[#00d9ff] font-black">
                  ${((numPersonas * 0.002) + 0.10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Demographic Segments */}
        <div className="bg-black/30 backdrop-blur-xl border-2 border-[#ff006e]/30 rounded-2xl p-6 shadow-lg hover:border-[#ff006e] transition-all">
          <h3 className="text-white font-[family-name:var(--font-metal)] text-xl mb-3 uppercase tracking-wide">DEATH SQUAD</h3>
          <div className="space-y-2 text-sm">
            <SegmentBadge name="Busy Parents" icon="👨‍👩‍👧" />
            <SegmentBadge name="Young Professionals" icon="💼" />
            <SegmentBadge name="Students" icon="🎓" />
            <SegmentBadge name="Retirees" icon="🏖️" />
          </div>
          <p className="mt-3 text-gray-400 text-xs font-black uppercase">
            4 killer squads ready to execute
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={!prdContent.trim()}
          className="w-full py-5 bg-gradient-to-r from-[#ff006e] to-[#ec008c] hover:from-[#ec008c] hover:to-[#ff006e] disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-[family-name:var(--font-metal)] rounded-full shadow-[0_0_40px_rgba(255,0,110,0.6)] hover:shadow-[0_0_60px_rgba(255,0,110,0.8)] transition-all disabled:transform-none uppercase tracking-widest text-xl"
        >
          {prdContent.trim() ? 'BEGIN EXECUTION' : 'ENTER PRD FIRST'}
        </button>
      </div>
    </div>
  )
}

function SegmentBadge({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-[#00d9ff]/30 rounded-lg px-3 py-2 hover:border-[#00d9ff]/60 transition-all">
      <span>{icon}</span>
      <span className="text-gray-300 font-bold">{name}</span>
    </div>
  )
}
