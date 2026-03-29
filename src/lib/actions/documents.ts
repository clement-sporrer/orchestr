'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'
import type { DocumentEntity, DocumentType } from '@/generated/prisma'

export type { DocumentEntity, DocumentType }

export async function getDocuments(entityType: DocumentEntity, entityId: string) {
  const organizationId = await getOrganizationId()

  return prisma.document.findMany({
    where: { organizationId, entityType, entityId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createDocument(data: {
  entityType: DocumentEntity
  entityId: string
  documentType: DocumentType
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}) {
  const organizationId = await getOrganizationId()

  const doc = await prisma.document.create({
    data: { ...data, organizationId },
  })

  revalidatePath('/')
  return doc
}

export async function deleteDocument(id: string) {
  const organizationId = await getOrganizationId()

  await prisma.document.delete({
    where: { id, organizationId },
  })

  revalidatePath('/')
}
