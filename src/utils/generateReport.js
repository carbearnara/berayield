// Generates a self-contained HTML report string from the current live pool data.
// Each section gets: highest-APR pool and lowest-risk (highest TVL single-sided) pool.

// ─── Curated protocol descriptions ───────────────────────────────────────────
// Keyed by symbol pattern (checked first, most specific) then resolved protocol name.
// pool._protocol is the display name, pool.symbol is the raw DeFiLlama symbol.

function lookupDescription(pool) {
  const proto = (pool._protocol || pool.project || '').toLowerCase()
  const sym   = (pool.symbol   || '').toUpperCase()
  const type  = (pool._type    || '').toLowerCase()

  // ── Symbol-specific ────────────────────────────────────────────────────────

  if (sym.includes('SIBERA'))
    return 'Stake iBERA on Infrared to receive siBERA, an ERC-4626 vault token that auto-compounds staking rewards. Yield accumulates through share price appreciation driven by iBERA validator rewards and BGT emissions — no manual claiming required.'

  if (sym.includes('SWBERA'))
    return 'Stake native BERA on hub.berachain.com to receive swBERA. Earn BGT emissions from Berachain\'s Proof-of-Liquidity consensus mechanism. swBERA is non-rebasing — your position grows in value rather than token count.'

  if (sym.includes('PRIMEUSD'))
    return 'PrimeUSD is a yield-bearing stablecoin from Prime Vaults backed by a diversified basket of real-world assets. Deposits earn passive RWA income that compounds automatically into the share price. No active management required — yield accrues continuously from underlying asset revenue.'

  if (sym.includes('SNRUSD'))
    return 'snrUSD is the senior tranche of Liquid Royalty\'s structured vault, backed by real-world royalty revenue from SailOut — a cross-border e-commerce operator with ~$50M annual revenue. Senior holders have first-loss protection: the junior tranche absorbs losses before seniors are impacted. Pays monthly USDe distributions plus BGT emissions.'

  if (sym.includes('NECT') || proto === 'beraborrow')
    return 'Beraborrow is a CDP protocol for minting NECT, Berachain\'s native overcollateralized stablecoin, against iBGT or iBERA collateral. Your collateral continues earning BGT rewards while you deploy minted NECT elsewhere — effectively doubling capital efficiency. Subject to liquidation if collateral ratio falls below the minimum threshold.'

  if (sym.includes('WBERA') && sym.includes('IBERA'))
    return 'Origami auto-compounds WBERA/iBERA LP positions. WBERA and iBERA both track native BERA value with minimal price divergence — this is a highly correlated pair with very low impermanent loss risk. Origami automatically harvests trading fees and BGT emissions and re-deposits them, eliminating manual compounding.'

  if (sym.includes('WBERA') && sym.includes('IBGT'))
    return 'Origami auto-compounds WBERA/iBGT LP positions on Infrared. Earns trading fees, BGT emissions, and iBGT\'s native staking yield — all automatically harvested and re-deployed. Both assets are BERA ecosystem tokens with correlated price action, reducing but not eliminating impermanent loss.'

  if (sym.includes('IBERA') && sym.includes('IBGT'))
    return 'Auto-compounding vault for iBERA/iBGT LPs. Both tokens are liquid-staked BERA ecosystem assets with correlated value — IL risk is lower than volatile pairs. Origami handles claim, swap, and re-deposit continuously, so the position compounds without any manual intervention.'

  if (sym.includes('IBERA') && sym.includes('OSBGT'))
    return 'Auto-compounding vault pairing iBERA with osBGT (Origin\'s liquid staked BGT). Both assets are BERA ecosystem derivatives tracking similar underlying value. Origami compounds fees and BGT rewards automatically. Reduced IL risk compared to cross-asset pairs.'

  if ((sym.startsWith('RE7') || sym.includes('RE7')) && sym.includes('HONEY'))
    return 'Bend RE7 is a HONEY lending vault on Bend, Berachain\'s native money market. Lend HONEY (Berachain\'s native stablecoin) to earn base borrow demand yield plus BGT reward emissions distributed to suppliers. No liquidation risk for lenders.'

  if (sym.includes('USDT') || sym.includes('USDT0'))
    return 'Rhea Finance provides lending markets for bridged assets on Berachain. USDT₀ is OFT-standard Tether bridged via LayerZero. Lend here to earn yield from borrower demand. Rates reflect organic borrow pressure for cross-chain liquidity.'

  if (sym.includes('HONEY') && proto === 'termmax')
    return 'Termmax is a fixed-rate lending protocol on Berachain. Lend HONEY at a fixed term for fully predictable yield — no variable rate risk, no surprise APR drops mid-position. Rates are determined by supply and demand at time of deposit.'

  if (sym.includes('HONEY') && proto === 'dolomite')
    return 'Lend HONEY on Dolomite to earn base borrow demand yield plus oDOLO option rewards. oDOLO options are exercisable at a discount to the DOLO token price, adding extra upside beyond the base rate. HONEY is Berachain\'s native overcollateralized stablecoin.'

  if (sym.includes('IBERA') && proto === 'dolomite')
    return 'Deposit iBERA on Dolomite to earn lending yield plus oDOLO rewards. iBERA is Infrared\'s liquid staking token for BERA — its native validator yield is baked into the token\'s value, meaning you earn Berachain staking rewards on top of Dolomite\'s borrow demand rates.'

  if (sym.includes('IBGT') && proto === 'infrared')
    return 'Infrared converts BGT — Berachain\'s non-transferable governance token — into liquid iBGT. Stake here to hold a transferable, yield-bearing representation of BGT while retaining all staking rewards. Infrared\'s validator network optimizes BGT delegation for maximum emission distribution.'

  // ── Protocol-level fallbacks ───────────────────────────────────────────────

  const protoDescriptions = {
    'dolomite': {
      lending:  'Deposit on Dolomite to earn base lending yield plus oDOLO option rewards — exercisable at a discount to the DOLO token price. Dolomite\'s advanced money market supports margin, borrowing, and leveraged strategies alongside standard lending.',
      default:  'Dolomite is an advanced money market on Berachain. Suppliers earn lending rates plus oDOLO rewards while borrowers can use deposited assets as margin collateral.',
    },
    'euler v2': {
      lending:  'Euler v2 is a permissionless lending protocol with modular vault architecture. Each asset pool is isolated — supply here to earn borrow demand yield with risk contained to this specific vault.',
      default:  'Euler v2 lending vault on Berachain. Deposit assets to earn yield from borrower demand. Risk is isolated per vault by Euler\'s modular design.',
    },
    'infrared': {
      staking:  'Infrared is Berachain\'s leading liquid staking protocol, optimizing BGT delegation across its validator network. Stake here to earn protocol rewards with full liquidity — no unbonding periods.',
      default:  'Infrared Finance LP vault. Earns trading fees and BGT emissions from Infrared\'s optimized validator network. Auto-compounding available via Origami.',
    },
    'berachain hub': {
      default: 'Native BERA staking via hub.berachain.com. Earn BGT emissions from Berachain\'s Proof-of-Liquidity mechanism without giving up liquidity.',
    },
    'origami': {
      lp:      'Origami auto-compounding vault. Continuously harvests LP fees and BGT emissions and re-deposits them into the position — no manual claiming needed. Compounds faster than manual strategies.',
      default: 'Origami Finance auto-compounding vault on Berachain. Rewards are automatically harvested and re-invested to maximize long-term returns.',
    },
    'kodiak': {
      lp:      'Kodiak Islands concentrated liquidity pool. Positions earn trading fees from swaps within the configured price range. Concentrated liquidity amplifies fee income versus full-range LPs but requires the price to stay in range.',
      default: 'Kodiak Finance pool on Berachain. Earns trading fees and BGT emissions from concentrated liquidity provision.',
    },
    'woofi': {
      default: 'WooFi Earn single-asset lending vault. Supply assets to WooFi\'s liquidity pool and earn yield from trading activity and lending demand.',
    },
    'brownfi': {
      default: 'Brownfi yield aggregator on Berachain. Deposits are routed to optimized on-chain strategies to maximize returns across the ecosystem.',
    },
    'liquid royalty': {
      default: 'Liquid Royalty structured vault backed by real-world royalty revenue. Yield is derived from merchant revenue targets on SailOut, a cross-border e-commerce platform.',
    },
    'bend': {
      default: 'Bend money market on Berachain. Lend assets to earn interest from borrowers plus BGT reward emissions for liquidity suppliers.',
    },
    'symbiosis': {
      default: 'Symbiosis cross-chain liquidity pool on Berachain. Earns yield from cross-chain swap volume routed through the protocol.',
    },
    'prime vaults': {
      default: 'Prime Vaults yield strategy on Berachain. Generates returns from a curated combination of on-chain yield sources.',
    },
  }

  // Match proto key (case-insensitive substring)
  for (const [key, descs] of Object.entries(protoDescriptions)) {
    if (proto.includes(key)) {
      if (type === 'lending' && descs.lending) return descs.lending
      if (type === 'staking' && descs.staking) return descs.staking
      if (type === 'lp'      && descs.lp)      return descs.lp
      if (descs.default) return descs.default
    }
  }

  return null
}

