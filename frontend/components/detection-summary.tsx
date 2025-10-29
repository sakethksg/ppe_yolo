'use client';

import { cn } from '@/lib/utils';
import { User, HardHat, ShieldCheck } from 'lucide-react';

interface DetectionSummaryProps {
  summary: {
    person: number;
    helmet: number;
    'safety-vest': number;
  };
  className?: string;
  variant?: 'default' | 'compact';
}

export function DetectionSummary({ 
  summary, 
  className,
  variant = 'default'
}: DetectionSummaryProps) {
  const items = [
    {
      label: 'Persons',
      value: summary.person,
      icon: User,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      label: 'Helmets',
      value: summary.helmet,
      icon: HardHat,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      label: 'Safety Vests',
      value: summary['safety-vest'],
      icon: ShieldCheck,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <item.icon className={cn('w-4 h-4', item.color)} />
            <span className="text-sm font-medium text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded-lg border',
            item.bgColor
          )}
        >
          <div className="flex items-center gap-2">
            <item.icon className={cn('w-5 h-5', item.color)} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
