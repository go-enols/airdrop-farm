import React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { makeEmptyEligibility, type AirdropFormData } from '../airdrop-defaults'

interface EligibilitySectionProps {
  form: AirdropFormData
  onChange: (next: AirdropFormData) => void
}

const EligibilitySection: React.FC<EligibilitySectionProps> = ({ form, onChange }) => {
  const { t } = useTranslation()

  const update = (i: number, patch: Partial<AirdropFormData['eligibilityCriteria'][number]>): void => {
    onChange({
      ...form,
      eligibilityCriteria: form.eligibilityCriteria.map((c, idx) =>
        idx === i ? { ...c, ...patch } : c
      )
    })
  }
  const remove = (i: number): void => {
    onChange({ ...form, eligibilityCriteria: form.eligibilityCriteria.filter((_, idx) => idx !== i) })
  }
  const add = (): void => {
    onChange({ ...form, eligibilityCriteria: [...form.eligibilityCriteria, makeEmptyEligibility()] })
  }

  return (
    <section className="space-y-2" data-section="eligibility">
      <header className="flex items-center justify-between gap-2 text-text-primary">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold">{t('airdrops.sectionEligibility')}</h3>
          {form.eligibilityCriteria.length > 0 && (
            <span className="text-[11px] text-text-muted">({form.eligibilityCriteria.length})</span>
          )}
        </div>
        <button
          type="button"
          data-testid="eligibility-section-add"
          onClick={add}
          className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-0.5"
        >
          <Plus size={12} />
          {t('airdrops.addEligibility')}
        </button>
      </header>

      {form.eligibilityCriteria.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">{t('airdrops.noEligibility')}</p>
      ) : (
        <div className="space-y-1.5">
          {form.eligibilityCriteria.map((c, i) => (
            <div
              key={c.id}
              className="p-2 rounded-lg bg-bg-card-hover/40 border border-border-light/60 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <input
                  name={`eligibility.${i}.description`}
                  type="text"
                  value={c.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  placeholder={t('airdrops.eligibilityDescription')}
                  className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
                <button
                  type="button"
                  data-testid={`eligibility-section-remove-${i}`}
                  onClick={() => remove(i)}
                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded shrink-0"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  name={`eligibility.${i}.requirementType`}
                  type="text"
                  value={c.requirementType}
                  onChange={(e) => update(i, { requirementType: e.target.value })}
                  placeholder={t('airdrops.eligibilityType')}
                  className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name={`eligibility.${i}.requirementValue`}
                  type="text"
                  value={c.requirementValue}
                  onChange={(e) => update(i, { requirementValue: e.target.value })}
                  placeholder={t('airdrops.eligibilityValue')}
                  className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`eligibility.${i}.required`}
                    checked={c.required}
                    onChange={(e) => update(i, { required: e.target.checked })}
                    className="rounded border-border-light"
                  />
                  {t('airdrops.eligibilityRequired')}
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`eligibility.${i}.met`}
                    checked={c.met}
                    onChange={(e) => update(i, { met: e.target.checked })}
                    className="rounded border-border-light"
                  />
                  {t('airdrops.eligibilityMet')}
                </label>
                <input
                  name={`eligibility.${i}.notes`}
                  type="text"
                  value={c.notes}
                  onChange={(e) => update(i, { notes: e.target.value })}
                  placeholder={t('airdrops.earningNotes')}
                  className="flex-1 px-2 py-1 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary bg-bg-card text-text-muted italic"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default EligibilitySection
