'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Video,
  Upload,
  Images,
  BarChart3,
  ShieldCheck,
  Settings,
  HardHat,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Live Detection',
    href: '/live',
    icon: Video,
  },
  {
    name: 'Upload & Detect',
    href: '/upload',
    icon: Upload,
  },
  {
    name: 'Gallery',
    href: '/gallery',
    icon: Images,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Compliance Check',
    href: '/compliance',
    icon: ShieldCheck,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo/Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
          <HardHat className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">RINL</span>
          <span className="text-xs text-muted-foreground">PPE Safety</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
            <span>System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
