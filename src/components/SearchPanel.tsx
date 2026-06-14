import { useState } from 'react'

interface SearchPanelProps {
  onSearch: (destination: string, dates: { start: string; end: string }, home?: string, budget?: number, duration?: number) => void
}

export default function SearchPanel({ onSearch }: SearchPanelProps) {
  const [mode, setMode] = useState<'discover' | 'plan'>('discover')
  
  // Discover Mode
  const [homeDiscover, setHomeDiscover] = useState('')
  const [startDateDiscover, setStartDateDiscover] = useState('')
  const [endDateDiscover, setEndDateDiscover] = useState('')
  const [budgetDiscover, setBudgetDiscover] = useState('')
  const [transportDiscover, setTransportDiscover] = useState<'public' | 'private'>('public')
  
  // Plan Mode
  const [homePlan, setHomePlan] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budgetPlan, setBudgetPlan] = useState('')
  const [transportPlan, setTransportPlan] = useState<'public' | 'private'>('public')

  const handleDiscoverSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (homeDiscover) {
      // Logic for discovering destinations based on home location
      alert(`Searching for best destinations from ${homeDiscover}${budgetDiscover ? ` with budget $${budgetDiscover}` : ''}...`)
    }
  }

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (destination && startDate && endDate) {
      onSearch(
        destination, 
        { start: startDate, end: endDate },
        homePlan || undefined,
        budgetPlan ? parseFloat(budgetPlan) : undefined
      )
    }
  }

  return (
    <section className="bg-gray-100 dark:bg-gray-800 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Start Your Journey</h2>
        
        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setMode('discover')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === 'discover'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-2 border-blue-500'
            }`}
          >
            🌍 Discover Best Destinations
          </button>
          <button
            onClick={() => setMode('plan')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === 'plan'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-2 border-blue-500'
            }`}
          >
            ✈️ Plan Your Trip
          </button>
        </div>

        {/* Discover Mode */}
        {mode === 'discover' && (
          <form onSubmit={handleDiscoverSubmit} className="card shadow-lg max-w-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              🌍 Find Your Perfect Destination
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tell us where you're from, your travel dates, budget, and preferred transport to get personalized recommendations!
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🏠 Your Home Location *
                </label>
                <input 
                  type="text"
                  value={homeDiscover}
                  onChange={(e) => setHomeDiscover(e.target.value)}
                  placeholder="e.g., New York, Los Angeles"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    📅 Start Date *
                  </label>
                  <input 
                    type="date"
                    value={startDateDiscover}
                    onChange={(e) => setStartDateDiscover(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    📅 End Date *
                  </label>
                  <input 
                    type="date"
                    value={endDateDiscover}
                    onChange={(e) => setEndDateDiscover(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  💰 Budget (USD) - Optional
                </label>
                <input 
                  type="number"
                  value={budgetDiscover}
                  onChange={(e) => setBudgetDiscover(e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🚗 Transport Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio"
                      value="public"
                      checked={transportDiscover === 'public'}
                      onChange={(e) => setTransportDiscover(e.target.value as 'public' | 'private')}
                      className="mr-2 w-4 h-4"
                      required
                    />
                    <span className="text-gray-700 dark:text-gray-300">🚌 Public Transport</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio"
                      value="private"
                      checked={transportDiscover === 'private'}
                      onChange={(e) => setTransportDiscover(e.target.value as 'public' | 'private')}
                      className="mr-2 w-4 h-4"
                      required
                    />
                    <span className="text-gray-700 dark:text-gray-300">🚗 Private Transport</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <span className="font-semibold">Tip:</span> We'll analyze weather, attractions, budget-friendliness, transport accessibility, and more to find your ideal destination!
                </p>
              </div>

              <button 
                type="submit"
                className="btn-primary w-full py-3 text-lg"
              >
                🔍 Find Best Destinations
              </button>
            </div>
          </form>
        )}

        {/* Plan Mode */}
        {mode === 'plan' && (
          <form onSubmit={handlePlanSubmit} className="card shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              ✈️ Plan Your Trip Details
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a detailed itinerary for your trip with specific dates and activities.
            </p>

            {/* First Row: Home and Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🏠 Home Location *
                </label>
                <input 
                  type="text"
                  value={homePlan}
                  onChange={(e) => setHomePlan(e.target.value)}
                  placeholder="Where are you from?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🌎 Destination *
                </label>
                <input 
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Second Row: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  📅 Check-in Date *
                </label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  📅 Check-out Date *
                </label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  💰 Budget (USD) - Optional
                </label>
                <input 
                  type="number"
                  value={budgetPlan}
                  onChange={(e) => setBudgetPlan(e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Transport Type */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  🚗 Transport Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio"
                      value="public"
                      checked={transportPlan === 'public'}
                      onChange={(e) => setTransportPlan(e.target.value as 'public' | 'private')}
                      className="mr-2 w-4 h-4"
                      required
                    />
                    <span className="text-gray-700 dark:text-gray-300">🚌 Public Transport</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio"
                      value="private"
                      checked={transportPlan === 'private'}
                      onChange={(e) => setTransportPlan(e.target.value as 'public' | 'private')}
                      className="mr-2 w-4 h-4"
                      required
                    />
                    <span className="text-gray-700 dark:text-gray-300">🚗 Private Transport</span>
                  </label>
                </div>
              </div>
            </div>
            {(homePlan || destination || budgetPlan) && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="font-semibold">Trip Summary:</span>{' '}
                  {homePlan && `From ${homePlan}`}
                  {homePlan && destination && ' to '}
                  {destination && `${destination}`}
                  {startDate && endDate && ` • ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
                  {budgetPlan && ` • $${parseFloat(budgetPlan).toLocaleString()}`}                  {transportPlan && ` • ${transportPlan === 'public' ? '🚌 Public' : '🚗 Private'}`}                </p>
              </div>
            )}

            <button 
              type="submit"
              className="btn-primary w-full py-3 text-lg"
            >
              📝 Create Your Itinerary
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
