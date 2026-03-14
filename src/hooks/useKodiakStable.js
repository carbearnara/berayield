import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_kodiak_stable_v1'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

const BERACHAIN_RPC = 'https://rpc.berachain.com'
const BGT_ADDRESS   = '0x656b95e550c07a9ffe548bd4085c72418ceb1dba'

// Kodiak V3 stable pools on Berachain with BGT reward vault emissions.
// Users deposit into the Kodiak Island (automated LP manager) to get island
// tokens, which are then staked in the BGT reward vault to earn BGT.
// LP TVL is measured directly from token balances held in the V3 pool contract.
const POOLS = [
  {
    symbol:       'USDe-HONEY',
    poolAddress:  '0x9E4C460645B39628C631003eB9911651d5441DD8',
    islandToken:  '0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9',
    rewardVault:  '0x75Da1D58A8d97f7b626224E7E71fa44DB13689f2',
    token0:       '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // USDe (18 dec)
    token1:       '0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce', // HONEY (18 dec)
  },
  {
    symbol:       'sUSDe-HONEY',
    poolAddress:  '0xcFfe3649a78A84A1C4aD9417aA041C2c52379AcE',
    islandToken:  '0xD5B6EA3544a51BfdDa7E6926BdF778339801dFe8',
    rewardVault:  '0x09b113Ae50B5AF0988B9a1Dc50BFE602e7C24Ef7',
    token0:       '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2', // sUSDe (18 dec)
    token1:       '0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce', // HONEY (18 dec)
  },
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

async function ethCall(to, data) {
  const res = await fetch(BERACHAIN_RPC, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_call',
      params:  [{ to, data }, 'latest'],
    }),
  })
  const json = await res.json()
  const hex = json.result
  // Return zero-padded 32-byte result on empty response
  return (hex && hex !== '0x')
    ? hex
    : '0x0000000000000000000000000000000000000000000000000000000000000000'
}

// ABI-encode balanceOf(address): selector 0x70a08231 + address padded to 32 bytes
function encodeBalanceOf(addr) {
  return '0x70a08231' + addr.slice(2).toLowerCase().padStart(64, '0')
}

async function fetchKodiakStablePools() {
  // Fetch BGT + token prices from DeFiLlama coins API
  const allAddrs = [
    `berachain:${BGT_ADDRESS.toLowerCase()}`,
    ...POOLS.flatMap(p => [
      `berachain:${p.token0.toLowerCase()}`,
      `berachain:${p.token1.toLowerCase()}`,
    ]),
  ]
  const uniqueAddrs = [...new Set(allAddrs)]
  const priceRes  = await fetch(`https://coins.llama.fi/prices/current/${uniqueAddrs.join(',')}`)
  const priceJson = await priceRes.json()
  const prices    = priceJson.coins || {}

  const bgtPrice = prices[`berachain:${BGT_ADDRESS.toLowerCase()}`]?.price || 0
  if (!bgtPrice) return []

  const results = []
  for (const pool of POOLS) {
    // Fetch token balances in pool contract + reward vault emission rate in parallel
    const [bal0Hex, bal1Hex, rewardRateHex] = await Promise.all([
      ethCall(pool.token0, encodeBalanceOf(pool.poolAddress)),
      ethCall(pool.token1, encodeBalanceOf(pool.poolAddress)),
      ethCall(pool.rewardVault, '0x7b0a47ee'), // rewardRate()
    ])

    // Both tokens have 18 decimals
    const bal0 = Number(BigInt(bal0Hex)) / 1e18
    const bal1 = Number(BigInt(bal1Hex)) / 1e18

    const price0 = prices[`berachain:${pool.token0.toLowerCase()}`]?.price ?? 1
    const price1 = prices[`berachain:${pool.token1.toLowerCase()}`]?.price ?? 1

    const tvlUsd = bal0 * price0 + bal1 * price1
    if (tvlUsd <= 0) continue

    // Synthetix-style reward vault: rewardRate is BGT/sec stored in 1e18 units
    const bgtPerSec    = Number(BigInt(rewardRateHex)) / 1e18
    const annualBgtUsd = bgtPerSec * 86400 * 365 * bgtPrice
    const apyReward    = parseFloat(((annualBgtUsd / tvlUsd) * 100).toFixed(4))

    if (apyReward <= 0) continue

    results.push({
      pool:             pool.poolAddress,
      project:          'kodiak',
      symbol:           pool.symbol,
      apy:              apyReward,
      apyBase:          0,
      apyReward,
      tvlUsd,
      underlyingTokens: [pool.islandToken], // island token address used for deposit URL
      exposure:         'multi',
      stablecoin:       true,
      chain:            'Berachain',
      rewardLabel:      'BGT',
    })
  }

  return results
}

// Returns pool objects for USDe/HONEY and sUSDe/HONEY Kodiak V3 pools.
// APY is entirely from BGT reward vault emissions (~6-7% at current rates).
// TVL is computed from live token balances in the V3 pool contract.
export function useKodiakStablePools() {
  const [data, setData] = useState(() => readCache() ?? [])
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchKodiakStablePools()
      .then(d => { if (!cancelled) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useKodiakStablePools] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
