import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { makeEmptyLink, type AirdropFormData } from '../airdrop-defaults'

interface LinksSectionProps {
  form: AirdropFormData
  onChange: (next: AirdropFormData) => void
}

const LinksSection: React.FC<LinksSectionProps> = ({ form, onChange }) => {
  const { t } = useTranslation()

  const update = (i: number, key: 'label' | 'url', value: string): void => {
    onChange({
      ...form,
      links: form.links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l))
    })
  }
  const remove = (i: number): void => {
    onChange({ ...form, links: form.links.filter((_, idx) => idx !== i) })
  }
  const add = (): void => {
    onChange({ ...form, links: [...form.links, makeEmptyLink()] })
  }

  return (
    <section className="space-y-2" data-section="links">
      <header className="flex items-center justify-between gap-2 text-text-primary">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold">{t('airdrops.sectionLinks')}</h3>
          {form.links.length > 0 && (
            <span className="text-[11px] text-text-muted">({form.links.length})</span>
          )}
        </div>
        <button
          type="button"
          data-testid="links-section-add"
          onClick={add}
          className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-0.5"
        >
          <Plus size={12} />
          {t('airdrops.addLink')}
        </button>
      </header>

      {form.links.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">{t('airdrops.noLinks')}</p>
      ) : (
        <div className="space-y-1.5">
          {form.links.map((l, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 p-2 rounded-lg bg-bg-card-hover/40 border border-border-light/60"
            >
              <input
                name={`links.${i}.label`}
                type="text"
                value={l.label}
                onChange={(e) => update(i, 'label', e.target.value)}
                placeholder={t('airdrops.linkLabel')}
                className="w-1/3 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                name={`links.${i}.url`}
                type="url"
                value={l.url}
                onChange={(e) => update(i, 'url', e.target.value)}
                placeholder={t('airdrops.linkUrl')}
                className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                data-testid={`links-section-remove-${i}`}
                onClick={() => remove(i)}
                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded shrink-0"
                aria-label={t('common.delete')}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default LinksSection
