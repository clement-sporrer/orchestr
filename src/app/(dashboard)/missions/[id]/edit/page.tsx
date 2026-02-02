import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobBuilderForm } from '@/components/job-builder/form'
import { getMission, getClientsWithContactsForSelect } from '@/lib/actions/missions'

interface EditMissionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMissionPage({ params }: EditMissionPageProps) {
  const { id } = await params

  let mission
  let clientsWithContacts: Awaited<ReturnType<typeof getClientsWithContactsForSelect>> = []
  try {
    ;[mission, clientsWithContacts] = await Promise.all([
      getMission(id),
      getClientsWithContactsForSelect(),
    ])
  } catch {
    notFound()
  }

  if (!mission) notFound()

  const initialData = {
    clientId: mission.clientId,
    mainContactId: mission.mainContactId ?? undefined,
    title: mission.title,
    location: mission.location ?? undefined,
    contractType: mission.contractType ?? undefined,
    seniority: mission.seniority ?? undefined,
    salaryMin: mission.salaryMin ?? undefined,
    salaryMax: mission.salaryMax ?? undefined,
    salaryVisible: mission.salaryVisible,
    currency: mission.currency,
    context: mission.context ?? undefined,
    contextVisibility: mission.contextVisibility,
    responsibilities: mission.responsibilities ?? undefined,
    responsibilitiesVisibility: mission.responsibilitiesVisibility,
    mustHave: mission.mustHave ?? undefined,
    mustHaveVisibility: mission.mustHaveVisibility,
    niceToHave: mission.niceToHave ?? undefined,
    niceToHaveVisibility: mission.niceToHaveVisibility,
    redFlags: mission.redFlags ?? undefined,
    process: mission.process ?? undefined,
    processVisibility: mission.processVisibility,
    calendlyLink: mission.calendlyLink ?? undefined,
    calendlyEmbed: mission.calendlyEmbed,
    scoreThreshold: mission.scoreThreshold,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/missions/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier la mission</h1>
          <p className="text-muted-foreground">
            {mission.title} – {mission.client.companyName ?? mission.client.name}
          </p>
        </div>
      </div>

      <JobBuilderForm
        clientsWithContacts={clientsWithContacts}
        missionId={id}
        initialData={initialData}
      />
    </div>
  )
}
