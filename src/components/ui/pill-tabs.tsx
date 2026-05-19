import { cn } from '@/lib/utils';
import React from 'react';

interface PillTabsProps {
  tabs: { id: string; label: string; count?: number; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function PillTabs({ tabs, activeTab, onChange, className, orientation = 'horizontal' }: PillTabsProps) {
  return (
    <div className={cn(
      "flex gap-2 pb-2", 
      orientation === 'vertical' ? 'flex-col w-full' : 'items-center overflow-x-auto scrollbar-hide', 
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              orientation === 'vertical' ? 'w-full justify-start px-4 py-2.5 text-[14px] rounded-xl' : '',
              isActive 
                ? "bg-primary text-white shadow-sm hover:bg-primary/90" 
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {tab.icon && <span className="flex items-center shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "ml-auto px-2 py-0.5 rounded-full text-[11px]",
                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
