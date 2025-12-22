'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const poolSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
})

async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifié')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { organizationId: true },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouvé')
  }

  return dbUser.organizationId
}

export async function getPools() {
  const organizationId = await getOrganizationId()

  const pools = await prisma.pool.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return pools
}

export async function getPool(id: string) {
  const organizationId = await getOrganizationId()

  const pool = await prisma.pool.findFirst({
    where: { id, organizationId },
    include: {
      candidates: {
        include: {
          candidate: true,
        },
        orderBy: { addedAt: 'desc' },
      },
    },
  })

  if (!pool) {
    throw new Error('Pool non trouvé')
  }

  return pool
}

export async function createPool(data: z.infer<typeof poolSchema>) {
  const organizationId = await getOrganizationId()
  const validated = poolSchema.parse(data)

  const pool = await prisma.pool.create({
    data: {
      ...validated,
      organizationId,
    },
  })

  revalidatePath('/pools')
  return pool
}

export async function updatePool(id: string, data: z.infer<typeof poolSchema>) {
  const organizationId = await getOrganizationId()
  const validated = poolSchema.parse(data)

  const existing = await prisma.pool.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Pool non trouvé')
  }

  const pool = await prisma.pool.update({
    where: { id },
    data: validated,
  })

  revalidatePath('/pools')
  revalidatePath(`/pools/${id}`)
  return pool
}

export async function deletePool(id: string) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.pool.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Pool non trouvé')
  }

  await prisma.pool.delete({
    where: { id },
  })

  revalidatePath('/pools')
}

export async function addCandidateToPool(poolId: string, candidateId: string) {
  const organizationId = await getOrganizationId()

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, organizationId },
  })

  if (!pool) {
    throw new Error('Pool non trouvé')
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, organizationId },
  })

  if (!candidate) {
    throw new Error('Candidat non trouvé')
  }

  const existing = await prisma.candidatePool.findFirst({
    where: { poolId, candidateId },
  })

  if (existing) {
    throw new Error('Candidat déjà dans ce pool')
  }

  await prisma.candidatePool.create({
    data: { poolId, candidateId },
  })

  revalidatePath(`/pools/${poolId}`)
}

export async function removeCandidateFromPool(poolId: string, candidateId: string) {
  const organizationId = await getOrganizationId()

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, organizationId },
  })

  if (!pool) {
    throw new Error('Pool non trouvé')
  }

  await prisma.candidatePool.deleteMany({
    where: { poolId, candidateId },
  })

  revalidatePath(`/pools/${poolId}`)
}



