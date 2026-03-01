'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  LayoutDashboard,
  Package,
  CreditCard,
  Activity,
  Sparkles,
  Settings,
  Zap,
  Globe,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { label: 'Dashboard', href: '/',          icon: LayoutDashboard },
  { label: 'Shipments', href: '/shipments', icon: Package },
  { label: 'Payments',  href: '/payments',  icon: CreditCard },
  { label: 'Event Log', href: '/events',    icon: Activity },
  { label: 'Gemini AI', href: '/gemini',    icon: Sparkles, isGemini: true },
  { label: 'Settings',  href: '/settings',  icon: Settings },
];

interface MobileNavProps {
  onGeminiOpen?: () => void;
}

export function MobileNav({ onGeminiOpen }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const handleGeminiClick = () => {
    setOpen(false);
    onGeminiOpen?.();
  };

  return (
    <>
      {/* Burger trigger button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="md:hidden text-foreground hover:bg-muted"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 border-r"
          style={{
            backgroundColor: 'hsl(var(--sidebar-bg))',
            borderColor: 'hsl(var(--sidebar-border))',
          }}
        >
          {/* Header */}
          <SheetHeader
            className="px-5 py-4 border-b"
            style={{ borderColor: 'hsl(var(--sidebar-border))' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <SheetTitle
                    className="text-sm font-bold leading-none"
                    style={{ color: 'hsl(var(--sidebar-fg))' }}
                  >
                    ZeroLag
                  </SheetTitle>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: 'hsl(var(--sidebar-muted))' }}
                  >
                    Supply Chain AI
                  </p>
                </div>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  style={{ color: 'hsl(var(--sidebar-fg))' }}
                  className="hover:bg-[hsl(var(--sidebar-hover-bg))]"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Network badge */}
          <div className="px-4 py-3">
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2 border"
              style={{
                backgroundColor: 'hsl(var(--sidebar-hover-bg))',
                borderColor: 'hsl(var(--sidebar-border))',
              }}
            >
              <Globe
                className="h-3 w-3"
                style={{ color: 'hsl(var(--sidebar-accent))' }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: 'hsl(var(--sidebar-accent))' }}
              >
                Arc Testnet
              </span>
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          <Separator style={{ backgroundColor: 'hsl(var(--sidebar-border))' }} />

          {/* Nav items */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            <p
              className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'hsl(var(--sidebar-muted))' }}
            >
              Navigation
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.isGemini) {
                return (
                  <button
                    key={item.href}
                    onClick={handleGeminiClick}
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
                  onClick={() => setOpen(false)}
                  className={cn('nav-item', isActive && 'nav-item-active')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t"
            style={{ borderColor: 'hsl(var(--sidebar-border))' }}
          >
            <p
              className="text-[10px]"
              style={{ color: 'hsl(var(--sidebar-muted))' }}
            >
              v1.0.0 · ARC × Encode Hackathon
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
