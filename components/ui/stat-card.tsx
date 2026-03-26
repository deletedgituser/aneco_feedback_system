import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
};

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
          {trend ? <p className="mt-2 text-xs text-text-secondary">{trend}</p> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-light text-primary">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}
