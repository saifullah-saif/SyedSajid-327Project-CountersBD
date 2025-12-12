"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/**
 * Reusable Stats Card Component for Admin Dashboard
 * Displays key metrics with icon, title, value, and optional trend
 */
export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <Card className={cn("bg-zinc-900 border-zinc-800", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>

            {trend !== undefined && (
              <div className="flex items-center mt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isPositiveTrend && "text-green-500",
                    isNegativeTrend && "text-red-500",
                    !isPositiveTrend && !isNegativeTrend && "text-zinc-400"
                  )}
                >
                  {isPositiveTrend && "↑ "}
                  {isNegativeTrend && "↓ "}
                  {Math.abs(trend)}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-zinc-500 ml-1">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={cn("p-3 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
