import { useState as useReportState, useMemo } from 'react'
import { useBerachainPools } from '../hooks/useDefiLlama'
import { useSnrUsd } from '../hooks/useLiquidRoyalty'
import { useBendVaults } from '../hooks/useBend'
import { usePrimeVaults } from '../hooks/usePrimeVaults'
import { useKodiakVaults } from '../hooks/useKodiak'
import { useDolomiteRates } from '../hooks/useDolomite'
import { useBrownfiPools } from '../hooks/useBrownfi'
import { useInfraredIBGT } from '../hooks/useInfrared'
import { useRheaUsdt0 } from '../hooks/useRhea'
import { useTermmaxHoney } from '../hooks/useTermmax'
import { useOrigamiVaults } from '../hooks/useOrigami'
import { useKodiakStablePools } from '../hooks/useKodiakStable'
import { useSwBera } from '../hooks/useSwBera'
import { useInfraredSiBera } from '../hooks/useInfraredSiBera'
import { formatTVL, formatAPY, getRiskLevel, apyToApr } from '../utils/formatters'
import ReportPage from './ReportPage'

// ─── Protocol name resolution ────────────────────────────────────────────────
// berapaw is an aggregator — resolve the underlying platform from symbol prefix

const PROJECT_DISPLAY = {
  'dolomite':        'Dolomite',
  'infrared-finance':'Infrared',
  'bex':             'BEX',
  'euler-v2':        'Euler v2',
  'woofi-earn':      'WooFi',
  'prime-vaults':    'Prime Vaults',
  'beraborrow':      'Beraborrow',
  'origami-finance': 'Origami',
  'berapaw':         'Berapaw',
  'berachain-hub':   'Berachain Hub',
  'symbiosis':       'Symbiosis',
  'brownfi':         'Brownfi',
  'rhea-finance':    'Rhea Finance',
  'termmax':         'Termmax',
  'kodiak':          'Kodiak',
}

function resolveProtocol(pool) {
  if (pool.project !== 'berapaw') {
    return PROJECT_DISPLAY[pool.project] || pool.project
  }
  const sym = pool.symbol || ''
  if (/^KODI/i.test(sym))   return 'Kodiak'
  if (/^I-/i.test(sym))     return 'Infrared'
  if (/^RE7/i.test(sym))    return 'Bend'
  if (/^SNRUSD/i.test(sym)) return 'Liquid Royalty'
  if (/^CHRM/i.test(sym))   return 'Charm Finance'
  return 'Berapaw'
}

// ─── Pool URL builder ─────────────────────────────────────────────────────────
// Constructs the most specific deposit/vault page URL possible per protocol.
// underlyingTokens[0] is the LP/vault contract address for pools, or the
// underlying asset address for single-sided positions.

