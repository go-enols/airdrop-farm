import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import AirdropFormModal from '../../../src/renderer/src/components/airdrops/AirdropFormModal'
import type { TaskTemplate } from '../../../../src/shared/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

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
  }
]
const pools = ['main']

describe('AirdropFormModal (server render)', () => {
  it('renders title for create mode', () => {
    const html = renderToString(
      <AirdropFormModal
        open={true}
        mode="create"
        onClose={() => {}}
        onSubmit={() => {}}
        formData={null}
        onChange={() => {}}
        scriptTemplates={templates}
        accountPools={pools}
        loadingFormData={false}
      />
    )
    expect(html).toContain('createAirdrop')
  })

  it('renders title for edit mode', () => {
    const html = renderToString(
      <AirdropFormModal
        open={true}
        mode="edit"
        onClose={() => {}}
        onSubmit={() => {}}
        formData={null}
        onChange={() => {}}
        scriptTemplates={templates}
        accountPools={pools}
        loadingFormData={false}
      />
    )
    expect(html).toContain('editAirdrop')
  })

  it('renders all 7 sections', () => {
    const html = renderToString(
      <AirdropFormModal
        open={true}
        mode="create"
        onClose={() => {}}
        onSubmit={() => {}}
        formData={null}
        onChange={() => {}}
        scriptTemplates={templates}
        accountPools={pools}
        loadingFormData={false}
      />
    )
    expect(html).toContain('sectionBasic')
    expect(html).toContain('sectionClassification')
    expect(html).toContain('sectionLinks')
    expect(html).toContain('sectionEligibility')
    expect(html).toContain('sectionTasks')
    expect(html).toContain('sectionEarnings')
    expect(html).toContain('sectionTags')
  })

  it('renders nothing when closed (open=false)', () => {
    const html = renderToString(
      <AirdropFormModal
        open={false}
        mode="create"
        onClose={() => {}}
        onSubmit={() => {}}
        formData={null}
        onChange={() => {}}
        scriptTemplates={templates}
        accountPools={pools}
        loadingFormData={false}
      />
    )
    expect(html).not.toContain('createAirdrop')
  })

  it('shows loading state when loadingFormData', () => {
    const html = renderToString(
      <AirdropFormModal
        open={true}
        mode="edit"
        onClose={() => {}}
        onSubmit={() => {}}
        formData={null}
        onChange={() => {}}
        scriptTemplates={[]}
        accountPools={[]}
        loadingFormData={true}
      />
    )
    expect(html).toMatch(/loading/i)
  })
})

describe('AirdropFormModal (interactive)', () => {
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

  it('clicking submit in create mode calls onSubmit with valid form', () => {
    const onSubmit = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropFormModal
          open={true}
          mode="create"
          onClose={() => {}}
          onSubmit={onSubmit}
          formData={null}
          onChange={() => {}}
          scriptTemplates={templates}
          accountPools={pools}
          loadingFormData={false}
        />
      )
    })
    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement
    const websiteInput = container.querySelector('input[name="website"]') as HTMLInputElement
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(nameInput.constructor.prototype, 'value')?.set
      setter?.call(nameInput, 'TestName')
      nameInput.dispatchEvent(new Event('input', { bubbles: true }))

      const setter2 = Object.getOwnPropertyDescriptor(websiteInput.constructor.prototype, 'value')?.set
      setter2?.call(websiteInput, 'https://test.com')
      websiteInput.dispatchEvent(new Event('input', { bubbles: true }))
    })
    // need to set accountPool too â€?but it has no `accountPool` input, it has select[name=accountPool]
    const poolSelect = container.querySelector('select[name="accountPool"]') as HTMLSelectElement
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(poolSelect.constructor.prototype, 'value')?.set
      setter?.call(poolSelect, 'main')
      poolSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const submitBtn = container.querySelector('[data-testid="airdrop-form-submit"]') as HTMLElement
    expect(submitBtn).toBeTruthy()
    act(() => {
      submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onSubmit).toHaveBeenCalled()
  })

  it('clicking cancel button calls onClose', () => {
    const onClose = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(
        <AirdropFormModal
          open={true}
          mode="create"
          onClose={onClose}
          onSubmit={() => {}}
          formData={null}
          onChange={() => {}}
          scriptTemplates={templates}
          accountPools={pools}
          loadingFormData={false}
        />
      )
    })
    const cancelBtn = container.querySelector('[data-testid="airdrop-form-cancel"]') as HTMLElement
    act(() => {
      cancelBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
