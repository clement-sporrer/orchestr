'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Sparkles } from 'lucide-react'
import { parseSemicolonList, joinSemicolonList } from '@/lib/validations/candidate'

interface SkillsInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  multiline?: boolean // If true, show textarea for semicolon-separated input
}

/**
 * SkillsInput component
 * Handles semicolon-separated skills as both tags and raw text
 */
export function SkillsInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  multiline = false,
}: SkillsInputProps) {
  const [inputValue, setInputValue] = useState('')

  // Parse current skills (memoized to avoid re-parsing on every render)
  const skills = useMemo(() => parseSemicolonList(value), [value])

  const addSkill = (skill?: string) => {
    const newSkill = (skill || inputValue).trim()
    if (!newSkill) return

    // Check if skill already exists
    if (skills.includes(newSkill)) return

    // Add to list
    const updated = [...skills, newSkill]
    onChange(joinSemicolonList(updated))
    setInputValue('')
  }

  const removeSkill = (skill: string) => {
    const updated = skills.filter((s) => s !== skill)
    onChange(joinSemicolonList(updated))
  }

  const handleTextareaChange = (text: string) => {
    onChange(text) // Store raw value
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {multiline ? (
        // Textarea mode - direct semicolon-separated input
        <div className="space-y-2">
          <Textarea
            placeholder={placeholder || 'Skill1; Skill2; Skill3'}
            value={value}
            onChange={(e) => handleTextareaChange(e.target.value)}
            disabled={disabled}
            rows={3}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Séparez les compétences par un point-virgule (;)
          </p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Tag input mode
        <div className="space-y-2">
          {/* Current skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add new skill */}
          <div className="flex gap-2">
            <Input
              placeholder={placeholder || 'Ajouter une compétence...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addSkill()}
              disabled={disabled || !inputValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Appuyez sur Entrée ou cliquez sur + pour ajouter
          </p>
        </div>
      )}
    </div>
  )
}
