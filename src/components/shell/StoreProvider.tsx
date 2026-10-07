"use client";

import { useEffect, type ReactNode } from "react";
import { useStore } from "@/store/useStore";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Rehydrates the persisted demo store on the client and gates rendering so
 * server and client markup never disagree.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    const finish = () => useStore.getState().setHydrated(true);
    const unsub = useStore.persist.onFinishHydration(finish);
    useStore.persist.rehydrate();
    // If storage was empty, onFinishHydration still fires; belt and braces:
    const t = setTimeout(finish, 50);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-dvh grid place-items-center bg-paper-100">
        <div className="flex flex-col items-center gap-3">
          <div className="font-display text-[22px] tracking-[0.18em] text-navy-900">IRONWOOD</div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full w-1/2 animate-[shimmer_1s_ease-in-out_infinite] bg-ember-500" style={{ animationName: "shimmer" }} />
          </div>
          <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
        </div>
      </div>
    );
  }

  return <ToastProvider>{children}</ToastProvider>;
}
