import React from 'react'
import { cn } from '../../lib/utils'

export function Btn({
  children, onClick, disabled, variant = 'primary', size = 'md', className,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'hero'; className?: string;
}) {
  const base = 'inline-flex items-center justify-center font-bold transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-2xl'
  const variants = {
    primary: 'bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm hover:shadow-xl active:scale-[0.98]',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 active:scale-[0.98]',
    outline: 'border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98]',
  }
  const sizes = {
    sm: 'text-xs px-4 py-2 gap-1.5',
    md: 'text-xs px-5 py-2.5 gap-2',
    lg: 'text-sm px-8 py-3.5 gap-2.5',
    hero: 'text-sm sm:text-base px-9 py-4 sm:px-11 sm:py-5 gap-3.5 shadow-2xl hover:scale-[1.02]',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </button>
  )
}