export function describePool(pool) {
  const curated = lookupDescription(pool)
  if (curated) return curated

  // Generic fallback
  const proto  = pool._protocol || pool.project || 'Unknown'
  const type   = pool._type    || 'Pool'
  const apr    = pool.apy      || 0
  const base   = pool.apyBase  || 0
  const reward = pool.apyReward || 0

  if (type === 'Staking') {
    return `Stake into ${proto}'s liquid staking vault. Earns ${apr.toFixed(2)}% annualized from protocol rewards with no impermanent loss.`
  }
  if (type === 'Lending') {
    const parts = []
    if (base > 0)   parts.push(`${base.toFixed(2)}% base lending rate`)
    if (reward > 0) parts.push(`${reward.toFixed(2)}% BGT rewards`)
    return `Deposit as single-sided collateral on ${proto}. Earns ${parts.join(' + ') || `${apr.toFixed(2)}% APR`}. No impermanent loss.`
  }
  if (type === 'Single-sided') {
    return `Single-asset deposit on ${proto}. Earns ${apr.toFixed(2)}% with no directional risk from paired assets.`
  }
  if (type === 'LP') {
    const parts = []
    if (base > 0)   parts.push(`${base.toFixed(2)}% trading fees`)
    if (reward > 0) parts.push(`${reward.toFixed(2)}% BGT emissions`)
    return `LP position on ${proto}. Earns ${parts.join(' + ') || `${apr.toFixed(2)}% APR`}. Carries impermanent loss risk.`
  }
  return `${proto} pool earning ${apr.toFixed(2)}% APR.`
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(v) {
  if (v == null || isNaN(v)) return '—'
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

function aprStr(v) {
  if (v == null || isNaN(v)) return '—'
  return `${v.toFixed(2)}%`
}

function accentHex(cssVar) {
  const map = {
    'var(--green)':       '#4caf82',
    'oklch(74% 0.18 50)': '#d4853a',
    'oklch(68% 0.14 250)':'#6b8fd4',
    'var(--gold-bright)': '#f5a623',
  }
  return map[cssVar] || '#f5a623'
}

function riskBadge(risk) {
  const colors = {
    Low:    { bg: '#1a2e1a', text: '#4caf82', border: '#2a4a2a' },
    Medium: { bg: '#2a2510', text: '#f5a623', border: '#3a3518' },
    High:   { bg: '#2a1515', text: '#e05252', border: '#3a2020' },
  }
  const c = colors[risk] || colors.Medium
  return `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:${c.bg};color:${c.text};border:1px solid ${c.border}">${risk} Risk</span>`
}

function typeBadge(type) {
  return `<span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;background:#1a1a1a;color:#888;border:1px solid #2a2a2a">${type}</span>`
}

function poolRow(pool, label, accent) {
  if (!pool) return `<div style="padding:18px 20px;color:#555;font-size:13px">No data available</div>`
  const desc = describePool(pool)
  const risk = pool._risk || 'Medium'
  const type = pool._type || 'Pool'
  const apr  = pool.apy   || 0
  const aprColor = apr >= 50 ? '#e05252' : apr >= 20 ? '#f5a623' : apr >= 5 ? '#4caf82' : '#888'

  return `
    <div style="padding:18px 20px;border-bottom:1px solid #1e1e1e">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${accent};background:${accent}22;padding:2px 8px;border-radius:3px">${label}</span>
            ${typeBadge(type)}
            ${riskBadge(risk)}
          </div>
          <div style="margin-bottom:8px">
            <span style="font-size:15px;font-weight:700;color:#f0f0f0;letter-spacing:-0.01em">${pool._protocol || pool.project}</span>
            <span style="color:#555;margin:0 6px">·</span>
            <span style="font-size:13px;color:#888;font-family:monospace">${pool.symbol || ''}</span>
          </div>
          <div style="font-size:12px;color:#777;line-height:1.65;max-width:480px">${desc}</div>
          ${pool._url ? `<div style="margin-top:10px"><a href="${pool._url}" style="font-size:11px;color:${accent};text-decoration:none;opacity:0.8">${pool._url} →</a></div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.04em;color:${aprColor};line-height:1">${aprStr(pool.apy)}</div>
          <div style="font-size:10px;color:#444;margin-top:3px;letter-spacing:0.06em;text-transform:uppercase">APR</div>
          ${pool.tvlUsd != null ? `<div style="font-size:11px;color:#555;margin-top:6px">${fmt(pool.tvlUsd)} TVL</div>` : ''}
        </div>
      </div>
    </div>`
}

function sectionBlock(section) {
  const accent = accentHex(section.accent)
  return `
    <div style="margin-bottom:24px;border:1px solid #1e1e1e;border-radius:4px;overflow:hidden">
      <div style="background:#111;border-bottom:2px solid ${accent};padding:14px 20px;display:flex;align-items:baseline;gap:10px">
        <span style="font-size:16px;font-weight:700;letter-spacing:-0.02em;color:#f0f0f0">${section.label}</span>
        <span style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#555">${section.sublabel}</span>
      </div>
      ${poolRow(section.topYield, 'Best Yield', accent)}
      ${poolRow(section.safest,   'Safest',     accent)}
    </div>`
}

export function generateReport(sections) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

  const body = sections.map(sectionBlock).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BeraYield Report — ${date}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { background: #0d0d0d; color: #c8c8c8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px 20px; }
  @media print {
    body { background: #fff; color: #111; padding: 0; }
    a { color: inherit !important; }
  }
</style>
</head>
<body>
<div style="max-width:700px;margin:0 auto">

  <!-- Header -->
  <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #1e1e1e">
    <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px">
      <span style="font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#f5a623">BeraYield</span>
      <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#555">Yield Report</span>
    </div>
    <div style="font-size:12px;color:#555;margin-bottom:12px">${date} · ${time}</div>
    <div style="font-size:13px;color:#777;line-height:1.6;max-width:560px">
      Top yield opportunity and lowest-risk position for each asset category on Berachain.
      Data sourced live from DeFiLlama and protocol APIs at time of generation.
    </div>
  </div>

  <!-- Sections -->
  ${body}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1e1e1e;font-size:11px;color:#444;line-height:1.8">
    <div>Data from <a href="https://defillama.com" style="color:#666">DeFiLlama</a> and individual protocol APIs · Generated by <a href="https://berayield.pages.dev" style="color:#f5a623">berayield.pages.dev</a></div>
    <div style="margin-top:4px;color:#333">Not financial advice. DeFi protocols carry smart contract, liquidity, and market risk. Always do your own research.</div>
  </div>

</div>
</body>
</html>`
}
