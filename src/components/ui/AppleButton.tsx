import React from 'react';
import { Loader2 } from 'lucide-react';

interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const AppleButton: React.FC<AppleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-normal rounded-full transition-all duration-150 select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-[#0066cc] text-white active:bg-[#0055b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071e3]',
    secondary:
      'bg-white text-[#0066cc] border border-[#d2d2d7] active:bg-[#f5f5f7]',
    ghost:
      'bg-[#f5f5f7] text-[#1d1d1f] active:bg-[#e5e5ea]',
    danger:
      'bg-[#ff3b30] text-white active:bg-[#d63026]',
    success:
      'bg-[#34c759] text-white active:bg-[#2db24f]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
