import { useBerachainProtocols } from '../hooks/useDefiLlama'
import { formatTVL } from '../utils/formatters'

const PROTOCOL_META = {
  infrared: {
    category: 'Liquid Staking',
    tagline: 'Liquid BGT wrapper. iBGT/siBGT for DeFi composability + validator-optimized yield.',
    url: 'https://infrared.finance',
    color: 'oklch(67% 0.16 200)',
    note: null,
  },
  kodiak: {
    category: 'DEX / CL',
    tagline: 'Concentrated liquidity hub. Kodiak Islands auto-rebalance positions. Triple-layer yield.',
    url: 'https://kodiak.finance',
    color: 'oklch(70% 0.17 68)',
    note: null,
  },
  bex: {
    category: 'Native DEX',
    tagline: 'Berachain\'s native AMM (Balancer V2). Core PoL-whitelisted pools.',
    url: 'https://hub.berachain.com',
    color: 'oklch(68% 0.18 30)',
    note: 'Partially restricted post-Nov 2025 exploit',
  },
  beraborrow: {
    category: 'CDP / Stablecoin',
    tagline: 'Mint NECT against yield-bearing collateral. Collateral keeps earning while you borrow.',
    url: 'https://beraborrow.com',
    color: 'oklch(70% 0.16 145)',
    note: null,
  },
  bend: {
    category: 'Lending',
    tagline: 'Native lending protocol (Morpho-based). Credit layer of Berachain with PoL integration.',
    url: 'https://hub.berachain.com',
    color: 'oklch(72% 0.14 250)',
    note: null,
  },
  dolomite: {
    category: 'Leverage',
    tagline: 'Leveraged yield farming. Loop strategies amplify PoL rewards with managed risk.',
    url: 'https://dolomite.io',
    color: 'oklch(68% 0.13 280)',
    note: null,
  },
  beradrome: {
    category: 'veDEX',
    tagline: 'Vote-escrow DEX (Velodrome-style). Participates in BGT bribe marketplace.',
    url: 'https://beradrome.com',
    color: 'oklch(65% 0.15 320)',
    note: null,
  },
  berps: {
    category: 'Perps',
    tagline: 'Native perpetual futures. Up to 100x leverage on crypto pairs, fully on-chain.',
    url: 'https://hub.berachain.com',
    color: 'oklch(62% 0.18 25)',
    note: null,
  },
}

const KNOWN_ORDER = ['infrared', 'kodiak', 'bex', 'beraborrow', 'bend', 'dolomite', 'beradrome', 'berps']

function HexIcon({ color, letter }) {
  return (
    <svg width="36" height="41" viewBox="0 0 36 41" fill="none" style={{ flexShrink: 0 }}>
      <polygon
        points="18,2 34,11 34,30 18,39 2,30 2,11"
        fill={color + '22'}
        stroke={color}
        strokeWidth="1"
      />
      <text
        x="18" y="25"
        textAnchor="middle"
        fill={color}
        fontSize="14"
        fontWeight="700"
        fontFamily="var(--font-body)"
      >
        {letter}
      </text>
    </svg>
  )
}

export default function ProtocolGrid() {
  const { data: protocols } = useBerachainProtocols()

  const displayProtocols = KNOWN_ORDER.map(slug => {
    const meta = PROTOCOL_META[slug]
    const live = protocols?.find(p => p.slug === slug || p.name?.toLowerCase().includes(slug.split('-')[0]))
    return { slug, meta, live }
  })

  return (
    <section style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-1)' }}>
      <div className="section" style={{ padding: '48px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <span className="section-label">Protocol Directory</span>
          <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Key protocols powering Berachain yield
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, background: 'var(--border-subtle)' }}>
          {displayProtocols.map(({ slug, meta, live }) => {
            const color = meta?.color || 'var(--gold-bright)'
            const letter = slug[0].toUpperCase()

            return (
              <div
                key={slug}
                style={{
                  background: 'var(--bg-surface-1)',
                  padding: '22px 24px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  transition: 'background var(--dur-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-1)'}
              >
                <HexIcon color={color} letter={letter} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {slug.charAt(0).toUpperCase() + slug.slice(1)}
                    </span>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color,
                      background: color + '22',
                      padding: '1px 6px',
                      borderRadius: 2,
                    }}>
                      {meta?.category}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 8 }}>
                    {meta?.tagline}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    {live?.tvl ? (
                      <span className="num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatTVL(live.tvl)} TVL
                      </span>
                    ) : (
                      <span />
                    )}
                    {meta?.note && (
                      <span style={{ fontSize: '0.625rem', color: 'var(--red)', background: 'var(--red-subtle)', padding: '1px 6px', borderRadius: 2 }}>
                        {meta.note}
                      </span>
                    )}
                    {meta?.url && (
                      <a
                        href={meta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}
                      >
                        Visit
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
