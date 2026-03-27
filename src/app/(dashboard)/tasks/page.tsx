import { Suspense } from 'react'
import { Plus, ListTodo, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { getTasks, completeTask, uncompleteTask } from '@/lib/actions/tasks'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import type { TaskPriority } from '@/generated/prisma'

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-gray-500/10 text-gray-600',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-orange-500/10 text-orange-600',
  URGENT: 'bg-red-500/10 text-red-600',
}

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
}

async function TasksList() {
  let tasks: Awaited<ReturnType<typeof getTasks>> = []
  
  try {
    tasks = await getTasks({ completed: false })
  } catch {
    tasks = []
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ListTodo className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune tâche</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            Vous n&apos;avez aucune tâche en attente. Bravo!
          </p>
          <CreateTaskDialog>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </CreateTaskDialog>
        </CardContent>
      </Card>
    )
  }

  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH')
  const normalTasks = tasks.filter((t) => t.priority !== 'URGENT' && t.priority !== 'HIGH')

  return (
    <div className="space-y-6">
      {urgentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>À faire</CardTitle>
          <CardDescription>{normalTasks.length} tâche{normalTasks.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {normalTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskItem({ task }: { task: Awaited<ReturnType<typeof getTasks>>[0] }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completedAt

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <form action={async () => {
        'use server'
        if (task.completedAt) {
          await uncompleteTask(task.id)
        } else {
          await completeTask(task.id)
        }
      }}>
        <button type="submit">
          <Checkbox checked={!!task.completedAt} />
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.completedAt ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge className={priorityColors[task.priority]}>
            {priorityLabels[task.priority]}
          </Badge>
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TasksListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function TasksPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tâches</h1>
          <p className="text-muted-foreground">
            Gérez vos relances et actions à faire
          </p>
        </div>
        <CreateTaskDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </Button>
        </CreateTaskDialog>
      </div>

      <Suspense fallback={<TasksListSkeleton />}>
        <TasksList />
      </Suspense>
    </div>
  )
}





