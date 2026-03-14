const CX = 200, CY = 200, R = 130

const NODES = [
  { angle: -90, label: 'Provide', sublabel: 'Liquidity', color: 'oklch(67% 0.15 145)' },
  { angle: -30, label: 'Stake', sublabel: 'Reward Vault', color: 'oklch(72% 0.14 250)' },
  { angle: 30,  label: 'Earn', sublabel: 'BGT', color: 'oklch(76% 0.17 68)' },
  { angle: 90,  label: 'Delegate', sublabel: 'to Validator', color: 'oklch(70% 0.17 68)' },
  { angle: 150, label: 'Receive', sublabel: 'Bribes', color: 'oklch(68% 0.18 30)' },
  { angle: 210, label: 'More', sublabel: 'Liquidity', color: 'oklch(65% 0.15 320)' },
].map(n => ({
  ...n,
  x: CX + R * Math.cos((n.angle * Math.PI) / 180),
  y: CY + R * Math.sin((n.angle * Math.PI) / 180),
}))

// Build the circular path string (clockwise)
const ORBIT_D = (() => {
  const r = R
  return `M ${CX},${CY - r} A ${r},${r} 0 1,1 ${CX - 0.001},${CY - r}`
})()

const CIRCUMFERENCE = 2 * Math.PI * R

const DESCRIPTIONS = [
  'LP fees from every swap',
  'BGT emitted per block',
  'Non-transferable governance token',
  'Increases validator emission share',
  'WBERA paid by protocols to attract emissions',
  'Higher incentives attract more capital',
]

export default function BgtFlywheel() {
  return (
    <section style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="section" style={{ padding: '48px 32px' }}>
        <div style={{ marginBottom: 40 }}>
          <span className="section-label">BGT Flywheel</span>
          <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            The self-reinforcing cycle that defines Berachain yields
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* SVG Diagram */}
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: 400 }}>
              {/* Orbital ring (dashed) */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="var(--border-muted)"
                strokeWidth="1"
                strokeDasharray="3 7"
              />

              {/* Center emblem */}
              <polygon
                points={`${CX},${CY-22} ${CX+19},${CY-11} ${CX+19},${CY+11} ${CX},${CY+22} ${CX-19},${CY+11} ${CX-19},${CY-11}`}
                fill="var(--gold-subtle)"
                stroke="var(--gold-mid)"
                strokeWidth="1.5"
              />
              <text x={CX} y={CY - 4} textAnchor="middle" fill="var(--gold-bright)" fontSize="8" fontWeight="700" fontFamily="var(--font-body)" letterSpacing="1">BGT</text>
              <text x={CX} y={CY + 9} textAnchor="middle" fill="var(--gold-mid)" fontSize="6" fontFamily="var(--font-body)">FLYWHEEL</text>

              {/* Connecting arcs between nodes */}
              {NODES.map((node, i) => {
                const next = NODES[(i + 1) % NODES.length]
                const startAngle = (node.angle * Math.PI) / 180
                const endAngle = (next.angle * Math.PI) / 180
                const arcR = R
                const x1 = CX + arcR * Math.cos(startAngle)
                const y1 = CY + arcR * Math.sin(startAngle)
                const x2 = CX + arcR * Math.cos(endAngle)
                const y2 = CY + arcR * Math.sin(endAngle)
                return (
                  <path
                    key={i}
                    d={`M ${x1},${y1} A ${arcR},${arcR} 0 0,1 ${x2},${y2}`}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                )
              })}

              {/* Animated traveling particle */}
              <path id="orbit-path" d={ORBIT_D} fill="none" stroke="none" />
              <circle r="5" fill="var(--gold-bright)" opacity="0.9" filter="url(#glow)">
                <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#orbit-path" />
                </animateMotion>
              </circle>

              {/* Glow filter */}
              <defs>
                <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Nodes */}
              {NODES.map((node, i) => {
                const labelR = R + 44
                const lx = CX + labelR * Math.cos((node.angle * Math.PI) / 180)
                const ly = CY + labelR * Math.sin((node.angle * Math.PI) / 180)
                const anchor = node.x < CX - 10 ? 'end' : node.x > CX + 10 ? 'start' : 'middle'

                return (
                  <g key={i}>
                    {/* Node circle */}
                    <circle
                      cx={node.x} cy={node.y} r={16}
                      fill={node.color + '22'}
                      stroke={node.color}
                      strokeWidth="1.5"
                    />
                    <text
                      x={node.x} y={node.y + 5}
                      textAnchor="middle"
                      fill={node.color}
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="var(--font-body)"
                    >
                      {i + 1}
                    </text>

                    {/* Label */}
                    <text
                      x={lx} y={ly - 4}
                      textAnchor={anchor}
                      fill="var(--text-primary)"
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="var(--font-body)"
                    >
                      {node.label}
                    </text>
                    <text
                      x={lx} y={ly + 8}
                      textAnchor={anchor}
                      fill="var(--text-muted)"
                      fontSize="8.5"
                      fontFamily="var(--font-body)"
                    >
                      {node.sublabel}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Step list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NODES.map((node, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: '18px 0',
                  borderBottom: i < NODES.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: node.color + '22',
                  border: `1.5px solid ${node.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: node.color,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                    {node.label} {node.sublabel}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {DESCRIPTIONS[i]}
                  </div>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 24,
              padding: '14px 18px',
              background: 'var(--gold-subtle)',
              borderLeft: '2px solid var(--gold-mid)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--gold-bright)' }}>The key insight:</strong> Every $1M in bribes
              generates ~$7.4M in BGT incentives — creating a high-ROI
              incentive flywheel unique to Berachain.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
