/**
 * @file AirdropDetailModal 组件测试
 * @description 测试 AirdropDetailModal 组件：服务端渲染（标题、描述、链接、任务、收益、资格条件、标签和空状态）
 *              以及交互行为（编辑/删除/关闭按钮回调）。
 * @module tests/renderer/airdrops
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import AirdropDetailModal from '../../../src/renderer/src/components/airdrops/AirdropDetailModal'
import type { AirdropProject } from '../../../src/shared/types'

// 模拟 react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

/** 构造一个示例空投项目用于详情弹窗渲染测试 */
const sample = (overrides: Partial<AirdropProject> = {}): AirdropProject => ({
  id: 'a1',
  name: 'Hyperliquid',
  chain: 'Hyperliquid L1',
  status: 'ongoing',
  projectType: 'testnet',
  description: 'Testnet points farming',
  website: 'https://app.hyperliquid.xyz',
  scriptTemplateId: 'script-uuid-1',
  accountPool: 'main',
  links: [{ label: 'Docs', url: 'https://docs.hyperliquid.xyz' }],
  eligibilityCriteria: [
    { id: 'e1', description: 'Bridge at least 0.1 ETH', requirementType: 'txCount', requirementValue: '10', required: true, met: false, notes: '' }
  ],
  tasks: [
    { id: 't1', title: 'Bridge', description: 'Use Orbiter', deadline: '2026-07-01', status: 'pending', notes: '' }
  ],
  earnings: [{ id: '1', token: 'ARB', amount: 100, valueUsd: 200, date: '2026-05-01', notes: 'season 1' }],
  tags: ['L1', 'points'],
  labels: ['priority'],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-05T00:00:00Z',
  ...overrides
})

// describe: 服务端渲染测试 — 验证 AirdropDetailModal 的渲染输出
describe('AirdropDetailModal (server render)', () => {
  // 用例：渲染项目名称作为标题
  it('renders the project name as title', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Hyperliquid')
  })

  // 用例：渲染项目描述
  it('renders the description', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Testnet points farming')
  })

  // 用例：渲染网站为可点击的外部链接
  it('renders the website as a clickable external link', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('https://app.hyperliquid.xyz')
    expect(html).toContain('target="_blank"')
  })

  // 用例：渲染所有链接及其标签
  it('renders all links with labels', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Docs')
    expect(html).toContain('https://docs.hyperliquid.xyz')
  })

  // 用例：渲染任务标题和状态
  it('renders tasks with title and status', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Bridge')
    expect(html).toContain('Use Orbiter')
  })

  // 用例：渲染收益的 token、数量和美元价值
  it('renders earnings with token, amount, and valueUsd', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('ARB')
    expect(html).toContain('100')
    expect(html).toContain('200')
  })

  // 用例：渲染资格条件列表
  it('renders eligibility criteria as a list', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Bridge at least 0.1 ETH')
  })

  // 用例：渲染标签和标记
  it('renders tags and labels', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('L1')
    expect(html).toContain('points')
    expect(html).toContain('priority')
  })

  // 用例：弹窗关闭时（open=false）不渲染任何内容
  it('renders nothing when closed (open=false)', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={false} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).not.toContain('Hyperliquid')
  })

  // 用例：空集合时显示空状态提示信息
  it('shows empty-state messages for empty collections', () => {
    const html = renderToString(
      <AirdropDetailModal
        project={sample({ links: [], tasks: [], earnings: [], eligibilityCriteria: [] })}
        open={true}
        onClose={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    )
    expect(html).toContain('airdrops.noLinks')
    expect(html).toContain('airdrops.noTasks')
    expect(html).toContain('airdrops.noEarnings')
  })
})

// describe: 交互测试 — 验证 AirdropDetailModal 的事件回调
describe('AirdropDetailModal (interactive)', () => {
  let container: HTMLDivElement
  let root: Root

  // 每次测试后卸载根节点并移除容器
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  // 每次测试前创建 DOM 容器
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  // 用例：点击"编辑"按钮触发 onEdit 并传递项目 id
  it('clicking "Edit" button fires onEdit with project id', () => {
    const onEdit = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={onEdit} onDelete={() => {}} />
      )
    })
    const editBtn = container.querySelector('[data-testid="airdrop-detail-edit"]') as HTMLElement
    expect(editBtn).toBeTruthy()
    act(() => {
      editBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onEdit).toHaveBeenCalledWith('a1')
  })

  // 用例：点击"删除"按钮触发 onDelete 并传递项目 id
  it('clicking "Delete" button fires onDelete with project id', () => {
    const onDelete = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={onDelete} />
      )
    })
    const delBtn = container.querySelector('[data-testid="airdrop-detail-delete"]') as HTMLElement
    act(() => {
      delBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onDelete).toHaveBeenCalledWith('a1')
  })

  // 用例：点击"关闭"按钮触发 onClose
  it('clicking "Close" button fires onClose', () => {
    const onClose = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropDetailModal project={sample()} open={true} onClose={onClose} onEdit={() => {}} onDelete={() => {}} />
      )
    })
    const closeBtn = container.querySelector('[data-testid="airdrop-detail-close"]') as HTMLElement
    act(() => {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