function buildPoolUrl(pool) {
  const project = pool.project
  const sym = (pool.symbol || '').toUpperCase()
  const addr = (pool.underlyingTokens || [])[0] || ''

  // berapaw wrapper — link to the underlying protocol
  if (project === 'berapaw') {
    if (/^KODI/i.test(sym)) {
      // Kodiak Islands: LP token address identifies the Island vault
      return addr
        ? `https://app.kodiak.finance/islands/${addr}`
        : 'https://app.kodiak.finance'
    }
    if (/^I-/i.test(sym)) {
      return 'https://infrared.finance/vaults'
    }
    if (/^RE7/i.test(sym)) {
      // Re7 Capital-curated vaults live on Bend (Berachain's Morpho-based lender)
      return 'https://bend.berachain.com/lend'
    }
    if (/^SNRUSD/i.test(sym)) return 'https://www.liquidroyalty.com/'
    if (/^CHRM/i.test(sym))   return 'https://app.charm.fi'
    return 'https://www.berapaw.com'
  }

  switch (project) {
    case 'infrared-finance':
      if (sym.includes('SIBERA')) return 'https://infrared.finance/ibera'
      if (sym.includes('IBERA'))  return 'https://infrared.finance/ibera'
      if (sym.includes('IBGT'))   return 'https://infrared.finance/ibgt'
      return 'https://infrared.finance/vaults'

    case 'origami-finance': {
      // Autostaking collection vaults use infrared-collection path with vault address
      const autostakingAddrs = new Set([
        '0x9e5cbed606d4c4e0c13ee6c94113a9852adf2aa4', // sWBERA-osBGT (DeFiLlama)
        '0xdb15910600700f776ef615dd0906216cc4a7b754', // WBERA-iBGT
        '0xdfd2514848c012f0f09c6db33114cedb24af9a60', // iBERA-iBGT
        '0xfcb6c2a149da114fd3f3d0fdf3f4935840b0df8a', // iBERA-osBGT
        '0xd7f54c425f64b6cd87b6b39b0a53487bcaffb0c', // WBERA-iBERA
      ])
      const poolAddrLower = (pool.pool || '').toLowerCase()
      if (autostakingAddrs.has(poolAddrLower) || sym.includes('SWBERA') || sym.includes('OSBGT')) {
        const vaultAddr = autostakingAddrs.has(poolAddrLower) ? pool.pool : '0x9E5CbeD606d4c4e0c13Ee6C94113a9852ADF2Aa4'
        return `https://www.origami.finance/collections/infrared-collection/autostaking-collection/80094-${vaultAddr}`
      }
      return addr
        ? `https://origami.finance/collections/berachain-collection/80094-${addr}/info`
        : 'https://origami.finance/collections/berachain-collection'
    }

    case 'euler-v2':
      // Confirmed: /vault/{address}?network=berachain
      // Note: underlyingTokens[0] here is the underlying asset, not the vault contract.
      // Without the vault contract address, link to the Berachain-filtered app.
      return 'https://app.euler.finance/?network=berachain'

    case 'dolomite':
      return 'https://app.dolomite.io'

    case 'bex':
      return 'https://hub.berachain.com/pools'

    case 'woofi-earn':
      return 'https://woofi.com/earn'

    case 'prime-vaults':
      return 'https://app.primevaults.finance/?chainId=80094'

    case 'beraborrow':
      return 'https://app.beraborrow.com'

    case 'symbiosis':
      return 'https://app.symbiosis.finance'

    case 'brownfi':
      // For Brownfi, pool.pool holds the pool contract address (not underlyingTokens[0])
      return pool.pool
        ? `https://app.brownfi.io/pool/${pool.pool}`
        : 'https://app.brownfi.io/pool'

    case 'rhea-finance':
      return 'https://x.rhea.finance/?chain=bera'

    case 'kodiak':
      // underlyingTokens[0] is the Kodiak Island token address — the correct deposit URL
      return addr
        ? `https://app.kodiak.finance/islands/${addr}`
        : 'https://app.kodiak.finance'

    case 'termmax':
      return 'https://app.termmax.ts.finance/earn/berachain/0xd07f1862ae599697cdcd6fd36df3c33af25fd782?chain=berachain&persistChain=1'

    case 'berachain-hub':
      return 'https://hub.berachain.com/stake'

    default:
      return 'https://defillama.com/yields?chain=Berachain'
  }
}

// ─── Asset classification helpers ───────────────────────────────────────────

const BTC_TOKENS  = ['WBTC','STBTC','LBTC','SOLVBTC','UNIBTC','BRBTC','CBBTC','TBTC']
const ETH_TOKENS  = ['WETH','WEETH','RSWETH','BERAETH','PRIMEETH']
const BERA_TOKENS = ['BERA','IBGT','OSBGT','WGBERA','LBGT','SWBERA','SIBERA']

function symContains(pool, tokens) {
  const s = (pool.symbol || '').toUpperCase()
  return tokens.some(t => s.includes(t))
}

// ─── Rhea Finance URL builder ─────────────────────────────────────────────────
// Handled in buildPoolUrl via project === 'rhea-finance'

// Known reward token addresses → human-readable symbol
const REWARD_TOKEN_NAMES = {
  '0xbaadcc2962417c01af99fb2b7c75706b9bd6babe': 'BGT',
  '0x656b95e550c07a9ffe548bd4085c72418ceb1dba': 'BGT',
  '0x0f81001ef0a83ecce5ccebf63eb302c70a39a654': 'oDOLO',
}

