import React from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Plus, Trash2, Calendar } from 'lucide-react'
import { makeEmptyEarning, type AirdropFormData } from '../airdrop-defaults'

interface EarningsSectionProps {
  form: AirdropFormData
  onChange: (next: AirdropFormData) => void
}

const EarningsSection: React.FC<EarningsSectionProps> = ({ form, onChange }) => {
  const { t } = useTranslation()

  const update = (i: number, patch: Partial<AirdropFormData['earnings'][number]>): void => {
    onChange({
      ...form,
      earnings: form.earnings.map((e, idx) => (idx === i ? { ...e, ...patch } : e))
    })
  }
  const remove = (i: number): void => {
    onChange({ ...form, earnings: form.earnings.filter((_, idx) => idx !== i) })
  }
  const add = (): void => {
    onChange({ ...form, earnings: [...form.earnings, makeEmptyEarning()] })
  }

  return (
    <section className="space-y-2" data-section="earnings">
      <header className="flex items-center justify-between gap-2 text-text-primary">
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold">{t('airdrops.sectionEarnings')}</h3>
          {form.earnings.length > 0 && (
            <span className="text-[11px] text-text-muted">({form.earnings.length})</span>
          )}
        </div>
        <button
          type="button"
          data-testid="earnings-section-add"
          onClick={add}
          className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-0.5"
        >
          <Plus size={12} />
          {t('airdrops.addEarning')}
        </button>
      </header>

      {form.earnings.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">{t('airdrops.noEarnings')}</p>
      ) : (
        <div className="space-y-1.5">
          {form.earnings.map((e, i) => (
            <div
              key={e.id}
              className="p-2 rounded-lg bg-bg-card-hover/40 border border-border-light/60 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <input
                  name={`earnings.${i}.token`}
                  type="text"
                  value={e.token}
                  onChange={(ev) => update(i, { token: ev.target.value })}
                  placeholder={t('airdrops.earningToken')}
                  className="w-20 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
                <input
                  name={`earnings.${i}.amount`}
                  type="number"
                  step="any"
                  value={String(e.amount ?? '')}
                  onChange={(ev) =>
                    update(i, { amount: ev.target.value === '' ? 0 : parseFloat(ev.target.value) || 0 })
                  }
                  placeholder={t('airdrops.earningAmount')}
                  className="w-24 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
                <input
                  name={`earnings.${i}.valueUsd`}
                  type="number"
                  step="any"
                  value={String(e.valueUsd ?? '')}
                  onChange={(ev) =>
                    update(i, { valueUsd: ev.target.value === '' ? 0 : parseFloat(ev.target.value) || 0 })
                  }
                  placeholder="USD $"
                  className="w-24 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
                <div className="flex items-center gap-1 px-2 py-1.5 text-xs border border-border-light rounded bg-bg-card shrink-0">
                  <Calendar size={11} className="text-text-muted" />
                  <input
                    name={`earnings.${i}.date`}
                    type="date"
                    value={e.date}
                    onChange={(ev) => update(i, { date: ev.target.value })}
                    className="w-24 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  data-testid={`earnings-section-remove-${i}`}
                  onClick={() => remove(i)}
                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded shrink-0"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <input
                name={`earnings.${i}.notes`}
                type="text"
                value={e.notes}
                onChange={(ev) => update(i, { notes: ev.target.value })}
                placeholder={t('airdrops.earningNotes')}
                className="w-full px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary bg-bg-card text-text-muted italic"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default EarningsSection
