import React from 'react'
import { cn } from '../../lib/utils'

export function Btn({
  children, onClick, disabled, variant = 'primary', size = 'md', className,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'hero'; className?: string;
}) {
  const sizeClass = size === 'hero' ? 'btn-lg' : `btn-${size}`;
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={cn('btn', variantClass, sizeClass, className)}
    >
      {children}
    </button>
  )
}
