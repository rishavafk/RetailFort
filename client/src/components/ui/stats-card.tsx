import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  valueClassName?: string;
  "data-testid"?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  valueClassName,
  "data-testid": testId 
}: StatsCardProps) {
  return (
    <Card className="shadow-sm border border-gray-100" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm mb-1">{title}</p>
            <p className={cn("text-xl font-medium", valueClassName)}>
              {value}
            </p>
          </div>
          <div className="flex-shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
