import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import AirdropKpiBar from '../../../src/renderer/src/components/airdrops/AirdropKpiBar'
import type { AirdropAnalytics } from '../../../src/shared/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const sample = (overrides: Partial<AirdropAnalytics> = {}): AirdropAnalytics => ({
  totalAirdrops: 12,
  ongoingCount: 5,
  completedCount: 3,
  claimedCount: 2,
  totalEarningsValueUsd: 1234.56,
  tokenEarnings: [
    { token: 'ARB', totalAmount: 200, totalValueUsd: 400 },
    { token: 'OP', totalAmount: 50, totalValueUsd: 150 }
  ],
  upcomingDeadlines: [],
  ...overrides
})

describe('AirdropKpiBar', () => {
  it('renders all 4 tiles', () => {
    const html = renderToString(<AirdropKpiBar analytics={sample()} />)
    expect(html).toContain('airdrops.kpi.total')
    expect(html).toContain('airdrops.kpi.ongoing')
    expect(html).toContain('airdrops.kpi.claimed')
    expect(html).toContain('airdrops.kpi.earnings')
  })

  it('shows counts and formatted USD', () => {
    const html = renderToString(<AirdropKpiBar analytics={sample()} />)
    expect(html).toContain('12')
    expect(html).toContain('5')
    expect(html).toContain('2')
    // USD formatted â€?exact string depends on locale, but contains digits and $
    expect(html).toMatch(/1,?234\.56|\$1,234\.56|\$1234\.56/)
  })

  it('renders 0 / $0 when analytics is empty', () => {
    const html = renderToString(
      <AirdropKpiBar
        analytics={{
          totalAirdrops: 0,
          ongoingCount: 0,
          completedCount: 0,
          claimedCount: 0,
          totalEarningsValueUsd: 0,
          tokenEarnings: [],
          upcomingDeadlines: []
        }}
      />
    )
    expect(html).toBeTruthy()
    expect(html).toMatch(/0\b/)
  })

  it('renders top tokens in the earnings tile', () => {
    const html = renderToString(<AirdropKpiBar analytics={sample()} />)
    expect(html).toContain('ARB')
    expect(html).toContain('OP')
  })
})
