import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListChecks, Plus, Trash2, Calendar } from 'lucide-react'
import type { AirdropTaskStatus } from '../../../../../shared/types'
import { makeEmptyTask, type AirdropFormData } from '../airdrop-defaults'

interface TasksSectionProps {
  form: AirdropFormData
  onChange: (next: AirdropFormData) => void
}

const TASK_STATUSES: AirdropTaskStatus[] = ['pending', 'inProgress', 'completed', 'skipped']
const TASK_STATUS_KEY: Record<AirdropTaskStatus, string> = {
  pending: 'tasks.status.idle',
  inProgress: 'tasks.status.running',
  completed: 'tasks.status.complete',
  skipped: 'tasks.status.paused'
}

const TasksSection: React.FC<TasksSectionProps> = ({ form, onChange }) => {
  const { t } = useTranslation()

  const update = (i: number, patch: Partial<AirdropFormData['tasks'][number]>): void => {
    onChange({
      ...form,
      tasks: form.tasks.map((tk, idx) => (idx === i ? { ...tk, ...patch } : tk))
    })
  }
  const remove = (i: number): void => {
    onChange({ ...form, tasks: form.tasks.filter((_, idx) => idx !== i) })
  }
  const add = (): void => {
    onChange({ ...form, tasks: [...form.tasks, makeEmptyTask()] })
  }

  return (
    <section className="space-y-2" data-section="tasks">
      <header className="flex items-center justify-between gap-2 text-text-primary">
        <div className="flex items-center gap-2">
          <ListChecks size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold">{t('airdrops.sectionTasks')}</h3>
          {form.tasks.length > 0 && (
            <span className="text-[11px] text-text-muted">({form.tasks.length})</span>
          )}
        </div>
        <button
          type="button"
          data-testid="tasks-section-add"
          onClick={add}
          className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-0.5"
        >
          <Plus size={12} />
          {t('airdrops.addTask')}
        </button>
      </header>

      {form.tasks.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">{t('airdrops.noTasks')}</p>
      ) : (
        <div className="space-y-1.5">
          {form.tasks.map((task, i) => (
            <div
              key={task.id}
              className="p-2 rounded-lg bg-bg-card-hover/40 border border-border-light/60 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <input
                  name={`tasks.${i}.title`}
                  type="text"
                  value={task.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder={t('airdrops.taskTitle')}
                  className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
                <select
                  name={`tasks.${i}.status`}
                  value={task.status}
                  onChange={(e) => update(i, { status: e.target.value as AirdropTaskStatus })}
                  className="px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary bg-bg-card"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(TASK_STATUS_KEY[s])}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  data-testid={`tasks-section-remove-${i}`}
                  onClick={() => remove(i)}
                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded shrink-0"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  name={`tasks.${i}.description`}
                  type="text"
                  value={task.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  placeholder={t('airdrops.taskDescription')}
                  className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex items-center gap-1 px-2 py-1.5 text-xs border border-border-light rounded bg-bg-card shrink-0">
                  <Calendar size={11} className="text-text-muted" />
                  <input
                    name={`tasks.${i}.deadline`}
                    type="date"
                    value={task.deadline}
                    onChange={(e) => update(i, { deadline: e.target.value })}
                    className="w-24 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
              <input
                name={`tasks.${i}.notes`}
                type="text"
                value={task.notes}
                onChange={(e) => update(i, { notes: e.target.value })}
                placeholder="备注（可选）"
                className="w-full px-2 py-1.5 text-xs border border-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary bg-bg-card text-text-muted italic"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default TasksSection
