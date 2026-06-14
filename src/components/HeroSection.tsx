interface HeroSectionProps {
  onSearchClick: () => void
}

export default function HeroSection({ onSearchClick }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Next Adventure</h2>
        <p className="text-xl mb-8 opacity-90">Plan, book, and explore amazing destinations around the world</p>
        <button 
          onClick={onSearchClick}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Start Exploring
        </button>
      </div>
    </section>
  )
}
