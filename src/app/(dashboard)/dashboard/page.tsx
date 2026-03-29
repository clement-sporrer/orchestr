import { Suspense } from 'react'
import Link from 'next/link'
import { 
  Briefcase, 
  Users, 
  ListTodo, 
  Send,
  ArrowRight,
  Clock,
  TrendingUp,
  Calendar,
  MessageSquare,
  UserPlus,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/helpers'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { displayClientCompanyName } from '@/lib/utils/client-display'

// Get current user's organization
async function getOrganizationId(): Promise<{ organizationId: string; userId: string } | null> {
  try {
    const user = await getCurrentUser()
    return { organizationId: user.organizationId, userId: user.id }
  } catch {
    return null
  }
}

// Get stats from database
async function getDashboardStats() {
  const context = await getOrganizationId()
  if (!context) return null

  const { organizationId, userId } = context
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    activeMissionsCount,
    candidatesThisMonth,
    pendingTasksCount,
    urgentTasksCount,
    shortlistsSentCount,
    pendingFeedbackCount,
    candidatesLastMonth,
  ] = await Promise.all([
    // Active missions
    prisma.mission.count({
      where: { organizationId, status: 'ACTIVE' },
    }),
    // Candidates added this month
    prisma.candidate.count({
      where: { organizationId, createdAt: { gte: startOfMonth } },
    }),
    // Pending tasks for user
    prisma.task.count({
      where: { userId, completedAt: null },
    }),
    // Urgent tasks
    prisma.task.count({
      where: { userId, completedAt: null, priority: { in: ['HIGH', 'URGENT'] } },
    }),
    // Shortlists sent
    prisma.shortlist.count({
      where: { mission: { organizationId } },
    }),
    // Pending feedback (shortlist candidates without feedback)
    prisma.shortlistCandidate.count({
      where: {
        shortlist: { mission: { organizationId } },
        feedback: null,
      },
    }),
    // Last month's candidates for comparison
    prisma.candidate.count({
      where: {
        organizationId,
        createdAt: { gte: lastMonthStart, lt: startOfMonth },
      },
    }),
  ])

  const candidateChange = candidatesLastMonth > 0
    ? Math.round(((candidatesThisMonth - candidatesLastMonth) / candidatesLastMonth) * 100)
    : 0

  return {
    activeMissions: {
      value: activeMissionsCount,
      change: `${activeMissionsCount} en cours`,
    },
    candidatesThisMonth: {
      value: candidatesThisMonth,
      change: candidateChange >= 0 ? `+${candidateChange}% vs mois dernier` : `${candidateChange}% vs mois dernier`,
    },
    pendingTasks: {
      value: pendingTasksCount,
      change: urgentTasksCount > 0 ? `${urgentTasksCount} urgente${urgentTasksCount > 1 ? 's' : ''}` : 'Aucune urgente',
    },
    shortlists: {
      value: shortlistsSentCount,
      change: pendingFeedbackCount > 0 ? `${pendingFeedbackCount} en attente feedback` : 'Tous traités',
    },
  }
}

