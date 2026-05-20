import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import Modal from './Modal'
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
  loading = false
}) => {
  return _jsxs(Modal, {
    open: open,
    onClose: onClose,
    title: title,
    maxWidth: 'max-w-sm',
    children: [
      _jsx('p', { className: 'text-sm text-text-secondary mb-6', children: message }),
      _jsxs('div', {
        className: 'flex justify-end gap-2',
        children: [
          _jsx('button', {
            onClick: onClose,
            className:
              'px-4 py-1.5 text-sm border border-border-light hover:bg-bg-card-hover rounded-lg transition-colors',
            children: cancelText
          }),
          _jsx('button', {
            onClick: onConfirm,
            disabled: loading,
            className: `px-4 py-1.5 text-sm text-white rounded-lg disabled:opacity-50 transition-colors ${danger ? 'bg-danger hover:bg-danger-hover' : 'bg-primary hover:bg-primary-hover'}`,
            children: loading ? '...' : confirmText
          })
        ]
      })
    ]
  })
}
export default ConfirmDialog
