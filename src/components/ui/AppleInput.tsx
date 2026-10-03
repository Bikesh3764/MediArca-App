import React from 'react';

interface AppleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const AppleInput: React.FC<AppleInputProps> = ({
  label,
  error,
  icon,
  rightElement,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full text-left">
      {label && (
        <label className="block text-xs font-semibold text-[#86868b] tracking-wider uppercase mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[#86868b] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] text-sm rounded-xl py-3 transition-all duration-150 outline-none ${
            icon ? 'pl-10' : 'px-4'
          } ${rightElement ? 'pr-11' : 'pr-4'} ${error ? 'border-[#ff3b30] bg-red-50/30' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center text-[#86868b]">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#ff3b30] mt-1 ml-1">{error}</p>}
    </div>
  );
};
