import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ExternalLink,
  Edit3,
  Trash2,
  Link as LinkIcon,
  ListChecks,
  DollarSign,
  Layers
} from 'lucide-react'
import type { AirdropLink, AirdropProject } from '../../../../shared/types'
import {
  statusColorMap,
  typeColorMap,
  statusLabelKey,
  typeLabelKey,
  statusBorderClass,
  formatEarningsSummary
} from './airdrop-mappers'

interface AirdropCardProps {
  project: AirdropProject
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
}

const FOOTER_LINK_CAP = 3

const AirdropCard: React.FC<AirdropCardProps> = ({ project, onEdit, onDelete, onView }) => {
  const { t } = useTranslation()

  const visibleLinks = project.links.slice(0, FOOTER_LINK_CAP)
  const hiddenLinkCount = Math.max(0, project.links.length - FOOTER_LINK_CAP)
  const earnings = formatEarningsSummary(project.earnings).slice(0, 3)

  return (
    <div
      data-testid="airdrop-card-body"
      onClick={() => onView(project.id)}
      className={`group relative flex flex-col bg-bg-card rounded-xl border border-border-light hover:border-border-hover transition-all duration-200 cursor-pointer overflow-hidden border-l-[3px] ${statusBorderClass(project.status)}`}
    >
      {/* Top: name + actions */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-2">
        <h3 className="font-semibold text-base text-text-primary leading-snug line-clamp-2 flex-1">
          {project.name}
        </h3>
        <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            data-testid="airdrop-card-edit"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(project.id)
            }}
            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors"
            aria-label={t('common.edit')}
          >
            <Edit3 size={14} />
          </button>
          <button
            data-testid="airdrop-card-delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(project.id)
            }}
            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded transition-colors"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Status + type pills */}
      <div className="flex items-center gap-1.5 px-4 pb-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${statusColorMap[project.status]}`}
        >
          {t(statusLabelKey[project.status])}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${typeColorMap[project.projectType]}`}
        >
          {t(typeLabelKey[project.projectType])}
        </span>
        {project.chain && (
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium bg-bg-tertiary text-text-secondary">
            {project.chain}
          </span>
        )}
      </div>

      {/* Description (3-line clamp) */}
      {project.description && (
        <p className="text-xs text-text-secondary px-4 pb-2.5 line-clamp-3 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Account pool / script template meta row */}
      {(project.accountPool || project.scriptTemplateId) && (
        <div className="flex items-center gap-2 px-4 pb-2.5 text-[11px] text-text-muted">
          {project.accountPool && (
            <span className="inline-flex items-center gap-1">
              <Layers size={11} className="shrink-0" />
              <span className="truncate max-w-[120px]">{project.accountPool}</span>
            </span>
          )}
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-primary hover:underline truncate max-w-[160px]"
            >
              <ExternalLink size={10} className="shrink-0" />
              <span className="truncate">{(() => {
                try {
                  return new URL(project.website).hostname.replace(/^www\./, '')
                } catch {
                  return project.website
                }
              })()}</span>
            </a>
          )}
        </div>
      )}

      {/* Always-visible footer: links, tasks, earnings */}
      <div className="mt-auto border-t border-border-light/70 px-4 py-2.5 bg-bg-card-hover/40 space-y-1.5">
        {/* Links row */}
        {project.links.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary flex-wrap">
            <LinkIcon size={11} className="text-text-muted shrink-0" />
            {visibleLinks.map((l: AirdropLink, i: number) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-bg-card border border-border-light rounded text-text-secondary hover:text-primary hover:border-primary/40 truncate max-w-[140px]"
                title={l.label || l.url}
              >
                {l.label || l.url}
              </a>
            ))}
            {hiddenLinkCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-bg-card border border-border-light rounded text-text-muted">
                +{hiddenLinkCount}
              </span>
            )}
          </div>
        )}

        {/* Tasks + earnings summary row */}
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          {project.tasks.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks size={11} className="text-text-muted" />
              <span className="font-medium">{project.tasks.length}</span>
              <span className="text-text-muted">{t('airdrops.tasks')}</span>
            </span>
          )}
          {earnings.length > 0 && (
            <span className="inline-flex items-center gap-1 truncate">
              <DollarSign size={11} className="text-text-muted" />
              <span className="font-medium">{earnings[0].amount}</span>
              <span className="text-text-muted">{earnings[0].token}</span>
              {earnings.length > 1 && (
                <span className="text-text-muted">+{earnings.length - 1}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Tags row (bottom) */}
      {project.tags.length > 0 && (
        <div className="flex items-center gap-1 px-4 py-2 border-t border-border-light/40 flex-wrap">
          {project.tags.slice(0, 4).map((tag: string, i: number) => (
            <span
              key={i}
              className="inline-block px-1.5 py-0.5 text-[10px] bg-bg-tertiary text-text-muted rounded font-medium"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span className="text-[10px] text-text-muted">+{project.tags.length - 4}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default AirdropCard
