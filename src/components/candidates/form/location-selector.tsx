'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  COUNTRIES,
  getCitiesForCountry,
  detectRegion,
} from '@/lib/data/locations'
import { Globe, MapPin, Map } from 'lucide-react'

interface LocationSelectorProps {
  country?: string
  city?: string
  region?: string
  onCountryChange: (country: string) => void
  onCityChange: (city: string) => void
  onRegionChange: (region: string) => void
  disabled?: boolean
}

/**
 * LocationSelector component
 * Cascading country → city → region selector with auto-detection
 */
export function LocationSelector({
  country,
  city,
  region,
  onCountryChange,
  onCityChange,
  onRegionChange,
  disabled,
}: LocationSelectorProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // Update cities when country changes
  useEffect(() => {
    if (country) {
      const cities = getCitiesForCountry(country)
      setAvailableCities(cities)

      // Clear city if not in new list
      if (city && !cities.includes(city)) {
        onCityChange('')
        onRegionChange('')
      }
    } else {
      setAvailableCities([])
    }
  }, [country])

  // Auto-detect region when city changes
  useEffect(() => {
    if (country && city) {
      const detectedRegion = detectRegion(city, country)
      if (detectedRegion) {
        onRegionChange(detectedRegion)
      }
    }
  }, [city, country])

  const handleCountryChange = (value: string) => {
    onCountryChange(value)
    onCityChange('')
    onRegionChange('')
  }

  const handleCityChange = (value: string) => {
    onCityChange(value)
  }

  return (
    <div className="space-y-4">
      {/* Country */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Pays
        </Label>
        <Select
          value={country || ''}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un pays..." />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      {country && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ville
          </Label>
          {availableCities.length > 0 ? (
            <Select
              value={city || ''}
              onValueChange={handleCityChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une ville..." />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((cityName) => (
                  <SelectItem key={cityName} value={cityName}>
                    {cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune ville disponible pour ce pays
            </p>
          )}
        </div>
      )}

      {/* Region (auto-filled) */}
      {region && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Région
          </Label>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
            <span className="text-muted-foreground">Auto-détecté:</span>
            <span className="font-medium">{region}</span>
          </div>
        </div>
      )}
    </div>
  )
}
