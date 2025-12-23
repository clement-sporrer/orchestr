import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreCandidate } from '@/lib/ai/scoring'
import type { Candidate, Mission } from '@/generated/prisma'

// Types for LinkedIn profile data from extension
export interface LinkedInExperience {
  company: string
  title: string
  startDate?: string
  endDate?: string
  description?: string
  location?: string
}

export interface LinkedInEducation {
  school: string
  degree?: string
  field?: string
  year?: string
}

export interface LinkedInProfileData {
  linkedinUrl: string
  firstName: string
  lastName: string
  headline?: string
  summary?: string
  location?: string
  email?: string
  phone?: string
  connections?: number
  experiences?: LinkedInExperience[]
  education?: LinkedInEducation[]
  skills?: string[]
  languages?: string[]
  certifications?: string[]
}

interface CaptureRequest {
  profileData: LinkedInProfileData
  missionId?: string
  addToVivier?: boolean
}

// Verify API key from extension
async function verifyApiKey(request: NextRequest): Promise<{ userId: string; organizationId: string } | null> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const apiKey = authHeader.substring(7)
  
  // For now, API key is in format: org_<organizationId>_user_<userId>
  // In production, this should be a proper token system
  const match = apiKey.match(/^org_([a-zA-Z0-9]+)_user_([a-zA-Z0-9]+)$/)
  
  if (!match) {
    // Try to find user by email if it's an email-based key
    const user = await prisma.user.findFirst({
      where: { email: apiKey },
      select: { id: true, organizationId: true },
    })
    
    if (user) {
      return { userId: user.id, organizationId: user.organizationId }
    }
    
    return null
  }
  
  const [, organizationId, userId] = match
  
  // Verify user exists and belongs to organization
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
  })
  
  if (!user) {
    return null
  }
  
  return { userId, organizationId }
}

// Find existing candidate by LinkedIn URL, email, or phone
async function findExistingCandidate(
  organizationId: string,
  profileData: LinkedInProfileData
): Promise<Candidate | null> {
  // Try to find by LinkedIn URL first
  if (profileData.linkedinUrl) {
    const byUrl = await prisma.candidate.findFirst({
      where: {
        organizationId,
        profileUrl: profileData.linkedinUrl,
      },
    })
    if (byUrl) return byUrl
  }
  
  // Try by email
  if (profileData.email) {
    const byEmail = await prisma.candidate.findFirst({
      where: {
        organizationId,
        email: profileData.email,
      },
    })
    if (byEmail) return byEmail
  }
  
  // Try by exact name match (less reliable)
  const byName = await prisma.candidate.findFirst({
    where: {
      organizationId,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    },
  })
  
  return byName
}

