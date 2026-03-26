// src/components/VoucherSeriesModal.jsx
"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function VoucherSeriesModal({
  isOpen,
  onClose,
  seriesList = [],
  selectedSeriesId,
  onSelectSeries,
}) {
  const [localSelectedId, setLocalSelectedId] = useState(selectedSeriesId);

  useEffect(() => {
    setLocalSelectedId(selectedSeriesId);
  }, [selectedSeriesId]);

  if (!isOpen) return null;

  const fallbackId = seriesList[0]?._id ?? null;
  const resolvedSelectedId = localSelectedId || selectedSeriesId || fallbackId;

  const currentSeries =
    seriesList.find((s) => s._id === resolvedSelectedId) ?? seriesList[0];

  const nextNumber =
    currentSeries?.currentNumber != null
      ? [
          currentSeries.prefix || "",
          String(currentSeries.currentNumber).padStart(
            currentSeries.widthOfNumericalPart || 1,
            "0"
          ),
          currentSeries.suffix || "",
        ]
          .filter(Boolean)
          .join(" / ")
      : "--";

  const formatNext = (s) => {
    const num = String(s.currentNumber || 1).padStart(
      s.widthOfNumericalPart || 1,
      "0"
    );
    return [s.prefix || "", num, s.suffix || ""].filter(Boolean).join(" / ");
  };

  const handleConfirm = () => {
    const selected =
      seriesList.find((s) => s._id === resolvedSelectedId) ?? seriesList[0];
    if (selected && onSelectSeries) onSelectSeries(selected);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-sm gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <DialogTitle className="text-sm font-semibold">
              Select series
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[11px] text-muted-foreground">
              Choose which series to use for this voucher.
            </DialogDescription>
          </div>
          
        </DialogHeader>

        <div className="border-b px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Current number:</span>{" "}
          <span className="tabular-nums">{nextNumber}</span>
        </div>

        <ScrollArea className="max-h-64 px-3 py-2.5">
          <div className="space-y-1.5">
            {seriesList.map((s) => {
              const isActive = s._id === resolvedSelectedId;
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => setLocalSelectedId(s._id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-xs transition-colors",
                    isActive
                      ? "border-primary/60 bg-primary/5"
                      : "border-border bg-background hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {s.seriesName}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Next: {formatNext(s)}
                  </p>
                </button>
              );
            })}
            {seriesList.length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                No series found for this voucher.
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-4 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-4 text-xs"
            onClick={handleConfirm}
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
