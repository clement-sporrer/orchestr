/** Shown when `Client.companyName` is missing or blank in DB (migration / legacy rows). */
export const CLIENT_COMPANY_FALLBACK_LABEL = 'Client sans nom'

export function displayClientCompanyName(companyName: string | null | undefined): string {
  const trimmed = companyName?.trim()
  if (trimmed && trimmed.length > 0) return trimmed
  return CLIENT_COMPANY_FALLBACK_LABEL
}
