import { z } from 'zod'

export interface FieldMeta {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect'
  label: string
  required: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  description?: string
  min?: number
  max?: number
  pattern?: string
}

export function extractFieldMeta(schema: z.ZodObject<z.ZodRawShape>): FieldMeta[] {
  const shape = schema.shape
  const fields: FieldMeta[] = []

  for (const [name, fieldSchema] of Object.entries(shape)) {
    const meta = parseZodField(name, fieldSchema as z.ZodTypeAny)
    fields.push(meta)
  }

  return fields
}

function parseZodField(name: string, schema: z.ZodTypeAny): FieldMeta {
  const meta: FieldMeta = {
    name,
    type: 'string',
    label: name,
    required: true,
  }

  const description = (schema as any).description as string | undefined
  if (description) {
    meta.label = description
    meta.description = description
  }

  const unwrapped = unwrapSchema(schema)
  const schemaType = unwrapped._def.type as string

  switch (schemaType) {
    case 'string':
      meta.type = 'string'
      break
    case 'number': {
      meta.type = 'number'
      const numSchema = unwrapped as any
      if (numSchema.minValue != null) meta.min = numSchema.minValue
      if (numSchema.maxValue != null) meta.max = numSchema.maxValue
      break
    }
    case 'boolean':
      meta.type = 'boolean'
      break
    case 'enum': {
      meta.type = 'select'
      const entries = (unwrapped._def as any).entries as Record<string, string> | undefined
      if (entries) {
        meta.options = Object.values(entries).map((v) => ({ label: String(v), value: String(v) }))
      }
      break
    }
    default:
      meta.type = 'string'
  }

  if (isOptionalSchema(schema)) {
    meta.required = false
  }

  const def = schema._def as any
  if (def.type === 'default' && def.defaultValue !== undefined) {
    meta.defaultValue = def.defaultValue
    meta.required = false
  }

  return meta
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = schema._def as any
  if (def.type === 'optional' || def.type === 'default') {
    return unwrapSchema(def.innerType)
  }
  return schema
}

function isOptionalSchema(schema: z.ZodTypeAny): boolean {
  const def = schema._def as any
  if (def.type === 'optional') return true
  if (def.type === 'default') return true
  return false
}

export const commonTaskParams = z.object({
  proxyEnabled: z.boolean().default(false).describe('使用代理'),
  headless: z.boolean().default(true).describe('无头模式'),
  maxRetries: z.number().int().min(0).max(10).default(3).describe('最大重试次数'),
  timeout: z.number().int().min(0).default(300).describe('超时时间(秒)'),
})

export type CommonTaskParams = z.infer<typeof commonTaskParams>