function resolveRewardLabel(pool) {
  if (pool.rewardLabel) return pool.rewardLabel
  const addrs = pool.rewardTokens || []
  const names = addrs
    .map(a => REWARD_TOKEN_NAMES[(a || '').toLowerCase()])
    .filter(Boolean)
  return names.length > 0 ? names.join(', ') : null
}

// Pools excluded from the dashboard entirely — obscure, experimental, or
// yield that is almost entirely unsustainable BGT emissions on tiny TVL.
// KODIWBTC-KDK / KODIWBERA-KDK: governance token pairs — high IL, niche
// KODIWBERA-BERO: obscure token with low liquidity
// OAC-WBTC-WETH-A: Origami leveraged BTC/ETH — out of scope for BTC section
// I-WETH-USDC.E: Infrared WETH/USDC LP vault — not a clean ETH yield entry
const BLOCKLIST_SYMBOLS = new Set([
  'KODIWBTC-KDK', 'KODIWBERA-KDK', 'KODIWBERA-BERO',
  'SNECT', 'BB.SNECT', 'OAC-WBTC-WETH-A', 'I-WETH-USDC.E', 'LBTC',
  'SWBERA', // replaced by native staking entry via useSwBera
  'IBGT',   // replaced by fresher data entry via useInfraredIBGT
])
const BLOCKLIST_PROJECTS = new Set(['bex'])

function isStablecoinPool(p) {
  // DeFiLlama marks pools as stablecoin=true only when all underlying assets are stable
  if (p.stablecoin === true) return true
  // Catch single-sided stable deposits DeFiLlama may not flag
  // USD₮0 uses unicode ₮ — strip it to ASCII for matching
  const s = (p.symbol || '').toUpperCase().replace(/₮/g, 'T')
  const stableSyms = ['USDC','USDT','HONEY','NECT','BYUSD','DAI','USD1','PRIMEUSD','SNRUSD']
  return p.exposure === 'single' && stableSyms.some(t => s.includes(t))
}

function isBtcPool(p)  { return !isStablecoinPool(p) && symContains(p, BTC_TOKENS) }
function isEthPool(p)  { return !isStablecoinPool(p) && !isBtcPool(p) && symContains(p, ETH_TOKENS) }
function isBeraPool(p) { return !isStablecoinPool(p) && !isBtcPool(p) && !isEthPool(p) && symContains(p, BERA_TOKENS) }

// ─── Symbol display cleanup ───────────────────────────────────────────────────
// berapaw wraps protocols — strip redundant prefixes since protocol is shown separately

function cleanSymbol(pool) {
  const sym = pool.symbol || ''
  if (pool.project === 'berapaw') {
    if (/^KODI/i.test(sym))   return sym.replace(/^KODI/i, '').replace(/₮/g, 'T')
    if (/^I-/i.test(sym))     return sym.replace(/^I-/i, '')
    if (/^CHRM/i.test(sym))   return sym.replace(/^CHRM/i, '')
    if (/^RE7/i.test(sym))    return sym.replace(/^RE7/i, '')
    if (sym.toUpperCase() === 'SNRUSD') return 'SNRUSD (USDe)'
  }
  if (pool.project === 'origami-finance') {
    // Strip OAC-...-A wrapper naming: OAC-SWBERA-OSBGT-A → SWBERA-OSBGT
    return sym.replace(/^OAC-/i, '').replace(/-A$/i, '')
  }
  return sym.replace(/₮/g, 'T')
}

// ─── Type label ──────────────────────────────────────────────────────────────

function getTypeLabel(pool) {
  if (pool.exposure === 'single') {
    const lending = new Set(['dolomite','euler-v2','woofi-earn','bend','beraborrow','rhea-finance','termmax'])
    const staking = new Set(['infrared-finance','berachain-hub'])
    if (staking.has(pool.project)) return 'Staking'
    // berapaw RE7* pools are Bend lending vaults
    if (pool.project === 'berapaw' && /^RE7/i.test(pool.symbol || '')) return 'Lending'
    return lending.has(pool.project) ? 'Lending' : 'Single-sided'
  }
  return 'LP'
}

