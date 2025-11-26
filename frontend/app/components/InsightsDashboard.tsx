'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, LineChart, Line, CartesianGrid } from 'recharts'

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
  major_conflicts: Array<{
    topic: string
    segment_a: string
    segment_b: string
    segment_a_wants: string
    segment_b_wants: string
    why_it_conflicts: string
    potential_resolution: string
  }>
  segment_insights: Array<{
    segment_name: string
    unique_concerns: string[]
    adoption_likelihood: number
    critical_missing_features: string[]
  }>
  risk_factors: string[]
  quick_wins: string[]
  strategic_decisions_needed: string[]
}

export default function InsightsDashboard({ insights }: { insights: FinalInsights }) {
  const riskLevel = insights.risk_score >= 7 ? 'CRITICAL' : insights.risk_score >= 5 ? 'HIGH' : 'MODERATE'
  const riskColor = riskLevel === 'CRITICAL' ? 'red' : riskLevel === 'HIGH' ? 'yellow' : 'cyan'

  const positivePercent = (insights.sentiment_breakdown.positive / insights.sentiment_breakdown.total) * 100
  const neutralPercent = (insights.sentiment_breakdown.neutral / insights.sentiment_breakdown.total) * 100
  const negativePercent = (insights.sentiment_breakdown.negative / insights.sentiment_breakdown.total) * 100

  return (
    <div className="space-y-12">
      {/* Hero Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          label="Assassins Deployed"
          value={insights.total_reviews.toString()}
          color="cyan"
        />
        <StatCard
          label="Idea Threat Level"
          value={`${insights.risk_score.toFixed(1)}/10`}
          color={riskColor}
          subtitle={riskLevel}
        />
        <StatCard
          label="Survival Rate"
          value={`${positivePercent.toFixed(0)}%`}
          color="cyan"
        />
        <StatCard
          label="Fatal Flaws Found"
          value={insights.critical_gaps.length.toString()}
          color="pink"
        />
      </div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#ff006e] to-transparent opacity-30"></div>

      {/* Executive Summary */}
      <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg neon-glow-pink">
        <h2 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-6">DEATH SUMMARY</h2>
        <p className="text-white text-lg leading-relaxed font-medium">{insights.executive_summary}</p>
      </div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent opacity-30"></div>

      {/* Sentiment Breakdown - Visual Charts */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-8 shadow-lg neon-glow-cyan">
          <h2 className="text-base font-black text-[#00d9ff] uppercase tracking-widest mb-6">KILL COUNT BREAKDOWN</h2>
          <div className="h-80 bg-black/50 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Positive', value: insights.sentiment_breakdown.positive, color: '#00d9ff' },
                    { name: 'Neutral', value: insights.sentiment_breakdown.neutral, color: '#a020f0' },
                    { name: 'Negative', value: insights.sentiment_breakdown.negative, color: '#ff006e' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => {
                    const percent = entry.percent || 0;
                    return `${entry.name} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                >
                  {[
                    { name: 'Positive', value: insights.sentiment_breakdown.positive, color: '#00d9ff' },
                    { name: 'Neutral', value: insights.sentiment_breakdown.neutral, color: '#a020f0' },
                    { name: 'Negative', value: insights.sentiment_breakdown.negative, color: '#ff006e' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid rgba(255, 0, 110, 0.5)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#00d9ff' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Score Gauge */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg neon-glow-pink">
          <h2 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-6">IDEA THREAT METER</h2>
          <div className="h-80 bg-black/50 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={20}
                data={[{
                  name: 'Risk Score',
                  value: insights.risk_score * 10,
                  fill: insights.risk_score >= 7 ? '#ff006e' : insights.risk_score >= 5 ? '#a020f0' : '#00d9ff'
                }]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-4xl">
                  {insights.risk_score.toFixed(1)}
                </text>
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-xs uppercase">
                  {riskLevel}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#a020f0] to-transparent opacity-30"></div>

      {/* Segment Trends Line Chart */}
      {insights.segment_insights.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-8 shadow-lg neon-glow-cyan">
          <h2 className="text-base font-black text-[#00d9ff] uppercase tracking-widest mb-6">SEGMENT ANALYSIS TRENDS</h2>
          <div className="h-96 bg-black/50 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={insights.segment_insights.map((s, idx) => ({
                  segment: s.segment_name,
                  adoptionRate: s.adoption_likelihood,
                  concernCount: s.unique_concerns.length,
                  missingFeatures: s.critical_missing_features.length,
                  index: idx + 1
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="segment"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
                  stroke="rgba(255,255,255,0.2)"
                />
                <YAxis
                  tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
                  stroke="rgba(255,255,255,0.2)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid rgba(255, 0, 110, 0.5)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="adoptionRate"
                  stroke="#00d9ff"
                  strokeWidth={3}
                  dot={{ fill: '#00d9ff', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  name="Kill Rate %"
                  activeDot={{ r: 7, fill: '#00d9ff', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="concernCount"
                  stroke="#ff006e"
                  strokeWidth={3}
                  dot={{ fill: '#ff006e', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  name="Concerns"
                  activeDot={{ r: 7, fill: '#ff006e', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="missingFeatures"
                  stroke="#a020f0"
                  strokeWidth={3}
                  dot={{ fill: '#a020f0', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  name="Missing Features"
                  activeDot={{ r: 7, fill: '#a020f0', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#00d9ff] rounded-full border-2 border-white"></div>
              <span className="text-xs text-white font-bold">Kill Rate %</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#ff006e] rounded-full border-2 border-white"></div>
              <span className="text-xs text-white font-bold">Concerns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#a020f0] rounded-full border-2 border-white"></div>
              <span className="text-xs text-white font-bold">Missing Features</span>
            </div>
          </div>
        </div>
      )}

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#ff006e] to-transparent opacity-30"></div>

      {/* Non-Obvious Insights */}
      {insights.non_obvious_insights.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg">
          <h2 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-3">BRUTAL TRUTHS</h2>
          <p className="text-white text-sm mb-8 font-medium">
            Uncovered through agent warfare
          </p>
          <ul className="space-y-3">
            {insights.non_obvious_insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 bg-black/50 backdrop-blur-md rounded-xl p-4 border border-[#ff006e]/30 hover:border-[#ff006e]/60 transition-all">
                <span className="text-[#ff006e] font-black text-sm mt-0.5 neon-text-pink">{i + 1}</span>
                <p className="text-white leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid: Top Concerns & Loved Features */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Top Concerns */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg">
          <h3 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-8">CRITICAL WOUNDS</h3>
          <ul className="space-y-3">
            {insights.top_concerns.slice(0, 5).map((concern, i) => (
              <li key={i} className="flex items-start gap-3 text-white text-sm leading-relaxed">
                <span className="text-[#ff006e] font-black min-w-[20px]">{i + 1}</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Most Loved */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-8 shadow-lg">
          <h3 className="text-base font-black text-[#00d9ff] uppercase tracking-widest mb-8">SURVIVORS' FAVORITES</h3>
          <ul className="space-y-3">
            {insights.most_loved_features.slice(0, 5).map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-white text-sm leading-relaxed">
                <span className="text-[#00d9ff] font-black min-w-[20px]">{i + 1}</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#ff006e] to-transparent opacity-30"></div>

      {/* Segment-Specific Insights */}
      {insights.segment_insights.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg">
          <h2 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-8">KILLER SQUAD BREAKDOWN</h2>

          {/* Bar Chart for Adoption Rates */}
          <div className="h-96 mb-8 bg-black/50 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={insights.segment_insights.map((s, idx) => ({
                  name: s.segment_name,
                  killRate: s.adoption_likelihood,
                  fill: ['#ff006e', '#00d9ff', '#a020f0', '#ff006e'][idx % 4]
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                />
                <YAxis
                  tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }}
                  label={{ value: 'Kill Rate %', angle: -90, position: 'insideLeft', fill: '#ffffff', fontWeight: 'bold', fontSize: 12 }}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid rgba(255, 0, 110, 0.5)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#00d9ff' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(value) => [`${value}%`, 'Kill Rate']}
                />
                <Bar
                  dataKey="killRate"
                  radius={[8, 8, 0, 0]}
                >
                  {insights.segment_insights.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ff006e', '#00d9ff', '#a020f0', '#ff006e'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Segment Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {insights.segment_insights.map((segment, i) => (
              <div key={i} className="bg-black/50 backdrop-blur-md rounded-xl p-5 border border-[#00d9ff]/30 hover:border-[#00d9ff]/60 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-black">{segment.segment_name}</h4>
                  <span className="text-[#00d9ff] font-black text-sm neon-text-cyan">
                    {segment.adoption_likelihood.toFixed(0)}% kill rate
                  </span>
                </div>
                {segment.unique_concerns.length > 0 && (
                  <div>
                    <p className="text-white text-xs uppercase tracking-wide mb-2 font-black">Will Murder For</p>
                    <ul className="text-sm text-white space-y-2">
                      {segment.unique_concerns.slice(0, 2).map((concern, j) => (
                        <li key={j} className="leading-relaxed">• {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#a020f0] to-transparent opacity-30"></div>

      {/* Major Conflicts */}
      {insights.major_conflicts.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg">
          <h2 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-3">SEGMENT WARS</h2>
          <p className="text-white text-sm mb-8 font-medium">Brutal trade-offs requiring bloodshed</p>
          <div className="space-y-8">
            {insights.major_conflicts.map((conflict, i) => (
              <div key={i} className="bg-black/50 backdrop-blur-md rounded-xl p-5 border border-[#ff006e]/30">
                <h4 className="text-white font-black mb-4 uppercase">{conflict.topic}</h4>
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-[#ff006e] text-xs uppercase tracking-wide mb-2 font-black">{conflict.segment_a}</p>
                    <p className="text-white text-sm leading-relaxed">{conflict.segment_a_wants}</p>
                  </div>
                  <div>
                    <p className="text-[#00d9ff] text-xs uppercase tracking-wide mb-2 font-black">{conflict.segment_b}</p>
                    <p className="text-white text-sm leading-relaxed">{conflict.segment_b_wants}</p>
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 mb-3 border border-[#a020f0]/30">
                  <p className="text-[#a020f0] text-xs uppercase tracking-wide mb-2 font-black">Battle Zone</p>
                  <p className="text-white text-sm leading-relaxed">{conflict.why_it_conflicts}</p>
                </div>
                {conflict.potential_resolution && (
                  <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-[#00d9ff]/30">
                    <p className="text-[#00d9ff] text-xs uppercase tracking-wide mb-2 font-black">Ceasefire Terms</p>
                    <p className="text-white text-sm leading-relaxed">{conflict.potential_resolution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent opacity-30"></div>

      {/* Recommendations */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Wins */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#00d9ff]/30 rounded-2xl p-8 shadow-lg">
          <h3 className="text-base font-black text-[#00d9ff] uppercase tracking-widest mb-8">EASY KILLS</h3>
          <ul className="space-y-3">
            {insights.quick_wins.map((win, i) => (
              <li key={i} className="flex items-start gap-3 text-white text-sm leading-relaxed">
                <span className="text-[#00d9ff] mt-0.5 font-black">{i + 1}</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategic Decisions */}
        <div className="bg-black/30 backdrop-blur-xl border border-[#ff006e]/30 rounded-2xl p-8 shadow-lg">
          <h3 className="text-base font-black text-[#ff006e] uppercase tracking-widest mb-8">HARD CHOICES</h3>
          <ul className="space-y-3">
            {insights.strategic_decisions_needed.map((decision, i) => (
              <li key={i} className="flex items-start gap-3 text-white text-sm leading-relaxed">
                <span className="text-[#ff006e] mt-0.5 font-black">{i + 1}</span>
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Download/Share */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            const json = JSON.stringify(insights, null, 2)
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'death-report.json'
            a.click()
          }}
          className="px-12 py-5 bg-gradient-to-r from-[#ff006e] to-[#ec008c] hover:from-[#ec008c] hover:to-[#ff006e] text-white text-xl font-[family-name:var(--font-metal)] rounded-full shadow-[0_0_40px_rgba(255,0,110,0.6)] hover:shadow-[0_0_60px_rgba(255,0,110,0.8)] transition-all uppercase tracking-widest"
        >
          DOWNLOAD CARNAGE REPORT
        </button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  subtitle
}: {
  label: string
  value: string
  color: string
  subtitle?: string
}) {
  const colorClasses = {
    cyan: { bg: 'bg-black/30', border: 'border-[#00d9ff]/30', text: 'text-[#00d9ff]', glow: 'neon-glow-cyan' },
    pink: { bg: 'bg-black/30', border: 'border-[#ff006e]/30', text: 'text-[#ff006e]', glow: 'neon-glow-pink' },
    red: { bg: 'bg-black/30', border: 'border-[#ff006e]/30', text: 'text-[#ff006e]', glow: 'neon-glow-pink' },
    purple: { bg: 'bg-black/30', border: 'border-[#a020f0]/30', text: 'text-[#a020f0]', glow: '' },
  }

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.cyan

  return (
    <div className={`${colors.bg} backdrop-blur-xl border ${colors.border} rounded-2xl p-6 shadow-lg ${colors.glow}`}>
      <div className="text-xs font-black text-white uppercase tracking-widest mb-3">{label}</div>
      <div className={`text-5xl font-black ${colors.text} mb-1 neon-text-${color === 'pink' || color === 'red' ? 'pink' : color === 'cyan' ? 'cyan' : ''}`}>{value}</div>
      {subtitle && <div className="text-sm text-white font-black uppercase tracking-wide">{subtitle}</div>}
    </div>
  )
}

