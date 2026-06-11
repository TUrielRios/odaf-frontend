import React from 'react'
import { dentalColors } from '../../config/colors'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-[${dentalColors.gray200}] overflow-hidden ${className}`}
    >
      {(title || subtitle) && (
        <div className={`px-6 py-4 border-b border-[${dentalColors.gray200}]`}>
          {title && (
            <h3 className={`text-lg font-semibold text-[${dentalColors.gray900}]`}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className={`text-sm text-[${dentalColors.gray600}] mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-[${dentalColors.gray200}] ${className}`}>{children}</div>
)

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-[${dentalColors.gray900}] ${className}`}>{children}</h3>
)

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-[${dentalColors.gray600}] mt-1 ${className}`}>{children}</p>
)

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
)