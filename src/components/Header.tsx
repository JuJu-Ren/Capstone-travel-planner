interface HeaderProps {
  onNavigate: () => void
}

export default function Header({ onNavigate }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 h-16 flex-shrink-0">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <button onClick={onNavigate} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🚂</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">RailTrip</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">US Train Travel Planner</p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">Amtrak · NJ Transit · PATH · Subway</span>
          </div>
          <button className="btn-primary text-sm px-4 py-2">Sign In</button>
        </div>
      </div>
    </header>
  )
}
