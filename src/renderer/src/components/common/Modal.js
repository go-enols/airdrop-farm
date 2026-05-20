import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-md', scrollable = true }) => {
  if (!open) return null
  return _jsxs('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center',
    children: [
      _jsx('div', { className: 'absolute inset-0 bg-black/50', onClick: onClose }),
      _jsxs('div', {
        className: `relative bg-bg-card rounded-xl shadow-xl p-6 w-full ${maxWidth} ${scrollable ? 'max-h-[90vh] overflow-y-auto' : ''}`,
        onClick: (e) => e.stopPropagation(),
        children: [
          _jsx('h2', {
            className: 'text-lg font-semibold text-text-primary mb-4',
            children: title
          }),
          children
        ]
      })
    ]
  })
}
export default Modal
