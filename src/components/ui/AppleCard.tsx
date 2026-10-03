import React from 'react';

interface AppleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  compact?: boolean;
}

export const AppleCard: React.FC<AppleCardProps> = ({
  children,
  interactive = false,
  compact = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-[18px] border border-[#e5e5ea] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-150 ${
        compact ? 'p-3.5' : 'p-4.5'
      } ${
        interactive
          ? 'active:scale-[0.985] active:border-[#0066cc]/40 cursor-pointer select-none'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
