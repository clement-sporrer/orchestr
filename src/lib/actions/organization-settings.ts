'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  organizationSettingsSchema,
  updateOrganizationSettingsSchema,
  type OrganizationSettingsInput,
  type UpdateOrganizationSettingsInput,
} from '@/lib/validations/candidate'
import { getOrganizationId } from '@/lib/auth/helpers'

/**
 * Get organization settings
 * Creates default settings if none exist
 */
export async function getOrganizationSettings() {
  try {
    const organizationId = await getOrganizationId()

    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
      select: {
        id: true,
        domains: true,
        sectors: true,
        jobFamilies: true,
        clientCategories: true,
        contractTypes: true,
        seniorities: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create default settings if none exist (Prisma defaults used for new fields)
    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: { organizationId },
        select: {
          id: true,
          domains: true,
          sectors: true,
          jobFamilies: true,
          clientCategories: true,
          contractTypes: true,
          seniorities: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error getting organization settings:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des paramètres',
    }
  }
}

/**
 * Update organization settings (full update)
 */
export async function updateOrganizationSettings(
  input: OrganizationSettingsInput
) {
  try {
    const organizationId = await getOrganizationId()

    // Validate input
    const validatedInput = organizationSettingsSchema.parse(input)

    // Upsert settings
    const settings = await prisma.organizationSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...validatedInput,
      },
      update: validatedInput,
      select: {
        id: true,
        domains: true,
        sectors: true,
        jobFamilies: true,
        clientCategories: true,
        contractTypes: true,
        seniorities: true,
        updatedAt: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating organization settings:', error)
    return {
      success: false,
      error: 'Erreur lors de la mise à jour des paramètres',
    }
  }
}

/**
 * Partially update organization settings
 */
export async function patchOrganizationSettings(
  input: UpdateOrganizationSettingsInput
) {
  try {
    const organizationId = await getOrganizationId()

    // Validate input
    const validatedInput = updateOrganizationSettingsSchema.parse(input)

    // Get current settings or create defaults
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
    })

    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: { organizationId },
      })
    }

    // Update only provided fields
    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: validatedInput,
      select: {
        id: true,
        domains: true,
        sectors: true,
        jobFamilies: true,
        clientCategories: true,
        contractTypes: true,
        seniorities: true,
        updatedAt: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings }
  } catch (error) {
    console.error('Error patching organization settings:', error)
    return {
      success: false,
      error: 'Erreur lors de la mise à jour des paramètres',
    }
  }
}

/**
 * Add a domain to the organization settings
 */
export async function addDomain(domain: string) {
  try {
    const organizationId = await getOrganizationId()

    // Get current settings
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Impossible de récupérer les paramètres',
      }
    }

    const currentDomains = result.data.domains || []

    // Check if domain already exists
    if (currentDomains.includes(domain)) {
      return { success: false, error: 'Ce domaine existe déjà' }
    }

    // Add domain
    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        domains: [...currentDomains, domain],
      },
      select: {
        domains: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings.domains }
  } catch (error) {
    console.error('Error adding domain:', error)
    return { success: false, error: "Erreur lors de l'ajout du domaine" }
  }
}

/**
 * Remove a domain from the organization settings
 */
export async function removeDomain(domain: string) {
  try {
    const organizationId = await getOrganizationId()

    // Get current settings
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Impossible de récupérer les paramètres',
      }
    }

    const currentDomains = result.data.domains || []

    // Remove domain
    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        domains: currentDomains.filter((d) => d !== domain),
      },
      select: {
        domains: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings.domains }
  } catch (error) {
    console.error('Error removing domain:', error)
    return {
      success: false,
      error: 'Erreur lors de la suppression du domaine',
    }
  }
}

/**
 * Add a sector to the organization settings
 */
