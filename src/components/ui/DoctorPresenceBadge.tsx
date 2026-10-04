import React from 'react';

interface DoctorPresenceBadgeProps {
  status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN' | string;
  steppedOutUntil?: string | null;
  size?: 'sm' | 'md';
}

export const DoctorPresenceBadge: React.FC<DoctorPresenceBadgeProps> = ({
  status,
  steppedOutUntil,
  size = 'md',
}) => {
  const isAvailable = status === 'IN_CABIN';
  const isSteppedOut = status === 'STEPPED_OUT';

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textClasses = size === 'sm' ? 'text-[11px] font-semibold' : 'text-xs font-semibold';

  if (isAvailable) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${textClasses}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        In Cabin
      </span>
    );
  }

  if (isSteppedOut) {
    let returnText = 'Stepped Out';
    if (steppedOutUntil) {
      try {
        const time = new Date(steppedOutUntil);
        returnText = `Back at ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } catch (e) {
        returnText = 'Back soon';
      }
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 ${textClasses}`}>
        <span className={`rounded-full bg-amber-500 ${dotSize}`} />
        {returnText}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200/60 ${textClasses}`}>
      <span className={`rounded-full bg-gray-400 ${dotSize}`} />
      Away
    </span>
  );
};
