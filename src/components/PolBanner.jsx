const STEPS = [
  {
    n: '01',
    title: 'Provide Liquidity',
    desc: 'Deposit tokens into whitelisted pools on BEX, Kodiak, or other PoL-enabled DEXs.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="8" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Stake LP in Reward Vault',
    desc: 'Stake your LP tokens into a Reward Vault (gauge). BGT emissions flow here based on validator votes.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="10" width="16" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Earn BGT',
    desc: 'BGT accrues continuously. It\'s non-transferable — earned only by providing liquidity.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <polygon points="11,2 13.9,8.1 20.6,8.9 15.8,13.5 17.1,20.2 11,17 4.9,20.2 6.2,13.5 1.4,8.9 8.1,8.1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    n: '04',
    title: 'Delegate to Validator',
    desc: 'Boost a validator with your BGT. Validators direct emissions to vaults — protocols bribe them for attention.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3v16M6 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    n: '05',
    title: 'Earn Bribe Income',
    desc: 'Delegated BGT earns a share of protocol bribe payments — real yield denominated in WBERA.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 7v8M8.5 9.5h3.75a1.75 1.75 0 0 1 0 3.5H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function PolBanner() {
  return (
    <section style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-1)' }}>
      <div className="section" style={{ padding: '44px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
          <span className="section-label">Proof of Liquidity</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            What makes Berachain yields structurally different
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 0,
          position: 'relative',
        }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{
                flex: 1,
                padding: '24px 24px 28px',
                borderLeft: i === 0 ? '1px solid var(--border-subtle)' : 'none',
                borderRight: '1px solid var(--border-subtle)',
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative',
              }}>
                {/* Arrow connector */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    right: -12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-surface-1)',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 6h10M7 2l4 4-4 4" stroke="var(--gold-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                <div style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--gold-mid)',
                  marginBottom: 16,
                }}>
                  {step.n}
                </div>
                <div style={{ color: 'var(--gold-bright)', marginBottom: 10 }}>
                  {step.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
