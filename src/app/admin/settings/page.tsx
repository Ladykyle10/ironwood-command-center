"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, SectionTitle, Drawer, DL } from "@/components/ui/Primitives";
import { Field, Input } from "@/components/ui/Form";
import { Pill } from "@/components/ui/Pill";
import { ROLE_LABEL } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function SettingsPage() {
  const branding = useStore((s) => s.branding);
  const updateBranding = useStore((s) => s.updateBranding);
  const resetDemo = useStore((s) => s.resetDemo);
  const users = useStore((s) => s.users);
  const seededAt = useStore((s) => s.seededAt);
  const { isAdmin } = useSession();
  const { toast } = useToast();
  const [b, setB] = useState(branding);
  const [confirm, setConfirm] = useState(false);
  const supabase = isSupabaseConfigured();

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader eyebrow="Settings" title="Platform settings" description="Branding for this portal, demo data controls, and the current data mode." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Branding" description="Default is Ironwood. White-label partners get their own configuration (see README → White-label)." />
          <div className="space-y-4">
            <Field label="Portal name"><Input value={b.portalName} onChange={(e) => setB({ ...b, portalName: e.target.value })} disabled={!isAdmin} /></Field>
            <Field label="Logo text" hint="Shown in the sidebar until a logo image is configured."><Input value={b.logoText} onChange={(e) => setB({ ...b, logoText: e.target.value })} disabled={!isAdmin} /></Field>
            <Field label="Primary brand color">
              <div className="flex items-center gap-3">
                <input type="color" value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} disabled={!isAdmin} className="h-10 w-14 rounded-md border border-ink-200 bg-white p-1" />
                <Input value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} disabled={!isAdmin} className="max-w-[140px]" />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Support email"><Input value={b.supportEmail} onChange={(e) => setB({ ...b, supportEmail: e.target.value })} disabled={!isAdmin} /></Field>
              <Field label="Support phone"><Input value={b.supportPhone} onChange={(e) => setB({ ...b, supportPhone: e.target.value })} disabled={!isAdmin} /></Field>
            </div>
            {isAdmin ? (
              <button onClick={() => { updateBranding(b); toast("Branding saved"); }} className="btn btn-primary">Save branding</button>
            ) : (
              <div className="text-[13px] text-ink-500">Only Ironwood Admins can change branding.</div>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionTitle title="Data mode" />
            <DL cols={1} items={[
              { label: "Current mode", value: supabase ? <Pill tone="sage" dot>Supabase connected</Pill> : <Pill tone="amber" dot>Demo mode — browser storage</Pill> },
              { label: "What that means", value: supabase ? "Reads and writes go to your Supabase project with row-level security." : "All data lives in this browser's local storage. Nothing is sent to a server. Safe for demos; not for real client data." },
              { label: "Demo data seeded", value: new Date(seededAt).toLocaleString() },
            ]} />
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setConfirm(true)} className="btn btn-secondary"><RotateCcw className="h-4 w-4" /> Reset demo data</button>
            </div>
          </Card>
          <Card>
            <SectionTitle title="Demo users" description="Switch between them from the top-right menu." />
            <ul className="divide-y divide-ink-100">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2 text-[13.5px]">
                  <span><span className="font-medium text-ink-900">{u.name}</span> <span className="text-ink-500">· {u.email}</span></span>
                  <Pill tone={u.role.startsWith("IRONWOOD") ? "ember" : "navy"} size="sm">{ROLE_LABEL[u.role]}</Pill>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Drawer open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" footer={<><button className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancel</button><button className="btn btn-accent" onClick={() => { resetDemo(); setConfirm(false); toast("Demo data reset", "All three demo clients restored with fresh dates."); }}>Reset</button></>}>
        <p className="text-[14px] text-ink-700">This restores the three demo clients, Signals, actions and questions with dates relative to today. Anything you created in this browser will be removed.</p>
      </Drawer>
    </div>
  );
}
