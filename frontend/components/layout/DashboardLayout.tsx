'use client';

import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GeminiDrawer } from '@/components/gemini/GeminiDrawer';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  onRefresh,
  isRefreshing,
}: DashboardLayoutProps) {
  const [geminiOpen, setGeminiOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────────── */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar onGeminiOpen={() => setGeminiOpen(true)} />
      </div>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Sticky header (contains mobile burger menu) */}
        <Header
          title={title}
          subtitle={subtitle}
          onGeminiOpen={() => setGeminiOpen(true)}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable page content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'p-4 md:p-6',
            'bg-background'
          )}
        >
          {children}
        </main>
      </div>

      {/* ── Gemini Intelligence Drawer (right side sheet) ───────────────── */}
      <GeminiDrawer open={geminiOpen} onOpenChange={setGeminiOpen} />
    </div>
  );
}
