import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_termmax_honey_v2'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes — fixed-rate APYs shift with each new order

// Termmax Finance HONEY lending vault on Berachain (curator: Origami Crypto)
// Fixed-term lending vault — HONEY deployed across multiple fixed-rate markets (~5-6% APY).
// Most vault capital is idle (awaiting redeployment into new terms), so blended depositor APY
// is low (~1.2%). Idle fraction varies; APY is computed live from the allocation endpoint.
const VAULT_ADDRESS = '0xd07f1862ae599697cdcd6fd36df3c33af25fd782'
const HONEY_ADDRESS = '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce'
const API_BASE      = 'https://api.termmax.ts.finance'

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

async function fetchTermmaxHoney() {
  // Fetch vault summary (TVL) and per-market allocation (APY) in parallel
  const [itemRes, allocRes] = await Promise.all([
    fetch(`${API_BASE}/vault/item?chainId=80094&vaultAddress=${VAULT_ADDRESS}`).then(r => r.json()),
    fetch(`${API_BASE}/vault/vault-allocation?chainId=80094&vaultAddress=${VAULT_ADDRESS}`).then(r => r.json()),
  ])

  const vaultData = itemRes?.data
  const items     = allocRes?.data?.items ?? []
  if (!vaultData || items.length === 0) return null

  // Official vault TVL from /vault/item (authoritative)
  const tvlUsd = parseFloat(vaultData.tvl || '0')

  // Blended APY = sum(allocation_fraction × market_apy) for active markets only.
  // allocation is the vault's fraction deployed to each market (0–1 scale).
  // Idle fraction (1 − sum of allocations) earns 0%, automatically included.
  let blendedApy = 0
  for (const item of items) {
    if (!item.market?.isEnabled || item.market?.isMatured) continue
    const alloc = item.allocation || 0
    const apy   = item.termPrices?.[0]?.lcft?.apy || 0
    blendedApy += alloc * apy
  }
  blendedApy = parseFloat((blendedApy * 100).toFixed(4))

  if (blendedApy <= 0 || tvlUsd <= 0) return null

  return {
    pool:             VAULT_ADDRESS,
    project:          'termmax',
    symbol:           'HONEY',
    apy:              blendedApy,
    apyBase:          blendedApy,
    apyReward:        null,
    tvlUsd,
    underlyingTokens: [HONEY_ADDRESS],
    exposure:         'single',
    stablecoin:       true,
    chain:            'Berachain',
    rewardLabel:      null,
    pointsLabel:      'XP',
  }
}

// Returns a single pool object for the Termmax HONEY lending vault.
// Fixed-term lending vault — blended depositor APY ~1.2% (markets yield 5-6%,
// but ~48% of vault capital is idle awaiting redeployment into new terms).
export function useTermmaxHoney() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchTermmaxHoney()
      .then(d => { if (!cancelled && d) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useTermmaxHoney] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
