import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_sibera_v3'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

const BERA_RPC = 'https://rpc.berachain.com/'
// DeFiLlama coin price for iBERA — more reliable than Infrared API field
const IBERA_PRICE_URL = 'https://coins.llama.fi/prices/current/berachain:0x9b6761bf2397bb5a6624a856cc84a3a14dcd3fe5'

// siBERA ERC-4626 vault — staking iBERA to receive siBERA
const SIBERA_VAULT = '0xa3503ba6460121d5936f4576f5486fed30dba4d8'
const IBERA_TOKEN  = '0x9b6761bf2397bb5a6624a856cc84a3a14dcd3fe5'

// convertToAssets(uint256 shares) selector
const CONVERT_TO_ASSETS = '0x07a2d13a'
// totalAssets() selector
const TOTAL_ASSETS = '0x01e1d114'
// 1e18 encoded as uint256 (get rate for 1 siBERA)
const ONE_ETHER = '0000000000000000000000000000000000000000000000000de0b6b3a7640000'
// Berachain ~2s block time, 30-day lookback
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

async function rpc(method, params) {
  const res = await fetch(BERA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  })
  return (await res.json()).result
}

// Safe BigInt parse — returns 0n on empty/invalid hex
function hexToBigInt(hex) {
  if (!hex || hex === '0x' || hex === '0x0') return 0n
  try { return BigInt(hex) } catch { return 0n }
}

async function fetchSiBeraData() {
  const [blockHex, priceRes] = await Promise.all([
    rpc('eth_blockNumber', []),
    fetch(IBERA_PRICE_URL).then(r => r.json()).catch(() => null),
  ])

  const currentBlock = parseInt(blockHex, 16)
  const pastBlock = '0x' + Math.max(0, currentBlock - BLOCKS_PER_30D).toString(16)

  const callData = CONVERT_TO_ASSETS + ONE_ETHER
  const [currentHex, pastHex, totalAssetsHex] = await Promise.all([
    rpc('eth_call', [{ to: SIBERA_VAULT, data: callData }, 'latest']),
    rpc('eth_call', [{ to: SIBERA_VAULT, data: callData }, pastBlock]),
    rpc('eth_call', [{ to: SIBERA_VAULT, data: TOTAL_ASSETS }, 'latest']),
  ])

  const currentRate = Number(hexToBigInt(currentHex)) / 1e18
  const pastRate    = Number(hexToBigInt(pastHex))    / 1e18

  // Annualized APR from 30-day share price appreciation
  const gain30d = pastRate > 0 ? (currentRate - pastRate) / pastRate : 0
  const aprBase = parseFloat((gain30d * (365 / 30) * 100).toFixed(2))

  // TVL: totalAssets in iBERA terms × iBERA USD price from DeFiLlama
  const iBeraPrice = parseFloat(
    priceRes?.coins?.['berachain:0x9b6761bf2397bb5a6624a856cc84a3a14dcd3fe5']?.price ?? 0
  )
  const totalAssetsiBERA = Number(hexToBigInt(totalAssetsHex)) / 1e18
  const tvlUsd = iBeraPrice > 0 && totalAssetsiBERA > 0 ? totalAssetsiBERA * iBeraPrice : null

  return {
    pool:             SIBERA_VAULT,
    project:          'infrared-finance',
    symbol:           'siBERA',
    chain:            'Berachain',
    exposure:         'single',
    stablecoin:       false,
    ilRisk:           'no',
    apyBase:          aprBase,
    apyReward:        null,
    apy:              aprBase,
    tvlUsd,
    underlyingTokens: [IBERA_TOKEN],
    _synthetic:       true,
  }
}

// Returns a synthetic pool object for iBERA → siBERA staking on Infrared,
// shaped to match DeFiLlama pool schema so it slots into OpportunityFeed.
export function useInfraredSiBera() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchSiBeraData()
      .then(d => { if (!cancelled && d) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useInfraredSiBera] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
