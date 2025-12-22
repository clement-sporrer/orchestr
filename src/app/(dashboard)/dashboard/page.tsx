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
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Stats cards data - will be replaced with real data
const stats = [
  {
    title: 'Missions actives',
    value: '12',
    change: '+2 ce mois',
    icon: Briefcase,
    href: '/missions',
  },
  {
    title: 'Candidats ce mois',
    value: '48',
    change: '+15% vs mois dernier',
    icon: Users,
    href: '/candidates',
  },
  {
    title: 'Tâches en attente',
    value: '7',
    change: '3 urgentes',
    icon: ListTodo,
    href: '/tasks',
  },
  {
    title: 'Shortlists envoyées',
    value: '5',
    change: '2 en attente feedback',
    icon: Send,
    href: '/missions',
  },
]

function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
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

function TasksList() {
  // Mock data - will be replaced with real data
  const tasks = [
    { id: '1', title: 'Relancer Marie Dupont', dueDate: 'Aujourd\'hui', priority: 'high', candidate: 'Marie Dupont', mission: 'Product Manager - TechCorp' },
    { id: '2', title: 'Préparer entretien Jean Martin', dueDate: 'Demain', priority: 'medium', candidate: 'Jean Martin', mission: 'CTO - StartupXYZ' },
    { id: '3', title: 'Envoyer shortlist DataCorp', dueDate: 'Dans 2 jours', priority: 'medium', mission: 'Data Engineer - DataCorp' },
    { id: '4', title: 'Appeler Pierre Bernard', dueDate: 'Cette semaine', priority: 'low', candidate: 'Pierre Bernard', mission: 'Sales Director - SalesForce' },
  ]

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
              <p className="text-xs text-muted-foreground">{task.mission}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {task.dueDate}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  // Mock data - will be replaced with real data
  const activities = [
    { id: '1', type: 'candidate_added', description: 'Sophie Lefebvre ajoutée à Product Manager - TechCorp', time: 'Il y a 2h' },
    { id: '2', type: 'interview_scheduled', description: 'Entretien planifié avec Thomas Rousseau', time: 'Il y a 3h' },
    { id: '3', type: 'feedback_received', description: 'Feedback reçu de DataCorp sur la shortlist', time: 'Il y a 5h' },
    { id: '4', type: 'mission_created', description: 'Nouvelle mission: Frontend Developer - WebAgency', time: 'Hier' },
    { id: '5', type: 'portal_completed', description: 'Emma Blanc a complété son profil candidat', time: 'Hier' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'candidate_added':
        return <Users className="h-4 w-4" />
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4" />
      case 'feedback_received':
        return <TrendingUp className="h-4 w-4" />
      case 'mission_created':
        return <Briefcase className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>Les derniers événements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4"
          >
            <div className="p-2 rounded-full bg-muted">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ActiveMissions() {
  // Mock data - will be replaced with real data
  const missions = [
    { id: '1', title: 'Product Manager', client: 'TechCorp', candidates: 8, stage: 'Sourcing' },
    { id: '2', title: 'CTO', client: 'StartupXYZ', candidates: 4, stage: 'Entretiens' },
    { id: '3', title: 'Data Engineer', client: 'DataCorp', candidates: 12, stage: 'Shortlist' },
    { id: '4', title: 'Sales Director', client: 'SalesForce', candidates: 6, stage: 'Sourcing' },
  ]

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
                <p className="text-xs text-muted-foreground">{mission.client}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{mission.candidates}</p>
                  <p className="text-xs text-muted-foreground">candidats</p>
                </div>
                <Badge variant="outline">{mission.stage}</Badge>
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

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue! Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/import">Importer CSV</Link>
          </Button>
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
        <TasksList />
        <ActiveMissions />
      </div>

      {/* Activity */}
      <RecentActivity />
    </div>
  )
}



