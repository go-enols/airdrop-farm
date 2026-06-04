import React from 'react'
import { useTranslation } from 'react-i18next'
import { Tags } from 'lucide-react'
import type { AirdropFormData } from '../airdrop-defaults'

interface TagsSectionProps {
  form: AirdropFormData
  onChange: (next: AirdropFormData) => void
}

const TagsSection: React.FC<TagsSectionProps> = ({ form, onChange }) => {
  const { t } = useTranslation()
  const set = <K extends keyof AirdropFormData>(key: K, value: AirdropFormData[K]) =>
    onChange({ ...form, [key]: value })

  return (
    <section className="space-y-2" data-section="tags">
      <header className="flex items-center gap-2 text-text-primary">
        <Tags size={14} className="text-text-muted" />
        <h3 className="text-sm font-semibold">{t('airdrops.sectionTags')}</h3>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            {t('airdrops.tags')}
          </label>
          <input
            name="tags"
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder={t('airdrops.tagsPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            {t('airdrops.labels')}
          </label>
          <input
            name="labels"
            type="text"
            value={form.labels}
            onChange={(e) => set('labels', e.target.value)}
            placeholder={t('airdrops.labelsPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </section>
  )
}

export default TagsSection
