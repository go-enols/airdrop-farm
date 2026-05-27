import React, { useRef, useCallback, useEffect } from 'react'
import type { FieldMeta } from '../../../shared/schemas/task-params'
import { validateFormFields } from '../../../shared/schemas/task-params'

interface DynamicFormProps {
  fields: FieldMeta[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
  onValidate?: (errors: Record<string, string>) => void
}

const inputBase =
  'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary'

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  values,
  onChange,
  errors,
  onValidate
}) => {
  const valuesRef = useRef(values)
  valuesRef.current = values
  const handleChange = useCallback(
    (name: string, value: unknown): void => {
      onChange({ ...valuesRef.current, [name]: value })
    },
    [onChange]
  )

  useEffect(() => {
    if (!onValidate) return
    onValidate(validateFormFields(fields, values))
  }, [fields, values, onValidate])

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
  const hasValue = value !== undefined && value !== null
  const defaultStr =
    field.defaultValue !== undefined && field.defaultValue !== null
      ? String(field.defaultValue)
      : ''
  const strValue = hasValue ? String(value) : defaultStr

  switch (field.type) {
    case 'boolean': {
      const rawBool = value !== undefined && value !== null ? value : field.defaultValue
      const checked = typeof rawBool === 'string' ? rawBool === 'true' : Boolean(rawBool ?? false)
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
          />
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      )
    }

    case 'number':
      return (
        <div>
          <input
            type="number"
            value={strValue}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onChange(field.name, undefined)
                return
              }
              const num = Number(raw)
              if (!isNaN(num)) onChange(field.name, num)
            }}
            min={field.min}
            max={field.max}
            className={`${inputBase} ${error ? 'border-danger' : ''}`}
            placeholder={defaultStr}
          />
          {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
        </div>
      )

    case 'select': {
      const opts = field.options?.length ? field.options : null
      return (
        <div>
          <select
            value={strValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${inputBase} ${error ? 'border-danger' : ''}`}
            disabled={!opts}
          >
            {opts ? (
              <>
                <option value="">请选择...</option>
                {opts.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </>
            ) : (
              <option value="">无可用选项</option>
            )}
          </select>
          {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
        </div>
      )
    }

    case 'multiselect': {
      const defaultArr = Array.isArray(field.defaultValue)
        ? (field.defaultValue as string[])
        : undefined
      const selected = (value as string[] | undefined) ?? defaultArr ?? []
      return (
        <div>
          <select
            multiple
            value={selected}
            onChange={(e) => {
              const vals = Array.from(e.target.selectedOptions, (o) => o.value)
              onChange(field.name, vals)
            }}
            className={`${inputBase} min-h-[80px] ${error ? 'border-danger' : ''}`}
          >
            {field.options?.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
        </div>
      )
    }

    case 'string':
    default:
      return (
        <div>
          <input
            type="text"
            value={strValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${inputBase} ${error ? 'border-danger' : ''}`}
            placeholder={defaultStr}
          />
          {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
        </div>
      )
  }
}

export default DynamicForm
