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
    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl group">
      <div className={cn("p-3 rounded-xl shrink-0", colorClassName)}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[28px] font-bold text-gray-900 leading-none">{value}</p>
          {trend && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-0.5 shrink-0 ml-2",
              trend.isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              {trend.isUp ? '↑' : '↓'}{Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <h3 className="text-[13px] text-gray-500 font-medium truncate">{title}</h3>
      </div>
    </div>
  );
}
