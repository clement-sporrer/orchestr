'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { addTagToCandidate, removeTagFromCandidate } from '@/lib/actions/candidates'
import { toast } from 'sonner'

interface CandidateTagsEditorProps {
  candidateId: string
  tags: string[]
}

export function CandidateTagsEditor({ candidateId, tags }: CandidateTagsEditorProps) {
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddTag = async () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return
    
    setLoading(true)
    try {
      await addTagToCandidate(candidateId, tagInput.trim())
      setTagInput('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTagFromCandidate(candidateId, tag)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Ajouter un tag..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddTag()
            }
          }}
          disabled={loading}
          className="h-8"
        />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleAddTag} 
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun tag</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}





