import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatBoxProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  colorClassName?: string;
}

export function StatBox({ title, value, icon, trend, colorClassName = 'bg-primary-light text-primary' }: StatBoxProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClassName)}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1",
            trend.isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-semibold mb-1">{title}</h3>
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
