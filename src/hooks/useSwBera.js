import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_swbera_v4'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

const BERA_RPC = 'https://rpc.berachain.com/'
// DeFiLlama coin price for WBERA (0x6969... is the canonical WBERA address on Berachain)
const BERA_PRICE_URL = 'https://coins.llama.fi/prices/current/berachain:0x6969696969696969696969696969696969696969'

// swBERA ERC-4626 vault — staking WBERA to receive swBERA
const SWBERA_VAULT   = '0x118D2cEeE9785eaf70C15Cd74CD84c9f8c3EeC9a'
const WBERA_TOKEN    = '0x6969696969696969696969696969696969696969'

// convertToAssets(uint256 shares) selector
const CONVERT_TO_ASSETS = '0x07a2d13a'
// totalAssets() selector
const TOTAL_ASSETS = '0x01e1d114'
// 1e18 encoded as uint256 (rate for 1 swBERA)
const ONE_ETHER = '0000000000000000000000000000000000000000000000000de0b6b3a7640000'
// ~2s block time, 30-day lookback
const BLOCKS_PER_30D = 1_296_000

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

// Safe BigInt parse — returns 0n on empty/invalid hex
function hexToBigInt(hex) {
  if (!hex || hex === '0x' || hex === '0x0') return 0n
  try { return BigInt(hex) } catch { return 0n }
}

async function rpc(method, params) {
  const res = await fetch(BERA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  })
  return (await res.json()).result
}

async function fetchSwBeraData() {
  const [blockHex, priceRes] = await Promise.all([
    rpc('eth_blockNumber', []),
    fetch(BERA_PRICE_URL).then(r => r.json()).catch(() => null),
  ])

  const currentBlock = parseInt(blockHex, 16)
  const pastBlock = '0x' + Math.max(0, currentBlock - BLOCKS_PER_30D).toString(16)

  const callData = CONVERT_TO_ASSETS + ONE_ETHER
  const [currentHex, pastHex, totalAssetsHex] = await Promise.all([
    rpc('eth_call', [{ to: SWBERA_VAULT, data: callData }, 'latest']),
    rpc('eth_call', [{ to: SWBERA_VAULT, data: callData }, pastBlock]),
    rpc('eth_call', [{ to: SWBERA_VAULT, data: TOTAL_ASSETS }, 'latest']),
  ])

  const currentRate = Number(hexToBigInt(currentHex)) / 1e18
  const pastRate    = Number(hexToBigInt(pastHex))    / 1e18

  // Annualized APR from 30-day share price appreciation
  const gain30d = pastRate > 0 ? (currentRate - pastRate) / pastRate : 0
  const aprBase = parseFloat((gain30d * (365 / 30) * 100).toFixed(2))

  // TVL: totalAssets in WBERA terms × WBERA price
  const beraPrice = parseFloat(
    priceRes?.coins?.['berachain:0x6969696969696969696969696969696969696969']?.price ?? 0
  )
  const totalAssetsWBera = Number(hexToBigInt(totalAssetsHex)) / 1e18
  const tvlUsd = beraPrice > 0 && totalAssetsWBera > 0 ? totalAssetsWBera * beraPrice : null

  return {
    pool:             SWBERA_VAULT,
    chain:            'Berachain',
    project:          'berachain-hub',
    symbol:           'swBERA',
    exposure:         'single',
    stablecoin:       false,
    ilRisk:           'no',
    apyBase:          aprBase,
    apyReward:        null,
    apy:              aprBase,
    tvlUsd,
    underlyingTokens: [WBERA_TOKEN],
    _synthetic:       true,
  }
}

// Returns a synthetic pool object for WBERA → swBERA staking on hub.berachain.com,
// shaped to match DeFiLlama pool schema so it slots into OpportunityFeed.
export function useSwBera() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchSwBeraData()
      .then(d => { if (!cancelled && d) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useSwBera] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
