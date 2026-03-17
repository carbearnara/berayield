import { describePool } from '../utils/generateReport'
import { formatAPY, formatTVL } from '../utils/formatters'

const RISK_COLORS = {
  Low:    { color: 'var(--green)',       bg: 'var(--green-subtle)' },
  Medium: { color: 'var(--gold-bright)', bg: 'var(--gold-subtle)' },
  High:   { color: 'var(--red)',         bg: 'var(--red-subtle)' },
}

function accentHex(cssVar) {
  const map = {
    'var(--green)':       '#4caf82',
    'oklch(74% 0.18 50)': '#d4853a',
    'oklch(68% 0.14 250)':'#6b8fd4',
    'var(--gold-bright)': '#f5a623',
  }
  return map[cssVar] || '#f5a623'
}

function PoolCard({ pool, label, accent }) {
  if (!pool) return (
    <div className="report-pool-row" style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      No data available
    </div>
  )

  const desc = describePool(pool)
  const risk = pool._risk || 'Medium'
  const riskC = RISK_COLORS[risk] || RISK_COLORS.Medium
  const apr = pool.apy || 0
  const aprColor = apr >= 50 ? 'var(--red)' : apr >= 20 ? 'var(--gold-bright)' : apr >= 5 ? 'var(--green)' : 'var(--text-muted)'

  return (
    <a
      className="report-pool-row"
      href={pool._url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        padding: '16px 0',
        borderTop: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div>
        <div className="report-pool-badges" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: accent, background: accent + '22', padding: '2px 7px', borderRadius: 2,
          }}>
            {label}
          </span>
          <span style={{
            fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: 2,
            border: '1px solid var(--border-subtle)',
          }}>
            {pool._type}
          </span>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: riskC.color, background: riskC.bg, padding: '2px 6px', borderRadius: 2,
          }}>
            {risk} Risk
          </span>
        </div>

        <div className="report-pool-name" style={{ marginBottom: 6 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700,
            letterSpacing: '-0.01em', color: 'var(--text-primary)',
          }}>
            {pool._protocol || pool.project}
          </span>
          <span style={{ color: 'var(--border-muted)', margin: '0 6px' }}>·</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {pool.symbol}
          </span>
        </div>

        <p className="report-pool-desc" style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          maxWidth: 520, margin: 0,
        }}>
          {desc}
        </p>

        {pool._url && (
          <div className="report-pool-link" style={{ marginTop: 6, fontSize: '0.68rem', color: accent, opacity: 0.8 }}>
            {pool._url} →
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
          <span className="num report-apr-num" style={{
            fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1, color: aprColor,
          }}>
            {formatAPY(apr)}
          </span>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            APR
          </span>
        </div>
        {pool.tvlUsd != null && (
          <div className="num" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {formatTVL(pool.tvlUsd)} TVL
          </div>
        )}
      </div>
    </a>
  )
}

function SectionBlock({ section }) {
  const accent = accentHex(section.accent)
  return (
    <div className="report-section" style={{ marginBottom: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        paddingBottom: 10,
        borderBottom: `2px solid ${accent}`,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700,
          letterSpacing: '-0.02em', color: 'var(--text-primary)',
        }}>
          {section.label}
        </h2>
        <span style={{
          fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>
          {section.sublabel}
        </span>
      </div>

      <PoolCard pool={section.topYield} label="Best Yield" accent={accent} />
      {section.safest && <PoolCard pool={section.safest} label="Safest" accent={accent} />}
    </div>
  )
}

export default function ReportPage({ sections }) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="report-main" style={{ padding: '52px 0', flex: 1 }}>
      <div className="section" style={{ maxWidth: 820 }}>

        {/* Header */}
        <div className="report-header" style={{ marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
                letterSpacing: '-0.03em', color: 'var(--text-primary)',
              }}>
                Yield Report
              </h1>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--gold-bright)',
                background: 'var(--gold-subtle)', padding: '2px 8px', borderRadius: 2,
              }}>
                BeraYield
              </span>
            </div>
            <button
              className="no-print"
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 4,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-muted)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                transition: 'background 150ms, color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-3)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            {date}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 560 }}>
            Top yield opportunity and lowest-risk position for each asset category on Berachain.
            Data sourced live from DeFiLlama and protocol APIs.
          </p>
        </div>

        {/* Sections — 2-column in print */}
        <div className="report-sections">
          {sections.map(s => (
            <SectionBlock key={s.label} section={s} />
          ))}
        </div>

        {/* Footer */}
        <div className="report-footer" style={{
          marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.7,
        }}>
          <div>Data from DeFiLlama and individual protocol APIs · berayield.pages.dev</div>
          <div style={{ color: 'var(--border-muted)', marginTop: 2 }}>
            Not financial advice. DeFi protocols carry smart contract, liquidity, and market risk. Always do your own research.
          </div>
        </div>

      </div>
    </main>
  )
}
