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
      className={`bg-white rounded-[18px] border border-[#e5e5ea] transition-all duration-150 ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      } ${
        interactive
          ? 'active:scale-95 active:border-[#0066cc]/40 cursor-pointer select-none'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
