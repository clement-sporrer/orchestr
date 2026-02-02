'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Languages } from 'lucide-react'
import { LANGUAGE_LEVEL_LABELS, LanguageLevelEnum } from '@/lib/validations/candidate'
import type { LanguageEntry } from '@/lib/validations/candidate'

interface LanguageInputProps {
  value: LanguageEntry[]
  onChange: (languages: LanguageEntry[]) => void
  disabled?: boolean
}

/**
 * LanguageInput component
 * Multi-language input with proficiency levels
 */
export function LanguageInput({
  value = [],
  onChange,
  disabled,
}: LanguageInputProps) {
  const [newLanguage, setNewLanguage] = useState('')
  const [newLevel, setNewLevel] = useState<
    'BEGINNER' | 'INTERMEDIATE' | 'FLUENT' | 'NATIVE'
  >('INTERMEDIATE')

  const addLanguage = () => {
    if (!newLanguage.trim()) return

    // Check if language already exists
    if (value.some((l) => l.language === newLanguage.trim())) {
      return
    }

    const updated = [
      ...value,
      { language: newLanguage.trim(), level: newLevel },
    ]
    onChange(updated)
    setNewLanguage('')
    setNewLevel('INTERMEDIATE')
  }

  const removeLanguage = (language: string) => {
    onChange(value.filter((l) => l.language !== language))
  }

  const updateLevel = (language: string, level: LanguageEntry['level']) => {
    onChange(
      value.map((l) => (l.language === language ? { ...l, level } : l))
    )
  }

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Languages className="h-4 w-4" />
        Langues
      </Label>

      {/* Existing languages */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((lang) => (
            <div
              key={lang.language}
              className="flex items-center gap-2 p-3 bg-muted rounded-lg"
            >
              <span className="font-medium flex-1">{lang.language}</span>
              <Select
                value={lang.level}
                onValueChange={(val) =>
                  updateLevel(
                    lang.language,
                    val as LanguageEntry['level']
                  )
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLanguage(lang.language)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new language */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: Français, English..."
          value={newLanguage}
          onChange={(e) => setNewLanguage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addLanguage()
            }
          }}
          disabled={disabled}
          className="flex-1"
        />
        <Select
          value={newLevel}
          onValueChange={(val: any) => setNewLevel(val)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGE_LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addLanguage}
          disabled={disabled || !newLanguage.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune langue ajoutée. Langue par défaut détectée selon le pays.
        </p>
      )}
    </div>
  )
}
