import React from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
  scrollable?: boolean
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  scrollable = true
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative bg-bg-card rounded-xl shadow-xl ring-1 ring-border-light p-6 w-full ${maxWidth} ${scrollable ? 'max-h-[90vh] overflow-y-auto' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export default Modal
