import { useState, useEffect } from 'react'

const cache = {}
const CACHE_TTL = 5 * 60 * 1000

function useFetch(key, url, transform) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const now = Date.now()
    if (cache[key] && now - cache[key].ts < CACHE_TTL) {
      setData(cache[key].data)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        const result = transform ? transform(json) : json
        cache[key] = { data: result, ts: Date.now() }
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [key])

  return { data, loading, error }
}

export function useChainTVL() {
  return useFetch(
    'berachain-tvl',
    'https://api.llama.fi/v2/chains',
    (chains) => chains.find(c => c.name === 'Berachain') || null
  )
}

export function useBerachainPools() {
  return useFetch(
    'berachain-pools',
    'https://yields.llama.fi/pools',
    (json) => {
      const pools = (json.data || []).filter(p => p.chain === 'Berachain')
      return pools
        .filter(p => p.tvlUsd > 0)
        .sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
    }
  )
}

export function useBerachainProtocols() {
  return useFetch(
    'berachain-protocols',
    'https://api.llama.fi/protocols',
    (protocols) =>
      protocols
        .filter(p => Array.isArray(p.chains) && p.chains.includes('Berachain'))
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
  )
}
