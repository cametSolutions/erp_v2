import { createContext, useContext } from "react";

export const DeleteConfirmContext = createContext(null);

export function useDeleteConfirm() {
  const context = useContext(DeleteConfirmContext);

  if (!context) {
    throw new Error("useDeleteConfirm must be used within DeleteConfirmProvider.");
  }

  return context;
}
