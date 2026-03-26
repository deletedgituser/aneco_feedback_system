import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";

type ListCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ListCard({ title, subtitle, children }: ListCardProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="space-y-3">{children}</div>
    </Card>
  );
}
