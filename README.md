# TravelPlanner Web UI

A modern, responsive web-based travel planning interface built with React, TypeScript, and Tailwind CSS.

## Features

- **Destination Discovery**: Browse and explore popular travel destinations with ratings and reviews
- **Trip Search**: Find available trips by destination and dates
- **Trip Planning**: Create detailed itineraries with daily activities and schedules
- **Responsive Design**: Mobile-first approach that works on all devices
- **Dark Mode Support**: Full dark mode implementation with Tailwind CSS
- **Modern UI/UX**: Clean, intuitive interface for seamless trip planning

## Tech Stack

- **Frontend Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation header
│   ├── HeroSection.tsx # Landing page hero section
│   ├── SearchPanel.tsx # Trip search interface
│   ├── DestinationGrid.tsx # Featured destinations
│   ├── TripPlanner.tsx # Itinerary creation tool
│   └── Footer.tsx      # Page footer
├── App.tsx             # Main application component
├── main.tsx            # React entry point
└── style.css           # Global styles with Tailwind
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173/`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Features Overview

### Home Page
- Hero banner with call-to-action
- Featured destinations grid
- Quick access to trip search

### Search Trips
- Filter trips by destination, check-in, and check-out dates
- View search results with pricing and availability
- Quick details view for each trip

### Trip Planner
- Create custom itineraries
- Add activities for each day of the trip
- Organize activities by time
- Edit and remove activities as needed

### Navigation
- Responsive header with navigation menu
- Mobile-friendly hamburger menu (can be added)
- Footer with links and information

## Customization

### Adding New Destinations

Edit `src/components/DestinationGrid.tsx`:

```typescript
const destinations = [
  {
    id: 1,
    name: 'City Name, Country',
    image: 'image-url',
    rating: 4.8,
    trips: 1240
  },
  // Add more destinations...
]
```

### Styling

- Colors are defined in `tailwind.config.js`
- Component styles use Tailwind utility classes
- Custom component styles in `src/style.css`

## Future Enhancements

- User authentication and profiles
- Trip sharing and collaboration
- Budget tracking and expense management
- Hotel and flight booking integration
- Weather and local events information
- Trip maps and location services
- User reviews and ratings
- Mobile app version

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue on the GitHub repository.

## Contributors

This project was created as a capstone project for travel planner application.
