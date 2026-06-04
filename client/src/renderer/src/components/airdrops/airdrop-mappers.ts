import type {
  AirdropStatus,
  AirdropProjectType,
  AirdropLink,
  AirdropTaskItem,
  Earning
} from '../../../../shared/types'

/**
 * Status pill colors for the Status column on cards + detail.
 * Uses the project's Tailwind theme tokens (see assets/main.css).
 */
export const statusColorMap: Record<AirdropStatus, string> = {
  ongoing: 'bg-primary-light text-primary',
  completed: 'bg-success-light text-success',
  cancelled: 'bg-danger-light text-danger',
  claimed: 'bg-purple-light text-purple'
}

/**
 * Project type pill colors.
 */
export const typeColorMap: Record<AirdropProjectType, string> = {
  testnet: 'bg-cyan-light text-cyan',
  mainnet: 'bg-primary-light text-primary',
  galxe: 'bg-orange-light text-orange',
  quest: 'bg-purple-light text-purple',
  social: 'bg-pink-light text-pink',
  other: 'bg-bg-tertiary text-text-secondary'
}

/**
 * i18n keys for status labels. Used so the i18n catalog is the single source of truth.
 */
export const statusLabelKey: Record<AirdropStatus, string> = {
  ongoing: 'airdrops.statusOngoing',
  completed: 'airdrops.statusCompleted',
  cancelled: 'airdrops.statusCancelled',
  claimed: 'airdrops.statusClaimed'
}

/**
 * i18n keys for project type labels.
 */
export const typeLabelKey: Record<AirdropProjectType, string> = {
  testnet: 'airdrops.typeTestnet',
  mainnet: 'airdrops.typeMainnet',
  galxe: 'airdrops.typeGalxe',
  quest: 'airdrops.typeQuest',
  social: 'airdrops.typeSocial',
  other: 'airdrops.typeOther'
}

/**
 * Border-left class used as a visual accent on the card edge.
 * Pair with a 2-3px left border to subtly indicate status at a glance.
 */
export const statusBorderClass = (status: AirdropStatus): string => {
  switch (status) {
    case 'ongoing':
      return 'border-l-primary'
    case 'completed':
      return 'border-l-success'
    case 'cancelled':
      return 'border-l-danger'
    case 'claimed':
      return 'border-l-purple-500'
    default:
      return 'border-l-border-light'
  }
}

/**
 * Background accent (used in the KPI bar's status tiles).
 */
export const statusAccent = (status: AirdropStatus): string => {
  switch (status) {
    case 'ongoing':
      return 'border-l-primary bg-primary-50/50'
    case 'completed':
      return 'border-l-success bg-success-50/50'
    case 'cancelled':
      return 'border-l-danger bg-danger-50/50'
    case 'claimed':
      return 'border-l-purple-500 bg-purple-50/50'
    default:
      return 'border-l-border-light'
  }
}

export interface AirdropCounts {
  links: number
  tasks: number
  earnings: number
}

export const summarizeCounts = (
  links: AirdropLink[],
  tasks: AirdropTaskItem[],
  earnings: Earning[]
): AirdropCounts => ({
  links: links.length,
  tasks: tasks.length,
  earnings: earnings.length
})

export interface EarningsSummaryRow {
  token: string
  amount: number
  valueUsd: number
}

/**
 * Aggregate earnings by token. Skips rows with empty token. Treats missing
 * valueUsd as 0. Result order: tokens are sorted by totalValueUsd DESC then
 * totalAmount DESC for stable display.
 */
export const formatEarningsSummary = (earnings: Earning[]): EarningsSummaryRow[] => {
  const map = new Map<string, { amount: number; valueUsd: number }>()
  for (const e of earnings) {
    const token = (e.token ?? '').trim()
    if (!token) continue
    const prev = map.get(token) ?? { amount: 0, valueUsd: 0 }
    map.set(token, {
      amount: prev.amount + (Number(e.amount) || 0),
      valueUsd: prev.valueUsd + (Number(e.valueUsd) || 0)
    })
  }
  return Array.from(map.entries())
    .map(([token, v]) => ({ token, amount: v.amount, valueUsd: v.valueUsd }))
    .sort((a, b) => {
      if (b.valueUsd !== a.valueUsd) return b.valueUsd - a.valueUsd
      return b.amount - a.amount
    })
}

export const formatUsd = (value: number): string => {
  if (!Number.isFinite(value)) return '$0'
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
