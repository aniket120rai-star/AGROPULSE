import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { StatusLevel } from '../types/agro';

interface StatusBadgeProps {
  status: StatusLevel;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const displayLabel = label ?? status;

  if (status === 'Good') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-[#1B4332] border border-emerald-200/80 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (status === 'Caution') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 border border-amber-200/80 whitespace-nowrap shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-900 border border-red-200/80 whitespace-nowrap shrink-0">
      <ShieldAlert className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

interface MatchRingProps {
  score: number;
  size?: number;
}

export function MatchRing({ score, size = 46 }: MatchRingProps) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const strokeColor =
    score >= 82 ? '#2D6A4F' : score >= 65 ? '#D97706' : '#DC2626';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${score}% match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8E4"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold text-[#1E293B] tabular-nums">
        {score}%
      </span>
    </div>
  );
}
