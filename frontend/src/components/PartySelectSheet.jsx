// src/components/PartySelectSheet.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { partyService } from "@/api/services/party.service";
import { PartyList } from "@/components/partyList";
import { setParty } from "@/store/slices/transactionSlice";

export default function PartySelectSheet({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const [selectedPartyId, setSelectedPartyId] = useState(null);

  const handleSelect = async (party) => {
    if (!party?._id) return;

    try {
      setSelectedPartyId(party._id);
      const fullParty = await partyService.getPartyById(party._id, {
        skipGlobalLoader: true,
      });

      dispatch(
        setParty({
          ...fullParty,
          totalOutstanding:
            fullParty?.totalOutstanding ?? party?.totalOutstanding ?? 0,
          classification:
            fullParty?.classification ?? party?.classification ?? "dr",
        })
      );
      onOpenChange(false);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch party details";
      toast.error(message);
    } finally {
      setSelectedPartyId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[80vh] max-h-[80vh] flex-col overflow-hidden rounded-t-3xl px-0 pt-3 pb-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 px-4 pb-2">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-sm">Select Party</SheetTitle>
              {selectedPartyId && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Loading details...
                </div>
              )}
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 px-4 pb-2">
            <PartyList mode="select" onSelect={handleSelect} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
