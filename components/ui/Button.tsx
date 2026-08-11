import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'lime' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mv-green/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-mv-green text-mv-cream hover:bg-mv-green-dark shadow-mv-sm border border-mv-green/30',
    lime: 'bg-mv-lime text-mv-cream hover:opacity-90 shadow-mv-sm font-bold border border-mv-lime/30',
    secondary: 'bg-mv-surface text-mv-ink border border-mv-border hover:bg-mv-cream-soft',
    outline: 'bg-transparent text-mv-ink border border-mv-border hover:border-mv-green hover:text-mv-green',
    ghost: 'bg-transparent text-mv-ink-soft hover:bg-mv-cream-soft hover:text-mv-ink',
    destructive: 'bg-mv-red text-white hover:opacity-90 shadow-mv-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
