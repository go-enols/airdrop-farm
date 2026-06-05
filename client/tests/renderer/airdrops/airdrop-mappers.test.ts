/**
 * @file 空投映射函数测试
 * @description 验证 airdrop-mappers 工具函数的正确性，
 *              包括状态/类型的颜色映射、标签键值、摘要统计、
 *              收益汇总等功能。
 * @module tests/renderer/airdrops
 */

import { describe, it, expect } from 'vitest'
import {
  statusColorMap,
  typeColorMap,
  statusLabelKey,
  typeLabelKey,
  statusAccent,
  summarizeCounts,
  formatEarningsSummary,
  statusBorderClass
} from '../../../src/renderer/src/components/airdrops/airdrop-mappers'
import type { AirdropProject, Earning, AirdropTaskItem, AirdropLink } from '../../../src/shared/types'

const sample = (overrides: Partial<AirdropProject> = {}): AirdropProject => ({
  id: 'a1',
  name: 'Hyperliquid',
  chain: 'Hyperliquid L1',
  status: 'ongoing',
  projectType: 'testnet',
  description: 'Testnet points',
  website: 'https://app.hyperliquid.xyz',
  scriptTemplateId: 's1',
  accountPool: 'main',
  links: [],
  eligibilityCriteria: [],
  tasks: [],
  earnings: [],
  tags: ['L1', 'points'],
  labels: [],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-05T00:00:00Z',
  ...overrides
})

describe('statusColorMap', () => {
  it('has entries for all 4 statuses', () => {
    expect(Object.keys(statusColorMap).sort()).toEqual(
      ['cancelled', 'claimed', 'completed', 'ongoing'].sort()
    )
  })
  it('returns non-empty Tailwind classes for each status', () => {
    for (const v of Object.keys(statusColorMap)) {
      expect(statusColorMap[v as keyof typeof statusColorMap]).toMatch(/bg-.*text-/)
    }
  })
})

describe('typeColorMap', () => {
  it('has entries for all 6 project types', () => {
    expect(Object.keys(typeColorMap).sort()).toEqual(
      ['galxe', 'mainnet', 'other', 'quest', 'social', 'testnet'].sort()
    )
  })
  it('returns non-empty Tailwind classes for each type', () => {
    for (const v of Object.keys(typeColorMap)) {
      expect(typeColorMap[v as keyof typeof typeColorMap]).toMatch(/bg-.*text-/)
    }
  })
})

describe('statusLabelKey', () => {
  it('returns the i18n key for each status', () => {
    expect(statusLabelKey.ongoing).toBe('airdrops.statusOngoing')
    expect(statusLabelKey.completed).toBe('airdrops.statusCompleted')
    expect(statusLabelKey.cancelled).toBe('airdrops.statusCancelled')
    expect(statusLabelKey.claimed).toBe('airdrops.statusClaimed')
  })
})

describe('typeLabelKey', () => {
  it('returns the i18n key for each project type', () => {
    expect(typeLabelKey.testnet).toBe('airdrops.typeTestnet')
    expect(typeLabelKey.mainnet).toBe('airdrops.typeMainnet')
    expect(typeLabelKey.galxe).toBe('airdrops.typeGalxe')
    expect(typeLabelKey.quest).toBe('airdrops.typeQuest')
    expect(typeLabelKey.social).toBe('airdrops.typeSocial')
    expect(typeLabelKey.other).toBe('airdrops.typeOther')
  })
})

describe('statusAccent', () => {
  it('returns a 3-character Tailwind class triple for border-left use', () => {
    for (const v of ['ongoing', 'completed', 'cancelled', 'claimed'] as const) {
      const accent = statusAccent(v)
      expect(accent).toMatch(/border-/)
    }
  })
})

describe('statusBorderClass', () => {
  it('returns a class usable as a status border indicator', () => {
    expect(statusBorderClass('ongoing')).toBe('border-l-primary')
    expect(statusBorderClass('claimed')).toBe('border-l-purple-500')
    expect(statusBorderClass('completed')).toBe('border-l-success')
    expect(statusBorderClass('cancelled')).toBe('border-l-danger')
  })
})

describe('summarizeCounts', () => {
  it('counts links, tasks, earnings correctly', () => {
    const links: AirdropLink[] = [{ label: 'a', url: 'u' }, { label: 'b', url: 'u' }]
    const tasks: AirdropTaskItem[] = [
      { id: '1', title: 't1', description: '', status: 'pending', notes: '' }
    ]
    const earnings: Earning[] = [{ id: '1', token: 'ARB', amount: 100, date: '2026-01-01', notes: '' }]
    const counts = summarizeCounts(links, tasks, earnings)
    expect(counts).toEqual({ links: 2, tasks: 1, earnings: 1 })
  })

  it('returns zeros for empty arrays', () => {
    expect(summarizeCounts([], [], [])).toEqual({ links: 0, tasks: 0, earnings: 0 })
  })
})

describe('formatEarningsSummary', () => {
  it('aggregates by token and sums amount + valueUsd', () => {
    const earnings: Earning[] = [
      { id: '1', token: 'ARB', amount: 100, valueUsd: 200, date: '2026-01-01', notes: '' },
      { id: '2', token: 'ARB', amount: 50, valueUsd: 100, date: '2026-02-01', notes: '' },
      { id: '3', token: 'OP', amount: 10, valueUsd: 30, date: '2026-02-01', notes: '' }
    ]
    const summary = formatEarningsSummary(earnings)
    expect(summary).toEqual([
      { token: 'ARB', amount: 150, valueUsd: 300 },
      { token: 'OP', amount: 10, valueUsd: 30 }
    ])
  })

  it('handles missing valueUsd by treating it as 0', () => {
    const earnings: Earning[] = [
      { id: '1', token: 'ARB', amount: 100, date: '2026-01-01', notes: '' }
    ]
    const summary = formatEarningsSummary(earnings)
    expect(summary).toEqual([{ token: 'ARB', amount: 100, valueUsd: 0 }])
  })

  it('returns empty array for empty input', () => {
    expect(formatEarningsSummary([])).toEqual([])
  })

  it('skips empty token rows', () => {
    const earnings: Earning[] = [
      { id: '1', token: '', amount: 100, valueUsd: 200, date: '2026-01-01', notes: '' }
    ]
    expect(formatEarningsSummary(earnings)).toEqual([])
  })
})

describe('card sample sanity', () => {
  it('smoke: maps status/type to non-empty values', () => {
    const p = sample()
    expect(statusColorMap[p.status]).toBeTruthy()
    expect(typeColorMap[p.projectType]).toBeTruthy()
    expect(statusBorderClass(p.status)).toBeTruthy()
    expect(statusAccent(p.status)).toBeTruthy()
  })
})
