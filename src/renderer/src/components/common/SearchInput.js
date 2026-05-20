import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { Search } from 'lucide-react'
const SearchInput = ({
  value,
  onChange,
  placeholder,
  className = '',
  inputClassName = 'pl-9 pr-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64 bg-bg-card'
}) => {
  return _jsxs('div', {
    className: `relative ${className}`,
    children: [
      _jsx(Search, {
        size: 16,
        className: 'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted'
      }),
      _jsx('input', {
        type: 'text',
        value: value,
        onChange: (e) => onChange(e.target.value),
        placeholder: placeholder,
        className: inputClassName
      })
    ]
  })
}
export default SearchInput
