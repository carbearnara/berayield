import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_origami_autostaking_v1'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// Origami Finance autostaking vaults on Berachain (infrared-collection)
// These vaults auto-compound LP positions with no manual claiming required.
// APY is computed from vault_price_based_apr using continuous compounding:
//   eAPY = (exp(apr) - 1) * 100
// API: https://origami-api.automation-templedao.link (discovered from JS bundle)
const API_BASE = 'https://origami-api.automation-templedao.link'
const CHAIN_ID = 80094

// Vaults with BERA or BGT in the name from the infrared autostaking collection.
// The sWBERA-osBGT vault (0x9E5CbeD...) is tracked by DeFiLlama under the
// symbol OAC-SWBERA-OSBGT-A and is handled separately via the main pool feed.
const VAULTS = [
  { address: '0xDb15910600700f776ef615dd0906216Cc4a7b754', symbol: 'WBERA-iBGT' },
  { address: '0xdfD2514848C012f0F09C6dB33114cedb24Af9A60', symbol: 'iBERA-iBGT' },
  { address: '0xfCb6C2A149dA114fd3f3D0FDF3f4935840b0dF8a', symbol: 'iBERA-osBGT' },
  { address: '0xd7F54C425f64B6cd87b6B39b0a53487bcafFfB0C', symbol: 'WBERA-iBERA' },
]

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null
    return parsed.data
  } catch { return null }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }))
  } catch {}
}

async function fetchOrigamiVaults() {
  const addresses = VAULTS.map(v => v.address)
  const input = encodeURIComponent(JSON.stringify({ chain: CHAIN_ID, vaults: addresses }))
  const res = await fetch(`${API_BASE}/public/dapp/investment-vault-metrics-2?input=${input}`)
  const json = await res.json()

  // Response is an array of vault metric objects
  const metrics = Array.isArray(json) ? json : (json?.result ?? [])

  const pools = []
  for (const vault of VAULTS) {
    const addrLower = vault.address.toLowerCase()
    const m = metrics.find(x => (x.vault_address || '').toLowerCase() === addrLower)
    if (!m) continue

    const latest = m.latest_metrics ?? m
    // vault_price_based_apr is a decimal fraction (e.g. 0.2747 = 27.47% APR)
    const aprRaw = parseFloat(latest.vault_price_based_apr ?? 0)
    // Continuous compounding: eAPY = exp(apr) - 1
    const eApyPct = parseFloat(((Math.exp(aprRaw) - 1) * 100).toFixed(4))

    // TVL from latest metrics (USD)
    const tvlUsd = parseFloat(latest.net_asset_value_usd ?? latest.tvl_usd ?? 0)

    // Skip vaults that are not yet active or have clearly unreliable APY
    // (>500% signals the vault is new with minimal TVL and volatile price ratios)
    if (eApyPct <= 0 || eApyPct > 500) continue

    pools.push({
      pool:             vault.address,
      project:          'origami-finance',
      symbol:           vault.symbol,
      apy:              eApyPct,
      apyBase:          eApyPct,
      apyReward:        null,
      tvlUsd,
      underlyingTokens: [],
      exposure:         'multi',
      stablecoin:       false,
      chain:            'Berachain',
    })
  }

  return pools
}

// Returns pool objects (shaped like DeFiLlama pools) for Origami autostaking
// vaults on Berachain that have BERA or BGT in the name.
// APY is computed via continuous compounding of vault_price_based_apr.
// Vaults with APY > 500% (volatile/new) are excluded automatically.
export function useOrigamiVaults() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchOrigamiVaults()
      .then(d => { if (!cancelled) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useOrigamiVaults] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
