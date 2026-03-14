import { useState, useMemo } from 'react'
import { useBerachainPools } from '../hooks/useDefiLlama'
import { formatTVL, formatAPY, getApyColor, getApyBg, getRiskLevel, getCategory } from '../utils/formatters'

const FILTERS = [
  { id: 'all', label: 'All Pools' },
  { id: 'stablecoins', label: 'Stablecoins' },
  { id: 'volatile', label: 'Volatile' },
  { id: 'bgt', label: 'BGT Vaults' },
]

const COLS = [
  { key: 'project', label: 'Protocol', numeric: false },
  { key: 'symbol', label: 'Pool', numeric: false },
  { key: 'tvlUsd', label: 'TVL', numeric: true },
  { key: 'apyBase', label: 'Base APY', numeric: true },
  { key: 'apyReward', label: 'Reward APY', numeric: true },
  { key: 'apy', label: 'Total APY', numeric: true },
  { key: '_risk', label: 'Risk', numeric: false },
]

function SortIcon({ dir }) {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 1v10M2 4l3-3 3 3" stroke={dir === 'asc' ? 'var(--gold-bright)' : 'var(--border-muted)'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 8l3 3 3-3" stroke={dir === 'desc' ? 'var(--gold-bright)' : 'var(--border-muted)'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function YieldTable() {
  const { data: pools, loading } = useBerachainPools()
  const [filter, setFilter] = useState('all')
  const [sortField, setSortField] = useState('tvlUsd')
  const [sortDir, setSortDir] = useState('desc')
  const [expanded, setExpanded] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    if (!pools) return []
    let rows = pools.map(p => ({ ...p, _risk: getRiskLevel(p), _category: getCategory(p) }))
    if (filter !== 'all') rows = rows.filter(r => r._category === filter)
    rows = rows.sort((a, b) => {
      const av = typeof a[sortField] === 'string' ? a[sortField] : (a[sortField] ?? 0)
      const bv = typeof b[sortField] === 'string' ? b[sortField] : (b[sortField] ?? 0)
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return showAll ? rows : rows.slice(0, 25)
  }, [pools, filter, sortField, sortDir, showAll])

  function handleSort(key) {
    if (sortField === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(key); setSortDir('desc') }
  }

  return (
    <section style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="section" style={{ padding: '48px 32px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span className="section-label">Yield Opportunities</span>
            {pools && (
              <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {pools.length} pools on Berachain
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-surface-1)', padding: 3, borderRadius: 4 }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  transition: 'background var(--dur-fast), color var(--dur-fast)',
                  background: filter === f.id ? 'var(--bg-surface-3)' : 'transparent',
                  color: filter === f.id ? 'var(--gold-bright)' : 'var(--text-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== '_risk' && handleSort(col.key)}
                    style={{
                      padding: '10px 12px',
                      textAlign: col.numeric ? 'right' : 'left',
                      cursor: col.key !== '_risk' ? 'pointer' : 'default',
                      userSelect: 'none',
                      color: sortField === col.key ? 'var(--gold-bright)' : 'var(--text-muted)',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {col.label}
                      {col.key !== '_risk' && (
                        <SortIcon dir={sortField === col.key ? sortDir : null} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {COLS.map(col => (
                      <td key={col.key} style={{ padding: '14px 12px' }}>
                        <div className="skeleton" style={{ width: col.numeric ? 64 : 100, height: 14, marginLeft: col.numeric ? 'auto' : 0 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} style={{ padding: '48px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No pools found for this filter
                  </td>
                </tr>
              ) : (
                filtered.map((pool, i) => (
                  <PoolRow
                    key={pool.pool || i}
                    pool={pool}
                    expanded={expanded === pool.pool}
                    onToggle={() => setExpanded(expanded === pool.pool ? null : pool.pool)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {pools && !showAll && pools.length > 25 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={() => setShowAll(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-muted)',
                color: 'var(--text-secondary)',
                padding: '10px 28px',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-body)',
                transition: 'border-color var(--dur-fast), color var(--dur-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-mid)'; e.currentTarget.style.color = 'var(--gold-bright)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              Show all {pools.length} pools
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function PoolRow({ pool, expanded, onToggle }) {
  const totalApy = pool.apy || 0
  const riskLower = pool._risk.toLowerCase()

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: expanded ? 'none' : '1px solid var(--border-subtle)',
          cursor: 'pointer',
          transition: 'background var(--dur-fast)',
          background: expanded ? 'var(--bg-surface-1)' : 'transparent',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--bg-surface-1)' }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
      >
        <td style={{ padding: '13px 12px' }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {pool.project}
          </div>
        </td>
        <td style={{ padding: '13px 12px' }}>
          <div className="num" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            {pool.symbol}
          </div>
        </td>
        <td style={{ padding: '13px 12px', textAlign: 'right' }}>
          <div className="num" style={{ color: 'var(--text-secondary)' }}>
            {formatTVL(pool.tvlUsd)}
          </div>
        </td>
        <td style={{ padding: '13px 12px', textAlign: 'right' }}>
          <div className="num" style={{ color: 'var(--text-secondary)' }}>
            {formatAPY(pool.apyBase)}
          </div>
        </td>
        <td style={{ padding: '13px 12px', textAlign: 'right' }}>
          <div className="num" style={{ color: pool.apyReward ? 'var(--green)' : 'var(--text-muted)' }}>
            {formatAPY(pool.apyReward)}
          </div>
        </td>
        <td style={{ padding: '13px 12px', textAlign: 'right' }}>
          <div
            className="num"
            style={{
              display: 'inline-block',
              color: getApyColor(totalApy),
              background: getApyBg(totalApy),
              padding: totalApy > 5 ? '2px 8px' : '2px 0',
              borderRadius: 2,
              fontWeight: totalApy > 5 ? 600 : 400,
            }}
          >
            {formatAPY(totalApy)}
          </div>
        </td>
        <td style={{ padding: '13px 12px', textAlign: 'right' }}>
          <span className={`badge badge--${riskLower}`}>{pool._risk}</span>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <td colSpan={COLS.length} style={{ padding: '0 12px 16px', background: 'var(--bg-surface-1)' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              {pool.apyMean30d != null && (
                <Detail label="30d avg APY" value={formatAPY(pool.apyMean30d)} />
              )}
              {pool.il7d != null && (
                <Detail label="7d IL" value={`${pool.il7d.toFixed(2)}%`} />
              )}
              {pool.exposure && (
                <Detail label="Exposure" value={pool.exposure} />
              )}
              {pool.stablecoin != null && (
                <Detail label="Stablecoin" value={pool.stablecoin ? 'Yes' : 'No'} />
              )}
              {pool.poolMeta && (
                <Detail label="Pool" value={pool.poolMeta} />
              )}
              {pool.url && (
                <a
                  href={pool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--gold-bright)', textDecoration: 'none', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={e => e.stopPropagation()}
                >
                  View pool
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H4M8 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </a>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div className="num" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{value}</div>
    </div>
  )
}
