import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_dolomite_v3'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

// Include oDOLO rewards — they're real yield (options on DOLO, exercisable at discount)
const DOLOMITE_URL =
  'https://api.dolomite.io/tokens/80094/interest-rates?exclude-odolo=false'

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

async function fetchDolomiteRates() {
  const res = await fetch(DOLOMITE_URL)
  const json = await res.json()
  const rates = json?.interestRates ?? []

  // Dolomite returns all rates as decimals (e.g. 0.0481 = 4.81%)
  // outsideSupplyInterestRateParts has two meaningful categories:
  //   nativeYield — intrinsic appreciation of yield-bearing collateral (iBERA staking,
  //                 weETH restaking, oriBGT price-implied APR, etc.). This is NOT a
  //                 separate token payment — it's baked into the token's value. We fold
  //                 it into apyBase so it reads as total base yield of the position.
  //   rewards     — separately distributed reward tokens (e.g. oDOLO). Goes into apyReward.
  //   points      — non-monetary points programs. Excluded.
  const SYMBOL_OVERRIDES = { 'DOLO': 'oDOLO' }
  const byTokenAddress = {}
  for (const r of rates) {
    const key = (r.token?.tokenAddress || '').toLowerCase()

    const lendingBase = parseFloat(r.supplyInterestRate  || 0)
    const total       = parseFloat(r.totalSupplyInterestRate || 0)
    const parts       = r.outsideSupplyInterestRateParts || []

    // nativeYield: intrinsic token yield — fold into apyBase
    const nativeSum = parts
      .filter(p => p.category === 'nativeYield')
      .reduce((s, p) => s + parseFloat(p.interestRate || 0), 0)

    // rewards: external token distributions — goes into apyReward
    const rewardParts = parts.filter(p => p.category === 'rewards')
    const rewardSum   = rewardParts.reduce((s, p) => s + parseFloat(p.interestRate || 0), 0)

    const rewardLabel = rewardParts
      .map(p => {
        const sym = p.rewardToken?.symbol
        if (sym) return SYMBOL_OVERRIDES[sym] ?? sym
        return p.label?.replace(/ (Rewards )?APR$/i, '').replace(/ Yield$/i, '') ?? null
      })
      .filter(Boolean)
      .join(', ') || null

    byTokenAddress[key] = {
      apyBase:     parseFloat(((lendingBase + nativeSum) * 100).toFixed(4)),
      apyReward:   rewardParts.length > 0 ? parseFloat((rewardSum * 100).toFixed(4)) : null,
      apy:         parseFloat((total * 100).toFixed(4)),
      rewardLabel,
    }
  }
  return byTokenAddress
}

// Returns a map of tokenAddress (lowercase) → { apyBase, apyReward, apy }
// Match against underlyingTokens[0] from DeFiLlama dolomite pools.
export function useDolomiteRates() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchDolomiteRates()
      .then(d => { if (!cancelled) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useDolomiteRates] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
