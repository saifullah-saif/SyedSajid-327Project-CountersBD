"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Reusable Status Badge Component
 * Provides consistent status indicators across admin dashboard
 */
export default function StatusBadge({ status, type = "event" }) {
  const getStatusConfig = () => {
    if (type === "event") {
      switch (status) {
        case "draft":
          return { label: "Draft", className: "bg-zinc-700 text-zinc-300" };
        case "pending":
          return {
            label: "Pending",
            className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          };
        case "approved":
          return {
            label: "Approved",
            className: "bg-green-500/10 text-green-500 border-green-500/20",
          };
        case "live":
          return {
            label: "Live",
            className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          };
        case "completed":
          return {
            label: "Completed",
            className: "bg-zinc-700 text-zinc-400 border-zinc-600",
          };
        case "cancelled":
          return {
            label: "Cancelled",
            className: "bg-red-500/10 text-red-500 border-red-500/20",
          };
        default:
          return { label: status, className: "bg-zinc-700 text-zinc-300" };
      }
    }

    if (type === "payment") {
      switch (status) {
        case "pending":
          return {
            label: "Pending",
            className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          };
        case "completed":
          return {
            label: "Completed",
            className: "bg-green-500/10 text-green-500 border-green-500/20",
          };
        case "failed":
          return {
            label: "Failed",
            className: "bg-red-500/10 text-red-500 border-red-500/20",
          };
        case "refunded":
          return {
            label: "Refunded",
            className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
          };
        default:
          return { label: status, className: "bg-zinc-700 text-zinc-300" };
      }
    }

    if (type === "organizer") {
      switch (status) {
        case "pending":
          return {
            label: "Pending Review",
            className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          };
        case "approved":
          return {
            label: "Approved",
            className: "bg-green-500/10 text-green-500 border-green-500/20",
          };
        case "rejected":
          return {
            label: "Rejected",
            className: "bg-red-500/10 text-red-500 border-red-500/20",
          };
        default:
          return { label: status, className: "bg-zinc-700 text-zinc-300" };
      }
    }

    return { label: status, className: "bg-zinc-700 text-zinc-300" };
  };

  const config = getStatusConfig();

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
