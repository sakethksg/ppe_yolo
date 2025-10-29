'use client';

import { cn } from '@/lib/utils';

interface ComplianceStatusBadgeProps {
  isCompliant: boolean | null | undefined;
  className?: string;
}

export function ComplianceStatusBadge({ isCompliant, className }: ComplianceStatusBadgeProps) {
  if (isCompliant === null || isCompliant === undefined) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        'bg-secondary text-secondary-foreground',
        className
      )}>
        <span className="text-lg">⚪</span>
        Unknown
      </span>
    );
  }

  if (isCompliant) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        'bg-chart-2/10 text-chart-2 border border-chart-2/20',
        className
      )}>
        <span className="text-lg">✅</span>
        Compliant
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
      'bg-destructive/10 text-destructive border border-destructive/20',
      className
    )}>
      <span className="text-lg">❌</span>
      Non-Compliant
    </span>
  );
}
