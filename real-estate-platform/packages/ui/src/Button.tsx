import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500 focus-visible:outline-primary-600',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-500 focus-visible:outline-secondary-600',
  outline: 'border border-secondary-300 bg-transparent text-secondary-700 hover:bg-secondary-50',
  ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-100',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
