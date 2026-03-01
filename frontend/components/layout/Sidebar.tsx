'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Activity,
  Sparkles,
  Settings,
  Zap,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { label: 'Dashboard', href: '/',          icon: LayoutDashboard },
  { label: 'Shipments', href: '/shipments', icon: Package },
  { label: 'Payments',  href: '/payments',  icon: CreditCard },
  { label: 'Event Log', href: '/events',    icon: Activity },
  { label: 'Gemini AI', href: '/gemini',    icon: Sparkles },
];

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  onGeminiOpen?: () => void;
}

export function Sidebar({ onGeminiOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-60 flex-col border-r"
      style={{
        backgroundColor: 'hsl(var(--sidebar-bg))',
        borderColor: 'hsl(var(--sidebar-border))',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p
            className="text-sm font-bold leading-none"
            style={{ color: 'hsl(var(--sidebar-fg))' }}
          >
            ZeroLag
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            Supply Chain AI
          </p>
        </div>
      </div>

      <Separator style={{ backgroundColor: 'hsl(var(--sidebar-border))' }} />

      {/* Network badge */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2 border"
          style={{
            backgroundColor: 'hsl(var(--sidebar-hover-bg))',
            borderColor: 'hsl(var(--sidebar-border))',
          }}
        >
          <Globe className="h-3 w-3" style={{ color: 'hsl(var(--sidebar-accent))' }} />
          <span
            className="text-[11px] font-medium"
            style={{ color: 'hsl(var(--sidebar-accent))' }}
          >
            Arc Testnet
          </span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p
          className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'hsl(var(--sidebar-muted))' }}
        >
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.label === 'Gemini AI') {
            return (
              <button
                key={item.href}
                onClick={onGeminiOpen}
                className={cn('nav-item w-full', isActive && 'nav-item-active')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/30">
                  AI
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', isActive && 'nav-item-active')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Separator style={{ backgroundColor: 'hsl(var(--sidebar-border))' }} />

      {/* Bottom nav */}
      <nav className="px-3 py-3 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', isActive && 'nav-item-active')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Version footer */}
      <div
        className="px-5 py-3 border-t"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <p
          className="text-[10px]"
          style={{ color: 'hsl(var(--sidebar-muted))' }}
        >
          v1.0.0 · ARC × Encode Hackathon
        </p>
      </div>
    </aside>
  );
}