export async function addSector(sector: string) {
  try {
    const organizationId = await getOrganizationId()

    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Impossible de récupérer les paramètres',
      }
    }

    const currentSectors = result.data.sectors || []

    if (currentSectors.includes(sector)) {
      return { success: false, error: 'Ce secteur existe déjà' }
    }

    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        sectors: [...currentSectors, sector],
      },
      select: {
        sectors: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings.sectors }
  } catch (error) {
    console.error('Error adding sector:', error)
    return { success: false, error: "Erreur lors de l'ajout du secteur" }
  }
}

/**
 * Remove a sector from the organization settings
 */
export async function removeSector(sector: string) {
  try {
    const organizationId = await getOrganizationId()

    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Impossible de récupérer les paramètres',
      }
    }

    const currentSectors = result.data.sectors || []

    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        sectors: currentSectors.filter((s) => s !== sector),
      },
      select: {
        sectors: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings.sectors }
  } catch (error) {
    console.error('Error removing sector:', error)
    return {
      success: false,
      error: 'Erreur lors de la suppression du secteur',
    }
  }
}

/**
 * Add a job family to the organization settings
 */
export async function addJobFamily(jobFamily: string) {
  try {
    const organizationId = await getOrganizationId()

    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Impossible de récupérer les paramètres',
      }
    }

    const currentJobFamilies = result.data.jobFamilies || []

    if (currentJobFamilies.includes(jobFamily)) {
      return {
        success: false,
        error: 'Cette famille de poste existe déjà',
      }
    }

    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        jobFamilies: [...currentJobFamilies, jobFamily],
      },
      select: {
        jobFamilies: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings.jobFamilies }
  } catch (error) {
    console.error('Error adding job family:', error)
    return {
      success: false,
      error: "Erreur lors de l'ajout de la famille de poste",
    }
  }
}

/**
 * Remove a job family from the organization settings
 */
export async function removeJobFamily(jobFamily: string) {
  try {
    const organizationId = await getOrganizationId()

    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Impossible de récupérer les paramètres',
      }
    }

    const currentJobFamilies = result.data.jobFamilies || []

    const updatedSettings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        jobFamilies: currentJobFamilies.filter((j) => j !== jobFamily),
      },
      select: {
        jobFamilies: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: updatedSettings.jobFamilies }
  } catch (error) {
    console.error('Error removing job family:', error)
    return {
      success: false,
      error: 'Erreur lors de la suppression de la famille de poste',
    }
  }
}

/**
 * Add a client category (PRD v2)
 */
export async function addClientCategory(category: string) {
  try {
    const organizationId = await getOrganizationId()
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return { success: false, error: 'Impossible de récupérer les paramètres' }
    }
    const current = result.data.clientCategories || []
    if (current.includes(category)) {
      return { success: false, error: 'Cette catégorie existe déjà' }
    }
    const updated = await prisma.organizationSettings.update({
      where: { organizationId },
      data: { clientCategories: [...current, category] },
      select: { clientCategories: true },
    })
    revalidatePath('/settings/organization')
    revalidatePath('/clients')
    return { success: true, data: updated.clientCategories }
  } catch (error) {
    console.error('Error adding client category:', error)
    return { success: false, error: "Erreur lors de l'ajout" }
  }
}

