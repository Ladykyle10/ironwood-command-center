"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone: "success" | "info";
}

const ToastCtx = createContext<{ toast: (title: string, body?: string, tone?: ToastItem["tone"]) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (title: string, body?: string, tone: ToastItem["tone"] = "success") => {
      const id = ++counter.current;
      setItems((xs) => [...xs, { id, title, body, tone }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:right-6 sm:left-auto">
        {items.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-float)] animate-fade-up",
              "bg-navy-900 text-paper-100 border-navy-700",
            )}
            role="status"
          >
            {t.tone === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-200 mt-0.5" /> : <Info className="h-5 w-5 shrink-0 text-steel-200 mt-0.5" />}
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">{t.title}</div>
              {t.body && <div className="text-[13px] text-navy-200 mt-0.5">{t.body}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-navy-300 hover:text-white" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