async function StatsCards() {
  const stats = await getDashboardStats()
  
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      title: 'Missions actives',
      value: stats.activeMissions.value.toString(),
      change: stats.activeMissions.change,
      icon: Briefcase,
      href: '/missions',
    },
    {
      title: 'Candidats ce mois',
      value: stats.candidatesThisMonth.value.toString(),
      change: stats.candidatesThisMonth.change,
      icon: Users,
      href: '/candidates',
    },
    {
      title: 'Tâches en attente',
      value: stats.pendingTasks.value.toString(),
      change: stats.pendingTasks.change,
      icon: ListTodo,
      href: '/tasks',
    },
    {
      title: 'Shortlists envoyées',
      value: stats.shortlists.value.toString(),
      change: stats.shortlists.change,
      icon: Send,
      href: '/missions',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <Link key={stat.title} href={stat.href}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

async function TasksList() {
  const context = await getOrganizationId()
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

  const formatDueDate = (date: Date | null) => {
    if (!date) return 'Pas de date'
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'En retard'
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Demain'
    if (diffDays <= 7) return `Dans ${diffDays} jours`
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tâches à faire</CardTitle>
            <CardDescription>Vos prochaines actions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mb-4 text-green-500" />
            <p className="font-medium">Aucune tâche en attente</p>
            <p className="text-sm">Vous êtes à jour !</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tâches à faire</CardTitle>
          <CardDescription>Vos prochaines actions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">
            Voir tout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  task.priority === 'URGENT' ? 'destructive' : 
                  task.priority === 'HIGH' ? 'destructive' : 
                  'secondary'
                }
                className="text-xs"
              >
                {formatDueDate(task.dueDate)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

async function RecentActivity() {
  const context = await getOrganizationId()
  if (!context) return null

  const interactions = await prisma.interaction.findMany({
    where: {
      organizationId: context.organizationId,
    },
    select: {
      id: true,
      type: true,
      content: true,
      createdAt: true,
      candidate: {
        select: { firstName: true, lastName: true },
      },
      missionCandidate: {
        select: {
          mission: {
            select: { title: true, client: { select: { companyName: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
      case 'EMAIL':
        return <MessageSquare className="h-4 w-4" />
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_DONE':
        return <Calendar className="h-4 w-4" />
      case 'CLIENT_FEEDBACK':
        return <TrendingUp className="h-4 w-4" />
      case 'PORTAL_COMPLETED':
      case 'PORTAL_INVITED':
        return <UserPlus className="h-4 w-4" />
      case 'NOTE':
        return <FileText className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityDescription = (interaction: typeof interactions[0]) => {
    const candidateName = `${interaction.candidate.firstName} ${interaction.candidate.lastName}`
    const missionTitle = interaction.missionCandidate?.mission?.title || ''
    
    switch (interaction.type) {
      case 'MESSAGE':
        return `Message envoyé à ${candidateName}`
      case 'EMAIL':
        return `Email envoyé à ${candidateName}`
      case 'INTERVIEW_SCHEDULED':
        return `Entretien planifié avec ${candidateName}`
      case 'INTERVIEW_DONE':
        return `Entretien terminé avec ${candidateName}`
      case 'CLIENT_FEEDBACK':
        return `Feedback client reçu pour ${candidateName}`
      case 'PORTAL_COMPLETED':
        return `${candidateName} a complété son profil`
      case 'PORTAL_INVITED':
        return `${candidateName} invité au portail candidat`
      case 'NOTE':
        return `Note ajoutée pour ${candidateName}`
      case 'STATUS_CHANGE':
        return `Statut modifié pour ${candidateName}`
      default:
        return `Activité pour ${candidateName}${missionTitle ? ` - ${missionTitle}` : ''}`
    }
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Les derniers événements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Aucune activité récente</p>
            <p className="text-sm">Commencez par ajouter des candidats</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>Les derniers événements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {interactions.map((interaction) => (
          <div
            key={interaction.id}
            className="flex items-start gap-4"
          >
            <div className="p-2 rounded-full bg-muted">
              {getActivityIcon(interaction.type)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">{getActivityDescription(interaction)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(interaction.createdAt, { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

async function ActiveMissions() {
  const context = await getOrganizationId()
  if (!context) return null

  const missions = await prisma.mission.findMany({
    where: {
      organizationId: context.organizationId,
      status: 'ACTIVE',
    },
    include: {
      client: {
        select: { companyName: true },
      },
      _count: {
        select: { missionCandidates: true },
      },
      missionCandidates: {
        select: { stage: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  })

  const getStageLabel = (mission: typeof missions[0]) => {
    const stages = mission.missionCandidates.map(mc => mc.stage)
    if (stages.includes('PLACED')) return 'Placé'
    if (stages.includes('OFFER')) return 'Offre'
    if (stages.includes('SHORTLIST')) return 'Shortlist'
    if (stages.includes('INTERVIEW')) return 'Entretien'
    if (stages.includes('RESPONSE')) return 'Réponse'
    if (stages.includes('CONTACTED')) return 'Prise de contact'
    return 'Sourcing'
  }

  if (missions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missions en cours</CardTitle>
            <CardDescription>Vos recrutements actifs</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/missions">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Aucune mission active</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/missions/new">Créer une mission</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Missions en cours</CardTitle>
          <CardDescription>Vos recrutements actifs</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/missions">
            Voir tout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {missions.map((mission) => (
            <Link
              key={mission.id}
              href={`/missions/${mission.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{mission.title}</p>
                <p className="text-xs text-muted-foreground">
                  {displayClientCompanyName(mission.client.companyName)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{mission._count.missionCandidates}</p>
                  <p className="text-xs text-muted-foreground">candidats</p>
                </div>
                <Badge variant="outline">{getStageLabel(mission)}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue ! Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/missions/new">Nouvelle mission</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>}>
          <TasksList />
        </Suspense>
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>}>
          <ActiveMissions />
        </Suspense>
      </div>

      {/* Activity */}
      <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}