export async function removeClientCategory(category: string) {
  try {
    const organizationId = await getOrganizationId()
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return { success: false, error: 'Impossible de récupérer les paramètres' }
    }
    const current = result.data.clientCategories || []
    const updated = await prisma.organizationSettings.update({
      where: { organizationId },
      data: { clientCategories: current.filter((c) => c !== category) },
      select: { clientCategories: true },
    })
    revalidatePath('/settings/organization')
    revalidatePath('/clients')
    return { success: true, data: updated.clientCategories }
  } catch (error) {
    console.error('Error removing client category:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

/**
 * Add a contract type (PRD v2)
 */
export async function addContractType(contractType: string) {
  try {
    const organizationId = await getOrganizationId()
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return { success: false, error: 'Impossible de récupérer les paramètres' }
    }
    const current = result.data.contractTypes || []
    if (current.includes(contractType)) {
      return { success: false, error: 'Ce type existe déjà' }
    }
    const updated = await prisma.organizationSettings.update({
      where: { organizationId },
      data: { contractTypes: [...current, contractType] },
      select: { contractTypes: true },
    })
    revalidatePath('/settings/organization')
    return { success: true, data: updated.contractTypes }
  } catch (error) {
    console.error('Error adding contract type:', error)
    return { success: false, error: "Erreur lors de l'ajout" }
  }
}

export async function removeContractType(contractType: string) {
  try {
    const organizationId = await getOrganizationId()
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return { success: false, error: 'Impossible de récupérer les paramètres' }
    }
    const current = result.data.contractTypes || []
    const updated = await prisma.organizationSettings.update({
      where: { organizationId },
      data: { contractTypes: current.filter((c) => c !== contractType) },
      select: { contractTypes: true },
    })
    revalidatePath('/settings/organization')
    return { success: true, data: updated.contractTypes }
  } catch (error) {
    console.error('Error removing contract type:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

/**
 * Add a seniority (PRD v2)
 */
export async function addSeniority(seniority: string) {
  try {
    const organizationId = await getOrganizationId()
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return { success: false, error: 'Impossible de récupérer les paramètres' }
    }
    const current = result.data.seniorities || []
    if (current.includes(seniority)) {
      return { success: false, error: 'Cette séniorité existe déjà' }
    }
    const updated = await prisma.organizationSettings.update({
      where: { organizationId },
      data: { seniorities: [...current, seniority] },
      select: { seniorities: true },
    })
    revalidatePath('/settings/organization')
    return { success: true, data: updated.seniorities }
  } catch (error) {
    console.error('Error adding seniority:', error)
    return { success: false, error: "Erreur lors de l'ajout" }
  }
}

export async function removeSeniority(seniority: string) {
  try {
    const organizationId = await getOrganizationId()
    const result = await getOrganizationSettings()
    if (!result.success || !result.data) {
      return { success: false, error: 'Impossible de récupérer les paramètres' }
    }
    const current = result.data.seniorities || []
    const updated = await prisma.organizationSettings.update({
      where: { organizationId },
      data: { seniorities: current.filter((s) => s !== seniority) },
      select: { seniorities: true },
    })
    revalidatePath('/settings/organization')
    return { success: true, data: updated.seniorities }
  } catch (error) {
    console.error('Error removing seniority:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

// PRD v2.0 default list values
const DEFAULT_DOMAINS = ['Leasing', 'Crédit Consommation', 'Informatique', 'M&A', 'Finance']
const DEFAULT_SECTORS = ['Courtier/Loueur', 'Captive', 'Établissement Financier', 'Asset Management', 'Banque']
const DEFAULT_JOB_FAMILIES = ['Commercial', 'Manager Commercial', 'Direction', 'Support', 'Technique']
const DEFAULT_CLIENT_CATEGORIES = ['Loueur', 'Établissement Financier', 'Industriel', 'Startup', 'Corporate']
const DEFAULT_CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance']
const DEFAULT_SENIORITIES = ['1-5 ans', '5-10 ans', '10-20 ans', '20+ ans']

/**
 * Reset organization settings to defaults
 */
export async function resetOrganizationSettings() {
  try {
    const organizationId = await getOrganizationId()

    const settings = await prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        domains: DEFAULT_DOMAINS,
        sectors: DEFAULT_SECTORS,
        jobFamilies: DEFAULT_JOB_FAMILIES,
        clientCategories: DEFAULT_CLIENT_CATEGORIES,
        contractTypes: DEFAULT_CONTRACT_TYPES,
        seniorities: DEFAULT_SENIORITIES,
      },
      select: {
        id: true,
        domains: true,
        sectors: true,
        jobFamilies: true,
        clientCategories: true,
        contractTypes: true,
        seniorities: true,
        updatedAt: true,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/candidates')

    return { success: true, data: settings }
  } catch (error) {
    console.error('Error resetting organization settings:', error)
    return {
      success: false,
      error: 'Erreur lors de la réinitialisation des paramètres',
    }
  }
}
