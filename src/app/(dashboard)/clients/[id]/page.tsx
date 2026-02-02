import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  Briefcase, 
  Users, 
  Plus,
  Pencil,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/actions/clients'
import { getOrganizationSettings } from '@/lib/actions/organization-settings'
import { ContactDialog } from '@/components/clients/contact-dialog'
import { ClientActions } from '@/components/clients/client-actions'

export const dynamic = 'force-dynamic'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  let client
  try {
    client = await getClient(id)
  } catch {
    notFound()
  }

  const settingsResult = await getOrganizationSettings()
  const clientCategories = settingsResult.success && settingsResult.data?.clientCategories
    ? settingsResult.data.clientCategories
    : []

  const getMissionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'ON_HOLD':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'DRAFT':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getMissionStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'ON_HOLD':
        return 'En pause'
      case 'DRAFT':
        return 'Brouillon'
      case 'CLOSED_FILLED':
        return 'Pourvue'
      case 'CLOSED_CANCELLED':
        return 'Annulée'
      default:
        return status
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                {client.companyName ?? client.name}
              </h1>
            </div>
            {(client.category ?? client.sector) && (
              <p className="text-muted-foreground mt-1">
                {client.category ?? client.sector}
              </p>
            )}
            {client.website && (
              <a 
                href={client.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <Globe className="h-3 w-3" />
                {client.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/missions/new?clientId=${client.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle mission
            </Link>
          </Button>
          <ClientActions client={client} clientCategories={clientCategories} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Missions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Missions
                </CardTitle>
                <CardDescription>
                  {client.missions.length} mission{client.missions.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/missions/new?clientId=${client.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {client.missions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune mission pour ce client
                </p>
              ) : (
                <div className="space-y-3">
                  {client.missions.map((mission) => (
                    <Link
                      key={mission.id}
                      href={`/missions/${mission.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{mission.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {mission._count.missionCandidates} candidat{mission._count.missionCandidates !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge className={getMissionStatusColor(mission.status)}>
                        {getMissionStatusLabel(mission.status)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Contacts */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacts
                </CardTitle>
                <CardDescription>
                  {client.contacts.length} contact{client.contacts.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <ContactDialog clientId={client.id}>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </ContactDialog>
            </CardHeader>
            <CardContent>
              {client.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun contact
                </p>
              ) : (
                <div className="space-y-4">
                  {client.contacts.map((contact) => {
                    const displayName = (contact.firstName && contact.lastName)
                      ? `${contact.firstName} ${contact.lastName}`
                      : contact.name ?? '—'
                    return (
                    <div key={contact.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {displayName}
                          {contact.isPrimary && (
                            <span className="ml-2 text-xs font-normal text-primary">★ Principal</span>
                          )}
                        </p>
                        <ContactDialog clientId={client.id} contact={contact}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </ContactDialog>
                      </div>
                      {(contact.title ?? contact.role) && (
                        <p className="text-sm text-muted-foreground">{contact.title ?? contact.role}</p>
                      )}
                      {contact.email && (
                        <a 
                          href={`mailto:${contact.email}`}
                          className="text-sm text-primary hover:underline block"
                        >
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a 
                          href={`tel:${contact.phone}`}
                          className="text-sm text-muted-foreground block"
                        >
                          {contact.phone}
                        </a>
                      )}
                      {contact !== client.contacts[client.contacts.length - 1] && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

