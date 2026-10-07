"use client";

import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Condition, Operator, RuleSet } from "@/lib/types";
import { FIELD_GROUPS, FIELD_MAP, FIELD_REGISTRY } from "@/lib/engine/fields";
import { OPERATORS_BY_TYPE } from "@/lib/engine/rules";
import { Select, Input } from "@/components/ui/Form";

/**
 * Visual editor for a RuleSet: IF (all / any) of these conditions hold.
 * Field, operator and value inputs adapt to the field type from the registry.
 */
export function RuleBuilder({ value, onChange, label, hint, tone = "ember" }: { value: RuleSet; onChange: (v: RuleSet) => void; label: string; hint?: string; tone?: "ember" | "amber" }) {
  const setCond = (i: number, patch: Partial<Condition>) => {
    const next = value.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange({ ...value, conditions: next });
  };
  const add = () => onChange({ ...value, conditions: [...value.conditions, { field: "org.employeeCount", operator: "gte", value: 1 }] });
  const remove = (i: number) => onChange({ ...value, conditions: value.conditions.filter((_, idx) => idx !== i) });

  return (
    <div className={clsx("rounded-xl border p-4", tone === "ember" ? "border-ember-200 bg-ember-50/30" : "border-amber-200 bg-amber-50/30")}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={clsx("text-[12px] font-bold uppercase tracking-[0.12em]", tone === "ember" ? "text-ember-700" : "text-amber-700")}>{label}</span>
        <span className="text-[13px] text-ink-600">when</span>
        <Select value={value.match} onChange={(e) => onChange({ ...value, match: e.target.value as "ALL" | "ANY" })} className="!w-auto !py-1 !text-[13px] !pr-8">
          <option value="ALL">all</option>
          <option value="ANY">any</option>
        </Select>
        <span className="text-[13px] text-ink-600">of these are true</span>
        {hint && <span className="ml-auto text-[12px] text-ink-500">{hint}</span>}
      </div>
      <div className="space-y-2">
        {value.conditions.map((c, i) => (
          <ConditionRow key={i} cond={c} index={i} onChange={(p) => setCond(i, p)} onRemove={() => remove(i)} />
        ))}
        {value.conditions.length === 0 && <div className="text-[13px] text-ink-500 py-1">No conditions — this rule never matches.</div>}
      </div>
      <button onClick={add} className="btn btn-secondary btn-sm mt-3"><Plus className="h-3.5 w-3.5" /> Add condition</button>
    </div>
  );
}

function ConditionRow({ cond, index, onChange, onRemove }: { cond: Condition; index: number; onChange: (p: Partial<Condition>) => void; onRemove: () => void }) {
  const def = FIELD_MAP[cond.field] ?? FIELD_REGISTRY[0];
  const ops = OPERATORS_BY_TYPE[def.type];
  const needsValue = !(cond.operator === "is_true" || cond.operator === "is_false");
  const listValue = Array.isArray(cond.value) ? cond.value : cond.value !== undefined && cond.value !== "" ? [String(cond.value)] : [];

  const onField = (key: string) => {
    const d = FIELD_MAP[key];
    const op = OPERATORS_BY_TYPE[d.type][0].value as Operator;
    const v = d.type === "boolean" ? undefined : d.type === "number" ? 1 : d.type === "list" ? [] : d.options?.[0] ?? "";
    onChange({ field: key, operator: op, value: v });
  };

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg bg-white border border-ink-100 p-2.5 sm:grid-cols-[auto_1.3fr_1fr_1.2fr_auto] sm:items-center">
      <span className="text-[11px] font-bold text-ink-400 w-8">{index === 0 ? "IF" : "AND"}</span>
      <Select value={cond.field} onChange={(e) => onField(e.target.value)} className="!py-1.5 !text-[13.5px]">
        {FIELD_GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {FIELD_REGISTRY.filter((f) => f.group === g).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </optgroup>
        ))}
      </Select>
      <Select value={cond.operator} onChange={(e) => onChange({ operator: e.target.value as Operator })} className="!py-1.5 !text-[13.5px]">
        {ops.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <div>
        {!needsValue ? (
          <span className="text-[13px] text-ink-400 px-1">—</span>
        ) : def.type === "number" ? (
          <Input type="number" value={Number(cond.value ?? 0)} onChange={(e) => onChange({ value: Number(e.target.value) })} className="!py-1.5 !text-[13.5px]" />
        ) : def.type === "list" || cond.operator === "in" ? (
          def.options ? (
            <MultiPick options={def.options} value={listValue} onChange={(v) => onChange({ value: v })} />
          ) : (
            <Input value={listValue.join(", ")} onChange={(e) => onChange({ value: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="comma-separated" className="!py-1.5 !text-[13.5px]" />
          )
        ) : def.options ? (
          <Select value={String(cond.value ?? "")} onChange={(e) => onChange({ value: e.target.value })} className="!py-1.5 !text-[13.5px]">
            {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        ) : (
          <Input value={String(cond.value ?? "")} onChange={(e) => onChange({ value: e.target.value })} className="!py-1.5 !text-[13.5px]" />
        )}
      </div>
      <button onClick={onRemove} className="btn btn-ghost btn-sm text-ink-400 hover:text-ember-600 justify-self-end" aria-label="Remove condition"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

/** Compact multi-select for list fields: a select to add + chips to remove. */
function MultiPick({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-md bg-navy-100 px-1.5 py-0.5 text-[12.5px] font-medium text-navy-800">
          {v}
          <button onClick={() => onChange(value.filter((x) => x !== v))} className="text-navy-400 hover:text-ember-600" aria-label={`Remove ${v}`}>×</button>
        </span>
      ))}
      <select
        value=""
        onChange={(e) => e.target.value && !value.includes(e.target.value) && onChange([...value, e.target.value])}
        className="rounded-md border border-ink-200 bg-white px-1.5 py-1 text-[12.5px] text-ink-600"
      >
        <option value="">+ add</option>
        {options.filter((o) => !value.includes(o)).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
