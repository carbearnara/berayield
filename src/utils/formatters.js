export function formatTVL(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function formatAPY(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  if (value > 9999) return '>9999%'
  if (value > 999) return `${Math.round(value)}%`
  return `${value.toFixed(2)}%`
}

// Alias — prefer this going forward
export const formatAPR = formatAPY

// Convert APY (compounded) → APR (simple annualized) assuming daily compounding.
// Pools already reporting APR (e.g. _synthetic hooks) should skip this.
export function apyToApr(apy) {
  if (apy == null || isNaN(apy) || apy <= 0) return apy
  return parseFloat((365 * (Math.pow(1 + apy / 100, 1 / 365) - 1) * 100).toFixed(2))
}

export function getApyColor(value) {
  if (!value || value <= 0) return 'var(--text-muted)'
  if (value < 5) return 'var(--text-secondary)'
  if (value < 20) return 'var(--green)'
  if (value < 50) return 'var(--gold-bright)'
  return 'var(--red)'
}

export function getApyBg(value) {
  if (!value || value <= 0) return 'transparent'
  if (value < 5) return 'transparent'
  if (value < 20) return 'var(--green-subtle)'
  if (value < 50) return 'var(--amber-subtle)'
  return 'var(--red-subtle)'
}

export function getRiskLevel(pool) {
  if (pool.stablecoin) return 'Low'
  const sym = (pool.symbol || '').toUpperCase()
  if (sym.includes('USDC') || sym.includes('USDT') || sym.includes('HONEY') || sym.includes('NECT') || sym.includes('BYUSD')) return 'Low'
  if (pool.exposure === 'single' || pool.ilRisk === 'no') return 'Medium'
  return 'High'
}

export function getCategory(pool) {
  const sym = (pool.symbol || '').toUpperCase()
  const proj = (pool.project || '').toLowerCase()
  if (pool.stablecoin || sym.includes('USDC') || sym.includes('USDT') || sym.includes('HONEY') || sym.includes('NECT') || sym.includes('BYUSD') || sym.includes('USD')) return 'stablecoins'
  if (sym.includes('BGT') || sym.includes('IBGT') || proj === 'infrared' || proj === 'beradrome' || proj === 'berancia') return 'bgt'
  return 'volatile'
}

export function formatTimestamp(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}
