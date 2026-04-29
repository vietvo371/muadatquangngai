'use client';

import { LucideIcon } from 'lucide-react';

export interface StatItem {
  label: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

interface StatsCardProps {
  stat: StatItem;
  className?: string;
}

export function StatsCard({ stat, className }: StatsCardProps) {
  const Icon = stat.icon;
  const value = typeof stat.value === 'number' ? stat.value.toLocaleString('vi-VN') : stat.value;

  return (
    <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm ${className || ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 truncate">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {stat.change && (
            <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg || 'bg-primary-light'}`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor || 'text-primary'}`} />
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: StatItem[];
  className?: string;
  cols?: string;
}

export function StatsGrid({ stats, className, cols = 'grid-cols-2 md:grid-cols-4' }: StatsGridProps) {
  return (
    <div className={`grid ${cols} gap-3 sm:gap-4 ${className || ''}`}>
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} />
      ))}
    </div>
  );
}