// ─── Pool sorting ────────────────────────────────────────────────────────────
// Single-sided / lending first (sorted by TVL desc), then LP (sorted by APY desc).

function sortPools(pools) {
  const single = pools
    .filter(p => p.exposure === 'single')
    .sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
  const lp = pools
    .filter(p => p.exposure !== 'single')
    .sort((a, b) => (b.apy || 0) - (a.apy || 0))
  return [...single, ...lp]
}

// ─── Category definitions ────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'stablecoins',
    label: 'Stablecoins',
    sublabel: 'Yield',
    description: 'Single-sided lending and stable-stable LP pools. Minimal directional risk — rates reflect borrow demand and liquidity incentives.',
    accent: 'var(--green)',
    accentSubtle: 'var(--green-subtle)',
    maxItems: 10,
    minTvl: 50_000,
    maxApy: 60,
    filter: isStablecoinPool,
  },
  {
    id: 'btc',
    label: 'Bitcoin',
    sublabel: 'Yield',
    description: 'Best available yields for BTC on Berachain. Single-sided lending rates are near 0% — higher returns require LP positions that carry impermanent loss.',
    accent: 'oklch(74% 0.18 50)',
    accentSubtle: 'oklch(16% 0.05 50)',
    maxItems: 5,
    maxSingle: 3,
    minTvl: 25_000,
    maxApy: 150,
    filter: isBtcPool,
  },
  {
    id: 'eth',
    label: 'Ethereum',
    sublabel: 'Yield',
    description: 'Best available yields for WETH on Berachain. Lending rates are under 1% — meaningful yield comes from Kodiak and Infrared LP vaults with IL risk.',
    accent: 'oklch(68% 0.14 250)',
    accentSubtle: 'oklch(16% 0.04 250)',
    maxItems: 6,
    maxSingle: 3,
    minTvl: 25_000,
    maxApy: 150,
    filter: isEthPool,
  },
  {
    id: 'bera',
    label: 'BERA',
    sublabel: 'Yield',
    description: 'Yields for Berachain-native assets: BERA, iBGT, iBERA, osBGT. Single-sided options shown first — LPs offer higher yield with IL risk against paired assets.',
    accent: 'var(--gold-bright)',
    accentSubtle: 'var(--gold-subtle)',
    maxItems: 10,
    maxSingle: 7,
    minTvl: 20_000,
    maxApy: 150,
    filter: isBeraPool,
  },
]

function pickPools(pools, cat) {
  if (!pools) return []
  const filtered = pools
    .filter(p => p._synthetic || !BLOCKLIST_SYMBOLS.has((p.symbol || '').toUpperCase()))
    .filter(p => p._synthetic || !BLOCKLIST_PROJECTS.has(p.project))
    // oriBGT already shown via Origami vaults; suppress the Dolomite lending duplicate
    .filter(p => !(p.project === 'dolomite' && (p.symbol || '').toUpperCase().includes('ORIBGT')))
    .filter(cat.filter)
    .filter(p => p._synthetic || ((p.apy || 0) > 0 && (p.apy || 0) < cat.maxApy))
    // Skip TVL filter for external sources where TVL data is unreliable or vaults are new
    .filter(p => p.project === 'brownfi' || p.project === 'origami-finance' || p._synthetic || (p.tvlUsd || 0) >= cat.minTvl)

  // Deduplicate Euler pools: keep only the highest-TVL pool per underlying symbol
  // (Euler deploys multiple vault addresses for the same asset)
  const eulerSeen = new Map()
  const deduped = filtered.filter(p => {
    if (p.project !== 'euler-v2') return true
    const key = (p.symbol || '').toUpperCase()
    const existing = eulerSeen.get(key)
    if (!existing || (p.tvlUsd || 0) > (existing.tvlUsd || 0)) {
      eulerSeen.set(key, p)
      return true
    }
    return false
  })
  // Second pass: remove any earlier lower-TVL Euler entry displaced by a later higher-TVL one
  const eulerWinners = new Set([...eulerSeen.values()])
  const filtered2 = deduped.filter(p => p.project !== 'euler-v2' || eulerWinners.has(p))

  // If maxSingle is set, cap single-sided slots so LP pools always get representation.
  // Remaining slots after single-sided are filled by LP pools sorted by APY desc.
  if (cat.maxSingle != null) {
    // Synthetic pools (swBERA, siBERA, etc.) are always included first;
    // remaining slots go to TVL-sorted regular pools.
    const syntheticSingle = filtered2.filter(p => p.exposure === 'single' && p._synthetic)
    const regularSingle = filtered2
      .filter(p => p.exposure === 'single' && !p._synthetic)
      .sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
      .slice(0, cat.maxSingle - syntheticSingle.length)
    const single = [...syntheticSingle, ...regularSingle]
    const lp = filtered2
      .filter(p => p.exposure !== 'single')
      .sort((a, b) => (b.apy || 0) - (a.apy || 0))
      .slice(0, cat.maxItems - single.length)
    return [...single, ...lp]
  }

  return sortPools(filtered2).slice(0, cat.maxItems)
}

