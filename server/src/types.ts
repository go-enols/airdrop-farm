export interface ScriptItem {
  id: string
  name: string
  version: string
  description: string
  schema: Record<string, unknown>
  entryPoint: string
  checksum: string
  filePath: string
  tags: string[]
  changelog: string
  downloads: number
  createdAt: string
  updatedAt: string
}

export interface TemplateItem {
  id: string
  name: string
  type: string
  version: string
  description: string
  schema: Record<string, unknown>
  checksum: string
  downloads: number
  createdAt: string
  updatedAt: string
}

export interface ScriptListResponse {
  items: ScriptItem[]
  total: number
}

export interface TemplateListResponse {
  items: TemplateItem[]
  total: number
}
