import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

/**
 * Reusable header for data-entry detail pages.
 *
 * Accepts:
 * - `title`: string displayed as section heading.
 *
 * Behavior:
 * - Back button calls `navigate(-1)` to return to previous settings screen.
 */
export function DataEntryDetailHeader({ title }) {
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => navigate(-1)}
        className="text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

/**
 * Reusable action row card used across data-entry settings screens.
 *
 * Accepts:
 * - `title`: primary label.
 * - `description`: secondary helper text.
 * - `icon`: Lucide icon component.
 * - `onClick`: callback triggered when row is pressed.
 *
 * Returns:
 * - A full-width button row with consistent visual style and chevron affordance.
 */
export function DataEntryActionRow({ title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-sm bg-white p-4 text-left shadow-md transition hover:bg-slate-100"
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-slate-900">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
}
