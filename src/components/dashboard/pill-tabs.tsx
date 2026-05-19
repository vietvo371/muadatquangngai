import { cn } from '@/lib/utils';

interface PillTabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function PillTabs({ tabs, activeTab, onChange }: PillTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all",
              isActive 
                ? "bg-gray-900 text-white shadow-sm" 
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-[11px]",
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
