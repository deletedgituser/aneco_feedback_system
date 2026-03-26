import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

type TableCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function TableCard({ title, subtitle, action, children }: TableCardProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-soft p-3">{children}</div>
    </Card>
  );
}
