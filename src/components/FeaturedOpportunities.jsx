import { useState, useEffect } from 'react'

const LR_API = 'https://lr-api-production.up.railway.app/api/v1'
const KODIAK_API = 'https://backend.kodiak.finance/vaults?limit=500'
// SAIL.r ERC-20 contract on Berachain
const SAILR_TOKEN = '0x59a61b8d3064a51a95a5d6393c03e2152b1a2770'

// ─── Data fetching ─────────────────────────────────────────────────────────────

function useFeaturedData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [lrRes, kodiakRes] = await Promise.all([
          fetch(`${LR_API}/vaults/share-prices`).then(r => r.json()).catch(() => null),
          fetch(KODIAK_API).then(r => r.json()).catch(() => null),
        ])

        if (cancelled) return

        // LR data
        const junior  = lrRes?.data?.vaults?.junior ?? null

        // Find the SAIL.r-USDe pool in Kodiak vault list
        const vaults = Array.isArray(kodiakRes)
          ? kodiakRes
          : (kodiakRes?.vaults ?? kodiakRes?.data ?? [])

        const sailrVault = vaults.find(v => {
          const tokens = (v.tokens || v.underlyingTokens || [])
            .map(t => typeof t === 'string' ? t : (t.address || t.id || ''))
            .map(s => s.toLowerCase())
          // Also check token0/token1 string fields
          const t0 = (v.token0?.address || v.token0?.id || v.token0 || '').toLowerCase()
          const t1 = (v.token1?.address || v.token1?.id || v.token1 || '').toLowerCase()
          return tokens.includes(SAILR_TOKEN) || t0 === SAILR_TOKEN || t1 === SAILR_TOKEN
        })

        let sailrData = null
        if (sailrVault) {
          sailrData = {
            apyBase:    sailrVault.apr         ?? null,
            apyReward:  sailrVault.farm?.apr   ?? null,
            apy:        (sailrVault.apr || 0) + (sailrVault.farm?.apr || 0),
            tvlUsd:     sailrVault.tvl         ?? sailrVault.tvlUsd ?? null,
            islandAddr: (sailrVault.id || '').toLowerCase(),
          }
        }

        setData({ junior, sailrData })
      } catch (err) {
        console.error('[useFeaturedData]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeaturedOpportunities() {
  const { data, loading } = useFeaturedData()

  const juniorStatus = data?.junior?.status ?? null
  const juniorTvl    = data?.junior?.tvl?.totalUsd ? parseFloat(data.junior.tvl.totalUsd) : null

  const sailr    = data?.sailrData
  const sailrApy = sailr?.apy ?? null
  const sailrBase    = sailr?.apyBase ?? null
  const sailrReward  = sailr?.apyReward ?? null
  const sailrTvl = sailr?.tvlUsd ? parseFloat(sailr.tvlUsd) : null
  const sailrHref = sailr?.islandAddr
    ? `https://app.kodiak.finance/islands/${sailr.islandAddr}`
    : 'https://app.kodiak.finance'

  return (
    <section id="featured" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '52px 0' }}>
      <div className="section">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.625rem',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}>
              Featured
            </h2>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright)',
              background: 'var(--gold-subtle)',
              padding: '2px 8px',
              borderRadius: 2,
            }}>
              Opportunities
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.65 }}>
            Unique yield opportunities native to Berachain — real-world assets, royalty tokens, and upcoming
            protocols not yet captured by standard aggregators.
          </p>
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 1,
          background: 'var(--border-subtle)',
        }}>

          {/* ── Card 1: SAIL.r LP on Kodiak ── */}
          <FeaturedCard
            loading={loading}
            href={sailrHref}
            accentColor="var(--gold-bright)"
            accentSubtle="var(--gold-subtle)"
            protocol="Liquid Royalty × Kodiak"
            tag="RWA · LP"
            tagColor="var(--gold-bright)"
            tagBg="var(--gold-subtle)"
            asset="SAIL.r / USDe"
            apyDisplay={sailrApy != null ? `${sailrApy.toFixed(1)}%` : '—'}
            apyBreakdown={
              sailrBase != null || sailrReward != null ? (
                <div style={{ marginTop: 5, display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {sailrBase > 0 && <span className="num">{sailrBase.toFixed(2)}% fees</span>}
                  {sailrReward > 0 && <span className="num" style={{ color: 'var(--gold-mid)' }}>+{sailrReward.toFixed(2)}% BGT</span>}
                </div>
              ) : sailrApy == null ? (
                <div style={{ marginTop: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kodiak Islands pool</div>
              ) : null
            }
            apyColor="var(--gold-bright)"
            tvl={sailrTvl ?? 4_800_000}
            tvlNote={sailrTvl == null ? 'est.' : null}
            riskLevel="High"
            statusBadge={{ label: 'LP · IL Risk', color: 'var(--red)', bg: 'var(--red-subtle)' }}
            description={
              <>
                <strong>SAIL.r</strong> is a royalty token issued by Liquid Royalty — it represents a
                10% revenue share from SailOut, a cross-border e-commerce operator with ~$50M in annual
                revenue. Monthly USDe payouts flow directly to token holders. The Kodiak LP pool
                earns trading fees and BGT emissions on top of the royalty dividend yield.
              </>
            }
          />

          {/* ── Card 2: Liquid Royalty Junior Vault ── */}
          <FeaturedCard
            loading={loading}
            href="https://www.liquidroyalty.com/"
            accentColor="oklch(68% 0.14 250)"
            accentSubtle="oklch(16% 0.04 250)"
            protocol="Liquid Royalty"
            tag="Junior Vault"
            tagColor="oklch(68% 0.14 250)"
            tagBg="oklch(16% 0.04 250)"
            asset="jnrUSD"
            apyDisplay="Variable"
            apyBreakdown={
              <div style={{ marginTop: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Amplified RWA royalty yield
              </div>
            }
            apyColor="oklch(68% 0.14 250)"
            tvl={juniorTvl}
            riskLevel="High"
            statusBadge={
              juniorStatus === 'under-collateralized'
                ? { label: 'Early Stage', color: 'var(--amber)', bg: 'var(--amber-subtle)' }
                : null
            }
            description={
              <>
                The <strong>junior tranche</strong> of Liquid Royalty's structured vault absorbs
                first-loss risk in exchange for amplified exposure to RWA royalty streams.
                Senior holders are protected first; junior holders capture levered upside from
                merchant revenue growth targets of 30–100% YoY.
                {juniorStatus === 'under-collateralized' && (
                  <>{' '}<span style={{ color: 'var(--text-muted)' }}>Currently in early bootstrapping phase.</span></>
                )}
              </>
            }
          />

          {/* ── Card 3: Everlong (Coming Soon) ── */}
          <FeaturedCard
            loading={false}
            href="https://github.com/delvtech/everlong"
            accentColor="var(--border-muted)"
            accentSubtle="var(--bg-surface-2)"
            protocol="DELV / Hyperdrive"
            tag="Fixed Rate Vaults"
            tagColor="var(--text-muted)"
            tagBg="var(--bg-surface-2)"
            asset="Everlong"
            apyDisplay="TBD"
            apyBreakdown={
              <div style={{ marginTop: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Variable fixed-rate compounding
              </div>
            }
            apyColor="var(--text-muted)"
            tvl={null}
            riskLevel={null}
            statusBadge={{ label: 'Coming Soon', color: 'var(--text-muted)', bg: 'var(--bg-surface-2)' }}
            description={
              <>
                <strong>Everlong</strong> is a yield vault product built on Hyperdrive that automatically
                rolls fixed-rate positions as they mature, compounding returns without user action.
                Designed to bring predictable yield to Berachain's PoL ecosystem — not yet deployed
                on mainnet.
              </>
            }
          />
        </div>
      </div>
    </section>
  )
}

// ─── Card component ────────────────────────────────────────────────────────────

function FeaturedCard({
  loading,
  href,
  accentColor,
  accentSubtle,
  protocol,
  tag,
  tagColor,
  tagBg,
  asset,
  apyDisplay,
  apyBreakdown,
  apyColor,
  tvl,
  tvlNote,
  riskLevel,
  statusBadge,
  description,
}) {
  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-surface-1)',
        padding: '22px 22px 20px',
        borderTop: `2px solid ${accentColor}33`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="skeleton" style={{ width: 72, height: 11 }} />
          <div className="skeleton" style={{ width: 52, height: 11 }} />
        </div>
        <div className="skeleton" style={{ width: 100, height: 17, marginBottom: 14 }} />
        <div className="skeleton" style={{ width: 80, height: 36, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 52, height: 11 }} />
      </div>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: 'var(--bg-surface-1)',
        padding: '22px 22px 20px',
        borderTop: `2px solid ${accentColor}`,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background var(--dur-fast)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-1)'}
    >
      {/* Protocol + tag row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {protocol}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {statusBadge && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: statusBadge.color, background: statusBadge.bg, padding: '1px 5px', borderRadius: 2,
            }}>
              {statusBadge.label}
            </span>
          )}
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: tagColor, background: tagBg, padding: '1px 5px', borderRadius: 2,
          }}>
            {tag}
          </span>
        </div>
      </div>

      {/* Asset name */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: 'var(--text-primary)',
        marginBottom: 14,
        lineHeight: 1.2,
      }}>
        {asset}
      </div>

      {/* APY display */}
      <div style={{ marginBottom: 16 }}>
        <div
          className="num"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: apyColor,
          }}
        >
          {apyDisplay}
        </div>
        {apyBreakdown}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: 16,
      }}>
        {description}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="num" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {tvl != null && tvl > 0
            ? `$${tvl >= 1e6 ? (tvl/1e6).toFixed(2)+'M' : tvl >= 1e3 ? (tvl/1e3).toFixed(1)+'K' : tvl.toFixed(0)} TVL${tvlNote ? ' ' + tvlNote : ''}`
            : '—'}
        </div>
        {riskLevel && (
          <span className={`badge badge--${riskLevel.toLowerCase()}`}>
            {riskLevel} Risk
          </span>
        )}
      </div>
    </a>
  )
}