// ─── Main ────────────────────────────────────────────────────────────────────

// Merge Merkl external reward APR onto the PRIMEUSD pool.
// DeFiLlama captures the base vault yield; Merkl has an additional
// reward campaign registered on Arbitrum for PRIMEUSD holders.
function applyPrimeOverride(pool, primeData) {
  if (!primeData || pool.project !== 'prime-vaults') return pool
  const sym = (pool.symbol || '').toUpperCase()
  if (!sym.includes('PRIMEUSD')) return pool
  return {
    ...pool,
    apyReward:   primeData.apyReward   ?? pool.apyReward,
    apy:         (pool.apyBase || 0) + (primeData.apyReward || 0),
    rewardLabel: primeData.rewardLabel ?? pool.rewardLabel,
  }
}

// Merge Kodiak live APY data onto KODI* berapaw pool entries.
// underlyingTokens[0] for berapaw KODI* pools is the Kodiak island address.
function applyKodiakOverride(pool, kodiakVaults) {
  if (!kodiakVaults || pool.project !== 'berapaw') return pool
  const sym = (pool.symbol || '').toUpperCase()
  if (!/^KODI/.test(sym)) return pool
  const islandAddr = ((pool.underlyingTokens || [])[0] || '').toLowerCase()
  const k = islandAddr ? kodiakVaults[islandAddr] : null
  if (!k) return pool
  return {
    ...pool,
    apyBase:     k.apyBase   ?? pool.apyBase,
    apyReward:   k.apyReward ?? pool.apyReward,
    apy:         (k.apyBase || 0) + (k.apyReward || 0),
    rewardLabel: 'BGT',
  }
}

// Merge Dolomite live APY data onto dolomite pool entries.
// underlyingTokens[0] for dolomite pools is the underlying token address.
function applyDolomiteOverride(pool, dolomiteRates) {
  if (!dolomiteRates || pool.project !== 'dolomite') return pool
  const tokenAddr = ((pool.underlyingTokens || [])[0] || '').toLowerCase()
  const d = tokenAddr ? dolomiteRates[tokenAddr] : null
  if (!d) return pool
  // Use Dolomite's values directly — do NOT fall back to DeFiLlama's apyReward.
  // DeFiLlama may classify nativeYield (staking APR) as apyReward, which is wrong.
  // When Dolomite reports d.apyReward = null, that means no external reward tokens.
  return {
    ...pool,
    apyBase:     d.apyBase,
    apyReward:   d.apyReward,
    apy:         d.apy,
    rewardLabel: d.rewardLabel,
  }
}

// Merge Bend live APY data onto RE7* berapaw pool entries.
// DeFiLlama's underlyingTokens[0] for a berapaw Bend pool is the loan token address,
// which matches Bend's loanTokenAddress — used as the lookup key.
function applyBendOverride(pool, bendVaults) {
  if (!bendVaults || pool.project !== 'berapaw') return pool
  const sym = (pool.symbol || '').toUpperCase()
  if (!/^RE7/.test(sym)) return pool
  const loanToken = ((pool.underlyingTokens || [])[0] || '').toLowerCase()
  const bend = loanToken ? bendVaults[loanToken] : null
  if (!bend) return pool
  return {
    ...pool,
    apyBase:     bend.apyBase   ?? pool.apyBase,
    apyReward:   bend.apyReward ?? pool.apyReward,
    apy:         (bend.apyBase || 0) + (bend.apyReward || 0),
    rewardLabel: 'BGT',
  }
}

