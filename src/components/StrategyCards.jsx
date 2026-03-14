const STRATEGIES = [
  {
    risk: 'Low',
    riskClass: 'badge--low',
    riskColor: 'var(--green)',
    borderColor: 'var(--green)',
    name: 'Safe Haven',
    subtitle: 'BYUSD/HONEY LP · BEX',
    apy: '5–10%',
    description: 'Berachain\'s native stablecoin pair with BGT emissions. Near-zero impermanent loss, direct PoL exposure.',
    steps: [
      'Acquire BYUSD and HONEY (mint HONEY via HoneySwap)',
      'Add liquidity to BYUSD/HONEY pool on BEX',
      'Stake LP tokens in the Reward Vault',
      'Earn BGT — delegate or burn to BERA',
    ],
    note: 'BEX is partially restricted following the Nov 2025 exploit. Verify pool status before depositing.',
  },
  {
    risk: 'Medium',
    riskClass: 'badge--medium',
    riskColor: 'var(--gold-bright)',
    borderColor: 'var(--gold-mid)',
    name: 'BGT Maximalist',
    subtitle: 'iBGT → siBGT · Infrared Finance',
    apy: '15–25%',
    description: 'Convert BGT to iBGT (liquid wrapper) then stake as siBGT. Earns a yield multiplier since not all iBGT is staked — stakers receive rewards attributable to the unstaked float.',
    steps: [
      'Earn BGT by providing liquidity anywhere',
      'Wrap BGT as iBGT via Infrared Finance',
      'Stake iBGT → receive siBGT',
      'Receive WBERA bribes + validator commissions',
    ],
    note: 'Infrared optimizes validator selection automatically. siBGT yield scales with iBGT staking ratio.',
  },
  {
    risk: 'High',
    riskClass: 'badge--high',
    riskColor: 'var(--red)',
    borderColor: 'var(--red)',
    name: 'Honey Leverage Loop',
    subtitle: 'iBGT → NECT → Kodiak LP · Multi-protocol',
    apy: '30–40%',
    description: 'CDP collateral keeps earning while borrowed NECT is deployed elsewhere. Stack BGT emissions across multiple protocols simultaneously.',
    steps: [
      'Hold iBGT (from Infrared)',
      'Deposit iBGT into Beraborrow Den as collateral',
      'Mint NECT (over-collateralized, iBGT keeps earning)',
      'Pair NECT with HONEY on Kodiak Finance',
      'Stake Kodiak LP → earn BGT + KDK rewards',
    ],
    note: 'Leveraged strategy: liquidation risk if iBGT price drops and collateral ratio falls below minimum.',
  },
]

export default function StrategyCards() {
  return (
    <section>
      <div className="section" style={{ padding: '48px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <span className="section-label">Curated Strategies</span>
          <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Three ways to approach Berachain yield — matched to risk tolerance
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border-subtle)' }}>
          {STRATEGIES.map((s, i) => (
            <StrategyCard key={i} strategy={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StrategyCard({ strategy: s, index }) {
  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--bg-surface-1)',
        padding: '32px 28px',
        borderTop: `3px solid ${s.borderColor}`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className={`badge ${s.riskClass}`}>{s.risk} Risk</span>
        <div
          className="num"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            lineHeight: 1,
            color: s.riskColor,
            letterSpacing: '-0.03em',
          }}
        >
          {s.apy}
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 4,
        letterSpacing: '-0.01em',
      }}>
        {s.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
        {s.subtitle}
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>
        {s.description}
      </p>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {s.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              flexShrink: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `1px solid ${s.borderColor}`,
              color: s.riskColor,
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {step}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--bg-surface-2)',
        borderLeft: `2px solid ${s.borderColor}`,
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        {s.note}
      </div>
    </div>
  )
}
