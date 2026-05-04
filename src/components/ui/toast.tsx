"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

export interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast(duration = 4000) {
  const [toast, setToast] = React.useState<ToastState | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, [toast, duration]);

  const show = (message: string, type: ToastType) => setToast({ message, type });
  const dismiss = () => setToast(null);

  return { toast, show, dismiss };
}

export function ToastOverlay({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-4",
          toast.type === "error"
            ? "bg-rose-600 text-white"
            : "bg-emerald-600 text-white"
        )}
      >
        {toast.type === "error"
          ? <AlertCircle className="h-5 w-5 shrink-0" />
          : <CheckCircle2 className="h-5 w-5 shrink-0" />
        }
        <span>{toast.message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
