import React from 'react'
import { cn } from '../../lib/utils'

export function Btn({
  children, onClick, disabled, variant = 'primary', size = 'md', className, type = 'button', style, title,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'hero'; className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  title?: string;
}) {
  const sizeClass = size === 'hero' ? 'btn-lg' : `btn-${size}`;
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled} 
      style={style}
      title={title}
      className={cn('btn', variantClass, sizeClass, className)}
    >
      {children}
    </button>
  )
}
