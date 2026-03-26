"use client";

import { cn } from "@/lib/cn";

type Tab = {
  value: string;
  label: string;
};

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface-raised p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-in-out",
            active === tab.value ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:bg-primary-light",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
