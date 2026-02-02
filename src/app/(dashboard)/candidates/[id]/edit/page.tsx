import { notFound } from 'next/navigation'
import { getCandidate } from '@/lib/actions/candidates'
import { EditCandidateForm } from './edit-candidate-form'

interface EditCandidatePageProps {
  params: Promise<{ id: string }>
}

export default async function EditCandidatePage({ params }: EditCandidatePageProps) {
  const { id } = await params

  let candidate
  try {
    candidate = await getCandidate(id)
  } catch {
    notFound()
  }

  return <EditCandidateForm candidate={candidate} />
}
