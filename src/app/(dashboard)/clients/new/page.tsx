import { getOrganizationSettings } from '@/lib/actions/organization-settings'
import { NewClientForm } from '@/components/clients/new-client-form'

export const dynamic = 'force-dynamic'

export default async function NewClientPage() {
  const result = await getOrganizationSettings()
  const clientCategories = result.success && result.data?.clientCategories
    ? result.data.clientCategories
    : []

  return <NewClientForm clientCategories={clientCategories} />
}
