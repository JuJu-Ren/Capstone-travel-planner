import { useState, useEffect } from 'react'
import type { RefObject } from 'react'

export interface GoogleProfile { name: string; email: string; picture: string }

function GoogleGIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.29C4.672 5.164 6.656 3.58 9 3.58z" />
    </svg>
  )
}

function BrandIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <g stroke="#2f6fed" strokeWidth="1" strokeLinecap="round">
        <line x1="17.5" y1="1.2" x2="17.5" y2="2.1" />
        <line x1="14" y1="2.5" x2="14.6" y2="3.2" />
        <line x1="21" y1="2.5" x2="20.4" y2="3.2" />
        <line x1="12.7" y1="5.6" x2="13.6" y2="5.6" />
      </g>
      <circle cx="17.5" cy="5.6" r="2.3" fill="#bcdcfc" stroke="#2f6fed" strokeWidth="1" />
      <path d="M14.6 10.4a2.6 2.6 0 0 1 5-1.1 2.2 2.2 0 0 1 1.9 2.3 2.2 2.2 0 0 1-2.2 2.1h-4.3a2 2 0 0 1-.4-3.9z" fill="none" stroke="#2f6fed" strokeWidth="1" strokeLinejoin="round" />
      <path d="M2 9.7C2 6.1 4.8 3.3 8.2 3.3s6.2 2.8 6.2 6.4c-1.3-1-2.8-1-4.1 0-1.4-1-2.9-1-4.2 0-1.4-1-2.9-1-4.1 0z" fill="#8ec2f2" stroke="#2f6fed" strokeWidth="1" strokeLinejoin="round" />
      <line x1="8.2" y1="9.7" x2="7" y2="18.2" stroke="#2f6fed" strokeWidth="1" />
      <path d="M1 16.6c1.6 1.6 3.3 1.6 4.9 0 3-2.8 6.3-2.8 8.9 0v5.1H1z" fill="#bcdcfc" stroke="#2f6fed" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}

interface HeaderProps {
  onNavigate: () => void
  googleUser: GoogleProfile | null
  hasGoogleAuth: boolean
  signInContainerRef: RefObject<HTMLDivElement | null>
  onSignOut: () => void
  savedPlacesCount: number
  onOpenSavedPlaces: () => void
  showRoutesToggle?: boolean
  routesOn?: boolean
  onToggleRoutes?: () => void
}

export default function Header({ onNavigate, googleUser, hasGoogleAuth, signInContainerRef, onSignOut, savedPlacesCount, onOpenSavedPlaces, showRoutesToggle, routesOn, onToggleRoutes }: HeaderProps) {
  const [showAbout, setShowAbout] = useState(false)
  const [pendingOpenSaved, setPendingOpenSaved] = useState(false)

  // Saved places only opens once signed in — if not, trigger sign-in and remember
  // to open it as soon as that completes.
  useEffect(() => {
    if (googleUser && pendingOpenSaved) {
      onOpenSavedPlaces()
      setPendingOpenSaved(false)
    }
  }, [googleUser, pendingOpenSaved, onOpenSavedPlaces])

  const handleSavedClick = () => {
    if (googleUser) { onOpenSavedPlaces(); return }
    setPendingOpenSaved(true)
    const realButton = signInContainerRef.current?.querySelector<HTMLElement>('[role="button"]')
    realButton?.click()
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 h-16 flex-shrink-0">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={onNavigate} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandIcon className="w-8 h-8 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Long Weekend Planner</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">US Train Travel Planner</p>
            </div>
          </button>
          <button
            onClick={() => setShowAbout(true)}
            title="What is this?"
            aria-label="What is this?"
            className="w-5 h-5 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#4a90f5" />
              <circle cx="12" cy="12" r="9.2" fill="none" stroke="#fff" strokeWidth="1.6" />
              <circle cx="12" cy="8.3" r="1.7" fill="#fff" />
              <rect x="10.5" y="11" width="3" height="6.6" rx="0.4" fill="#fff" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSavedClick}
            title={googleUser ? 'Saved places' : 'Sign in to view your saved places'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#e0b81e" />
              <path d="M16 6.5H8a1 1 0 0 0-1 1V18l5-3.8 5 3.8V7.5a1 1 0 0 0-1-1z" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            Saved{savedPlacesCount > 0 ? ` (${savedPlacesCount})` : ''}
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Amtrak · NJ Transit · PATH · Subway</span>
          </div>

          {showRoutesToggle && (
            <button
              onClick={onToggleRoutes}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              🚂 Routes {routesOn ? 'On' : 'Off'}
            </button>
          )}

          {googleUser ? (
            <div className="flex items-center gap-2">
              <img src={googleUser.picture} alt={googleUser.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{googleUser.name.split(' ')[0]}</span>
              <button onClick={onSignOut} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Sign out</button>
            </div>
          ) : hasGoogleAuth ? (
            <>
              {/* Real Google button kept off-screen — clicking our own grey-pill
                  button (matching the rest of the header) triggers it programmatically
                  so we can style sign-in consistently instead of using Google's own
                  on-page button chrome. */}
              <div ref={signInContainerRef} style={{ position: 'fixed', top: -9999, left: -9999 }} aria-hidden="true" />
              <button
                onClick={() => signInContainerRef.current?.querySelector<HTMLElement>('[role="button"]')?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <GoogleGIcon className="w-4 h-4 flex-shrink-0" />
                Sign in with Google
              </button>
            </>
          ) : (
            <button
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed"
              disabled
              title="Add VITE_GOOGLE_CLIENT_ID to .env to enable Google Sign-In"
            >Sign In</button>
          )}
        </div>
      </div>

      {showAbout && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAbout(false)}
              aria-label="Close"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >✕</button>
            <div className="flex items-center gap-2 mb-3">
              <BrandIcon className="w-8 h-8 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Long Weekend Planner</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Long Weekend Planner helps you put together a quick getaway to any US train-accessible city — or anywhere else you search. Pick a destination and tell us what you're into, and we'll pull together curated places to eat, shop, and explore, real weather forecasts, local events, and an AI-generated itinerary built around your interests — all on one page, no bookings required.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="btn-primary text-sm px-4 py-2 mt-5 w-full"
            >Got it</button>
          </div>
        </div>
      )}
    </header>
  )
}
