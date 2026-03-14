import { useState, useEffect } from 'react'

const CACHE_KEY = 'berayield_kodiak_v1'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

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

async function fetchKodiakVaults() {
  const res = await fetch('https://backend.kodiak.finance/vaults?limit=500')
  const json = await res.json()
  const vaults = Array.isArray(json) ? json : (json.vaults ?? json.data ?? [])

  // Kodiak returns APR values already as percentages (e.g. 5.807 = 5.807%)
  // apyBase   = vault.apr      — trading fee APR from swap volume
  // apyReward = vault.farm.apr — BGT reward APR from the PoL reward vault
  const byVaultId = {}
  for (const v of vaults) {
    const key = (v.id || '').toLowerCase()
    byVaultId[key] = {
      apyBase:   v.apr          ?? 0,
      apyReward: v.farm?.apr    ?? null,
    }
  }
  return byVaultId
}

// Returns a map of vaultId/islandAddress (lowercase) → { apyBase, apyReward }
// Match against underlyingTokens[0] from DeFiLlama berapaw KODI* pools.
export function useKodiakVaults() {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(() => readCache() === null)

  useEffect(() => {
    const cached = readCache()
    if (cached) { setData(cached); setLoading(false); return }

    let cancelled = false
    fetchKodiakVaults()
      .then(d => { if (!cancelled) { writeCache(d); setData(d) } })
      .catch(err => console.error('[useKodiakVaults] fetch failed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
