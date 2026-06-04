import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Globe, Hash, AlignLeft } from 'lucide-react'
import type { AirdropFormData } from '../airdrop-defaults'

export interface BasicInfoErrors {
  name?: string
  website?: string
}

interface BasicInfoSectionProps {
  form: AirdropFormData
  onChange: (next: AirdropFormData) => void
  errors?: BasicInfoErrors
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ form, onChange, errors = {} }) => {
  const { t } = useTranslation()
  const set = <K extends keyof AirdropFormData>(key: K, value: AirdropFormData[K]) =>
    onChange({ ...form, [key]: value })

  return (
    <section className="space-y-3" data-section="basic">
      <header className="flex items-center gap-2 text-text-primary">
        <FileText size={14} className="text-text-muted" />
        <h3 className="text-sm font-semibold">{t('airdrops.sectionBasic')}</h3>
      </header>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          {t('airdrops.name')} <span className="text-danger">*</span>
        </label>
        <input
          name="name"
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.name ? 'border-danger' : 'border-border-light'
          }`}
        />
        {errors.name && <p className="text-[11px] text-danger mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
          <Globe size={11} />
          {t('airdrops.website')} <span className="text-danger">*</span>
        </label>
        <input
          name="website"
          type="url"
          value={form.website}
          onChange={(e) => set('website', e.target.value)}
          placeholder="https://..."
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.website ? 'border-danger' : 'border-border-light'
          }`}
        />
        {errors.website && <p className="text-[11px] text-danger mt-1">{errors.website}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
          <Hash size={11} />
          {t('airdrops.chain')}
        </label>
        <input
          name="chain"
          type="text"
          value={form.chain}
          onChange={(e) => set('chain', e.target.value)}
          placeholder="Ethereum, Solana, Hyperliquid L1..."
          className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
          <AlignLeft size={11} />
          {t('airdrops.description')}
          <span className="text-text-muted text-[11px] font-normal">
            {t('airdrops.descriptionMarkdownHint')}
          </span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono leading-relaxed"
        />
      </div>
    </section>
  )
}

export default BasicInfoSection
