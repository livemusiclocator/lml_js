import { useEffect, useState } from 'react'
import axios from 'axios'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'
import './App.css'

interface Price {
  amount: string
  description: string
}

interface VenueData {
  id: string
  name: string
  address: string
  capacity: number
  website: string
  postcode: string
  vibe: string
  tags: string[]
  location_url: string
  latitude: number
  longitude: number
}

interface Gig {
  id: string
  name: string
  date: string
  ticketing_url: string
  start_time: string
  start_timestamp: string
  duration: string | null
  finish_time: string | null
  finish_timestamp: string | null
  description: string | null
  status: string
  ticket_status: string | null
  series: string | null
  category: string | null
  information_tags: string[]
  genre_tags: string[]
  venue: VenueData
  sets: any[]
  prices: Price[]
}

interface Venue {
  id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  gigCount: number
  website: string
}

const containerStyle = {
  width: '100%',
  height: '100vh'
}

const center = {
  lat: -37.8136,
  lng: 144.9631 // Melbourne center coordinates
}

function App() {
  // We're storing gigs data only to process it into venues and venueGigs
  const [venues, setVenues] = useState<Venue[]>([])
  const [venueGigs, setVenueGigs] = useState<{[venueId: string]: Gig[]}>({})
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string
  })

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true)
        setSelectedVenue(null)
        
        const dateString = formatDate(selectedDate)
        const response = await axios.get(`https://api.lml.live/gigs/for/melbourne/${dateString}`)
        const gigsData = response.data
        
        // Process venues and organize gigs by venue
        const venueMap = new Map<string, Venue>()
        const venueGigsMap: {[venueId: string]: Gig[]} = {}
        
        gigsData.forEach((gig: Gig) => {
          const venueId = gig.venue.id
          
          // Add gig to venue's gig list
          if (!venueGigsMap[venueId]) {
            venueGigsMap[venueId] = []
          }
          venueGigsMap[venueId].push(gig)
          
          // Create or update venue
          if (!venueMap.has(venueId)) {
            venueMap.set(venueId, {
              id: gig.venue.id,
              name: gig.venue.name,
              address: gig.venue.address,
              location: {
                lat: gig.venue.latitude,
                lng: gig.venue.longitude
              },
              website: gig.venue.website,
              gigCount: 1
            })
          } else {
            const venue = venueMap.get(venueId)!
            venue.gigCount += 1
          }
        })
        
        setVenues(Array.from(venueMap.values()))
        setVenueGigs(venueGigsMap)
        setLoading(false)
      } catch (err) {
        setError('Failed to fetch gigs data')
        setLoading(false)
        console.error(err)
      }
    }

    fetchGigs()
  }, [selectedDate])

  const handleVenueMarkerClick = (venue: Venue) => {
    setSelectedVenue(venue)
  }
  
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value)
    setSelectedDate(newDate)
  }
  
  const goToToday = () => {
    setSelectedDate(new Date())
  }
  
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate)
    prevDay.setDate(prevDay.getDate() - 1)
    setSelectedDate(prevDay)
  }
  
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setSelectedDate(nextDay)
  }

  if (!isLoaded) return <div>Loading Maps...</div>
  if (loading) return <div>Loading gigs data...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="app-container">
      <header>
        <h1>Live Music Locator</h1>
        <p>Melbourne Gigs | {selectedDate.toLocaleDateString()}</p>
        
        <div className="date-controls">
          <button onClick={goToPreviousDay} className="date-nav-button">
            &laquo; Prev Day
          </button>
          <button onClick={goToToday} className="date-nav-button today-button">
            Today
          </button>
          <input 
            type="date" 
            value={formatDate(selectedDate)} 
            onChange={handleDateChange}
            className="date-picker"
          />
          <button onClick={goToNextDay} className="date-nav-button">
            Next Day &raquo;
          </button>
        </div>
      </header>
      
      <div className="map-container">
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-icon venue-icon"></div>
            <span>Venue</span>
          </div>
          <div className="legend-info">
            Larger pins = More gigs
          </div>
        </div>
        
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
        >
          {/* Venue markers */}
          {venues.map((venue) => (
            <MarkerF
              key={`venue-${venue.id}`}
              position={venue.location}
              onClick={() => handleVenueMarkerClick(venue)}
              icon={{
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1 1 10,-30 C 10,-22 2,-20 0,0 Z",
                fillColor: '#FF5722',
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: venue.gigCount > 1 ? 1.0 + Math.min(venue.gigCount, 5) * 0.15 : 1.0
              }}
              label={{
                text: venue.gigCount > 1 ? venue.gigCount.toString() : '',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {selectedVenue && (
        <div className="venue-details-panel">
          <div className="venue-header">
            <h2>{selectedVenue.name}</h2>
            <p className="venue-info">
              <span className="venue-address">{selectedVenue.address}</span>
              {selectedVenue.website && (
                <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer" className="venue-website">
                  Visit Website
                </a>
              )}
            </p>
            <p className="gig-count">{selectedVenue.gigCount} gig{selectedVenue.gigCount !== 1 ? 's' : ''} on {selectedDate.toLocaleDateString()}</p>
          </div>
          
          <div className="gigs-list">
            {venueGigs[selectedVenue.id]?.map((gig) => (
              <div key={gig.id} className="gig-item">
                <h3 className="gig-title">{gig.name}</h3>
                <div className="gig-time">
                  <span>{gig.start_time}</span>
                  {gig.finish_time && <span> - {gig.finish_time}</span>}
                </div>
                
                {gig.description && <p className="gig-description">{gig.description}</p>}
                
                {gig.genre_tags.length > 0 && (
                  <div className="gig-genres">
                    {gig.genre_tags.map((genre, index) => (
                      <span key={index} className="genre-tag">{genre}</span>
                    ))}
                  </div>
                )}
                
                {gig.prices.length > 0 && (
                  <p className="gig-price">Price: {gig.prices[0].amount}</p>
                )}
                
                <a href={gig.ticketing_url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="ticket-link">
                  Get Tickets
                </a>
              </div>
            ))}
          </div>
          
          <button onClick={() => setSelectedVenue(null)} className="close-button">Close</button>
        </div>
      )}
    </div>
  )
}

export default App