// Extract current position and company from experiences
function extractCurrentPosition(experiences?: LinkedInExperience[]): { 
  currentPosition?: string
  currentCompany?: string 
} {
  if (!experiences || experiences.length === 0) {
    return {}
  }
  
  // Find current position (no end date or most recent)
  const current = experiences.find(exp => !exp.endDate) || experiences[0]
  
  return {
    currentPosition: current.title,
    currentCompany: current.company,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyApiKey(request)
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      )
    }
    
    const { organizationId, userId } = auth
    
    // Parse request body
    const body: CaptureRequest = await request.json()
    const { profileData, missionId, addToVivier = true } = body
    
    // Validate required fields
    if (!profileData.firstName || !profileData.lastName) {
      return NextResponse.json(
        { error: 'firstName and lastName are required' },
        { status: 400 }
      )
    }
    
    // Check if mission exists and belongs to organization
    let mission: Mission | null = null
    if (missionId) {
      mission = await prisma.mission.findFirst({
        where: { id: missionId, organizationId },
      })
      
      if (!mission) {
        return NextResponse.json(
          { error: 'Mission not found or unauthorized' },
          { status: 404 }
        )
      }
    }
    
    // Check for existing candidate (deduplication)
    const existingCandidate = await findExistingCandidate(organizationId, profileData)
    
    const { currentPosition, currentCompany } = extractCurrentPosition(profileData.experiences)
    
    let candidate: Candidate
    let isNew = false
    
    if (existingCandidate) {
      // Update existing candidate
      candidate = await prisma.candidate.update({
        where: { id: existingCandidate.id },
        data: {
          // Only update if new data is better
          profileUrl: profileData.linkedinUrl || existingCandidate.profileUrl,
          email: profileData.email || existingCandidate.email,
          phone: profileData.phone || existingCandidate.phone,
          location: profileData.location || existingCandidate.location,
          currentPosition: currentPosition || existingCandidate.currentPosition,
          currentCompany: currentCompany || existingCandidate.currentCompany,
        },
      })
      
      // Update or create enrichment
      await prisma.candidateEnrichment.upsert({
        where: { candidateId: candidate.id },
        create: {
          candidateId: candidate.id,
          linkedinUrl: profileData.linkedinUrl,
          linkedinHeadline: profileData.headline,
          linkedinSummary: profileData.summary,
          linkedinConnections: profileData.connections,
          experiences: profileData.experiences as unknown as object,
          education: profileData.education as unknown as object,
          skills: profileData.skills || [],
          languages: profileData.languages || [],
          certifications: profileData.certifications || [],
          lastEnrichedAt: new Date(),
          enrichmentSource: 'chrome_extension',
        },
        update: {
          linkedinUrl: profileData.linkedinUrl,
          linkedinHeadline: profileData.headline,
          linkedinSummary: profileData.summary,
          linkedinConnections: profileData.connections,
          experiences: profileData.experiences as unknown as object,
          education: profileData.education as unknown as object,
          skills: profileData.skills || [],
          languages: profileData.languages || [],
          certifications: profileData.certifications || [],
          lastEnrichedAt: new Date(),
          enrichmentSource: 'chrome_extension',
        },
      })
    } else {
      // Create new candidate
      candidate = await prisma.candidate.create({
        data: {
          organizationId,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          location: profileData.location,
          profileUrl: profileData.linkedinUrl,
          currentPosition,
          currentCompany,
          status: 'ACTIVE',
          enrichment: {
            create: {
              linkedinUrl: profileData.linkedinUrl,
              linkedinHeadline: profileData.headline,
              linkedinSummary: profileData.summary,
              linkedinConnections: profileData.connections,
              experiences: profileData.experiences as unknown as object,
              education: profileData.education as unknown as object,
              skills: profileData.skills || [],
              languages: profileData.languages || [],
              certifications: profileData.certifications || [],
              lastEnrichedAt: new Date(),
              enrichmentSource: 'chrome_extension',
            },
          },
        },
      })
      isNew = true
    }
    
    // Add to mission if specified
    let missionCandidate = null
    let score = null
    
    if (mission) {
      // Check if already in mission
      const existingMc = await prisma.missionCandidate.findFirst({
        where: {
          missionId: mission.id,
          candidateId: candidate.id,
        },
      })
      
      if (!existingMc) {
        // Score the candidate
        const scoringResult = await scoreCandidate(candidate, mission)
        score = scoringResult.score
        
        // Add to pipeline
        missionCandidate = await prisma.missionCandidate.create({
          data: {
            missionId: mission.id,
            candidateId: candidate.id,
            stage: 'SOURCED',
            score: scoringResult.score,
            scoreReasons: scoringResult.reasons,
          },
        })
        
        // Get organizationId from mission
        const missionWithOrg = await prisma.mission.findUnique({
          where: { id: mission.id },
          select: { organizationId: true },
        })

        if (missionWithOrg) {
          // Create interaction for tracking
          await prisma.interaction.create({
            data: {
              organizationId: missionWithOrg.organizationId,
              candidateId: candidate.id,
              missionCandidateId: missionCandidate.id,
              userId,
              type: 'NOTE',
              content: `Candidat ajouté via extension Chrome (score: ${scoringResult.score}%)`,
            },
          })
        }
      } else {
        missionCandidate = existingMc
        score = existingMc.score
      }
    }
    
    // Fetch complete candidate data with enrichment
    const completeCandidate = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: {
        enrichment: true,
      },
    })
    
    return NextResponse.json({
      success: true,
      isNew,
      isDuplicate: !isNew,
      candidate: completeCandidate,
      missionCandidate,
      score,
      message: isNew 
        ? 'Candidat cree avec succes' 
        : 'Candidat existant mis a jour',
    })
    
  } catch (error) {
    console.error('Extension capture error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve missions for the extension dropdown
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request)
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { organizationId } = auth
    
    // Get active missions for the dropdown
    const missions = await prisma.mission.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        client: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            missionCandidates: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })
    
    return NextResponse.json({
      missions: missions.map(m => ({
        id: m.id,
        title: m.title,
        clientName: m.client.name,
        candidateCount: m._count.missionCandidates,
      })),
    })
    
  } catch (error) {
    console.error('Extension get missions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



