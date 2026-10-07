"use client";

import clsx from "clsx";
import { Check, ChevronDown, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

export function Field({ label, hint, children, className, required }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="text-ember-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <div className="mt-1 text-[12.5px] text-ink-500">{hint}</div>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("field", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("field min-h-[96px] leading-relaxed", props.className)} />;
}

export function Select({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={clsx("field appearance-none pr-9", className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none py-1.5">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition", checked ? "bg-navy-900" : "bg-ink-200")}
      >
        <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium text-ink-800">{label}</span>
        {description && <span className="block text-[12.5px] text-ink-500">{description}</span>}
      </span>
    </label>
  );
}

/** Multi-select rendered as toggleable chips, with free-text add. */
export function ChipSelect({
  options,
  value,
  onChange,
  allowCustom,
  placeholder = "Add…",
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  allowCustom?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const extras = value.filter((v) => !options.includes(v));
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-2">
      <div className="flex flex-wrap gap-1.5">
        {[...options, ...extras].map((o) => {
          const on = value.includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => toggle(o)}
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium ring-1 ring-inset transition",
                on ? "bg-navy-900 text-white ring-navy-900" : "bg-paper-100 text-ink-600 ring-ink-200 hover:ring-ink-300",
              )}
            >
              {on && <Check className="h-3 w-3" />}
              {o}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = draft.trim();
            if (v && !value.includes(v)) onChange([...value, v]);
            setDraft("");
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="field py-1.5 text-[13.5px]" />
          <button type="submit" className="btn btn-secondary btn-sm">Add</button>
        </form>
      )}
    </div>
  );
}

export function TagList({ items, onRemove }: { items: string[]; onRemove?: (i: string) => void }) {
  if (!items.length) return <span className="text-ink-400 text-[14px]">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-paper-200 px-2 py-0.5 text-[13px] text-ink-700">
          {i}
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)} className="text-ink-400 hover:text-ember-600" aria-label={`Remove ${i}`}>
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
