import Link from 'next/link'
import { Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { SuspenseBoundary } from '@/components/streaming/suspense-boundary'
import { StatCardSkeleton, ListItemSkeleton } from '@/components/streaming/skeleton-patterns'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// Auth helper
async function getContext() {
  try {
    const user = await getCurrentUser()
    return { organizationId: user.organizationId, userId: user.id }
  } catch {
    return null
  }
}

// Optimized stat card component
async function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend,
  href 
}: { 
  title: string
  value: string | number
  subtitle: string
  trend?: number
  href: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="p-6 hover:border-primary/50 transition-all duration-200 cursor-pointer group">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight group-hover:text-primary transition-colors">
              {value}
            </h3>
            {trend !== undefined && trend !== 0 && (
              <span className={`text-sm font-medium flex items-center ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </Card>
    </Link>
  )
}

// Stats section with Promise.allSettled for resilience
async function StatsSection() {
  const context = await getContext()
  if (!context) return null

  const { organizationId, userId } = context
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Use allSettled to not block if one query fails
  const results = await Promise.allSettled([
    prisma.mission.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.candidate.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
    prisma.candidate.count({ where: { organizationId, createdAt: { gte: lastMonthStart, lt: startOfMonth } } }),
    prisma.task.count({ where: { userId, completedAt: null } }),
    prisma.task.count({ where: { userId, completedAt: null, priority: { in: ['HIGH', 'URGENT'] } } }),
  ])

  const activeMissions = results[0].status === 'fulfilled' ? results[0].value : 0
  const candidatesThisMonth = results[1].status === 'fulfilled' ? results[1].value : 0
  const candidatesLastMonth = results[2].status === 'fulfilled' ? results[2].value : 0
  const pendingTasks = results[3].status === 'fulfilled' ? results[3].value : 0
  const urgentTasks = results[4].status === 'fulfilled' ? results[4].value : 0

  const candidateTrend = candidatesLastMonth > 0
    ? Math.round(((candidatesThisMonth - candidatesLastMonth) / candidatesLastMonth) * 100)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Missions actives"
        value={activeMissions}
        subtitle={`${activeMissions} en cours`}
        href="/missions"
      />
      <StatCard
        title="Candidats ce mois"
        value={candidatesThisMonth}
        subtitle="Nouveaux ajouts"
        trend={candidateTrend}
        href="/candidates"
      />
      <StatCard
        title="Tâches"
        value={pendingTasks}
        subtitle={urgentTasks > 0 ? `${urgentTasks} urgente${urgentTasks > 1 ? 's' : ''}` : 'Aucune urgente'}
        href="/tasks"
      />
      <StatCard
        title="Shortlists"
        value="-"
        subtitle="À venir"
        href="/missions"
      />
    </div>
  )
}

// Quick tasks list
async function QuickTasksList() {
  const context = await getContext()
  if (!context) return null

  const tasks = await prisma.task.findMany({
    where: {
      userId: context.userId,
      completedAt: null,
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
    take: 5,
  })

  if (tasks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Aucune tâche en attente</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <input type="checkbox" className="mt-1" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              )}
            </div>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(task.dueDate, { addSuffix: true, locale: fr })}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// Active missions preview
async function ActiveMissionsList() {
  const context = await getContext()
  if (!context) return null

  const missions = await prisma.mission.findMany({
    where: {
      organizationId: context.organizationId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      title: true,
      client: { select: { name: true } },
      _count: { select: { missionCandidates: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  })

  if (missions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Aucune mission active</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-3">
        {missions.map((mission) => (
          <Link
            key={mission.id}
            href={`/missions/${mission.id}`}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{mission.title}</p>
              <p className="text-xs text-muted-foreground">{mission.client.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{mission._count.missionCandidates}</p>
              <p className="text-xs text-muted-foreground">candidats</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

// Main dashboard page
export default async function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Minimal header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d&apos;ensemble de votre activité
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/missions/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle mission
          </Link>
        </Button>
      </div>

      {/* Stats with individual suspense boundaries */}
      <SuspenseBoundary
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <StatsSection />
      </SuspenseBoundary>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tâches à faire</h2>
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
              Voir tout →
            </Link>
          </div>
          <SuspenseBoundary
            fallback={
              <Card className="p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </Card>
            }
          >
            <QuickTasksList />
          </SuspenseBoundary>
        </div>

        {/* Missions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Missions actives</h2>
            <Link href="/missions" className="text-sm text-muted-foreground hover:text-foreground">
              Voir tout →
            </Link>
          </div>
          <SuspenseBoundary
            fallback={
              <Card className="p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </Card>
            }
          >
            <ActiveMissionsList />
          </SuspenseBoundary>
        </div>
      </div>
    </div>
  )
}
