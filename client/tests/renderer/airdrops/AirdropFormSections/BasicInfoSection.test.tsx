import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import BasicInfoSection from '../../../../src/renderer/src/components/airdrops/AirdropFormSections/BasicInfoSection'
import type { AirdropFormData } from '../../../../src/renderer/src/components/airdrops/airdrop-defaults'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const baseForm = (overrides: Partial<AirdropFormData> = {}): AirdropFormData => ({
  name: 'Hyperliquid',
  website: 'https://app.hyperliquid.xyz',
  chain: 'Hyperliquid L1',
  description: 'Testnet points',
  scriptTemplateId: '',
  accountPool: 'main',
  status: 'ongoing',
  projectType: 'testnet',
  tags: 'L1, points',
  labels: '',
  links: [],
  eligibilityCriteria: [],
  tasks: [],
  earnings: [],
  ...overrides
})

function change(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set
    setter?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('BasicInfoSection (server render)', () => {
  it('renders name, website, chain, description fields', () => {
    const html = renderToString(
      <BasicInfoSection form={baseForm()} onChange={() => {}} errors={{}} />
    )
    expect(html).toContain('Hyperliquid')
    expect(html).toContain('https://app.hyperliquid.xyz')
    expect(html).toContain('Hyperliquid L1')
    expect(html).toContain('Testnet points')
  })

  it('marks name with required asterisk', () => {
    const html = renderToString(
      <BasicInfoSection form={baseForm()} onChange={() => {}} errors={{}} />
    )
    // name label contains " *"
    expect(html).toMatch(/name.*\*/i)
  })

  it('marks website with required asterisk', () => {
    const html = renderToString(
      <BasicInfoSection form={baseForm()} onChange={() => {}} errors={{}} />
    )
    expect(html).toMatch(/website.*\*/i)
  })

  it('renders description as textarea', () => {
    const html = renderToString(
      <BasicInfoSection form={baseForm()} onChange={() => {}} errors={{}} />
    )
    expect(html).toMatch(/<textarea/i)
  })

  it('shows markdown hint', () => {
    const html = renderToString(
      <BasicInfoSection form={baseForm()} onChange={() => {}} errors={{}} />
    )
    expect(html).toContain('descriptionMarkdownHint')
  })

  it('shows error message for name field', () => {
    const html = renderToString(
      <BasicInfoSection form={baseForm({ name: '' })} onChange={() => {}} errors={{ name: 'required' }} />
    )
    expect(html).toContain('required')
  })
})

describe('BasicInfoSection (interactive)', () => {
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

  it('calls onChange with full new formData when name field changes', () => {
    const onChange = vi.fn()
    act(() => {
      root = createRoot(container)
      root.render(<BasicInfoSection form={baseForm()} onChange={onChange} errors={{}} />)
    })
    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement
    change(nameInput, 'NewName')
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as AirdropFormData
    expect(lastCall.name).toBe('NewName')
  })
})
