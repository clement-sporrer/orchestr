import { notFound } from 'next/navigation'
import { getMissionOverview } from '@/lib/actions/missions'
import { MissionDetailShell } from '@/components/missions/mission-detail-shell'

interface MissionDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function MissionDetailPage({ params, searchParams }: MissionDetailPageProps) {
  const { id } = await params
  const { tab = 'pipeline' } = await searchParams

  const overview = await getMissionOverview(id)
  if (!overview) notFound()

  return (
    <div className="p-6 space-y-6">
      <MissionDetailShell missionId={id} overview={overview} initialTab={tab} />
    </div>
  )
}
