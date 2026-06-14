import { useState } from 'react'

interface Activity {
  id: string
  day: number
  title: string
  description: string
  time: string
}

export default function TripPlanner() {
  const [tripName, setTripName] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [newActivity, setNewActivity] = useState({ day: 1, title: '', time: '09:00' })

  const addActivity = () => {
    if (newActivity.title) {
      setActivities([
        ...activities,
        {
          id: Date.now().toString(),
          ...newActivity,
          description: ''
        }
      ])
      setNewActivity({ day: 1, title: '', time: '09:00' })
    }
  }

  const removeActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id))
  }

  const groupedActivities = Array.from({ length: 7 }).map((_, i) => ({
    day: i + 1,
    activities: activities.filter(a => a.day === i + 1)
  }))

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Create Your Trip</h2>

        {/* Trip Info */}
        <div className="card mb-8">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Trip Name
            </label>
            <input 
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g., Summer Vacation 2024"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Add Activity */}
        <div className="card mb-8">
          <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Add Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Day
              </label>
              <select 
                value={newActivity.day}
                onChange={(e) => setNewActivity({ ...newActivity, day: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Activity
              </label>
              <input 
                type="text"
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                placeholder="Activity name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Time
              </label>
              <input 
                type="time"
                value={newActivity.time}
                onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button 
                onClick={addActivity}
                className="btn-primary w-full"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="space-y-6">
          {groupedActivities.map(({ day, activities: dayActivities }) => (
            <div key={day} className="card">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">
                📅 Day {day}
              </h3>
              {dayActivities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No activities planned</p>
              ) : (
                <div className="space-y-3">
                  {dayActivities.map(activity => (
                    <div key={activity.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{activity.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">⏰ {activity.time}</p>
                      </div>
                      <button 
                        onClick={() => removeActivity(activity.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn-primary w-full mt-8">Save Trip</button>
      </div>
    </div>
  )
}
