import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sprout, Activity, CheckCircle2, Wallet } from 'lucide-react'
import type { AirdropAnalytics, TokenEarnings } from '../../../../shared/types'
import { formatUsd } from './airdrop-mappers'

interface AirdropKpiBarProps {
  analytics: AirdropAnalytics
}

interface KpiTile {
  labelKey: string
  value: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  accent: string
  iconColor: string
}

const AirdropKpiBar: React.FC<AirdropKpiBarProps> = ({ analytics }) => {
  const { t } = useTranslation()

  const topTokens = analytics.tokenEarnings.slice(0, 2)

  const tiles: KpiTile[] = [
    {
      labelKey: 'airdrops.kpi.total',
      value: String(analytics.totalAirdrops),
      icon: Sprout,
      accent: 'border-l-primary',
      iconColor: 'text-primary'
    },
    {
      labelKey: 'airdrops.kpi.ongoing',
      value: String(analytics.ongoingCount),
      icon: Activity,
      accent: 'border-l-primary',
      iconColor: 'text-primary'
    },
    {
      labelKey: 'airdrops.kpi.claimed',
      value: String(analytics.claimedCount),
      icon: CheckCircle2,
      accent: 'border-l-purple-500',
      iconColor: 'text-purple'
    },
    {
      labelKey: 'airdrops.kpi.earnings',
      value: formatUsd(analytics.totalEarningsValueUsd),
      icon: Wallet,
      accent: 'border-l-success',
      iconColor: 'text-success'
    }
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <div
              key={tile.labelKey}
              className={`bg-bg-card rounded-lg border border-border-light border-l-[3px] ${tile.accent} px-3 py-2.5 flex items-center gap-3 hover:border-border-hover transition-colors`}
            >
              <div className={`shrink-0 ${tile.iconColor}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-text-muted font-medium leading-tight">
                  {t(tile.labelKey)}
                </div>
                <div className="text-lg font-bold text-text-primary leading-tight truncate">
                  {tile.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {topTokens.length > 0 && (
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-text-muted">
          <span className="font-medium">{t('airdrops.kpi.topTokens')}:</span>
          {topTokens.map((t2: TokenEarnings) => (
            <span
              key={t2.token}
              className="inline-flex items-center px-1.5 py-0.5 bg-bg-card border border-border-light rounded text-text-secondary font-medium tabular-nums"
            >
              {t2.totalAmount} {t2.token}
              {t2.totalValueUsd > 0 && (
                <span className="ml-1 text-text-muted text-[10px]">
                  ${t2.totalValueUsd.toLocaleString()}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default AirdropKpiBar
