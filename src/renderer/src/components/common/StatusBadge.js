import { jsxs as _jsxs } from 'react/jsx-runtime'
const StatusBadge = ({
  status,
  colorMap,
  defaultColor = 'bg-status-idle-bg text-status-idle-text',
  label,
  children
}) => {
  const hasChildren = !!children
  return _jsxs('span', {
    className: `${hasChildren ? 'inline-flex items-center gap-1.5' : 'inline-block'} px-2 py-0.5 text-xs rounded-full font-medium ${colorMap[status] || defaultColor}`,
    children: [children, label ?? status]
  })
}
export default StatusBadge
