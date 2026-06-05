/**
 * @file 空投数据分析测试
 * @description 验证 StoreService.getAirdropAnalytics() 的各项聚合统计功能，
 *              包括按状态计数、按代币汇总收益、即将到期任务等场景。
 * @module tests/main/services
 */

import { describe, it, expect } from 'vitest'
import { StoreService } from '../../../src/main/services/store'

/** 创建内存数据库的 StoreService 实例用于测试 */
function setup(): StoreService {
  return new StoreService(':memory:')
}

/** 生成空投项目基础数据，支持字段覆盖 */
const baseAirdrop = (overrides: Record<string, unknown> = {}) => ({
  name: 'Hyperliquid',
  chain: 'Hyperliquid L1',
  status: 'ongoing' as const,
  projectType: 'testnet' as const,
  description: 'desc',
  website: 'https://app.hyperliquid.xyz',
  scriptTemplateId: 's1',
  accountPool: 'main',
  links: [],
  eligibilityCriteria: [],
  tasks: [],
  earnings: [],
  tags: [],
  labels: [],
  ...overrides
})

// describe: 空投分析聚合函数 getAirdropAnalytics 测试
describe('StoreService.getAirdropAnalytics', () => {
  it('returns zeros and empty arrays for empty database', () => {
    // 用例：空数据库返回全零指标和空数组
    const store = setup()
    const a = store.getAirdropAnalytics()
    expect(a.totalAirdrops).toBe(0)
    expect(a.ongoingCount).toBe(0)
    expect(a.completedCount).toBe(0)
    expect(a.claimedCount).toBe(0)
    expect(a.cancelledCount).toBe(0)
    expect(a.totalEarningsValueUsd).toBe(0)
    expect(a.tokenEarnings).toEqual([])
    expect(a.upcomingDeadlines).toEqual([])
  })

  it('counts airdrops by status correctly', () => {
    // 用例：按状态统计空投数量是否正确
    const store = setup()
    store.createAirdrop(baseAirdrop({ name: 'ongoing1', status: 'ongoing' }))
    store.createAirdrop(baseAirdrop({ name: 'ongoing2', status: 'ongoing' }))
    store.createAirdrop(baseAirdrop({ name: 'completed1', status: 'completed' }))
    store.createAirdrop(baseAirdrop({ name: 'claimed1', status: 'claimed' }))
    store.createAirdrop(baseAirdrop({ name: 'cancelled1', status: 'cancelled' }))
    const a = store.getAirdropAnalytics()
    expect(a.totalAirdrops).toBe(5)
    expect(a.ongoingCount).toBe(2)
    expect(a.completedCount).toBe(1)
    expect(a.claimedCount).toBe(1)
    expect(a.cancelledCount).toBe(1)
  })

  it('aggregates total earnings valueUsd across all airdrops', () => {
    // 用例：跨所有空投项目汇总收益总价值（valueUsd）
    const store = setup()
    store.createAirdrop(
      baseAirdrop({
        name: 'a1',
        earnings: [
          { id: 'e1', token: 'ARB', amount: 100, valueUsd: 200, date: '2026-01-01', notes: '' },
          { id: 'e2', token: 'OP', amount: 50, valueUsd: 100, date: '2026-02-01', notes: '' }
        ]
      })
    )
    store.createAirdrop(
      baseAirdrop({
        name: 'a2',
        earnings: [{ id: 'e3', token: 'ARB', amount: 25, valueUsd: 50, date: '2026-03-01', notes: '' }]
      })
    )
    const a = store.getAirdropAnalytics()
    expect(a.totalEarningsValueUsd).toBe(350)
  })

  it('groups tokenEarnings by token with totalAmount and totalValueUsd', () => {
    // 用例：按代币分组统计总数量和总价值
    const store = setup()
    store.createAirdrop(
      baseAirdrop({
        name: 'a1',
        earnings: [
          { id: 'e1', token: 'ARB', amount: 100, valueUsd: 200, date: '2026-01-01', notes: '' },
          { id: 'e2', token: 'OP', amount: 50, valueUsd: 100, date: '2026-02-01', notes: '' }
        ]
      })
    )
    store.createAirdrop(
      baseAirdrop({
        name: 'a2',
        earnings: [
          { id: 'e3', token: 'ARB', amount: 25, valueUsd: 50, date: '2026-03-01', notes: '' },
          { id: 'e4', token: 'OP', amount: 10, valueUsd: 30, date: '2026-03-01', notes: '' }
        ]
      })
    )
    const a = store.getAirdropAnalytics()
    const arb = a.tokenEarnings.find((t) => t.token === 'ARB')
    const op = a.tokenEarnings.find((t) => t.token === 'OP')
    expect(arb).toEqual({ token: 'ARB', totalAmount: 125, totalValueUsd: 250 })
    expect(op).toEqual({ token: 'OP', totalAmount: 60, totalValueUsd: 130 })
  })

  it('returns upcoming deadlines (up to 5, sorted by deadline asc)', () => {
    // 用例：返回即将到期的任务截止日期列表（最多 5 条，按截至日期升序排列）
    const store = setup()
    store.createAirdrop(
      baseAirdrop({
        name: 'project-A',
        tasks: [
          { id: 't1', title: 'bridge', description: '', status: 'pending', notes: '', deadline: '2026-08-01' }
        ]
      })
    )
    store.createAirdrop(
      baseAirdrop({
        name: 'project-B',
        tasks: [
          { id: 't2', title: 'swap', description: '', status: 'pending', notes: '', deadline: '2026-07-01' },
          { id: 't3', title: 'claim', description: '', status: 'pending', notes: '', deadline: '2026-09-01' }
        ]
      })
    )
    const a = store.getAirdropAnalytics()
    expect(a.upcomingDeadlines).toHaveLength(3)
    expect(a.upcomingDeadlines[0].deadline).toBe('2026-07-01')
    expect(a.upcomingDeadlines[0].projectName).toBe('project-B')
    expect(a.upcomingDeadlines[0].taskTitle).toBe('swap')
  })

  it('caps upcomingDeadlines at 5', () => {
    // 用例：即将到期截止日期最多返回 5 条
    const store = setup()
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      id: `t${i}`,
      title: `task-${i}`,
      description: '',
      status: 'pending' as const,
      notes: '',
      deadline: `2026-08-${String(i + 1).padStart(2, '0')}`
    }))
    store.createAirdrop(baseAirdrop({ name: 'p1', tasks }))
    const a = store.getAirdropAnalytics()
    expect(a.upcomingDeadlines.length).toBe(5)
  })

  it('handles earnings without valueUsd gracefully (treats as 0)', () => {
    // 用例：收益缺少 valueUsd 时视为 0 处理
    const store = setup()
    store.createAirdrop(
      baseAirdrop({
        name: 'a1',
        earnings: [{ id: 'e1', token: 'ARB', amount: 100, date: '2026-01-01', notes: '' }]
      })
    )
    const a = store.getAirdropAnalytics()
    expect(a.totalEarningsValueUsd).toBe(0)
  })
})
