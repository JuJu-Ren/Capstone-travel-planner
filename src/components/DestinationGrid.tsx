const destinations = [
  {
    id: 1,
    name: 'Paris, France',
    image: 'https://via.placeholder.com/300x200?text=Paris',
    rating: 4.8,
    trips: 1240
  },
  {
    id: 2,
    name: 'Tokyo, Japan',
    image: 'https://via.placeholder.com/300x200?text=Tokyo',
    rating: 4.9,
    trips: 980
  },
  {
    id: 3,
    name: 'New York, USA',
    image: 'https://via.placeholder.com/300x200?text=NewYork',
    rating: 4.7,
    trips: 1520
  },
  {
    id: 4,
    name: 'Barcelona, Spain',
    image: 'https://via.placeholder.com/300x200?text=Barcelona',
    rating: 4.6,
    trips: 890
  },
  {
    id: 5,
    name: 'Dubai, UAE',
    image: 'https://via.placeholder.com/300x200?text=Dubai',
    rating: 4.5,
    trips: 750
  },
  {
    id: 6,
    name: 'Sydney, Australia',
    image: 'https://via.placeholder.com/300x200?text=Sydney',
    rating: 4.8,
    trips: 650
  }
]

export default function DestinationGrid() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Popular Destinations</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-12">Explore our most loved travel destinations</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map(destination => (
            <div key={destination.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <img 
                src={destination.image} 
                alt={destination.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                  {destination.name}
                </h3>
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>⭐ {destination.rating}</span>
                  <span>{destination.trips} trips</span>
                </div>
                <button className="btn-primary w-full mt-4">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
