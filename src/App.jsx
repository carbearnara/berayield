import Header from './components/Header'
import OpportunityFeed from './components/OpportunityFeed'
import Footer from './components/Footer'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <OpportunityFeed />
      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  )
}
