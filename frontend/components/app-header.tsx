'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid setState within effect
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            PPE Safety Monitoring System
          </h1>
          <p className="text-xs text-muted-foreground">
            Rashtriya Ispat Nigam Limited - Steel Plant
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-chart-2/10 border border-chart-2/20">
            <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
            <span className="text-xs font-medium text-chart-2">Online</span>
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg',
                'border bg-card hover:bg-accent transition-colors'
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-foreground" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
