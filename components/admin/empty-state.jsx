"use client";

import { FileQuestion } from "lucide-react";

/**
 * Empty State Component
 * Displays when no data is available in tables or lists
 */
export default function EmptyState({
  title = "No data found",
  description = "There are no items to display at the moment.",
  icon: Icon = FileQuestion,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-zinc-800/50 rounded-full p-4 mb-4">
        <Icon className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 text-center max-w-md">
        {description}
      </p>
    </div>
  );
}
