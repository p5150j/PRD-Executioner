'use client'

import { useEffect, useState } from 'react'

interface SegmentConfig {
  segment_id: string
  name: string
  icon: string
  enabled: boolean
  count: number
}

interface PRDInputProps {
  prdContent: string
  setPrdContent: (content: string) => void
  numPersonas: number
  setNumPersonas: (num: number) => void
  segments: SegmentConfig[]
  setSegments: (segments: SegmentConfig[]) => void
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
  segments,
  setSegments,
  onStart
}: PRDInputProps) {
  const [showCustomCreator, setShowCustomCreator] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('')
  const [customCount, setCustomCount] = useState(10)
  const [isSquadsOpen, setIsSquadsOpen] = useState(false)

  const loadSample = () => {
    setPrdContent(SAMPLE_PRD)
  }

  const addCustomSegment = () => {
    if (!customName.trim()) {
      alert('Please enter a segment name')
      return
    }

    const newSegment: SegmentConfig = {
      segment_id: `custom_${Date.now()}`,
      name: customName.trim(),
      icon: customIcon,
      enabled: true,
      count: customCount
    }

    setSegments([...segments, newSegment])

    // Reset form
    setCustomName('')
    setCustomIcon('')
    setCustomCount(10)
    setShowCustomCreator(false)
  }

  const removeSegment = (segmentId: string) => {
    setSegments(segments.filter(s => s.segment_id !== segmentId))
  }

  // Calculate total from enabled segments
  const totalPersonas = segments
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + s.count, 0)

  // Update parent's numPersonas when total changes
  useEffect(() => {
    setNumPersonas(totalPersonas)
  }, [totalPersonas, setNumPersonas])

  const toggleSegment = (segmentId: string) => {
    const newSegments = segments.map(s =>
      s.segment_id === segmentId ? { ...s, enabled: !s.enabled } : s
    )
    setSegments(newSegments)
  }

  const updateSegmentCount = (segmentId: string, count: number) => {
    const newSegments = segments.map(s =>
      s.segment_id === segmentId ? { ...s, count } : s
    )
    setSegments(newSegments)
  }

  const distributeEvenly = (total: number) => {
    const enabledSegments = segments.filter(s => s.enabled)
    if (enabledSegments.length === 0) return

    const perSegment = Math.floor(total / enabledSegments.length)
    const remainder = total % enabledSegments.length

    const newSegments = segments.map((s) => {
      if (!s.enabled) return s
      const enabledIndex = enabledSegments.findIndex(es => es.segment_id === s.segment_id)
      return {
        ...s,
        count: perSegment + (enabledIndex < remainder ? 1 : 0)
      }
    })
    setSegments(newSegments)
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
            className="w-full h-[500px] bg-black/50 backdrop-blur-md text-white border border-[#00d9ff]/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#ff006e] focus:border-[#ff006e] font-mono text-sm resize-none placeholder:text-gray-500 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:backdrop-blur-md hover:[&::-webkit-scrollbar-thumb]:bg-white/30"
          />

          <p className="mt-3 text-gray-400 text-sm">
            <span className="font-black text-[#ff006e]">WARNING:</span> Include features, pricing, target users, and assumptions.
            More detail = more carnage.
          </p>
        </div>
      </div>

      {/* Right: Configuration */}
      <div className="space-y-6">
        {/* Total Count Display */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-6 shadow-lg neon-glow-cyan">
          <label className="text-white font-[family-name:var(--font-metal)] text-2xl block mb-3 uppercase tracking-wide">
            TOTAL ASSASSINS
          </label>

          <div className="text-center">
            <div className="text-6xl font-black text-[#ff006e] neon-text-pink mb-3">
              {totalPersonas}
            </div>

            {/* Quick Distribute Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[8, 50, 100, 300].map(count => (
                <button
                  key={count}
                  onClick={() => distributeEvenly(count)}
                  className="px-3 py-2 rounded-lg text-sm font-black transition-all uppercase bg-black/40 backdrop-blur-md text-gray-400 border border-[#00d9ff]/20 hover:border-[#00d9ff]/50 hover:text-white"
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
                  {totalPersonas <= 50 ? '~5 min' : totalPersonas <= 100 ? '~10 min' : '~15 min'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Cost to Kill:</span>
                <span className="text-[#00d9ff] font-black">
                  ${((totalPersonas * 0.002) + 0.10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Segment Configuration - Accordion */}
        <div className="bg-black/30 backdrop-blur-xl border-2 border-[#ff006e]/30 rounded-2xl shadow-lg hover:border-[#ff006e] transition-all overflow-hidden">
          {/* Accordion Header */}
          <button
            onClick={() => setIsSquadsOpen(!isSquadsOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <h3 className="text-white font-[family-name:var(--font-metal)] text-xl uppercase tracking-wide">
              DEATH SQUADS
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs font-black uppercase">
                {segments.filter(s => s.enabled).length} / {segments.length} active
              </span>
              <svg
                className={`w-5 h-5 text-[#ff006e] transition-transform ${isSquadsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Accordion Content */}
          {isSquadsOpen && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {segments.map(segment => (
                  <SegmentControl
                    key={segment.segment_id}
                    segment={segment}
                    onToggle={toggleSegment}
                    onCountChange={updateSegmentCount}
                    onRemove={segment.segment_id.startsWith('custom_') ? removeSegment : undefined}
                  />
                ))}
              </div>

          {/* Custom Segment Creator */}
          <div className="mt-4 pt-4 border-t border-white/10">
            {!showCustomCreator ? (
              <button
                onClick={() => setShowCustomCreator(true)}
                className="w-full py-2 bg-black/50 backdrop-blur-md border border-[#a020f0]/30 hover:border-[#a020f0]/60 text-[#a020f0] font-black text-sm rounded-lg transition-all uppercase tracking-wide"
              >
                + CREATE CUSTOM SQUAD
              </button>
            ) : (
              <div className="bg-black/50 backdrop-blur-md border border-[#a020f0]/60 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#a020f0] font-black text-sm uppercase">Custom Squad</h4>
                  <button
                    onClick={() => setShowCustomCreator(false)}
                    className="text-white/60 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <label className="text-white text-xs font-bold">Name:</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-black/50 border border-white/20 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#a020f0]"
                    placeholder="e.g., Gamers, Developers, etc."
                  />

                  <label className="text-white text-xs font-bold">Count:</label>
                  <input
                    type="number"
                    value={customCount}
                    onChange={(e) => setCustomCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="bg-black/50 border border-white/20 rounded px-3 py-1 text-white text-sm w-20 focus:outline-none focus:ring-1 focus:ring-[#a020f0]"
                    min="1"
                    max="100"
                  />
                </div>

                <button
                  onClick={addCustomSegment}
                  className="w-full py-2 bg-gradient-to-r from-[#a020f0] to-[#8b00ff] hover:from-[#8b00ff] hover:to-[#a020f0] text-white font-black text-xs rounded-lg transition-all uppercase tracking-wide"
                >
                  Add Squad
                </button>
              </div>
            )}
          </div>
            </div>
          )}
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

function SegmentControl({
  segment,
  onToggle,
  onCountChange,
  onRemove
}: {
  segment: SegmentConfig
  onToggle: (id: string) => void
  onCountChange: (id: string, count: number) => void
  onRemove?: (id: string) => void
}) {
  return (
    <div className={`bg-black/50 backdrop-blur-md border rounded-lg p-3 transition-all ${
      segment.enabled
        ? 'border-[#00d9ff]/60 neon-glow-cyan'
        : 'border-white/10 opacity-50'
    }`}>
      {/* Header with checkbox */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="checkbox"
          checked={segment.enabled}
          onChange={() => onToggle(segment.segment_id)}
          className="w-5 h-5 rounded accent-[#ff006e] cursor-pointer"
        />
        <span className="text-white font-black text-sm flex-1">{segment.name}</span>
        <span className="text-[#ff006e] font-black text-lg neon-text-pink">
          {segment.count}
        </span>
        {onRemove && (
          <button
            onClick={() => onRemove(segment.segment_id)}
            className="text-white/40 hover:text-[#ff006e] transition-colors text-xs font-bold ml-1 uppercase"
            title="Remove custom squad"
          >
            Remove
          </button>
        )}
      </div>

      {/* Slider */}
      {segment.enabled && (
        <div className="pl-7">
          <input
            type="range"
            min="1"
            max="100"
            value={segment.count}
            onChange={(e) => onCountChange(segment.segment_id, parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff006e]"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
      )}
    </div>
  )
}
