import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_primevaults'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

// Merkl campaign identifier for PRIMEUSD external rewards.
// Campaign is registered on Arbitrum (chainId 42161) even though
// PrimeUSD itself runs on Berachain — the reward distributor is on Arbitrum.
const PRIMEUSD_MERKL_ID = '0xa30b6c0b410f6adfa2fcdacd6e3bae78dc0bd7a4'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }))
  } catch {}
}

async function fetchPrimeVaultsData() {
  const res = await fetch(
    `https://api.merkl.xyz/v4/opportunities?identifier=${PRIMEUSD_MERKL_ID}`
  )
  const json = await res.json()
  const opportunity = json[0] ?? null
  const apr = opportunity?.apr ?? null

  // Extract reward token symbols from Merkl's tokens array
  // Merkl includes both the staking token and reward tokens; filter to reward tokens only
  // by checking against the campaign's rewardTokens list in aprRecord breakdowns
  const rewardTokenSymbols = (opportunity?.tokens ?? [])
    .filter(t => t.isReward ?? true)
    .map(t => t.symbol)
    .filter(Boolean)
  const rewardLabel = rewardTokenSymbols.length > 0 ? rewardTokenSymbols.join(', ') : 'Merkl rewards'

  return {
    // Merkl returns APR already as a percentage (e.g. 25.1, not 0.251)
    apyReward:   apr != null ? parseFloat(apr.toFixed(2)) : null,
    rewardLabel,
    fetchedAt:   Date.now(),
  }
}

export function usePrimeVaults() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    fetchPrimeVaultsData()
      .then(d => {
        if (cancelled) return
        writeCache(d)
        setData(d)
      })
      .catch(err => {
        console.error('[usePrimeVaults] fetch failed:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
