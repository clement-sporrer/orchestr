import { PrismaClient } from '../src/generated/prisma'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Create Supabase admin client for user creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function main() {
  console.log('🌱 Seeding database...')

  // Dev user credentials
  const devEmail = 'dev@orchestr.io'
  const devPassword = 'DevOrchestR2024!'
  const devName = 'Dev Owner'
  const orgName = 'Orchestr Dev'

  // 1. Create organization first
  console.log('Creating organization...')
  const organization = await prisma.organization.upsert({
    where: { id: 'org_dev_001' },
    update: {},
    create: {
      id: 'org_dev_001',
      name: orgName,
      contactEmail: devEmail,
      defaultCalendlyLink: 'https://calendly.com/orchestr-dev',
    },
  })
  console.log(`✅ Organization created: ${organization.name}`)

  // 2. Create user in Supabase Auth
  console.log('Creating Supabase auth user...')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: devEmail,
    password: devPassword,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: devName,
      organization_id: organization.id,
    },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('⚠️  Auth user already exists, continuing...')
    } else {
      throw authError
    }
  } else {
    console.log(`✅ Auth user created: ${authData.user?.email}`)
  }

  // 3. Create user in database
  console.log('Creating database user...')
  const user = await prisma.user.upsert({
    where: { email: devEmail },
    update: {
      name: devName,
      role: 'ADMIN',
    },
    create: {
      email: devEmail,
      name: devName,
      role: 'ADMIN',
      organizationId: organization.id,
    },
  })
  console.log(`✅ Database user created: ${user.email}`)

  // 4. Create a sample client
  console.log('Creating sample client...')
  const client = await prisma.client.upsert({
    where: { id: 'client_demo_001' },
    update: {},
    create: {
      id: 'client_demo_001',
      organizationId: organization.id,
      companyName: 'TechCorp Demo',
      sector: 'Technology',
      website: 'https://techcorp.demo',
      notes: 'Client de démonstration',
    },
  })
  console.log(`✅ Sample client created: ${client.companyName}`)

  // 5. Create a sample contact
  console.log('Creating sample contact...')
  await prisma.contact.upsert({
    where: { id: 'contact_demo_001' },
    update: {},
    create: {
      id: 'contact_demo_001',
      clientId: client.id,
      firstName: 'Marie',
      lastName: 'Dupont',
      title: 'DRH',
      email: 'marie.dupont@techcorp.demo',
      phone: '+33 6 12 34 56 78',
    },
  })
  console.log('✅ Sample contact created')

  // 6. Create a sample mission
  console.log('Creating sample mission...')
  const mission = await prisma.mission.upsert({
    where: { id: 'mission_demo_001' },
    update: {},
    create: {
      id: 'mission_demo_001',
      organizationId: organization.id,
      clientId: client.id,
      recruiterId: user.id,
      status: 'ACTIVE',
      title: 'Senior Full-Stack Developer',
      location: 'Paris, France (Hybrid)',
      contractType: 'CDI',
      seniority: 'SENIOR',
      salaryMin: 55000,
      salaryMax: 75000,
      salaryVisible: true,
      context: 'TechCorp recherche un développeur senior pour renforcer son équipe produit. Contexte de forte croissance.',
      contextVisibility: 'INTERNAL',
      responsibilities: `• Développement de nouvelles fonctionnalités
• Code review et mentorat des juniors
• Participation aux décisions techniques
• Collaboration avec l'équipe produit`,
      responsibilitiesVisibility: 'ALL',
      mustHave: `• 5+ ans d'expérience en développement web
• Maîtrise de React et Node.js
• Expérience avec PostgreSQL
• Bon niveau d'anglais`,
      mustHaveVisibility: 'ALL',
      niceToHave: `• Expérience avec TypeScript
• Connaissance de Docker/Kubernetes
• Contributions open source`,
      niceToHaveVisibility: 'ALL',
      redFlags: `• Candidat cherchant du full remote uniquement
• Prétentions salariales > 80k€`,
      process: `1. Call RH (30 min)
2. Test technique (1h)
3. Entretien technique (1h)
4. Entretien final avec CEO`,
      processVisibility: 'INTERNAL_CLIENT',
      // scoreThreshold removed in pipeline simplification
    },
  })
  console.log(`✅ Sample mission created: ${mission.title}`)

  // 7. Create a sample pool
  console.log('Creating sample pool...')
  await prisma.pool.upsert({
    where: { id: 'pool_demo_001' },
    update: {},
    create: {
      id: 'pool_demo_001',
      organizationId: organization.id,
      name: 'Développeurs Senior',
      description: 'Pool de développeurs expérimentés (5+ ans)',
    },
  })
  console.log('✅ Sample pool created')

  // 8. Create sample candidates
  console.log('Creating sample candidates...')
  const candidates = [
    {
      id: 'candidate_demo_001',
      firstName: 'Jean',
      lastName: 'Martin',
      email: 'jean.martin@email.com',
      phone: '+33 6 11 22 33 44',
      location: 'Paris',
      currentPosition: 'Senior Developer',
      currentCompany: 'StartupXYZ',
      tags: ['React', 'Node.js', 'TypeScript'],
    },
    {
      id: 'candidate_demo_002',
      firstName: 'Sophie',
      lastName: 'Bernard',
      email: 'sophie.bernard@email.com',
      phone: '+33 6 22 33 44 55',
      location: 'Lyon',
      currentPosition: 'Lead Developer',
      currentCompany: 'BigTech',
      tags: ['Python', 'Django', 'PostgreSQL'],
    },
    {
      id: 'candidate_demo_003',
      firstName: 'Thomas',
      lastName: 'Petit',
      email: 'thomas.petit@email.com',
      location: 'Remote',
      currentPosition: 'Full-Stack Developer',
      currentCompany: 'Freelance',
      tags: ['Vue.js', 'Laravel', 'MySQL'],
    },
  ]

  for (const c of candidates) {
    await prisma.candidate.upsert({
      where: { id: c.id },
      update: {},
      create: {
        ...c,
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    })
  }
  console.log(`✅ ${candidates.length} sample candidates created`)

  // 9. Add candidates to mission pipeline
  console.log('Adding candidates to pipeline...')
  await prisma.missionCandidate.upsert({
    where: { missionId_candidateId: { missionId: mission.id, candidateId: 'candidate_demo_001' } },
    update: {},
    create: {
      missionId: mission.id,
      candidateId: 'candidate_demo_001',
      stage: 'INTERVIEW',
      contactStatus: 'OPEN',
    },
  })
  await prisma.missionCandidate.upsert({
    where: { missionId_candidateId: { missionId: mission.id, candidateId: 'candidate_demo_002' } },
    update: {},
    create: {
      missionId: mission.id,
      candidateId: 'candidate_demo_002',
      stage: 'CONTACTED',
      contactStatus: 'OPEN',
    },
  })
  console.log('✅ Candidates added to pipeline')

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Seed completed successfully!')
  console.log('='.repeat(50))
  console.log('\n📧 Dev credentials:')
  console.log(`   Email:    ${devEmail}`)
  console.log(`   Password: ${devPassword}`)
  console.log('\n🔗 Login at: http://localhost:3000/login')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })





