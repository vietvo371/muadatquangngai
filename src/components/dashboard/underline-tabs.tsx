import { cn } from '@/lib/utils';

interface UnderlineTabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function UnderlineTabs({ tabs, activeTab, onChange }: UnderlineTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-gray-200 overflow-x-auto scrollbar-hide w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "py-4 text-[14px] font-bold whitespace-nowrap border-b-2 transition-colors relative top-[1px]",
              isActive 
                ? "border-primary text-primary" 
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-[11px]",
                isActive ? "bg-primary-light text-primary" : "bg-gray-100 text-gray-500"
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
