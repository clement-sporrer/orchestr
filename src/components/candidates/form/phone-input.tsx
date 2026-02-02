'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Common country codes
const COUNTRY_CODES = [
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
]

interface PhoneInputProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * PhoneInput component
 * Splits phone into country code + number, stores as single string
 */
export function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  // Parse existing value
  const parsePhone = (phone: string | undefined) => {
    if (!phone) return { code: '+33', number: '' }

    // Try to extract country code
    const match = phone.match(/^(\+\d{1,4})\s?(.*)$/)
    if (match) {
      return { code: match[1], number: match[2] }
    }

    // Default
    return { code: '+33', number: phone }
  }

  const [countryCode, setCountryCode] = useState(parsePhone(value).code)
  const [phoneNumber, setPhoneNumber] = useState(parsePhone(value).number)

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code)
    onChange(`${code} ${phoneNumber}`.trim())
  }

  const handleNumberChange = (number: string) => {
    setPhoneNumber(number)
    onChange(`${countryCode} ${number}`.trim())
  }

  return (
    <div className="space-y-2">
      <Label>Téléphone</Label>
      <div className="flex gap-2">
        <Select
          value={countryCode}
          onValueChange={handleCountryCodeChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          placeholder="6 12 34 56 78"
          value={phoneNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
      </div>
    </div>
  )
}
