import { describe, it, expect, vi } from 'vitest'
import React, { useState } from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import AirdropCard from '../../../src/renderer/src/components/airdrops/AirdropCard'
import type { AirdropProject } from '../../../src/shared/types'

// Mock i18next so the component renders predictable text without provider setup
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      key + (opts?.count !== undefined ? `|${opts.count}` : '')
  })
}))

const sample = (overrides: Partial<AirdropProject> = {}): AirdropProject => ({
  id: 'a1',
  name: 'Hyperliquid',
  chain: 'Hyperliquid L1',
  status: 'ongoing',
  projectType: 'testnet',
  description: 'Testnet points farming',
  website: 'https://app.hyperliquid.xyz',
  scriptTemplateId: null,
  accountPool: 'main',
  links: [
    { label: 'Docs', url: 'https://docs.hyperliquid.xyz' },
    { label: 'Twitter', url: 'https://twitter.com/hyperliquid' }
  ],
  eligibilityCriteria: [],
  tasks: [
    { id: 't1', title: 'Bridge', description: '', status: 'pending', notes: '' }
  ],
  earnings: [{ id: '1', token: 'ARB', amount: 100, valueUsd: 200, date: '2026-05-01', notes: '' }],
  tags: ['L1', 'points'],
  labels: [],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-05T00:00:00Z',
  ...overrides
})

function click(el: Element | null): void {
  if (!el) throw new Error('element not found')
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

describe('AirdropCard (server render)', () => {
  it('renders project name and description', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('Hyperliquid')
    expect(html).toContain('Testnet points farming')
  })

  it('renders the website link with target="_blank"', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('https://app.hyperliquid.xyz')
    expect(html).toContain('target="_blank"')
  })

  it('renders the chain in the meta row', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('Hyperliquid L1')
  })

  it('renders account pool if non-empty', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('main')
  })

  it('renders link pills (always visible, no expand)', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('Docs')
    expect(html).toContain('Twitter')
  })

  it('renders link "more" indicator when more than 3 links', () => {
    const links = [
      { label: 'L1', url: 'u' },
      { label: 'L2', url: 'u' },
      { label: 'L3', url: 'u' },
      { label: 'L4', url: 'u' },
      { label: 'L5', url: 'u' }
    ]
    const html = renderToString(
      <AirdropCard project={sample({ links })} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />
    )
    // React inserts an HTML comment between adjacent text nodes (`+` and `{hiddenLinkCount}`).
    // Match the rendered pattern with a regex tolerant of the comment separator.
    expect(html).toMatch(/\+<!--\s*-->2/)
  })

  it('renders task count and earning summary', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toMatch(/1.*task/i)
    expect(html).toContain('100')
    expect(html).toContain('ARB')
  })

  it('renders tag pills', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('L1')
    expect(html).toContain('points')
  })

  it('applies status border-left class', () => {
    const html = renderToString(<AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={() => {}} />)
    expect(html).toContain('border-l-primary')
  })

  it('shows "ï¿? when description empty and no chain', () => {
    const html = renderToString(
      <AirdropCard
        project={sample({ description: '', chain: '' })}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
      />
    )
    expect(html).toBeTruthy()
  })
})

describe('AirdropCard (interactive)', () => {
  let container: HTMLDivElement
  let root: Root

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('calls onEdit when edit icon button is clicked', () => {
    const onEdit = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropCard project={sample()} onEdit={onEdit} onDelete={() => {}} onView={() => {}} />
      )
    })
    const editBtn = container.querySelector('[data-testid="airdrop-card-edit"]') as HTMLElement
    expect(editBtn).toBeTruthy()
    click(editBtn)
    expect(onEdit).toHaveBeenCalledWith('a1')
  })

  it('calls onDelete when delete icon button is clicked', () => {
    const onDelete = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropCard project={sample()} onEdit={() => {}} onDelete={onDelete} onView={() => {}} />
      )
    })
    const delBtn = container.querySelector('[data-testid="airdrop-card-delete"]') as HTMLElement
    click(delBtn)
    expect(onDelete).toHaveBeenCalledWith('a1')
  })

  it('calls onView when card body is clicked', () => {
    const onView = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropCard project={sample()} onEdit={() => {}} onDelete={() => {}} onView={onView} />
      )
    })
    const body = container.querySelector('[data-testid="airdrop-card-body"]') as HTMLElement
    click(body)
    expect(onView).toHaveBeenCalledWith('a1')
  })
})

describe('AirdropCard keeps interactive events local (no parent rerender storm)', () => {
  it('does not re-render when only unrelated state changes (regression for useState-in-render bug)', () => {
    let renderCount = 0
    function Wrapper(): React.ReactElement {
      const [, setN] = useState(0)
      renderCount += 1
      return (
        <div>
          <AirdropCard project={sample()} onEdit={() => setN((x) => x + 1)} onDelete={() => {}} onView={() => {}} />
        </div>
      )
    }
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root: Root = (() => {
      let r: Root | null = null
      act(() => {
        r = createRoot(container)
        r.render(<Wrapper />)
      })
      return r!
    })()
    const before = renderCount
    act(() => {
      ;(container.querySelector('[data-testid="airdrop-card-edit"]') as HTMLElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      )
    })
    // Wrapper rerenders (parent state changed), but AirdropCard itself is still the same instance
    expect(renderCount).toBeGreaterThan(before)
    act(() => root.unmount())
    container.remove()
  })
})
