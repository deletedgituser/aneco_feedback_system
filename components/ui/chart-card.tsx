import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-border bg-surface-soft p-4">{children}</div>
    </Card>
  );
}
