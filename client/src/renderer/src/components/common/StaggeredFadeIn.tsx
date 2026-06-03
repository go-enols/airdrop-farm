import React from 'react'

interface StaggeredFadeInProps {
  children: React.ReactNode
  delayStep?: number
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

const StaggeredFadeIn: React.FC<StaggeredFadeInProps> = ({
  children,
  delayStep = 40,
  className = '',
  as: Tag = 'div'
}) => {
  const items = React.Children.toArray(children)
  return (
    <Tag className={`stagger-fade ${className}`}>
      {items.map((child, idx) => (
        <div
          key={(child as React.ReactElement)?.key ?? idx}
          className="stagger-item"
          style={{ ['--stagger-delay' as string]: `${idx * delayStep}ms` }}
        >
          {child}
        </div>
      ))}
    </Tag>
  )
}

export default StaggeredFadeIn
