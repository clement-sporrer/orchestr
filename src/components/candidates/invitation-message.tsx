'use client'

import { useState } from 'react'
import { Copy, Check, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type MessageFormat = 'linkedin_connection' | 'linkedin_inmail' | 'email'

interface InvitationMessageProps {
  candidateFirstName: string
  portalUrl: string
  missionTitle?: string
  trigger?: React.ReactNode
}

const FORMAT_CONFIG: Record<MessageFormat, { label: string; maxChars: number; description: string }> = {
  linkedin_connection: {
    label: 'LinkedIn (court)',
    maxChars: 200,
    description: 'Note de connexion LinkedIn - max 200 caracteres',
  },
  linkedin_inmail: {
    label: 'InMail',
    maxChars: 1900,
    description: 'Message LinkedIn InMail - max 1900 caracteres',
  },
  email: {
    label: 'Email',
    maxChars: 5000,
    description: 'Email classique - format libre',
  },
}

export function InvitationMessage({
  candidateFirstName,
  portalUrl,
  missionTitle,
  trigger,
}: InvitationMessageProps) {
  const [format, setFormat] = useState<MessageFormat>('linkedin_connection')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [open, setOpen] = useState(false)

  const config = FORMAT_CONFIG[format]

  const generateMessage = async () => {
    setGenerating(true)
    
    // Generate based on format
    let generated = ''
    
    if (format === 'linkedin_connection') {
      // Short message for LinkedIn connection (max 200 chars)
      generated = `Merci ${candidateFirstName}! Voici le lien pour decouvrir l'opportunite et completer votre profil: ${portalUrl}`
      
      // If too long, shorten
      if (generated.length > 200) {
        generated = `${candidateFirstName}, decouvrez l'opportunite ici: ${portalUrl}`
      }
    } else if (format === 'linkedin_inmail') {
      generated = `Bonjour ${candidateFirstName},

Merci pour votre interet pour ${missionTitle || 'cette opportunite'}!

Je vous invite a completer votre profil via ce lien securise:
${portalUrl}

Ce parcours vous permettra de:
- Decouvrir le poste en detail
- Completer vos informations
- Reserver un creneau d'entretien

A tres bientot!`
    } else {
      generated = `Bonjour ${candidateFirstName},

Suite a notre echange, je vous invite a completer votre profil candidat pour ${missionTitle || 'cette opportunite'}.

Vous pouvez acceder a votre espace personnel via ce lien securise:
${portalUrl}

Ce parcours vous permettra de:
- Consulter la fiche de poste complete
- Mettre a jour vos informations
- Reserver un creneau pour un entretien
- Repondre a quelques questions complementaires

N'hesitez pas a me contacter si vous avez des questions.

Bien cordialement`
    }
    
    setMessage(generated)
    setGenerating(false)
  }

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    toast.success('Message copie!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFormatChange = (value: string) => {
    if (value) {
      setFormat(value as MessageFormat)
      setMessage('') // Reset message when format changes
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Generer message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Message d&apos;invitation</DialogTitle>
          <DialogDescription>
            Generez un message personnalise pour inviter {candidateFirstName} a completer son profil
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Format Toggle */}
          <div className="space-y-2">
            <Label>Format du message</Label>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={handleFormatChange}
              className="justify-start"
            >
              <ToggleGroupItem value="linkedin_connection" aria-label="LinkedIn court">
                LinkedIn (court)
              </ToggleGroupItem>
              <ToggleGroupItem value="linkedin_inmail" aria-label="InMail">
                InMail
              </ToggleGroupItem>
              <ToggleGroupItem value="email" aria-label="Email">
                Email
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>

          {/* Generate Button */}
          {!message && (
            <Button onClick={generateMessage} disabled={generating} className="w-full">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generer le message
                </>
              )}
            </Button>
          )}

          {/* Message Editor */}
          {message && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Message</Label>
                  <span className={`text-xs ${message.length > config.maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {message.length}/{config.maxChars} caracteres
                  </span>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={format === 'linkedin_connection' ? 3 : 8}
                  className="resize-none"
                />
                {message.length > config.maxChars && (
                  <p className="text-xs text-destructive">
                    Le message depasse la limite de {config.maxChars} caracteres
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateMessage}
                  disabled={generating}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerer
                </Button>
                <Button
                  onClick={copyMessage}
                  disabled={message.length > config.maxChars}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copie!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



