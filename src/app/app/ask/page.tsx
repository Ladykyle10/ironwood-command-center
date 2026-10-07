"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquareText, Send } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { triageQuestion } from "@/lib/engine/triage";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, EmptyState, SectionTitle } from "@/components/ui/Primitives";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { DomainTag, QuestionStatusPill } from "@/components/ui/Pill";
import { TriageCard } from "@/components/client/Triage";
import { PRIMARY_DOMAINS, DOMAIN_LABEL, type Domain, type Triage } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

const EXAMPLE = "An employee has been on short-term disability while attending rehabilitation. We do not qualify for FMLA. Can we terminate?";

export default function AskPage() {
  const { user, activeOrgId, canEdit } = useSession();
  const data = useOrgData(activeOrgId);
  const submitQuestion = useStore((s) => s.submitQuestion);
  const { toast } = useToast();
  const router = useRouter();
  const [text, setText] = useState("");
  const [domain, setDomain] = useState<Domain | "">("");
  const [triage, setTriage] = useState<Triage | null>(null);
  if (!data) return null;

  const analyze = () => {
    if (text.trim().length < 12) return;
    setTriage(triageQuestion(text.trim(), data.org, domain || undefined));
  };
  const send = () => {
    const q = submitQuestion(data.org.id, user.id, user.name, text.trim(), domain || undefined);
    toast("Sent to your Ironwood consultant", "You'll be notified when they respond.");
    setText("");
    setTriage(null);
    router.push(`/app/ask/${q.id}`);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        eyebrow="Ask Ironwood"
        title="Ask before you act"
        description="Describe the situation in plain language. You'll get a preliminary read based on your company profile, and your question goes to an Ironwood consultant."
      />

      <Card>
        {canEdit ? (
          <div className="space-y-4">
            <Field label="Your question">
              <Textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setTriage(null); }}
                placeholder={`e.g. ${EXAMPLE}`}
                className="min-h-[120px] text-[15.5px]"
              />
            </Field>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Service area" hint="Optional — we detect it if left blank." className="sm:w-64">
                <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain | "")}>
                  <option value="">Detect automatically</option>
                  {PRIMARY_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}
                </Select>
              </Field>
              <div className="flex flex-wrap gap-2 sm:ml-auto sm:mb-5">
                {!text && <button onClick={() => setText(EXAMPLE)} className="btn btn-ghost">Use example</button>}
                <button onClick={analyze} disabled={text.trim().length < 12} className="btn btn-secondary flex-1 sm:flex-none">Get preliminary read</button>
                <button onClick={send} disabled={text.trim().length < 12} className="btn btn-primary flex-1 sm:flex-none"><Send className="h-4 w-4" /> Send to consultant</button>
              </div>
            </div>
            {triage && (
              <div className="animate-fade-up space-y-3">
                <TriageCard triage={triage} />
                <div className="flex justify-end">
                  <button onClick={send} className="btn btn-accent"><Send className="h-4 w-4" /> Send to consultant</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState compact title="Viewer access" body="Your role can read questions and responses. Ask a client admin to submit new questions." />
        )}
      </Card>

      <section>
        <SectionTitle title="Your questions" count={data.questions.length} />
        {data.questions.length === 0 ? (
          <EmptyState title="No questions yet" body="Anything you ask here is reviewed by an Ironwood consultant." icon={<MessageSquareText className="h-6 w-6" />} />
        ) : (
          <Card padded={false} className="divide-y divide-ink-100">
            {data.questions.map((q) => (
              <Link key={q.id} href={`/app/ask/${q.id}`} className="group flex gap-4 px-5 py-4 hover:bg-paper-50 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <DomainTag domain={q.domain} />
                    <span className="text-[12.5px] text-ink-500">{q.submittedByName} · {fmtDateTime(q.submittedAt)}</span>
                  </div>
                  <div className="text-[15px] text-ink-900 leading-snug line-clamp-2 group-hover:text-navy-700">{q.text}</div>
                  {q.responses.length > 0 && (
                    <div className="mt-1.5 text-[13px] text-ink-500 line-clamp-1">
                      <span className="font-semibold text-ink-700">{q.responses[q.responses.length - 1].consultantName.split(" ")[0]}:</span> {q.responses[q.responses.length - 1].text}
                    </div>
                  )}
                </div>
                <QuestionStatusPill status={q.status} size="sm" />
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