// Merge LiquidRoyalty live data onto the snrUSD pool entry
function applyLrOverride(pool, lrData) {
  if (!lrData || (pool.symbol || '').toUpperCase() !== 'SNRUSD') return pool
  return {
    ...pool,
    apyBase:     lrData.apyBase   ?? pool.apyBase,
    apyReward:   lrData.apyReward ?? pool.apyReward,
    apy:         (lrData.apyBase || 0) + (lrData.apyReward || 0),
    rewardLabel: 'BGT',
    // Keep DeFiLlama TVL — LR API TVL appears inconsistent
  }
}

function annotatePool(pool) {
  return {
    ...pool,
    _protocol: resolveProtocol(pool),
    _type:     getTypeLabel(pool),
    _risk:     getRiskLevel(pool),
    _url:      buildPoolUrl(pool),
  }
}

export default function OpportunityFeed({ showReport, onToggleReport }) {
  const { data: pools, loading } = useBerachainPools()
  const { data: lrData } = useSnrUsd()
  const { data: bendVaults }    = useBendVaults()
  const { data: primeData }     = usePrimeVaults()
  const { data: kodiakVaults }  = useKodiakVaults()
  const { data: dolomiteRates } = useDolomiteRates()
  const { data: brownfiPools }  = useBrownfiPools()
  const { data: infraredIBGT }  = useInfraredIBGT()
  const { data: rheaUsdt0 }     = useRheaUsdt0()
  const { data: termmaxHoney }  = useTermmaxHoney()
  const { data: origamiVaults }      = useOrigamiVaults()
  const { data: kodiakStablePools }  = useKodiakStablePools()
  const { data: swBera }             = useSwBera()
  const { data: siBera }             = useInfraredSiBera()

  const allPools = (() => {
    if (!pools) return pools
    const extra = [
      ...(brownfiPools || []),
      ...(infraredIBGT  ? [infraredIBGT]  : []),
      ...(rheaUsdt0     ? [rheaUsdt0]     : []),
      ...(termmaxHoney  ? [termmaxHoney]  : []),
      ...(origamiVaults || []),
      ...(kodiakStablePools || []),
      ...(swBera ? [swBera] : []),
      ...(siBera ? [siBera] : []),
    ]
    return [...pools, ...extra]
  })()

  const enriched = allPools
    ? allPools.map(p => {
        const overridden = applyLrOverride(
          applyBendOverride(
            applyKodiakOverride(
              applyDolomiteOverride(
                applyPrimeOverride(p, primeData),
                dolomiteRates
              ),
              kodiakVaults
            ),
            bendVaults
          ),
          lrData
        )
        // _synthetic pools (swBERA, siBERA, etc.) already report APR.
        // DeFiLlama and most protocol APIs return APY — convert to APR for consistency.
        if (overridden._synthetic) return overridden
        return {
          ...overridden,
          apyBase:   apyToApr(overridden.apyBase),
          apyReward: apyToApr(overridden.apyReward),
          apy:       apyToApr(overridden.apy),
        }
      })
    : allPools

  const reportSections = useMemo(() => {
    if (!enriched) return []
    return CATEGORIES.map(cat => {
      const pools = pickPools(enriched, cat).map(annotatePool)
      const topYield = [...pools].sort((a, b) => (b.apy || 0) - (a.apy || 0))[0] ?? null
      const singles = pools.filter(p => p.exposure === 'single')
      const safestSource = singles.length > 0 ? singles : pools
      const safest = [...safestSource].sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))[0] ?? null
      return {
        label: cat.label,
        sublabel: cat.sublabel,
        accent: cat.accent,
        topYield,
        safest: safest?.pool !== topYield?.pool ? safest : null,
      }
    })
  }, [enriched])

  return (
    <>
      {showReport
        ? <ReportPage sections={reportSections} />
        : (
          <main>
            {CATEGORIES.map((cat, i) => (
              <CategorySection
                key={cat.id}
                category={cat}
                pools={pickPools(enriched, cat)}
                loading={loading}
                last={i === CATEGORIES.length - 1}
              />
            ))}
          </main>
        )
      }
      <ReportFAB loading={loading} showReport={showReport} onClick={onToggleReport} />
    </>
  )
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({ category: cat, pools, loading, last }) {
  const hasLP = pools.some(p => p.exposure === 'multi' && !isLeveragedVault(p))
  const hasLeveraged = pools.some(p => isLeveragedVault(p))

  return (
    <section id={cat.id} style={{ borderBottom: last ? 'none' : '1px solid var(--border-subtle)', padding: '52px 0' }}>
      <div className="section">
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.625rem',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}>
              {cat.label}
            </h2>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: cat.accent,
              background: cat.accentSubtle,
              padding: '2px 8px',
              borderRadius: 2,
            }}>
              {cat.sublabel}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.65 }}>
            {cat.description}
          </p>
          {!loading && hasLP && (
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', flexShrink: 0 }} />
              LP positions carry impermanent loss risk.
            </div>
          )}
          {!loading && hasLeveraged && (
            <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', flexShrink: 0 }} />
              Leveraged positions carry liquidation risk.
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 1,
          background: 'var(--border-subtle)',
        }}>
          {loading
            ? Array.from({ length: cat.maxItems }).map((_, i) => (
                <SkeletonCard key={i} accent={cat.accent} />
              ))
            : pools.length > 0
            ? pools.map((pool, i) => (
                <OpportunityCard key={pool.pool || i} pool={pool} accent={cat.accent} accentSubtle={cat.accentSubtle} />
              ))
            : (
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-surface-1)',
                padding: '40px 28px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}>
                No pools meeting criteria — check{' '}
                <a href="https://defillama.com/yields?chain=Berachain" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-mid)' }}>
                  DeFiLlama
                </a>
              </div>
            )
          }
        </div>
      </div>
    </section>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

