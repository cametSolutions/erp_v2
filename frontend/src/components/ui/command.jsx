import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

function Command({ className, ...props }) {
  return (
    <div
      data-slot="command"
      className={cn(
        "flex h-full max-h-[20rem] w-full flex-col overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function CommandInput({ className, ...props }) {
  const inputValue = props.value;
  const hasValue = typeof inputValue === "string" && inputValue.length > 0;

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 px-3">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        data-slot="command-input"
        className={cn(
          "flex h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400",
          className
        )}
        {...props}
      />
      {hasValue && typeof props.onChange === "function" ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() =>
            props.onChange({
              target: { value: "" },
              currentTarget: { value: "" },
            })
          }
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function CommandList({ className, ...props }) {
  return (
    <div
      data-slot="command-list"
      className={cn(
        "max-h-[16rem] overflow-y-auto overscroll-contain p-1 touch-pan-y",
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }) {
  return (
    <div
      data-slot="command-empty"
      className={cn("px-3 py-6 text-center text-sm text-slate-500", className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }) {
  return (
    <div
      data-slot="command-group"
      className={cn("overflow-hidden p-1 text-slate-900", className)}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }) {
  return (
    <button
      type="button"
      data-slot="command-item"
      className={cn(
        "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm outline-none transition hover:bg-slate-100 focus:bg-slate-100 data-[selected=true]:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
};
