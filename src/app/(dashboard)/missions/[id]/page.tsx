import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Users,
  Settings,
  MoreHorizontal,
  Pencil,
  Trash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getMissionHeader, getMission } from '@/lib/actions/missions'
import { PipelineView } from '@/components/pipeline/pipeline-view'
import { JobView } from '@/components/job-builder/job-view'
import { MissionSourcingView } from '@/components/missions/sourcing-view'
import { MissionShortlistView } from '@/components/missions/shortlist-view'
import { MissionStatusActions } from '@/components/missions/status-actions'
import { Skeleton } from '@/components/ui/skeleton'
import type { MissionStatus } from '@/generated/prisma'

interface MissionDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const statusLabels: Record<MissionStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Active',
  ON_HOLD: 'En pause',
  CLOSED_FILLED: 'Pourvue',
  CLOSED_CANCELLED: 'Annulée',
}

const statusColors: Record<MissionStatus, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  ON_HOLD: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  CLOSED_FILLED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CLOSED_CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
}

function MissionHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/missions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  )
}

function MissionBodySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}

async function MissionHeader({ id }: { id: string }) {
  const header = await getMissionHeader(id)
  if (!header) notFound()

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/missions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{header.title}</h1>
            <Badge className={statusColors[header.status as MissionStatus]}>
              {statusLabels[header.status as MissionStatus]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground flex-wrap">
            <Link
              href={`/clients/${header.clientId}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Building2 className="h-4 w-4" />
              {header.client.companyName ?? header.client.name}
            </Link>
            {header.mainContact && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {[header.mainContact.firstName, header.mainContact.lastName].filter(Boolean).join(' ') || header.mainContact.email}
                {header.mainContact.email && (
                  <a
                    href={`mailto:${header.mainContact.email}`}
                    className="hover:text-foreground"
                  >
                    ({header.mainContact.email})
                  </a>
                )}
              </span>
            )}
            {(header.location ?? header.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {header.city ?? header.location}
                {header.country && `, ${header.country}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {header._count.missionCandidates} candidat
              {header._count.missionCandidates !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <MissionStatusActions missionId={header.id} currentStatus={header.status as MissionStatus} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/missions/${header.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/missions/${header.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

async function MissionBody({ id, tab }: { id: string; tab: string }) {
  let mission
  try {
    mission = await getMission(id)
  } catch {
    notFound()
  }

  return (
    <Tabs defaultValue={tab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="pipeline" asChild>
          <Link href={`/missions/${id}?tab=pipeline`}>Pipeline</Link>
        </TabsTrigger>
        <TabsTrigger value="job" asChild>
          <Link href={`/missions/${id}?tab=job`}>Fiche de poste</Link>
        </TabsTrigger>
        <TabsTrigger value="sourcing" asChild>
          <Link href={`/missions/${id}?tab=sourcing`}>Sourcing</Link>
        </TabsTrigger>
        <TabsTrigger value="shortlist" asChild>
          <Link href={`/missions/${id}?tab=shortlist`}>Shortlist</Link>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline" className="mt-6">
        <PipelineView mission={mission as any} />
      </TabsContent>

      <TabsContent value="job" className="mt-6">
        <JobView mission={mission} />
      </TabsContent>

      <TabsContent value="sourcing" className="mt-6">
        <MissionSourcingView mission={mission as any} />
      </TabsContent>

      <TabsContent value="shortlist" className="mt-6">
        <MissionShortlistView mission={mission as any} />
      </TabsContent>
    </Tabs>
  )
}

export default async function MissionDetailPage({
  params,
  searchParams,
}: MissionDetailPageProps) {
  const { id } = await params
  const { tab = 'pipeline' } = await searchParams

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<MissionHeaderSkeleton />}>
        <MissionHeader id={id} />
      </Suspense>

      <Suspense fallback={<MissionBodySkeleton />}>
        <MissionBody id={id} tab={tab} />
      </Suspense>
    </div>
  )
}
