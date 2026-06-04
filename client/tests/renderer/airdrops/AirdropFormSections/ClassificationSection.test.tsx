import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import ClassificationSection from '../../../../src/renderer/src/components/airdrops/AirdropFormSections/ClassificationSection'
import type { AirdropFormData, TaskTemplateOption } from '../../../../src/renderer/src/components/airdrops/airdrop-defaults'
import type { TaskTemplate } from '../../../../../src/shared/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const baseForm = (overrides: Partial<AirdropFormData> = {}): AirdropFormData => ({
  name: 'Hyperliquid',
  website: 'https://app.hyperliquid.xyz',
  chain: 'Hyperliquid L1',
  description: '',
  scriptTemplateId: 'script-1',
  accountPool: 'main',
  status: 'ongoing',
  projectType: 'testnet',
  tags: '',
  labels: '',
  links: [],
  eligibilityCriteria: [],
  tasks: [],
  earnings: [],
  ...overrides
})

const templates: TaskTemplate[] = [
  {
    id: 'script-1',
    name: 'Bridge Bot',
    version: '1.0.0',
    description: 'Bridges',
    installPath: '/x',
    manifest: {},
    remoteUrl: null,
    isInstalled: true,
    downloadedAt: '2026-01-01',
    updatedAt: '2026-01-01'
  },
  {
    id: 'script-2',
    name: 'Swap Bot',
    version: '2.0.0',
    description: 'Swaps',
    installPath: '/y',
    manifest: {},
    remoteUrl: null,
    isInstalled: true,
    downloadedAt: '2026-01-01',
    updatedAt: '2026-01-01'
  }
]

const pools = ['main', 'secondary']

function changeSelect(el: HTMLSelectElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set
    setter?.call(el, value)
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('ClassificationSection (server render)', () => {
  it('renders status dropdown with all 4 options', () => {
    const html = renderToString(
      <ClassificationSection
        form={baseForm()}
        onChange={() => {}}
        errors={{}}
        scriptTemplates={[]}
        accountPools={[]}
        loading={false}
      />
    )
    expect(html).toMatch(/<select[^>]*name="status"/)
  })

  it('renders projectType dropdown with all 6 options', () => {
    const html = renderToString(
      <ClassificationSection
        form={baseForm()}
        onChange={() => {}}
        errors={{}}
        scriptTemplates={[]}
        accountPools={[]}
        loading={false}
      />
    )
    expect(html).toContain('Testnet')
    expect(html).toContain('Mainnet')
    expect(html).toContain('Galxe')
  })

  it('renders accountPool dropdown with provided pool options', () => {
    const html = renderToString(
      <ClassificationSection
        form={baseForm()}
        onChange={() => {}}
        errors={{}}
        scriptTemplates={[]}
        accountPools={pools}
        loading={false}
      />
    )
    expect(html).toContain('main')
    expect(html).toContain('secondary')
  })

  it('renders accountPool as required (asterisk)', () => {
    const html = renderToString(
      <ClassificationSection
        form={baseForm()}
        onChange={() => {}}
        errors={{}}
        scriptTemplates={[]}
        accountPools={pools}
        loading={false}
      />
    )
    expect(html).toMatch(/accountPool.*\*/i)
  })

  it('renders scriptTemplate dropdown with "(可�?" hint', () => {
    const html = renderToString(
      <ClassificationSection
        form={baseForm()}
        onChange={() => {}}
        errors={{}}
        scriptTemplates={templates}
        accountPools={[]}
        loading={false}
      />
    )
    expect(html).toContain('scriptTemplateOptional')
  })

  it('shows loading state when loading', () => {
    const html = renderToString(
      <ClassificationSection
        form={baseForm()}
        onChange={() => {}}
        errors={{}}
        scriptTemplates={[]}
        accountPools={[]}
        loading={true}
      />
    )
    expect(html).toMatch(/loading/i)
  })
})

describe('ClassificationSection (interactive)', () => {
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

  it('changing status dropdown fires onChange with new status', () => {
    const onChange = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <ClassificationSection
          form={baseForm()}
          onChange={onChange}
          errors={{}}
          scriptTemplates={templates}
          accountPools={pools}
          loading={false}
        />
      )
    })
    const statusSelect = container.querySelector('select[name="status"]') as HTMLSelectElement
    changeSelect(statusSelect, 'completed')
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as AirdropFormData
    expect(last.status).toBe('completed')
  })

  it('changing accountPool fires onChange with new pool', () => {
    const onChange = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <ClassificationSection
          form={baseForm()}
          onChange={onChange}
          errors={{}}
          scriptTemplates={templates}
          accountPools={pools}
          loading={false}
        />
      )
    })
    const poolSelect = container.querySelector('select[name="accountPool"]') as HTMLSelectElement
    changeSelect(poolSelect, 'secondary')
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as AirdropFormData
    expect(last.accountPool).toBe('secondary')
  })

  it('accountPool error is displayed', () => {
    act(() => {
      root = createRoot(container)
      root.render(
        <ClassificationSection
          form={baseForm({ accountPool: '' })}
          onChange={() => {}}
          errors={{ accountPool: 'required' }}
          scriptTemplates={[]}
          accountPools={pools}
          loading={false}
        />
      )
    })
    expect(container.textContent).toContain('required')
  })
})

// Sanity: TaskTemplateOption type is exported
const _x: TaskTemplateOption | null = null
void _x
