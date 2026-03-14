import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_brownfi_v2'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

async function fetchBrownfiPools() {
  const [poolsRes, merklRes] = await Promise.all([
    fetch('https://api.brownfi.io/pools/?chainId=80094'),
    fetch('https://api.brownfi.io/merkl-campaign/apr?chainId=80094').catch(() => null),
  ])

  const poolsJson = await poolsRes.json()
  const merklJson = merklRes ? await merklRes.json().catch(() => null) : null

  console.log('[useBrownfi] raw pools:', poolsJson)
  console.log('[useBrownfi] raw merkl:', merklJson)

  // Build merkl APR lookup by token pair symbol (case-insensitive).
  // The API has no pool address — pairs are encoded in the title:
  // "BrownFi USDC-WETH Supply APR" → key "USDC-WETH" (also store reversed "WETH-USDC")
  const merklByPair = {}
  if (Array.isArray(merklJson)) {
    for (const m of merklJson) {
      const apr = parseFloat(m.value || m.apr || 0)
      if (!apr) continue
      const match = (m.title || '').match(/BrownFi\s+(.+?)\s+Supply APR/i)
      if (match) {
        const pair = match[1].toUpperCase()
        merklByPair[pair] = apr
        const parts = pair.split('-')
        if (parts.length === 2) merklByPair[`${parts[1]}-${parts[0]}`] = apr
      }
    }
  }

  const pools = (Array.isArray(poolsJson) ? poolsJson : []).map(p => {
    const address = (p.address || p.id || p.poolAddress || '').toLowerCase()
    const token0 = p.token0 || p.tokenA || {}
    const token1 = p.token1 || p.tokenB || {}
    const sym0 = token0.symbol || token0.name || '?'
    const sym1 = token1.symbol || token1.name || '?'
    const symbol = `${sym0}-${sym1}`

    const feeApr    = parseFloat(p.apr || p.feeApr || p.fee_apr || 0)
    const merklApr  = merklByPair[symbol.toUpperCase()] || 0
    const totalApy  = feeApr + merklApr

    return {
      pool:             address,
      project:          'brownfi',
      symbol,
      apy:              totalApy,
      apyBase:          feeApr,
      apyReward:        merklApr > 0 ? merklApr : null,
      tvlUsd:           parseFloat(p.tvl || p.tvlUsd || p.tvl_usd || 0),
      underlyingTokens: [token0.address || token0.id, token1.address || token1.id].filter(Boolean),
      exposure:         'multi',
      stablecoin:       false,
      chain:            'Berachain',
      rewardLabel:      merklApr > 0 ? 'Merkl rewards' : null,
    }
  }).filter(p => p.apy > 0 && p.pool)

  return pools
}

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

// Returns an array of pool objects shaped like DeFiLlama pool entries.
export function useBrownfiPools() {
  const [data, setData] = useState(() => readCache() ?? [])
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchBrownfiPools()
      .then(d => { if (!cancelled) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useBrownfi] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
