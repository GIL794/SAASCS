'use client';

import * as React from 'react';
import {
  Package,
  CreditCard,
  CheckCircle2,
  Activity,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'cyan' | 'emerald' | 'violet' | 'amber';
}

const colorMap = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'text-blue-400',    badge: 'text-blue-400' },
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    icon: 'text-cyan-400',    badge: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', badge: 'text-emerald-400' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'text-violet-400',  badge: 'text-violet-400' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',   badge: 'text-amber-400' },
};

interface StatsCardsProps {
  totalShipments?: number;
  paymentsSettled?: number;
  totalVolume?: string;
  aiDecisions?: number;
  avgSettlementMs?: number;
}

export function StatsCards({
  totalShipments = 0,
  paymentsSettled = 0,
  totalVolume = '0.00',
  aiDecisions = 0,
  avgSettlementMs = 0,
}: StatsCardsProps) {
  const stats: Stat[] = [
    {
      label: 'Total Shipments',
      value: totalShipments,
      sub: 'Active on Arc',
      icon: Package,
      color: 'blue',
      trend: 'up',
      trendValue: '+2 today',
    },
    {
      label: 'Payments Settled',
      value: paymentsSettled,
      sub: 'Via Circle Wallets',
      icon: CreditCard,
      color: 'emerald',
      trend: 'up',
      trendValue: '100% success',
    },
    {
      label: 'USDC Volume',
      value: `$${totalVolume}`,
      sub: 'On-chain settled',
      icon: Zap,
      color: 'cyan',
      trend: 'up',
      trendValue: 'Sub-second',
    },
    {
      label: 'AI Decisions',
      value: aiDecisions,
      sub: 'Gemini evaluations',
      icon: Activity,
      color: 'violet',
      trend: 'neutral',
      trendValue: 'Autonomous',
    },
    {
      label: 'Avg Settlement',
      value: avgSettlementMs > 0 ? `${avgSettlementMs}ms` : '< 1s',
      sub: 'Arc finality',
      icon: CheckCircle2,
      color: 'amber',
      trend: 'up',
      trendValue: 'Gas in USDC',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const colors = colorMap[stat.color];

        return (
          <Card
            key={stat.label}
            className={cn(
              'relative overflow-hidden border transition-all duration-200',
              'hover:shadow-glow hover:-translate-y-0.5',
              colors.border
            )}
          >
            <CardContent className="p-4">
              {/* Icon */}
              <div className={cn('mb-3 inline-flex rounded-lg p-2', colors.bg)}>
                <Icon className={cn('h-4 w-4', colors.icon)} />
              </div>

              {/* Value */}
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-foreground leading-none">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-foreground/80">
                  {stat.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {stat.sub}
                </p>
              </div>

              {/* Trend */}
              {stat.trendValue && (
                <div className={cn('mt-2 flex items-center gap-1', colors.badge)}>
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[10px] font-medium">{stat.trendValue}</span>
                </div>
              )}

              {/* Background decoration */}
              <div
                className={cn(
                  'absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-5',
                  colors.bg.replace('/10', '')
                )}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
