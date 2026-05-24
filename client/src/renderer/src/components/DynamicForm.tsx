import React from 'react'
import type { FieldMeta } from '../../../shared/schemas/task-params'

interface DynamicFormProps {
  fields: FieldMeta[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
}

const inputBase =
  'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary'

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, values, onChange, errors }) => {
  const handleChange = (name: string, value: unknown): void => {
    onChange({ ...values, [name]: value })
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {field.label}
            {!field.required && <span className="text-text-muted ml-1">(可选)</span>}
          </label>
          {renderField(field, values[field.name], handleChange, errors?.[field.name])}
          {field.description && field.description !== field.label && (
            <p className="text-xs text-text-muted mt-1">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function renderField(
  field: FieldMeta,
  value: unknown,
  onChange: (name: string, value: unknown) => void,
  error?: string
): React.ReactNode {
  const strValue = value !== undefined && value !== null ? String(value) : ''
  const defaultStr =
    field.defaultValue !== undefined && field.defaultValue !== null
      ? String(field.defaultValue)
      : ''

  switch (field.type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value ?? field.defaultValue ?? false)}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
          />
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      )

    case 'number':
      return (
        <div>
          <input
            type="number"
            value={strValue || defaultStr}
            onChange={(e) =>
              onChange(field.name, e.target.value === '' ? undefined : Number(e.target.value))
            }
            min={field.min}
            max={field.max}
            className={`${inputBase} ${error ? 'border-danger' : ''}`}
            placeholder={defaultStr}
          />
          {error && <span className="text-xs text-danger mt-1">{error}</span>}
        </div>
      )

    case 'select':
      return (
        <div>
          <select
            value={strValue || defaultStr}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${inputBase} ${error ? 'border-danger' : ''}`}
          >
            <option value="">请选择...</option>
            {field.options?.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <span className="text-xs text-danger mt-1">{error}</span>}
        </div>
      )

    case 'multiselect':
      return (
        <div>
          <select
            multiple
            value={(value as string[]) ?? []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value)
              onChange(field.name, selected)
            }}
            className={`${inputBase} min-h-[80px] ${error ? 'border-danger' : ''}`}
          >
            {field.options?.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <span className="text-xs text-danger mt-1">{error}</span>}
        </div>
      )

    case 'string':
    default:
      return (
        <div>
          <input
            type="text"
            value={strValue || defaultStr}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${inputBase} ${error ? 'border-danger' : ''}`}
            placeholder={defaultStr}
          />
          {error && <span className="text-xs text-danger mt-1">{error}</span>}
        </div>
      )
  }
}

export default DynamicForm
