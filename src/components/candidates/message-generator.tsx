'use client'

import { useState } from 'react'
import { Copy, Check, Sparkles, Loader2, MessageSquare, Mail, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { generateApproachMessage } from '@/lib/ai/messages'
import type { Mission, Candidate, CandidateEnrichment } from '@/generated/prisma'

type MessageFormat = 'linkedin_connection' | 'linkedin_inmail' | 'email'

interface MessageGeneratorProps {
  candidate: Candidate & { enrichment?: CandidateEnrichment | null }
  mission: Mission
  onMessageSent?: (format: MessageFormat, content: string) => void
  trigger?: React.ReactNode
}

const FORMAT_CONFIG: Record<MessageFormat, { 
  label: string
  icon: typeof Linkedin
  maxChars: number
  description: string 
}> = {
  linkedin_connection: {
    label: 'LinkedIn',
    icon: Linkedin,
    maxChars: 200,
    description: 'Note de connexion - max 200 caracteres',
  },
  linkedin_inmail: {
    label: 'InMail',
    icon: MessageSquare,
    maxChars: 1900,
    description: 'Message InMail LinkedIn - max 1900 caracteres',
  },
  email: {
    label: 'Email',
    icon: Mail,
    maxChars: 5000,
    description: 'Email professionnel',
  },
}

export function MessageGenerator({
  candidate,
  mission,
  onMessageSent,
  trigger,
}: MessageGeneratorProps) {
  const [format, setFormat] = useState<MessageFormat>('linkedin_connection')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [open, setOpen] = useState(false)

  const config = FORMAT_CONFIG[format]

  const handleGenerate = async () => {
    setGenerating(true)
    
    try {
      const result = await generateApproachMessage(
        format,
        candidate,
        mission,
        customContext || undefined
      )
      
      setMessage(result.content)
      if (result.subject) {
        setSubject(result.subject)
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Erreur lors de la generation')
    } finally {
      setGenerating(false)
    }
  }

  const copyMessage = async () => {
    const textToCopy = format === 'linkedin_connection' 
      ? message 
      : `Objet: ${subject}\n\n${message}`
    
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Message copie!')
    
    if (onMessageSent) {
      onMessageSent(format, message)
    }
    
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFormatChange = (value: string) => {
    if (value) {
      setFormat(value as MessageFormat)
      setMessage('')
      setSubject('')
    }
  }

  const resetForm = () => {
    setMessage('')
    setSubject('')
    setCustomContext('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Generer message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generer un message d&apos;approche</DialogTitle>
          <DialogDescription>
            Message personnalise pour {candidate.firstName} {candidate.lastName} - {mission.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Candidate Info Card */}
          <Card className="bg-muted/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                {candidate.firstName} {candidate.lastName}
              </CardTitle>
              <CardDescription className="text-xs">
                {candidate.currentPosition && `${candidate.currentPosition}`}
                {candidate.currentCompany && ` @ ${candidate.currentCompany}`}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Format Toggle */}
          <div className="space-y-2">
            <Label>Format du message</Label>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={handleFormatChange}
              className="justify-start"
            >
              {Object.entries(FORMAT_CONFIG).map(([key, { label, icon: Icon }]) => (
                <ToggleGroupItem key={key} value={key} aria-label={label} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>

          {/* Custom Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Contexte additionnel (optionnel)</Label>
            <Input
              id="context"
              placeholder="Ex: Nous avons echange au salon X..."
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generation IA en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {message ? 'Regenerer' : 'Generer le message'}
              </>
            )}
          </Button>

          {/* Message Editor */}
          {message && (
            <>
              {/* Subject (for InMail and Email) */}
              {format !== 'linkedin_connection' && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Objet</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Message</Label>
                  <span className={`text-xs ${message.length > config.maxChars ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {message.length}/{config.maxChars}
                  </span>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={format === 'linkedin_connection' ? 4 : 10}
                  className="resize-none font-mono text-sm"
                />
                {message.length > config.maxChars && (
                  <p className="text-xs text-destructive">
                    Le message depasse la limite de {config.maxChars} caracteres
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMessage('')
                    setSubject('')
                  }}
                  className="flex-1"
                >
                  Effacer
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
                      Copier le message
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

