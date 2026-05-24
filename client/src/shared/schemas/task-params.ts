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

/**
 * Convert a JSON Schema object to FieldMeta[].
 * Handles the manifest.json schema format: { type: "object", properties: {...}, required: [...] }
 */
export function jsonSchemaToFieldMeta(jsonSchema: Record<string, unknown>): FieldMeta[] {
  const fields: FieldMeta[] = []
  if (jsonSchema.type !== 'object' || !jsonSchema.properties) return fields

  const properties = jsonSchema.properties as Record<string, Record<string, unknown>>
  const requiredList = (jsonSchema.required as string[]) ?? []

  for (const [name, propSchema] of Object.entries(properties)) {
    const enumValues = propSchema.enum as string[] | undefined
    const meta: FieldMeta = {
      name,
      type: mapJsonSchemaType(propSchema.type as string, enumValues),
      label: (propSchema.title as string) || (propSchema.description as string) || name,
      required: requiredList.includes(name),
      description: (propSchema.description as string) || undefined,
      defaultValue: propSchema.default
    }

    if (enumValues) {
      meta.options = enumValues.map((v) => ({ label: v, value: v }))
    }

    if (meta.type === 'number') {
      if (propSchema.minimum !== undefined) meta.min = propSchema.minimum as number
      if (propSchema.maximum !== undefined) meta.max = propSchema.maximum as number
    }

    if (propSchema.pattern) {
      meta.pattern = propSchema.pattern as string
    }

    fields.push(meta)
  }

  return fields
}

function mapJsonSchemaType(
  jsonType: string,
  enumValues: string[] | undefined
): FieldMeta['type'] {
  if (enumValues?.length) return 'select'
  switch (jsonType) {
    case 'boolean': return 'boolean'
    case 'integer':
    case 'number': return 'number'
    default: return 'string'
  }
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
      const checks = numSchema._def?.checks as Array<{ kind: string; value: number }> | undefined
      if (checks?.length) {
        for (const check of checks) {
          if (check.kind === 'min' && meta.min == null) meta.min = check.value
          if (check.kind === 'max' && meta.max == null) meta.max = check.value
        }
      }
      break
    }
    case 'boolean':
      meta.type = 'boolean'
      break
    case 'enum': {
      meta.type = 'select'
      const values = (unwrapped._def as any).values as string[] | undefined
      if (values?.length) {
        meta.options = values.map((v) => ({ label: v, value: v }))
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
