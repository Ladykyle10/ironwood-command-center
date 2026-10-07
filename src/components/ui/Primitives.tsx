"use client";

import clsx from "clsx";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { initials } from "@/lib/format";

/* ---------------- Layout ---------------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[28px] leading-[1.1] sm:text-[34px] text-ink-900">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-600 leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, padded = true, as: Tag = "div" }: { children: ReactNode; className?: string; padded?: boolean; as?: "div" | "section" | "article" }) {
  return <Tag className={clsx("card", padded && "p-5 sm:p-6", className)}>{children}</Tag>;
}

export function SectionTitle({
  title,
  count,
  action,
  description,
  className,
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-end justify-between gap-3 mb-3", className)}>
      <div>
        <h2 className="text-[19px] text-ink-900 flex items-center gap-2">
          {title}
          {typeof count === "number" && <span className="tabular rounded-full bg-paper-200 px-2 py-0.5 text-[12px] font-sans font-semibold text-ink-600 tracking-normal">{count}</span>}
        </h2>
        {description && <p className="text-[13.5px] text-ink-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SeeAll({ href, label = "See all" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy-700 hover:text-ember-600 transition">
      {label}
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function EmptyState({
  title,
  body,
  action,
  compact,
  icon,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center rounded-[var(--radius-card)] border border-dashed border-ink-200 bg-paper-50", compact ? "px-5 py-8" : "px-6 py-14")}>
      {icon && <div className="mb-3 text-ink-400">{icon}</div>}
      <div className="font-display text-[20px] text-ink-900">{title}</div>
      {body && <p className="mt-1.5 max-w-sm text-[14px] text-ink-500 leading-relaxed">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = "md", tone = "navy" }: { name: string; size?: "sm" | "md" | "lg"; tone?: "navy" | "ember" | "paper" }) {
  const sz = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-[13px]", lg: "h-12 w-12 text-[16px]" }[size];
  const tn = { navy: "bg-navy-900 text-paper-100", ember: "bg-ember-500 text-white", paper: "bg-paper-300 text-ink-700" }[tone];
  return (
    <span className={clsx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide", sz, tn)} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Stat({ label, value, hint, tone = "neutral", href }: { label: string; value: ReactNode; hint?: string; tone?: "neutral" | "ember" | "amber" | "sage" | "steel"; href?: string }) {
  const color = { neutral: "text-ink-900", ember: "text-ember-600", amber: "text-amber-600", sage: "text-sage-600", steel: "text-steel-600" }[tone];
  const inner = (
    <>
      <div className="eyebrow">{label}</div>
      <div className={clsx("mt-1.5 font-display text-[32px] leading-none tabular", color)}>{value}</div>
      {hint && <div className="mt-1.5 text-[12.5px] text-ink-500">{hint}</div>}
    </>
  );
  const cls = "card p-4 sm:p-5 min-w-0 block";
  return href ? <Link href={href} className={clsx(cls, "hover:border-ink-300 transition")}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export function Progress({ value, tone = "steel", className }: { value: number; tone?: "steel" | "sage" | "ember" | "amber"; className?: string }) {
  const bar = { steel: "bg-steel-500", sage: "bg-sage-500", ember: "bg-ember-500", amber: "bg-amber-500" }[tone];
  return (
    <div className={clsx("h-1.5 w-full rounded-full bg-ink-100 overflow-hidden", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-all", bar)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* ---------------- Drawer (right on desktop, sheet on mobile) ---------------- */

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "absolute bg-white shadow-[var(--shadow-pop)] flex flex-col",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl animate-slide-up",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:rounded-none sm:animate-slide-in-right",
          wide ? "sm:w-[640px]" : "sm:w-[520px]",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div className="min-w-0 font-display text-[22px] leading-tight text-ink-900">{title}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm -mr-2" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-ink-100 px-5 py-4 sm:px-6 flex flex-wrap gap-2 justify-end bg-paper-50">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Tabs ---------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-1 overflow-x-auto scroll-thin border-b border-ink-100 -mx-1 px-1", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={clsx(
              "relative shrink-0 px-3 py-2.5 text-[14px] font-semibold transition whitespace-nowrap",
              active ? "text-ink-900" : "text-ink-500 hover:text-ink-800",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className={clsx("ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] tabular", active ? "bg-navy-900 text-white" : "bg-paper-200 text-ink-500")}>{t.count}</span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-ember-500" />}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Segmented filter chips ---------------- */

export function Chips<T extends string>({
  options,
  value,
  onChange,
  allLabel,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T | "ALL";
  onChange: (v: T | "ALL") => void;
  allLabel?: string;
}) {
  const all = [{ value: "ALL" as const, label: allLabel ?? "All" }, ...options];
  return (
    <div className="flex gap-1.5 overflow-x-auto scroll-thin -mx-1 px-1 py-0.5">
      {all.map((o) => {
        const active = o.value === value;
        const count = "count" in o ? o.count : undefined;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value as T | "ALL")}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-inset transition",
              active ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-ink-600 ring-ink-200 hover:ring-ink-300",
            )}
          >
            {o.label}
            {typeof count === "number" && <span className={clsx("ml-1 tabular", active ? "text-paper-300" : "text-ink-400")}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Definition list ---------------- */

export function DL({ items, cols = 2 }: { items: { label: string; value: ReactNode }[]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={clsx("grid gap-x-6 gap-y-4", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="eyebrow">{it.label}</dt>
          <dd className="mt-1 text-[15px] text-ink-800 break-words">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
