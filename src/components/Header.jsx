import { useChainTVL } from '../hooks/useDefiLlama'
import { formatTVL } from '../utils/formatters'

function BerachainLogo() {
  return (
    <img
      src="https://icons.llamao.fi/icons/chains/rsz_berachain.jpg"
      alt="Berachain"
      width="32"
      height="32"
      style={{ borderRadius: '50%', display: 'block' }}
      onError={e => {
        e.currentTarget.style.display = 'none'
        e.currentTarget.nextSibling.style.display = 'block'
      }}
    />
  )
}

export default function Header() {
  const { data: chain, loading } = useChainTVL()

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      padding: '28px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-base)',
    }}>
      <div className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BerachainLogo />
          <svg width="32" height="37" viewBox="0 0 38 44" fill="none" aria-hidden="true" style={{ display: 'none' }}>
            <polygon points="19,2 36,11 36,33 19,42 2,33 2,11" stroke="var(--gold-bright)" strokeWidth="1.5" fill="none" />
            <polygon points="19,9 29,14.8 29,26.5 19,32.3 9,26.5 9,14.8" stroke="var(--gold-bright)" strokeWidth="1" fill="var(--gold-subtle)" />
            <polygon points="19,15 24,17.9 24,23.6 19,26.5 14,23.6 14,17.9" fill="var(--gold-bright)" opacity="0.7" />
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              BeraYield
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 3 }}>
              BERACHAIN YIELD INTELLIGENCE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {[
              { href: '#featured',    label: 'Featured' },
              { href: '#stablecoins', label: 'Stables' },
              { href: '#btc',         label: 'BTC' },
              { href: '#eth',         label: 'ETH' },
              { href: '#bera',        label: 'BERA' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  transition: 'color var(--dur-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {label}
              </a>
            ))}
          </nav>
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'right' }}>
            <div className="section-label" style={{ color: 'var(--text-muted)' }}>Chain TVL</div>
            <div className="num" style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
              {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 72, height: 16 }} /> : (formatTVL(chain?.tvl) || '—')}
            </div>
          </div>
          <a
            href="https://defillama.com/chain/berachain"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            DeFiLlama
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </a>
        </div>
      </div>
    </header>
  )
}
