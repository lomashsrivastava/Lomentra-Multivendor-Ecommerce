// Custom dashboard widgets

interface ChartDataPoint {
  month: string
  revenue: number
  platformFees?: number
  sales?: number
}

interface CategoryDataPoint {
  name: string
  value: number
}

interface RatingDataPoint {
  stars: number;
  count: number;
}

// ==========================================
// 1. NEON REVENUE LINE CHART
// ==========================================
interface RevenueLineChartProps {
  data: ChartDataPoint[]
}

export function RevenueLineChart({ data = [] }: RevenueLineChartProps) {
  if (data.length === 0) return <div className="text-slate-500 py-12 text-center text-xs">No revenue data available</div>

  const width = 500
  const height = 220
  const padding = { top: 20, right: 30, bottom: 30, left: 50 }

  const maxVal = Math.max(...data.map((d) => d.revenue), 100)
  const points = data.map((d, i) => {
    const x = padding.left + (i * (width - padding.left - padding.right)) / (data.length - 1)
    const y = height - padding.bottom - (d.revenue / maxVal) * (height - padding.top - padding.bottom)
    return { x, y, val: d.revenue, label: d.month }
  })

  // Create SVG path string
  let linePath = ''
  let areaPath = ''
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} `
    areaPath = `M ${points[0].x} ${height - padding.bottom} L ${points[0].x} ${points[0].y} `

    for (let i = 1; i < points.length; i++) {
      // Smooth curves using cubic bezier
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2
      const cpY1 = points[i - 1].y
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2
      const cpY2 = points[i].y

      linePath += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y} `
      areaPath += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y} `
    }

    areaPath += `L ${points[points.length - 1].x} ${height - padding.bottom} Z`
  }

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Revenue over Time</h4>
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <filter id="neonShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const y = padding.top + p * (height - padding.top - padding.bottom)
            return (
              <line
                key={idx}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )
          })}

          {/* Area under curve */}
          {areaPath && <path d={areaPath} fill="url(#chartGlow)" />}

          {/* Path line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#strokeGradient)"
              strokeWidth="3.5"
              filter="url(#neonShadow)"
              strokeLinecap="round"
            />
          )}

          {/* Interactive Circle Dots */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#818cf8"
                stroke="#1e293b"
                strokeWidth="2.5"
                className="transition-all duration-300 group-hover:r-7 group-hover:fill-indigo-400"
              />
              {/* Value Tooltip popover on hover */}
              <rect
                x={p.x - 30}
                y={p.y - 32}
                width="60"
                height="20"
                rx="6"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none"
              />
              <text
                x={p.x}
                y={p.y - 18}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="9"
                fontWeight="bold"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none font-mono"
              >
                ${p.val.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontWeight="600"
            >
              {p.label}
            </text>
          ))}

          {/* Y Axis min/max */}
          <text x={10} y={padding.top + 5} fill="#64748b" fontSize="9" fontWeight="bold">
            ${maxVal.toFixed(0)}
          </text>
          <text x={10} y={height - padding.bottom} fill="#64748b" fontSize="9" fontWeight="bold">
            $0
          </text>
        </svg>
      </div>
    </div>
  )
}

// ==========================================
// 2. RADIAL DONUT CATEGORY CHART
// ==========================================
interface CategoryPieChartProps {
  data: CategoryDataPoint[]
}

export function CategoryPieChart({ data = [] }: CategoryPieChartProps) {
  const filteredData = data.filter((d) => d.value > 0)
  if (filteredData.length === 0) {
    return <div className="text-slate-500 py-12 text-center text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">No sales category breakdown</div>
  }

  const cx = 100
  const cy = 100
  const r = 60
  const strokeWidth = 14
  const circumference = 2 * Math.PI * r

  const total = filteredData.reduce((sum, d) => sum + d.value, 0)
  let accumulatedPercent = 0

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6']

  const segments = filteredData.map((d, i) => {
    const percent = d.value / total
    const strokeDasharray = `${percent * circumference} ${circumference}`
    const strokeDashoffset = -accumulatedPercent * circumference
    accumulatedPercent += percent

    return {
      ...d,
      strokeDasharray,
      strokeDashoffset,
      color: colors[i % colors.length],
      percent: Math.round(percent * 100),
    }
  })

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Sales by Category</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Left: SVG radial donut */}
        <div className="flex justify-center">
          <svg viewBox="0 0 200 200" className="w-[140px] h-[140px]">
            {/* Background Circle */}
            <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#1e293b" strokeWidth={strokeWidth} />

            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                className="transition-all duration-500 hover:opacity-85"
              />
            ))}

            {/* Inner Ring stats overlay */}
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
              Total Units
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="950">
              {total}
            </text>
          </svg>
        </div>

        {/* Right: Custom Legends */}
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-slate-350 font-medium truncate max-w-[80px]">{seg.name}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-slate-400 font-bold">
                <span>{seg.value} units</span>
                <span className="text-[10px] text-slate-500">({seg.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. RATING BAR CHART
// ==========================================
interface RatingBarChartProps {
  data: RatingDataPoint[]
}

export function RatingBarChart({ data = [] }: RatingBarChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Rating Distribution</h4>
      <div className="space-y-3.5">
        {data.map((row) => {
          const percent = total > 0 ? Math.round((row.count / total) * 100) : 0
          return (
            <div key={row.stars} className="flex items-center gap-3 text-xs text-slate-300">
              <span className="w-10 font-bold text-right flex items-center justify-end gap-1 font-mono">
                {row.stars} ★
              </span>
              <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-12 font-mono text-slate-450 font-bold text-left">
                {row.count} ({percent}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
