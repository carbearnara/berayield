import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_snrusd'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

const LR_API = 'https://lr-api-production.up.railway.app/api/v1'
const BERA_GRAPHQL = 'https://api.berachain.com/graphql'
// snrUSD Berachain reward vault address
const SNRUSD_REWARD_VAULT = '0x18e310dD4A6179D9600E95D18926Ab7819B2A071'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {}
}

async function fetchSnrUsdData() {
  const [vaultRes, bgtRes] = await Promise.all([
    fetch(`${LR_API}/vaults/share-prices`),
    fetch(BERA_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          polGetRewardVault(
            vaultAddress: "${SNRUSD_REWARD_VAULT}"
            chain: BERACHAIN
          ) {
            dynamicData { apr }
          }
        }`,
      }),
    }),
  ])

  const vault = await vaultRes.json()
  const bgt = await bgtRes.json()

  // LiquidRoyalty hardcodes 13% base APY on their own frontend —
  // it represents the guaranteed RWA royalty yield, capped at 13%.
  const apyBase = 13

  const rawApr = bgt?.data?.polGetRewardVault?.dynamicData?.apr
  const apyReward = rawApr != null ? parseFloat((rawApr * 100).toFixed(2)) : null

  // TVL from LR's share-prices endpoint
  const seniorTvl = vault?.data?.vaults?.senior?.tvl?.totalUsd
  const tvlUsd = seniorTvl ? parseFloat(seniorTvl) : null

  return {
    apyBase,
    apyReward,
    tvlUsd,
    fetchedAt: Date.now(),
  }
}

export function useSnrUsd() {
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
    fetchSnrUsdData()
      .then(d => {
        if (cancelled) return
        writeCache(d)
        setData(d)
      })
      .catch(err => {
        console.error('[useSnrUsd] fetch failed:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
