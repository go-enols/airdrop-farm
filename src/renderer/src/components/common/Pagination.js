import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { ChevronLeft, ChevronRight } from 'lucide-react'
const Pagination = ({ page, totalPages, onPrev, onNext, totalCountText, pageText }) => {
  const btnClass =
    'p-2 rounded-lg border border-border-light hover:bg-bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
  const textClass = 'text-sm text-text-muted min-w-[80px] text-center'
  if (totalCountText) {
    return _jsxs('div', {
      className: 'flex items-center justify-between',
      children: [
        _jsx('span', { className: 'text-sm text-text-muted', children: totalCountText }),
        _jsxs('div', {
          className: 'flex items-center gap-2',
          children: [
            _jsx('button', {
              onClick: onPrev,
              disabled: page <= 1,
              className: btnClass,
              children: _jsx(ChevronLeft, { size: 16 })
            }),
            _jsx('span', { className: textClass, children: pageText || `${page} / ${totalPages}` }),
            _jsx('button', {
              onClick: onNext,
              disabled: page >= totalPages,
              className: btnClass,
              children: _jsx(ChevronRight, { size: 16 })
            })
          ]
        })
      ]
    })
  }
  return _jsxs('div', {
    className: 'flex items-center justify-center gap-2',
    children: [
      _jsx('button', {
        onClick: onPrev,
        disabled: page <= 1,
        className: btnClass,
        children: _jsx(ChevronLeft, { size: 16 })
      }),
      _jsx('span', { className: textClass, children: pageText || `${page} / ${totalPages}` }),
      _jsx('button', {
        onClick: onNext,
        disabled: page >= totalPages,
        className: btnClass,
        children: _jsx(ChevronRight, { size: 16 })
      })
    ]
  })
}
export default Pagination
