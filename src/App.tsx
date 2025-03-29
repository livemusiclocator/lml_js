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
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [venueGigs, setVenueGigs] = useState<{[venueId: string]: Gig[]}>({})
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [availableInfoTags, setAvailableInfoTags] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedInfoTags, setSelectedInfoTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showHeader, setShowHeader] = useState(true)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string
  })

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Filter venues based on selected genres and info tags
  useEffect(() => {
    if (selectedGenres.length === 0 && selectedInfoTags.length === 0) {
      setVenues(allVenues)
      return
    }

    const filteredVenues = allVenues.filter(venue => {
      const venueGigsList = venueGigs[venue.id] || []
      
      // Check if any gig in this venue matches the selected filters
      return venueGigsList.some(gig => {
        // For genres, check if any of the selected genres match the gig's genres (case insensitive)
        const genreMatch = selectedGenres.length === 0 || 
          gig.genre_tags.some(genre => 
            selectedGenres.includes(genre.toLowerCase())
          )
        
        // For info tags, check if any of the selected info tags match the gig's info tags (case insensitive)
        const infoMatch = selectedInfoTags.length === 0 || 
          gig.information_tags.some(tag => 
            selectedInfoTags.includes(tag.toLowerCase())
          )
        
        return genreMatch && infoMatch
      })
    })

    setVenues(filteredVenues)
  }, [selectedGenres, selectedInfoTags, allVenues, venueGigs])

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true)
        setSelectedVenue(null)
        setSelectedGenres([])
        setSelectedInfoTags([])
        
        const dateString = formatDate(selectedDate)
        const response = await axios.get(`https://api.lml.live/gigs/for/melbourne/${dateString}`)
        const gigsData = response.data
        
        // Process venues and organize gigs by venue
        const venueMap = new Map<string, Venue>()
        const venueGigsMap: {[venueId: string]: Gig[]} = {}
        
        // Collect all unique genres and info tags
        const genresSet = new Set<string>()
        const infoTagsSet = new Set<string>()
        
        gigsData.forEach((gig: Gig) => {
          const venueId = gig.venue.id
          
          // Add gig to venue's gig list
          if (!venueGigsMap[venueId]) {
            venueGigsMap[venueId] = []
          }
          venueGigsMap[venueId].push(gig)
          
          // Collect genres and info tags (convert to lowercase)
          gig.genre_tags.forEach(genre => genresSet.add(genre.toLowerCase()))
          gig.information_tags.forEach(tag => infoTagsSet.add(tag.toLowerCase()))
          
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
        
        const processedVenues = Array.from(venueMap.values())
        setAllVenues(processedVenues)
        setVenues(processedVenues)
        setVenueGigs(venueGigsMap)
        setAvailableGenres(Array.from(genresSet).sort())
        setAvailableInfoTags(Array.from(infoTagsSet).sort())
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
  
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }
  
  const toggleHeader = () => {
    setShowHeader(!showHeader)
  }
  
  const toggleGenre = (genre: string) => {
    // We're already working with lowercase genres from the available list
    setSelectedGenres(prevSelected => 
      prevSelected.includes(genre)
        ? prevSelected.filter(g => g !== genre)
        : [...prevSelected, genre]
    )
  }
  
  const toggleInfoTag = (tag: string) => {
    // We're already working with lowercase tags from the available list
    setSelectedInfoTags(prevSelected => 
      prevSelected.includes(tag)
        ? prevSelected.filter(t => t !== tag)
        : [...prevSelected, tag]
    )
  }
  
  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedInfoTags([])
  }

  if (!isLoaded) return <div>Loading Maps...</div>
  if (loading) return <div>Loading gigs data...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="app-container">
      <button 
        onClick={toggleHeader} 
        className="header-toggle-button"
        aria-expanded={showHeader}
        aria-controls="header-content"
      >
        {showHeader ? 'Hide Controls' : 'Show Controls'}
        {(selectedGenres.length > 0 || selectedInfoTags.length > 0) && 
          <span className="filter-indicator-dot"></span>
        }
      </button>
      
      <header className={showHeader ? 'show' : 'hide'} id="header-content">
        <div className="header-main">
          <h1>Live Music Locator</h1>
          <p>Melbourne Gigs | {selectedDate.toLocaleDateString()}</p>
        </div>
        
        <div className="header-controls">
          <div className="date-controls">
            <button onClick={goToPreviousDay} className="date-nav-button">
              &laquo; Prev
            </button>
            <button onClick={goToToday} className="date-nav-button today-button">
              Today
            </button>
            <input 
              type="date" 
              value={formatDate(selectedDate)} 
              onChange={handleDateChange}
              className="date-picker"
              aria-label="Select date"
              id="date-selector"
            />
            <button onClick={goToNextDay} className="date-nav-button">
              Next &raquo;
            </button>
          </div>
        </div>
        
        <div className="filter-section">
          <button 
            onClick={toggleFilters} 
            className={`filter-toggle-button ${showFilters ? 'active' : ''}`}
            aria-expanded={showFilters}
            aria-controls="filters-panel"
          >
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            {(selectedGenres.length > 0 || selectedInfoTags.length > 0) && 
              <span className="filter-count">
                {selectedGenres.length + selectedInfoTags.length}
              </span>
            }
          </button>
          
          <div id="filters-panel" className={`filters-container ${showFilters ? 'show' : 'hide'}`}>
            {(availableGenres.length > 0 || availableInfoTags.length > 0) && (
              <button 
                onClick={clearFilters}
                className="clear-filters-button"
                disabled={selectedGenres.length === 0 && selectedInfoTags.length === 0}
              >
                Clear All Filters
              </button>
            )}
              
              {availableGenres.length > 0 && (
                <div className="filter-group">
                  <h3>Music Genres</h3>
                  <div className="filter-tags">
                    {availableGenres.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`filter-tag ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {availableInfoTags.length > 0 && (
                <div className="filter-group">
                  <h3>Event Info</h3>
                  <div className="filter-tags">
                    {availableInfoTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleInfoTag(tag)}
                        className={`filter-tag info-tag ${selectedInfoTags.includes(tag) ? 'selected' : ''}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      </header>
      
      <div className="map-container">
        
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
          <button 
            onClick={() => setSelectedVenue(null)} 
            className="close-panel-button" 
            aria-label="Close venue details"
          >
            &times;
          </button>
          
          <div className="venue-header">
            <div className="venue-title">
              <h2>{selectedVenue.name}</h2>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.location.lat},${selectedVenue.location.lng}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="directions-button"
              >
                <span className="directions-icon">📍</span> Directions
              </a>
            </div>
            <p className="venue-info">
              <span className="venue-address">{selectedVenue.address}</span>
              <div className="venue-links">
                {selectedVenue.website && (
                  <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer" className="venue-website">
                    Visit Website
                  </a>
                )}
              </div>
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
        </div>
      )}
    </div>
  )
}

export default App