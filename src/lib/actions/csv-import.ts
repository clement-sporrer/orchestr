'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { ImportDestination } from '@/generated/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'

interface CsvRow {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  currentPosition?: string
  currentCompany?: string
  linkedin?: string
  tags?: string
}

interface PreviewResult {
  status: 'new' | 'update' | 'merge' | 'ignore' | 'error'
  data: CsvRow
  existingCandidate?: { id: string; name: string }
  mergeWith?: { id: string; name: string; matchField: string }
  error?: string
}

// Preview import without committing
export async function previewCsvImport(
  rows: CsvRow[],
  _destination: ImportDestination,
  _destinationId?: string
): Promise<{
  total: number
  new: number
  updated: number
  merged: number
  ignored: number
  errors: number
  previews: PreviewResult[]
}> {
  const organizationId = await getOrganizationId()

  // --- Batch duplicate detection ---
  // Collect unique values upfront, run 3 queries total (instead of 3 per row)
  const emails = [...new Set(rows.map(r => r.email).filter(Boolean) as string[])]
  const phones = [...new Set(rows.map(r => r.phone).filter(Boolean) as string[])]
  const linkedinUrls = [...new Set(rows.map(r => r.linkedin).filter(Boolean) as string[])]

  const [byEmailList, byPhoneList, byUrlList] = await Promise.all([
    emails.length
      ? prisma.candidate.findMany({
          where: { organizationId, email: { in: emails } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [],
    phones.length
      ? prisma.candidate.findMany({
          where: { organizationId, phone: { in: phones } },
          select: { id: true, firstName: true, lastName: true, phone: true },
        })
      : [],
    linkedinUrls.length
      ? prisma.candidate.findMany({
          where: { organizationId, linkedin: { in: linkedinUrls } },
          select: { id: true, firstName: true, lastName: true, linkedin: true },
        })
      : [],
  ])

  const emailMap = new Map(byEmailList.map(c => [c.email!, c]))
  const phoneMap = new Map(byPhoneList.map(c => [c.phone!, c]))
  const urlMap = new Map(byUrlList.map(c => [c.linkedin!, c]))
  // --- End batch ---

  const previews: PreviewResult[] = []
  let newCount = 0
  let updateCount = 0
  let mergeCount = 0
  let errorCount = 0

  for (const row of rows) {
    if (!row.firstName || !row.lastName) {
      previews.push({
        status: 'error',
        data: row,
        error: 'Prénom et nom requis',
      })
      errorCount++
      continue
    }

    const existingByEmail = row.email ? (emailMap.get(row.email) ?? null) : null
    const existingByPhone = row.phone ? (phoneMap.get(row.phone) ?? null) : null
    const existingByUrl = row.linkedin ? (urlMap.get(row.linkedin) ?? null) : null

    if (existingByEmail) {
      previews.push({
        status: 'update',
        data: row,
        existingCandidate: {
          id: existingByEmail.id,
          name: `${existingByEmail.firstName} ${existingByEmail.lastName}`,
        },
      })
      updateCount++
    } else if (existingByPhone || existingByUrl) {
      const existing = (existingByPhone ?? existingByUrl)!
      previews.push({
        status: 'merge',
        data: row,
        mergeWith: {
          id: existing.id,
          name: `${existing.firstName} ${existing.lastName}`,
          matchField: existingByPhone ? 'phone' : 'linkedin',
        },
      })
      mergeCount++
    } else {
      previews.push({
        status: 'new',
        data: row,
      })
      newCount++
    }
  }

  return {
    total: rows.length,
    new: newCount,
    updated: updateCount,
    merged: mergeCount,
    ignored: 0,
    errors: errorCount,
    previews,
  }
}

// Execute import
export async function executeCsvImport(
  rows: CsvRow[],
  destination: ImportDestination,
  destinationId?: string,
  mapping?: Record<string, string>,
  fileName?: string
) {
  const organizationId = await getOrganizationId()

  // Create import record
  const csvImport = await prisma.csvImport.create({
    data: {
      organizationId,
      fileName: fileName || 'import.csv',
      destination,
      destinationId,
      status: 'PROCESSING',
      totalRows: rows.length,
      mapping: mapping ?? undefined,
      rollbackAvailableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  })

  // --- Batch duplicate detection ---
  // Collect unique values upfront, run 3 queries total (instead of 3 per row)
  const emails = [...new Set(rows.map(r => r.email).filter(Boolean) as string[])]
  const phones = [...new Set(rows.map(r => r.phone).filter(Boolean) as string[])]
  const linkedinUrls = [...new Set(rows.map(r => r.linkedin).filter(Boolean) as string[])]

  const [byEmailList, byPhoneList, byUrlList] = await Promise.all([
    emails.length
      ? prisma.candidate.findMany({
          where: { organizationId, email: { in: emails } },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, linkedin: true, location: true, currentPosition: true, currentCompany: true, tags: true },
        })
      : [],
    phones.length
      ? prisma.candidate.findMany({
          where: { organizationId, phone: { in: phones } },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, linkedin: true, location: true, currentPosition: true, currentCompany: true, tags: true },
        })
      : [],
    linkedinUrls.length
      ? prisma.candidate.findMany({
          where: { organizationId, linkedin: { in: linkedinUrls } },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, linkedin: true, location: true, currentPosition: true, currentCompany: true, tags: true },
        })
      : [],
  ])

  const emailMap = new Map(byEmailList.map(c => [c.email!, c]))
  const phoneMap = new Map(byPhoneList.map(c => [c.phone!, c]))
  const urlMap = new Map(byUrlList.map(c => [c.linkedin!, c]))
  // --- End batch ---

  const affectedCandidateIds: string[] = []
  let newCount = 0
  let updatedCount = 0
  let mergedCount = 0
  let errorCount = 0
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    try {
      if (!row.firstName || !row.lastName) {
        errors.push({ row: i + 1, error: 'Prénom et nom requis' })
        errorCount++
        continue
      }

      // Check for existing using pre-loaded maps
      const existingByEmail = row.email ? (emailMap.get(row.email) ?? null) : null
      const existingByPhone = row.phone ? (phoneMap.get(row.phone) ?? null) : null
      const existingByUrl = row.linkedin ? (urlMap.get(row.linkedin) ?? null) : null
      const existingCandidate = existingByEmail ?? existingByPhone ?? existingByUrl ?? null

      const tags = row.tags 
        ? row.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      if (existingCandidate) {
        // Update or merge
        await prisma.candidate.update({
          where: { id: existingCandidate.id },
          data: {
            // Only update empty fields
            email: existingCandidate.email || row.email || null,
            phone: existingCandidate.phone || row.phone || null,
            location: existingCandidate.location || row.location || null,
            currentPosition: existingCandidate.currentPosition || row.currentPosition || null,
            currentCompany: existingCandidate.currentCompany || row.currentCompany || null,
            linkedin: existingCandidate.linkedin || row.linkedin || null,
            tags: [...new Set([...existingCandidate.tags, ...tags])],
          },
        })
        affectedCandidateIds.push(existingCandidate.id)
        if (!existingByEmail && (existingByPhone || existingByUrl)) {
          mergedCount++
        } else {
          updatedCount++
        }
      } else {
        // Create new
        const candidate = await prisma.candidate.create({
          data: {
            organizationId,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || null,
            phone: row.phone || null,
            location: row.location || null,
            currentPosition: row.currentPosition || null,
            currentCompany: row.currentCompany || null,
            linkedin: row.linkedin || null,
            tags,
          },
        })
        affectedCandidateIds.push(candidate.id)
        newCount++

        // Add to pool or mission if specified
        if (destination === 'POOL' && destinationId) {
          await prisma.candidatePool.create({
            data: {
              candidateId: candidate.id,
              poolId: destinationId,
            },
          })
        } else if (destination === 'MISSION' && destinationId) {
          await prisma.missionCandidate.create({
            data: {
              candidateId: candidate.id,
              missionId: destinationId,
            },
          })
        }
      }
    } catch (err) {
      errors.push({ 
        row: i + 1, 
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      })
      errorCount++
    }
  }

  // Update import record
  await prisma.csvImport.update({
    where: { id: csvImport.id },
    data: {
      status: 'COMPLETED',
      newCount,
      updatedCount,
      mergedCount,
      errorCount,
      affectedCandidateIds,
      errors: errors.length > 0 ? errors : undefined,
      completedAt: new Date(),
    },
  })

  revalidatePath('/candidates')
  if (destination === 'POOL' && destinationId) {
    revalidatePath(`/pools/${destinationId}`)
  }
  if (destination === 'MISSION' && destinationId) {
    revalidatePath(`/missions/${destinationId}`)
  }

  return {
    importId: csvImport.id,
    total: rows.length,
    new: newCount,
    updated: updatedCount,
    merged: mergedCount,
    errors: errorCount,
  }
}

// Rollback import
export async function rollbackCsvImport(importId: string) {
  const organizationId = await getOrganizationId()

  const csvImport = await prisma.csvImport.findFirst({
    where: { id: importId, organizationId },
  })

  if (!csvImport) {
    throw new Error('Import non trouvé')
  }

  if (csvImport.status === 'ROLLED_BACK') {
    throw new Error('Import déjà annulé')
  }

  if (csvImport.rollbackAvailableUntil && csvImport.rollbackAvailableUntil < new Date()) {
    throw new Error('Délai d\'annulation dépassé')
  }

  // Delete newly created candidates
  await prisma.candidate.deleteMany({
    where: {
      id: { in: csvImport.affectedCandidateIds },
      organizationId,
    },
  })

  await prisma.csvImport.update({
    where: { id: importId },
    data: { status: 'ROLLED_BACK' },
  })

  revalidatePath('/candidates')
  return { success: true }
}

// Get import history
export async function getImportHistory() {
  const organizationId = await getOrganizationId()

  const imports = await prisma.csvImport.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return imports
}

