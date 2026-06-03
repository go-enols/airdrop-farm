import { renderToString } from 'react-dom/server'
import EmptyState from '../../../src/renderer/src/components/common/EmptyState'
import { Package } from 'lucide-react'

describe('EmptyState', () => {
  it('renders icon, title, description', () => {
    const html = renderToString(
      <EmptyState icon={Package} title="No items" description="Add one to get started" />
    )
    expect(html).toContain('No items')
    expect(html).toContain('Add one to get started')
    expect(html).toContain('lucide-package')
  })

  it('renders optional action button when provided', () => {
    const html = renderToString(
      <EmptyState icon={Package} title="No items" action={<button>Add</button>} />
    )
    expect(html).toContain('Add')
    expect(html).toContain('button')
  })

  it('applies dense variant class for compact contexts', () => {
    const html = renderToString(<EmptyState icon={Package} title="x" dense />)
    expect(html).toMatch(/py-4|p-4/)
  })
})
