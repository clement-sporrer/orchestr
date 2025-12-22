'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { TaskPriority } from '@/generated/prisma'

const taskSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.date().optional(),
  missionCandidateId: z.string().optional(),
})

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifié')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouvé')
  }

  return dbUser.id
}

export async function getTasks(filters?: {
  completed?: boolean
  priority?: TaskPriority
}) {
  const userId = await getCurrentUserId()

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(filters?.completed === true ? { completedAt: { not: null } } : {}),
      ...(filters?.completed === false ? { completedAt: null } : {}),
      ...(filters?.priority ? { priority: filters.priority } : {}),
    },
    orderBy: [
      { completedAt: 'asc' },
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  })

  return tasks
}

export async function createTask(data: z.infer<typeof taskSchema>) {
  const userId = await getCurrentUserId()
  const validated = taskSchema.parse(data)

  const task = await prisma.task.create({
    data: {
      ...validated,
      userId,
    },
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return task
}

export async function updateTask(id: string, data: Partial<z.infer<typeof taskSchema>>) {
  const userId = await getCurrentUserId()

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error('Tâche non trouvée')
  }

  const task = await prisma.task.update({
    where: { id },
    data,
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return task
}

export async function completeTask(id: string) {
  const userId = await getCurrentUserId()

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error('Tâche non trouvée')
  }

  const task = await prisma.task.update({
    where: { id },
    data: { completedAt: new Date() },
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return task
}

export async function uncompleteTask(id: string) {
  const userId = await getCurrentUserId()

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error('Tâche non trouvée')
  }

  const task = await prisma.task.update({
    where: { id },
    data: { completedAt: null },
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return task
}

export async function deleteTask(id: string) {
  const userId = await getCurrentUserId()

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error('Tâche non trouvée')
  }

  await prisma.task.delete({
    where: { id },
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}



