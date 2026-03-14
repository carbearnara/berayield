import { useChainTVL, useBerachainPools, useBerachainProtocols } from '../hooks/useDefiLlama'
import { formatTVL, formatAPY, getApyColor } from '../utils/formatters'

export default function StatsRow() {
  const { data: chain, loading: chainLoading } = useChainTVL()
  const { data: pools, loading: poolsLoading } = useBerachainPools()
  const { data: protocols } = useBerachainProtocols()

  const topPool = pools
    ? pools.filter(p => (p.apy || 0) < 9999 && (p.apy || 0) > 0).sort((a, b) => b.apy - a.apy)[0]
    : null

  const topProtocol = protocols?.[0] ?? null

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', minHeight: 140 }}>
        {/* TVL — takes 2 columns */}
        <div style={{
          padding: '36px 40px 36px 0',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div className="section-label">Total Value Locked · Berachain</div>
          <div>
            {chainLoading ? (
              <div className="skeleton" style={{ width: 200, height: 60, marginTop: 8 }} />
            ) : (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: 'var(--text-primary)',
              }} className="num">
                {formatTVL(chain?.tvl)}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Live via DeFiLlama
            </div>
          </div>
        </div>

        {/* Highest APY */}
        <div style={{
          padding: '36px 32px',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div className="section-label">Highest Pool APY</div>
          <div>
            {poolsLoading ? (
              <div className="skeleton" style={{ width: 110, height: 44, marginTop: 8 }} />
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: getApyColor(topPool?.apy),
                }} className="num">
                  {formatAPY(topPool?.apy)}
                </div>
                {topPool && (
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {topPool.project} · {topPool.symbol}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Top protocol + BGT note */}
        <div style={{
          padding: '36px 0 36px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div className="section-label">Largest Protocol</div>
          <div>
            {!protocols ? (
              <div className="skeleton" style={{ width: 120, height: 44, marginTop: 8 }} />
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  color: 'var(--text-primary)',
                }}>
                  {topProtocol?.name || '—'}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {formatTVL(topProtocol?.tvl)} TVL
                </div>
              </>
            )}
          </div>
          <div style={{
            marginTop: 20,
            padding: '10px 14px',
            background: 'var(--gold-subtle)',
            borderLeft: '2px solid var(--gold-mid)',
            fontSize: '0.75rem',
            color: 'var(--gold-bright)',
            lineHeight: 1.5,
          }}>
            BGT = non-transferable governance token earned only by LPs
          </div>
        </div>
      </div>
    </div>
  )
}
