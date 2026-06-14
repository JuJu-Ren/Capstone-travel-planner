interface HeaderProps {
  onNavigate: (page: 'home' | 'search' | 'planner') => void
}

export default function Header({ onNavigate }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">TravelPlanner</h1>
        </div>
        
        <nav className="hidden md:flex gap-6">
          <button 
            onClick={() => onNavigate('home')}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('search')}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
          >
            Search Trips
          </button>
          <button 
            onClick={() => onNavigate('planner')}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
          >
            Plan Trip
          </button>
        </nav>

        <button className="btn-primary hidden sm:block">Sign In</button>
      </div>
    </header>
  )
}
