import type {
  AirdropProject,
  AirdropStatus,
  AirdropProjectType,
  AirdropLink,
  AirdropTaskItem,
  AirdropTaskStatus,
  Earning,
  EligibilityCriterion,
  TaskTemplate
} from '../../../../shared/types'

/**
 * Slim TaskTemplate shape used by ClassificationSection to populate the
 * "Script template (optional)" dropdown. Mirrors the parts we render.
 */
export interface TaskTemplateOption {
  id: string
  name: string
  version: string
}

export const toTaskTemplateOption = (t: TaskTemplate): TaskTemplateOption => ({
  id: t.id,
  name: t.name,
  version: t.version
})

export interface AirdropLinkFormData {
  label: string
  url: string
}

export interface AirdropEligibilityFormData {
  id: string
  description: string
  requirementType: string
  requirementValue: string
  required: boolean
  met: boolean
  notes: string
}

export interface AirdropTaskFormData {
  id: string
  title: string
  description: string
  deadline: string
  status: AirdropTaskStatus
  notes: string
}

export interface AirdropEarningFormData {
  id: string
  token: string
  amount: number
  valueUsd: number
  date: string
  notes: string
}

export interface AirdropFormData {
  name: string
  website: string
  chain: string
  description: string
  scriptTemplateId: string
  accountPool: string
  status: AirdropStatus
  projectType: AirdropProjectType
  tags: string
  labels: string
  links: AirdropLinkFormData[]
  eligibilityCriteria: AirdropEligibilityFormData[]
  tasks: AirdropTaskFormData[]
  earnings: AirdropEarningFormData[]
}

export const emptyForm = (): AirdropFormData => ({
  name: '',
  website: '',
  chain: '',
  description: '',
  scriptTemplateId: '',
  accountPool: '',
  status: 'ongoing',
  projectType: 'testnet',
  tags: '',
  labels: '',
  links: [],
  eligibilityCriteria: [],
  tasks: [],
  earnings: []
})

export const makeEmptyLink = (): AirdropLinkFormData => ({ label: '', url: '' })

export const makeEmptyTask = (): AirdropTaskFormData => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  deadline: '',
  status: 'pending',
  notes: ''
})

export const makeEmptyEarning = (): AirdropEarningFormData => ({
  id: crypto.randomUUID(),
  token: '',
  amount: 0,
  valueUsd: 0,
  date: new Date().toISOString().slice(0, 10),
  notes: ''
})

export const makeEmptyEligibility = (): AirdropEligibilityFormData => ({
  id: crypto.randomUUID(),
  description: '',
  requirementType: '',
  requirementValue: '',
  required: false,
  met: false,
  notes: ''
})

const tagsToString = (tags: string[]): string => tags.join(', ')

const splitCommaSeparated = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

/**
 * Convert an AirdropProject into the form-data shape. The tags/labels arrays
 * are joined by ", " so the user can edit them as text.
 */
export const toFormData = (p: AirdropProject): AirdropFormData => ({
  name: p.name ?? '',
  website: p.website ?? '',
  chain: p.chain ?? '',
  description: p.description ?? '',
  scriptTemplateId: p.scriptTemplateId ?? '',
  accountPool: p.accountPool ?? '',
  status: p.status,
  projectType: p.projectType,
  tags: tagsToString(p.tags ?? []),
  labels: tagsToString(p.labels ?? []),
  links: (p.links ?? []).map((l: AirdropLink) => ({
    label: l.label ?? '',
    url: l.url ?? ''
  })),
  eligibilityCriteria: (p.eligibilityCriteria ?? []).map((e: EligibilityCriterion) => ({
    id: e.id,
    description: e.description ?? '',
    requirementType: e.requirementType ?? '',
    requirementValue: e.requirementValue ?? '',
    required: !!e.required,
    met: !!e.met,
    notes: e.notes ?? ''
  })),
  tasks: (p.tasks ?? []).map((t: AirdropTaskItem) => ({
    id: t.id,
    title: t.title ?? '',
    description: t.description ?? '',
    deadline: t.deadline ?? '',
    status: t.status,
    notes: t.notes ?? ''
  })),
  earnings: (p.earnings ?? []).map((e: Earning) => ({
    id: e.id,
    token: e.token ?? '',
    amount: Number(e.amount) || 0,
    valueUsd: Number(e.valueUsd) || 0,
    date: e.date ?? '',
    notes: e.notes ?? ''
  }))
})

/**
 * Convert form-data back into the payload shape the API expects.
 * Strips id/createdAt/updatedAt so this can be used both for create and update.
 */
export const fromFormData = (fd: AirdropFormData): Omit<AirdropProject, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: fd.name.trim(),
  website: fd.website.trim(),
  chain: fd.chain.trim(),
  description: fd.description.trim(),
  scriptTemplateId: fd.scriptTemplateId.trim() || undefined,
  accountPool: fd.accountPool.trim(),
  status: fd.status,
  projectType: fd.projectType,
  tags: splitCommaSeparated(fd.tags),
  labels: splitCommaSeparated(fd.labels),
  links: fd.links
    .map((l) => ({ label: (l.label ?? '').trim(), url: (l.url ?? '').trim() }))
    .filter((l) => l.label.length > 0 || l.url.length > 0),
  eligibilityCriteria: fd.eligibilityCriteria.map((e) => ({
    id: e.id,
    description: e.description.trim(),
    requirementType: e.requirementType.trim(),
    requirementValue: e.requirementValue.trim(),
    required: e.required,
    met: e.met,
    notes: e.notes.trim()
  })),
  tasks: fd.tasks.map((t) => ({
    id: t.id,
    title: t.title.trim(),
    description: t.description.trim(),
    deadline: t.deadline.trim() || undefined,
    status: t.status,
    notes: t.notes.trim()
  })),
  earnings: fd.earnings
    .map((e) => ({
      id: e.id,
      token: e.token.trim(),
      amount: Number(e.amount) || 0,
      valueUsd: Number(e.valueUsd) || 0,
      date: e.date,
      notes: e.notes.trim()
    }))
    .filter((e) => e.token.length > 0)
})

export type BasicValidation = { valid: true } | { valid: false; field: 'name' | 'website' | 'accountPool' }

/**
 * Validate the three required top-level fields. Returns the first failure,
 * not a list â€?the UI shows a single inline error at a time.
 */
export const validateBasic = (fd: AirdropFormData): BasicValidation => {
  if (!fd.name.trim()) return { valid: false, field: 'name' }
  if (!fd.website.trim()) return { valid: false, field: 'website' }
  if (!fd.accountPool.trim()) return { valid: false, field: 'accountPool' }
  return { valid: true }
}
