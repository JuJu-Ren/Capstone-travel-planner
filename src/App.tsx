import { useState } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import SearchPanel from './components/SearchPanel'
import DestinationGrid from './components/DestinationGrid'
import TripPlanner from './components/TripPlanner'
import Footer from './components/Footer'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'planner'>('home')
  const [searchResults, setSearchResults] = useState([])

  const handleSearch = (destination: string, dates: { start: string; end: string }) => {
    // Simulate search results
    const mockResults = [
      {
        id: 1,
        name: `Trip to ${destination}`,
        duration: `${Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 60 * 60 * 24))} days`,
        price: Math.floor(Math.random() * 3000) + 500,
        image: 'https://via.placeholder.com/300x200?text=' + destination
      }
    ]
    setSearchResults(mockResults)
    setCurrentPage('search')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header onNavigate={setCurrentPage} />
      
      <main className="flex-1">
        {currentPage === 'home' && (
          <>
            <HeroSection onSearchClick={() => setCurrentPage('search')} />
            <DestinationGrid />
          </>
        )}
        
        {currentPage === 'search' && (
          <>
            <SearchPanel onSearch={handleSearch} />
            {searchResults.length > 0 && (
              <div className="container mx-auto px-4 py-12">
                <h2 className="text-3xl font-bold mb-8">Available Trips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map(trip => (
                    <div key={trip.id} className="card hover:shadow-lg transition-shadow">
                      <img src={trip.image} alt={trip.name} className="w-full h-48 object-cover rounded-t-lg" />
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{trip.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{trip.duration}</p>
                        <p className="text-2xl font-bold text-blue-500">${trip.price}</p>
                        <button className="btn-primary w-full mt-4">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {currentPage === 'planner' && <TripPlanner />}
      </main>

      <Footer />
    </div>
  )
}

export default App
