import { useState, useEffect } from 'react'
import Header from './components/Header'
import OpportunityFeed from './components/OpportunityFeed'
import FeaturedOpportunities from './components/FeaturedOpportunities'
import Footer from './components/Footer'

function isReportPath() {
  return window.location.pathname === '/report'
}

export default function App() {
  const [showReport, setShowReport] = useState(isReportPath)

  // Sync state with browser back/forward navigation
  useEffect(() => {
    const onPop = () => setShowReport(isReportPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function toggleReport() {
    setShowReport(v => {
      const next = !v
      window.history.pushState(null, '', next ? '/report' : '/')
      return next
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      {!showReport && <FeaturedOpportunities />}
      <OpportunityFeed
        showReport={showReport}
        onToggleReport={toggleReport}
      />
      {!showReport && <div style={{ flex: 1 }} />}
      <Footer />
    </div>
  )
}
