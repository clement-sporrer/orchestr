'use client'

import { useState } from 'react'
import { 
  Linkedin, 
  Briefcase, 
  GraduationCap, 
  Wrench,
  Globe,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { CandidateEnrichment } from '@/generated/prisma'

interface Experience {
  company: string
  title: string
  startDate?: string
  endDate?: string
  description?: string
  location?: string
}

interface Education {
  school: string
  degree?: string
  field?: string
  year?: string
}

interface EnrichmentPanelProps {
  enrichment: CandidateEnrichment | null
  candidateId: string
  onRefresh?: () => void
}

export function EnrichmentPanel({ enrichment, candidateId, onRefresh }: EnrichmentPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('experiences')

  if (!enrichment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0077b5]" />
            Enrichissement LinkedIn
          </CardTitle>
          <CardDescription>
            Aucune donnee LinkedIn disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Utilisez l&apos;extension Chrome pour capturer les donnees LinkedIn de ce candidat
          </p>
        </CardContent>
      </Card>
    )
  }

  const experiences = (enrichment.experiences as Experience[] | null) || []
  const education = (enrichment.education as Education[] | null) || []
  const skills = enrichment.skills || []
  const languages = enrichment.languages || []
  const certifications = enrichment.certifications || []

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0077b5]" />
            Donnees LinkedIn
          </CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {enrichment.linkedinUrl && (
          <a 
            href={enrichment.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Voir le profil <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline */}
        {enrichment.linkedinHeadline && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{enrichment.linkedinHeadline}</p>
          </div>
        )}

        {/* Connections */}
        {enrichment.linkedinConnections && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {enrichment.linkedinConnections.toLocaleString()} connexions
          </div>
        )}

        <Separator />

        {/* Experiences */}
        {experiences.length > 0 && (
          <CollapsibleSection
            title="Experiences"
            icon={Briefcase}
            count={experiences.length}
            isOpen={expandedSection === 'experiences'}
            onToggle={() => toggleSection('experiences')}
          >
            <div className="space-y-3">
              {experiences.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-primary/20 pl-3">
                  <p className="font-medium text-sm">{exp.title}</p>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-xs text-muted-foreground">
                      {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate || 'Present'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Education */}
        {education.length > 0 && (
          <CollapsibleSection
            title="Formation"
            icon={GraduationCap}
            count={education.length}
            isOpen={expandedSection === 'education'}
            onToggle={() => toggleSection('education')}
          >
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-primary/20 pl-3">
                  <p className="font-medium text-sm">{edu.school}</p>
                  {edu.degree && (
                    <p className="text-sm text-muted-foreground">
                      {edu.degree} {edu.field ? `- ${edu.field}` : ''}
                    </p>
                  )}
                  {edu.year && (
                    <p className="text-xs text-muted-foreground">{edu.year}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <CollapsibleSection
            title="Competences"
            icon={Wrench}
            count={skills.length}
            isOpen={expandedSection === 'skills'}
            onToggle={() => toggleSection('skills')}
          >
            <div className="flex flex-wrap gap-1">
              {skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <CollapsibleSection
            title="Langues"
            icon={Globe}
            count={languages.length}
            isOpen={expandedSection === 'languages'}
            onToggle={() => toggleSection('languages')}
          >
            <div className="flex flex-wrap gap-1">
              {languages.map((lang, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <CollapsibleSection
            title="Certifications"
            icon={Award}
            count={certifications.length}
            isOpen={expandedSection === 'certifications'}
            onToggle={() => toggleSection('certifications')}
          >
            <div className="space-y-1">
              {certifications.map((cert, idx) => (
                <p key={idx} className="text-sm">
                  {cert}
                </p>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Summary */}
        {enrichment.linkedinSummary && (
          <CollapsibleSection
            title="A propos"
            icon={Linkedin}
            isOpen={expandedSection === 'summary'}
            onToggle={() => toggleSection('summary')}
          >
            <p className="text-sm whitespace-pre-wrap">{enrichment.linkedinSummary}</p>
          </CollapsibleSection>
        )}

        {/* Last enriched */}
        {enrichment.lastEnrichedAt && (
          <div className="pt-2 text-xs text-muted-foreground text-center">
            Derniere mise a jour : {new Date(enrichment.lastEnrichedAt).toLocaleDateString('fr-FR')}
            {enrichment.enrichmentSource && ` via ${enrichment.enrichmentSource}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Collapsible section component
interface CollapsibleSectionProps {
  title: string
  icon: typeof Briefcase
  count?: number
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function CollapsibleSection({ 
  title, 
  icon: Icon, 
  count, 
  isOpen, 
  onToggle, 
  children 
}: CollapsibleSectionProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left hover:bg-muted/50 rounded p-2 -mx-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pl-6">
          {children}
        </div>
      )}
    </div>
  )
}

