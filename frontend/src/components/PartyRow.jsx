import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export function PartyRow({ party, rightContent, onClick }) {
  return (
    <Card
      className="rounded border-none bg-slate-50 py-1 shadow-lg ring-0 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {party?.partyName || "Untitled Party"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {party?.mobileNumber || party?.emailID || "No contact details"}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {rightContent}
        </div>
      </CardContent>
    </Card>
  );
}
