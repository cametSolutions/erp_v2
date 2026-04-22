import { ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DataEntryActionRow,
  DataEntryDetailHeader,
} from "@/pages/settings/DataEntrySettingsShared";
import { useState } from "react";

/**
 * Placeholder sheet for receipt data-entry settings.
 * Kept as a dedicated component so real controls can be added later
 * without changing page-level structure.
 */
function ReceiptSettingsSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88vh] w-full flex-col gap-0 rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b border-slate-100 px-6 py-5">
          <SheetTitle>Receipt Settings</SheetTitle>
          <SheetDescription>Coming soon</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-slate-500">
          Receipt-specific data entry settings are not available yet.
        </div>
        <SheetFooter className="border-t border-slate-100 px-6 py-4">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Receipt data-entry settings page.
 *
 * Current state:
 * - Contains a single "Coming soon" entry point to maintain navigation parity
 *   with Order and Voucher settings sections.
 */
export default function DataEntryReceiptSettings() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="space-y-4 bg-white">
      {/* <DataEntryDetailHeader title="Receipt" /> */}
      <DataEntryActionRow
        title="Receipt Settings"
        description="Coming soon"
        icon={ReceiptText}
        onClick={() => setSheetOpen(true)}
      />

      <ReceiptSettingsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