// Origami LOV (Leveraged Origami Vault) pools use leverage rather than LP pairing —
// the relevant risk is liquidation/leverage risk, not impermanent loss.
function isLeveragedVault(pool) {
  if (pool.project !== 'origami-finance') return false
  const sym = (pool.symbol || '').toUpperCase()
  return sym.includes('LOV')
}

// LP pools where both assets are highly correlated — stablecoin pairs or
// same-underlying derivative pairs (e.g. iBGT/wgBERA). IL risk is low.
function isCorrelatedLP(pool) {
  if (pool.exposure !== 'multi') return false

  // Stable/stable pairs — DeFiLlama sets stablecoin:true only when ALL assets are stable
  if (pool.stablecoin === true) return true

  const sym = (pool.symbol || '').toUpperCase()

  // If the pool contains any stablecoin, the pair is cross-type — not correlated.
  // e.g. WBERA/HONEY: BERA ecosystem + stablecoin → IL risk, not correlated.
  const STABLES = ['USDC','USDT','HONEY','NECT','BYUSD','DAI','USD1','PRIMEUSD','SNRUSD','USDE']
  if (STABLES.some(s => sym.includes(s))) return false

  // BERA-ecosystem pairs: all tokens track native BERA value.
  // Match greedily longest-first and consume matched text to prevent a single token
  // (e.g. WBERA) from matching multiple entries (WBERA + BERA).
  const BERA_DERIVS = ['WGBERA','SWBERA','SIBERA','OSBGT','GBERA','IBERA','WBERA','IBGT','BERA']
  let s = sym
  let beraCount = 0
  for (const d of BERA_DERIVS) {
    if (s.includes(d)) {
      beraCount++
      s = s.replace(d, '')
    }
  }
  return beraCount >= 2
}

