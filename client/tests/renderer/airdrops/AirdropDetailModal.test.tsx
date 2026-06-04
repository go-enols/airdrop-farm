import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import AirdropDetailModal from '../../../src/renderer/src/components/airdrops/AirdropDetailModal'
import type { AirdropProject } from '../../../src/shared/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

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

describe('AirdropDetailModal (server render)', () => {
  it('renders the project name as title', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Hyperliquid')
  })

  it('renders the description', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Testnet points farming')
  })

  it('renders the website as a clickable external link', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('https://app.hyperliquid.xyz')
    expect(html).toContain('target="_blank"')
  })

  it('renders all links with labels', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Docs')
    expect(html).toContain('https://docs.hyperliquid.xyz')
  })

  it('renders tasks with title and status', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Bridge')
    expect(html).toContain('Use Orbiter')
  })

  it('renders earnings with token, amount, and valueUsd', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('ARB')
    expect(html).toContain('100')
    expect(html).toContain('200')
  })

  it('renders eligibility criteria as a list', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('Bridge at least 0.1 ETH')
  })

  it('renders tags and labels', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={true} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).toContain('L1')
    expect(html).toContain('points')
    expect(html).toContain('priority')
  })

  it('renders nothing when closed (open=false)', () => {
    const html = renderToString(
      <AirdropDetailModal project={sample()} open={false} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />
    )
    expect(html).not.toContain('Hyperliquid')
  })

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

describe('AirdropDetailModal (interactive)', () => {
  let container: HTMLDivElement
  let root: Root

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

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
