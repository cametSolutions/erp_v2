import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const DeleteConfirmContext = createContext(null);

const DEFAULT_OPTIONS = {
  title: "Delete this item?",
  description: "This action cannot be undone.",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
};

export function DeleteConfirmProvider({ children }) {
  const resolverRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    options: DEFAULT_OPTIONS,
  });

  const closeDialog = useCallback((confirmed) => {
    if (resolverRef.current) {
      resolverRef.current(confirmed);
      resolverRef.current = null;
    }

    setDialogState((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const confirmDelete = useCallback((options = {}) => {
    setDialogState({
      open: true,
      options: {
        ...DEFAULT_OPTIONS,
        ...options,
      },
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (!dialogState.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDialog(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDialog, dialogState.open]);

  const { title, description, confirmLabel, cancelLabel } = dialogState.options;

  return (
    <DeleteConfirmContext.Provider value={confirmDelete}>
      {children}

      {dialogState.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-description"
            className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="space-y-2">
              <h2
                id="delete-confirm-title"
                className="text-lg font-semibold text-slate-900"
              >
                {title}
              </h2>
              <p
                id="delete-confirm-description"
                className="text-sm leading-6 text-slate-500"
              >
                {description}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => closeDialog(false)}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => closeDialog(true)}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DeleteConfirmContext.Provider>
  );
}

export function useDeleteConfirm() {
  const context = useContext(DeleteConfirmContext);

  if (!context) {
    throw new Error("useDeleteConfirm must be used within DeleteConfirmProvider.");
  }

  return context;
}
