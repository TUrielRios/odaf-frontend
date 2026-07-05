import React from 'react'
import { dentalColors } from '../../config/colors'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantClasses = {
    primary: `bg-[${dentalColors.primary}] text-white hover:bg-[${dentalColors.primaryDark}] focus:ring-[${dentalColors.primary}]`,
    secondary: `bg-[${dentalColors.gray200}] text-[${dentalColors.gray800}] hover:bg-[${dentalColors.gray300}] focus:ring-[${dentalColors.gray400}]`,
    outline: `border-2 border-[${dentalColors.primary}] text-[${dentalColors.primary}] hover:bg-[${dentalColors.primary}] hover:text-white focus:ring-[${dentalColors.primary}]`,
    destructive: `bg-red-500 text-white hover:bg-red-700 focus:ring-red-500`,
    ghost: `bg-transparent text-[${dentalColors.gray700}] hover:bg-[${dentalColors.gray100}] focus:ring-[${dentalColors.gray400}]`
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const isDisabled = disabled || loading

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}