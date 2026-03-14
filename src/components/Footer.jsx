export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '32px 0',
    }}>
      <div className="section" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Data sourced from{' '}
            <a
              href="https://defillama.com/chain/berachain"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--gold-mid)', textDecoration: 'none' }}
            >
              DeFiLlama
            </a>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            BeraYield — Berachain Yield Intelligence
          </span>
        </div>

        <div style={{
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          maxWidth: 500,
          textAlign: 'right',
          lineHeight: 1.5,
        }}>
          Not financial advice. DeFi involves significant risk including smart contract vulnerabilities,
          liquidation, and token price volatility. Always do your own research.
        </div>
      </div>
    </footer>
  )
}
