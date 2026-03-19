import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MobileHeaderActions({ options, tone = "light" }) {
  const showMenuDots = options?.showMenuDots ?? true;
  const isDarkTone = tone === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const actionButtons = options?.actionButtons ?? [];
  const menuItems = options?.menuItems ?? [];

  const actionButtonClass = isDarkTone
    ? "flex h-9 w-9 items-center justify-center text-white transition-colors hover:text-white/75"
    : "flex h-9 w-9 items-center justify-center text-slate-700 transition-colors hover:text-slate-900";
  const menuPanelClass = isDarkTone
    ? "absolute right-0 top-11 z-40 min-w-[160px] overflow-hidden rounded-xl bg-slate-900/95 py-1 text-white shadow-xl backdrop-blur"
    : "absolute right-0 top-11 z-40 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-lg";

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [menuOpen]);

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {actionButtons.map((action, index) => {
        const Icon = action?.icon;
        const actionKey =
          action?.key || action?.label || action?.ariaLabel || `action-${index}`;

        return (
          <Button
            key={actionKey}
            type="button"
            variant={action.variant || "outline"}
            size={action.size || "sm"}
            className={action.className}
            onClick={action.onClick}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {action.label ? <span>{action.label}</span> : null}
          </Button>
        );
      })}

      {showMenuDots && (
        <button
          type="button"
          onClick={() => {
            if (options?.onMenuClick) {
              options.onMenuClick();
              return;
            }

            if (menuItems.length > 0) {
              setMenuOpen((prev) => !prev);
            }
          }}
          className={actionButtonClass}
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}

      {showMenuDots && menuOpen && menuItems.length > 0 && (
        <div className={menuPanelClass}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onSelect?.();
                setMenuOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                isDarkTone ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