function OpportunityCard({ pool, accent, accentSubtle }) {
  const totalApy = pool.apy || 0
  const isLeveraged = isLeveragedVault(pool)
  const isCorrelated = isCorrelatedLP(pool)
  // Leveraged vaults are single-asset despite DeFiLlama marking exposure as 'multi'
  const isLP = pool.exposure === 'multi' && !isLeveraged
  const typeLabel = getTypeLabel(pool)
  const protocol = resolveProtocol(pool)
  const href = buildPoolUrl(pool)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: 'var(--bg-surface-1)',
        padding: '22px 22px 20px',
        borderTop: `2px solid ${isLP ? accent + 'aa' : accent}`,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background var(--dur-fast)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface-1)'}
    >
      {/* Protocol row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {protocol}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isLeveraged && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--red)', background: 'var(--red-subtle)', padding: '1px 5px', borderRadius: 2,
            }}
              title="This position uses leverage — liquidation risk if collateral value drops"
            >
              Lev Risk
            </span>
          )}
          {isCorrelated && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 2,
            }}
              title="Both assets track the same underlying — impermanent loss risk is low"
            >
              Correlated
            </span>
          )}
          {isLP && !isLeveraged && !isCorrelated && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--red)', background: 'var(--red-subtle)', padding: '1px 5px', borderRadius: 2,
            }}
              title="This position carries impermanent loss risk"
            >
              IL Risk
            </span>
          )}
          {!isLeveraged && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: accent, background: accentSubtle, padding: '1px 5px', borderRadius: 2,
            }}>
              {typeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Asset symbol */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: isLP ? 'var(--text-secondary)' : 'var(--text-primary)',
        marginBottom: 14,
        lineHeight: 1.2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {cleanSymbol(pool)}
      </div>

      {/* APR */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div
            className="num"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.25rem',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: accent,
              opacity: isLP ? 0.8 : 1,
            }}
          >
            {formatAPY(totalApy)}
          </div>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            paddingBottom: 2,
          }}>APR</span>
        </div>
        <div style={{ marginTop: 5, display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {pool.apyBase > 0 && (
            <span className="num">{formatAPY(pool.apyBase)} base</span>
          )}
          {pool.apyReward > 0 && (
            <span
              className="num"
              style={{ color: 'var(--gold-mid)', cursor: 'help', borderBottom: '1px dashed var(--gold-mid)' }}
              title={resolveRewardLabel(pool) ? `Paid in ${resolveRewardLabel(pool)}` : 'Reward tokens'}
            >
              +{formatAPY(pool.apyReward)} rewards
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="num" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {(pool.tvlUsd || 0) > 0 ? formatTVL(pool.tvlUsd) + ' TVL' : '—'}
        </div>
        {pool.pointsLabel && (
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
            padding: '1px 5px', borderRadius: 2,
          }} title="Points rewards available">
            +{pool.pointsLabel}
          </span>
        )}
      </div>
    </a>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

// ─── Report FAB ───────────────────────────────────────────────────────────────

function ReportFAB({ loading, showReport, onClick }) {
  const [hovered, setHovered] = useReportState(false)
  const disabled = loading

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={showReport ? 'Back to dashboard' : 'View yield report'}
      className="no-print"
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 48,
        padding: '0 20px 0 16px',
        borderRadius: 24,
        background: disabled ? 'var(--bg-surface-2)' : hovered ? 'var(--gold-bright)' : showReport ? 'var(--bg-surface-2)' : 'var(--bg-surface-1)',
        border: `1px solid ${disabled ? 'var(--border-subtle)' : hovered ? 'var(--gold-bright)' : 'var(--border-muted)'}`,
        color: disabled ? 'var(--text-muted)' : hovered ? '#0d0d0d' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: hovered && !disabled ? '0 4px 20px rgba(245,166,35,0.25)' : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: disabled ? 0.4 : 1 }}>
        {showReport
          ? <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>
          : <>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </>
        }
      </svg>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.01em' }}>
        {showReport ? 'Dashboard' : 'Yield Report'}
      </span>
    </button>
  )
}

function SkeletonCard({ accent }) {
  return (
    <div style={{ background: 'var(--bg-surface-1)', padding: '22px 22px 20px', borderTop: `2px solid ${accent}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 60, height: 11 }} />
        <div className="skeleton" style={{ width: 44, height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 90, height: 17, marginBottom: 14 }} />
      <div className="skeleton" style={{ width: 72, height: 36, marginBottom: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: 52, height: 11 }} />
        <div className="skeleton" style={{ width: 36, height: 16, borderRadius: 2 }} />
      </div>
    </div>
  )
}
