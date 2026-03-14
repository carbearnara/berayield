import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_bend_vaults_v3'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

const BERA_GRAPHQL = 'https://api.berachain.com/graphql'

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

async function gql(query) {
  const res = await fetch(BERA_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return res.json()
}

// Known mapping: Bend vault address → PoL reward vault address.
// The PoL reward vault is a separate contract — its stakingToken is the Bend vault address.
// Sourced from: https://api.berachain.com/graphql polGetRewardVaults query.
const BEND_REWARD_VAULT_MAP = {
  '0x30bba9cd9eb8c95824aa42faa1bb397b07545bc1': '0xdb6e93cd7bddc45ebc411619792fc5f977316c38', // RE7 HONEY
}

async function fetchBendVaults() {
  const bendVaults = await gql(`{
    bendVaults {
      vaultAddress
      loanTokenAddress
      dynamicData {
        nativeApy
        performanceFee
        platformFee
      }
    }
  }`).then(j => j?.data?.bendVaults ?? [])

  // Fetch BGT APR for each known reward vault in parallel
  const rewardVaultAddresses = Object.values(BEND_REWARD_VAULT_MAP)
  const bgtResults = await Promise.all(
    rewardVaultAddresses.map(addr =>
      gql(`{
        polGetRewardVault(chain: BERACHAIN, vaultAddress: "${addr}") {
          vaultAddress
          stakingTokenAddress
          dynamicData { apr }
        }
      }`).then(j => j?.data?.polGetRewardVault)
        .catch(() => null)
    )
  )

  // Build PoL lookup: Bend vault address (lowercase) → BGT apr (decimal)
  const bgtByBendVault = {}
  for (const rv of bgtResults) {
    if (!rv) continue
    const stakingKey = (rv.stakingTokenAddress || '').toLowerCase()
    bgtByBendVault[stakingKey] = rv.dynamicData?.apr ?? 0
  }

  console.log('[useBendVaults] BGT by Bend vault:', bgtByBendVault)

  // Build final lookup: loanTokenAddress (lowercase) → { apyBase, apyReward }
  // All values from the API are decimals — multiply by 100 for percentage display.
  const byLoanToken = {}
  for (const v of bendVaults) {
    const loanKey    = (v.loanTokenAddress || '').toLowerCase()
    const stakingKey = (v.vaultAddress     || '').toLowerCase()

    const nativeApy      = v.dynamicData?.nativeApy      ?? 0
    const performanceFee = v.dynamicData?.performanceFee  ?? 0
    const platformFee    = v.dynamicData?.platformFee     ?? 0
    const bgtApr         = bgtByBendVault[stakingKey]     ?? 0

    byLoanToken[loanKey] = {
      apyBase:   parseFloat(((nativeApy - performanceFee - platformFee) * 100).toFixed(4)),
      apyReward: parseFloat((bgtApr * 100).toFixed(4)),
    }
  }

  console.log('[useBendVaults] final lookup:', byLoanToken)
  return byLoanToken
}

// Returns a map of loanTokenAddress (lowercase) → { apyBase, apyReward }
// Match against underlyingTokens[0] from a DeFiLlama berapaw RE7* pool.
export function useBendVaults() {
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
    fetchBendVaults()
      .then(d => {
        if (cancelled) return
        writeCache(d)
        setData(d)
      })
      .catch(err => {
        console.error('[useBendVaults] fetch failed:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
