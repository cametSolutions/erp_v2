import { createContext, useContext } from "react";

export const MobileHeaderContext = createContext(null);

export function useMobileHeaderContext() {
  const context = useContext(MobileHeaderContext);

  if (!context) {
    throw new Error("useMobileHeader must be used within HomeLayout.");
  }

  return context;
}
