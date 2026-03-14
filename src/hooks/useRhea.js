import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_rhea_usdt0_v3'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes — lending rates shift with utilization

// Rhea Finance on Berachain routes USDT0 deposits through NEAR's Burrow lending protocol.
// The "bera" chain filter in Rhea's UI maps to the usdt.tether-token.near asset in Burrow.
// USDT0 on Berachain: 0x779ded0c9e1022225f8e0630b35a9b54be713736
// Burrow contract:    contract.main.burrow.near
// Reward token:       lst.rhealab.near (rNEAR, 24 decimals)
// Farm type:          TokenNetBalance — rewards distributed over boosted shares

const NEAR_RPC        = 'https://rpc.mainnet.near.org'
const BURROW_CONTRACT = 'contract.main.burrow.near'
const ASSET_TOKEN_ID  = 'usdt.tether-token.near'
const REWARD_TOKEN_ID = 'lst.rhealab.near'
const RHEA_PRICE_API  = 'https://api.rhea.finance/list-token-price'
const USDT0_ADDRESS   = '0x779ded0c9e1022225f8e0630b35a9b54be713736'
// Burrow stores share balances with 18 effective decimal places (confirmed empirically)
const SHARE_DECIMALS  = 18
// rNEAR (lst.rhealab.near) uses 24 decimal places
const REWARD_DECIMALS = 24

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

async function nearView(contractId, methodName, args) {
  const argsBase64 = btoa(JSON.stringify(args))
  const res = await fetch(NEAR_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'berayield',
      method: 'query',
      params: {
        request_type: 'call_function',
        finality: 'final',
        account_id: contractId,
        method_name: methodName,
        args_base64: argsBase64,
      },
    }),
  })
  const json = await res.json()
  const resultBytes = json?.result?.result
  if (!resultBytes) throw new Error('NEAR RPC: no result')
  return JSON.parse(String.fromCharCode(...resultBytes))
}

async function fetchRheaUsdt0() {
  // Fetch asset data and reward token price in parallel
  const [asset, priceList] = await Promise.all([
    nearView(BURROW_CONTRACT, 'get_asset', { token_id: ASSET_TOKEN_ID }),
    fetch(RHEA_PRICE_API).then(r => r.json()).catch(() => null),
  ])

  // ── Supply APR (base) ──────────────────────────────────────────────────────
  // supply_apr is a decimal string (e.g., "0.0305..." = 3.05%)
  const supplyAprDecimal = parseFloat(asset.supply_apr || '0')
  const apyBase = parseFloat((supplyAprDecimal * 100).toFixed(4))

  // ── TVL (total supplied) ───────────────────────────────────────────────────
  const suppliedRaw = BigInt(asset.supplied?.balance || '0')
  const tvlUsd = Number(suppliedRaw) / 10 ** SHARE_DECIMALS

  // ── Farm reward APR ────────────────────────────────────────────────────────
  // Farm type: TokenNetBalance — rewards distributed proportionally over boosted_shares.
  // boosted_shares is the effective weighted denominator (includes boost multipliers).
  // For a non-boosted depositor, reward APR = annualRewardUsd / (boosted_shares in USD).
  // We read farm data from asset.farms (included in get_asset response).
  let apyReward = 0
  const farms = asset.farms || []
  const tnbFarm = farms.find(f => f.farm_id?.TokenNetBalance === ASSET_TOKEN_ID)
  const rewardInfo = tnbFarm?.rewards?.[REWARD_TOKEN_ID]

  if (rewardInfo) {
    // reward_per_day is raw with REWARD_DECIMALS precision
    const rewardPerDay = Number(BigInt(rewardInfo.reward_per_day)) / 10 ** REWARD_DECIMALS
    // boosted_shares uses the same SHARE_DECIMALS precision as supplied.balance
    const boostedShares = Number(BigInt(rewardInfo.boosted_shares)) / 10 ** SHARE_DECIMALS

    // Reward token price from Rhea price API
    let rewardPriceUsd = 0
    if (priceList && typeof priceList === 'object') {
      const priceEntry = priceList[REWARD_TOKEN_ID]
      if (priceEntry != null) {
        rewardPriceUsd = parseFloat(priceEntry?.price ?? priceEntry) || 0
      }
    }

    if (boostedShares > 0 && rewardPriceUsd > 0) {
      const annualRewardUsd = rewardPerDay * 365 * rewardPriceUsd
      apyReward = parseFloat(((annualRewardUsd / boostedShares) * 100).toFixed(4))
    }
  }

  return {
    pool:             'rhea-usdt0-berachain',
    project:          'rhea-finance',
    symbol:           'USDT0',
    apy:              parseFloat((apyBase + apyReward).toFixed(4)),
    apyBase,
    apyReward:        apyReward > 0 ? apyReward : null,
    tvlUsd,
    underlyingTokens: [USDT0_ADDRESS],
    exposure:         'single',
    stablecoin:       true,
    chain:            'Berachain',
    rewardLabel:      apyReward > 0 ? 'rNEAR' : null,
  }
}

// Returns a single pool object shaped like a DeFiLlama pool for the Rhea Finance
// USDT0 lending pool on Berachain (backed by Burrow protocol on NEAR).
// Base APY: ~3% (Burrow supply APR). Reward: rNEAR distributed over boosted shares.
export function useRheaUsdt0() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchRheaUsdt0()
      .then(d => { if (!cancelled && d) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useRheaUsdt0] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
