import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, MapPin, Spinner } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { findTimezoneByCoordinates, formatTimezoneDisplay } from '@/lib/timezone-db'

interface LocationResult {
  name: string
  displayName: string
  latitude: number
  longitude: number
  country: string
}

interface LocationSearchProps {
  value: string
  onLocationSelect: (location: {
    name: string
    latitude: number
    longitude: number
    timezone: string
  }) => void
  className?: string
}

export function LocationSearch({ value, onLocationSelect, className }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchLocations = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([])
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&limit=5` +
        `&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PsychicLinkCharts/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to search locations')
      }

      const data = await response.json()

      const locationResults: LocationResult[] = data.map((item: any) => {
        const cityName = item.address.city || 
                        item.address.town || 
                        item.address.village || 
                        item.address.municipality ||
                        item.address.county ||
                        item.name

        const country = item.address.country || ''
        const state = item.address.state || ''
        
        let displayParts = [cityName]
        if (state && state !== cityName) {
          displayParts.push(state)
        }
        if (country) {
          displayParts.push(country)
        }

        return {
          name: `${cityName}, ${country}`,
          displayName: displayParts.join(', '),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          country: country
        }
      })

      setResults(locationResults)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching locations:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const getTimezoneFromCoordinates = (latitude: number, longitude: number): string => {
    return findTimezoneByCoordinates(latitude, longitude)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(query)
    }, 500)
  }

  const handleSelectLocation = (location: LocationResult) => {
    setSearchQuery(location.displayName)
    setShowResults(false)
    setResults([])

    const timezone = getTimezoneFromCoordinates(location.latitude, location.longitude)

    onLocationSelect({
      name: location.displayName,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone
    })
  }

  const handleSearch = () => {
    searchLocations(searchQuery)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (results.length > 0) {
                setShowResults(true)
              }
            }}
            placeholder="Search for city, town, or place..."
            className="pr-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner className="animate-spin text-muted-foreground" size={16} />
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching || searchQuery.length < 3}
        >
          <MagnifyingGlass size={18} weight="bold" />
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((location, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectLocation(location)}
              className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-start gap-3 border-b border-border/50 last:border-b-0"
            >
              <MapPin size={18} weight="fill" className="text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {location.displayName}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && searchQuery.length >= 3 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No locations found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  )
}
