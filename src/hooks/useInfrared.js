import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_infrared_ibgt_v1'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

// iBGT staking vault on Infrared Finance (Berachain mainnet)
const IBGT_VAULT_ADDRESS = '0x75f3be06b02e235f6d0e7ef2d462b29739168301'
const IBGT_TOKEN_ADDRESS = '0xac03caba51e17c86c921e1f6cbfbdc91f8bb2e6b'

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

async function fetchInfraredIBGT() {
  const res = await fetch(
    'https://infrared.finance/api/backend-vaults?chainId=80094',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: [IBGT_VAULT_ADDRESS] }),
    }
  )
  const json = await res.json()
  const vaultData = json[IBGT_VAULT_ADDRESS] ?? null
  if (!vaultData) return null

  // aprBreakdown.infrared is keyed by reward token address → { apr, apr7dMovingAverage }
  // Values are on a 0–1 scale (0.515 = 51.5%) — multiply by 100 for display
  const infraredBreakdown = vaultData.aprBreakdown?.infrared ?? {}
  const totalAprDecimal = Object.values(infraredBreakdown)
    .reduce((sum, entry) => sum + (parseFloat(entry.apr) || 0), 0)

  const tvl = parseFloat(vaultData.tvlBreakdown?.infrared ?? 0)

  return {
    pool:             IBGT_VAULT_ADDRESS,
    project:          'infrared-finance',
    symbol:           'iBGT',
    apy:              parseFloat((totalAprDecimal * 100).toFixed(2)),
    apyBase:          null,
    apyReward:        parseFloat((totalAprDecimal * 100).toFixed(2)),
    tvlUsd:           tvl,
    underlyingTokens: [IBGT_TOKEN_ADDRESS],
    exposure:         'single',
    stablecoin:       false,
    chain:            'Berachain',
    rewardLabel:      'wiBGT',
    _synthetic:       true,
  }
}

// Returns a single pool object shaped like a DeFiLlama pool for the iBGT staking vault.
// Primary reward is wiBGT (~51% APR). TVL ~$5M.
export function useInfraredIBGT() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchInfraredIBGT()
      .then(d => { if (!cancelled && d) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useInfraredIBGT] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
