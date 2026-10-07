"use client";

import { useState } from "react";
import clsx from "clsx";
import { useSession } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Avatar, Card } from "@/components/ui/Primitives";
import { Textarea } from "@/components/ui/Form";
import { fmtDateTime } from "@/lib/format";
import type { Question } from "@/lib/types";

/** Client-facing thread: original question, consultant responses, client follow-ups. */
export function QuestionThread({ question, allowReply }: { question: Question; allowReply: boolean }) {
  const { user } = useSession();
  const addClientReply = useStore((s) => s.addClientReply);
  const { toast } = useToast();
  const [reply, setReply] = useState("");

  const send = () => {
    if (!reply.trim()) return;
    addClientReply(question.id, user.id, user.name, reply.trim());
    setReply("");
    toast("Follow-up sent", "Your consultant has been notified.");
  };

  return (
    <Card>
      <div className="space-y-5">
        <Message name={question.submittedByName} at={question.submittedAt} text={question.text} side="client" />
        {question.responses.map((r) => (
          <Message key={r.id} name={r.consultantName} at={r.createdAt} text={r.text} side={r.from === "CLIENT" ? "client" : "ironwood"} />
        ))}
        {question.responses.length === 0 && (
          <div className="rounded-lg bg-paper-100 px-4 py-3 text-[13.5px] text-ink-600">
            {question.status === "REVIEWING" ? "An Ironwood consultant is reviewing this now." : "Waiting for an Ironwood consultant to pick this up."}
          </div>
        )}
        {allowReply && question.status !== "CLOSED" && (
          <div className="pt-2 border-t border-ink-100">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a follow-up or more detail…" className="min-h-[72px]" />
            <div className="mt-2 flex justify-end">
              <button onClick={send} disabled={!reply.trim()} className="btn btn-secondary">Send follow-up</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Message({ name, at, text, side }: { name: string; at: string; text: string; side: "client" | "ironwood" }) {
  return (
    <div className="flex gap-3">
      <Avatar name={name} size="sm" tone={side === "ironwood" ? "ember" : "navy"} />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-ink-500 mb-1">
          <span className="font-semibold text-ink-800">{name}</span>{side === "ironwood" ? " · Ironwood" : ""} · {fmtDateTime(at)}
        </div>
        <div className={clsx("rounded-xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap", side === "ironwood" ? "bg-ember-50 text-ink-900 border border-ember-100" : "bg-paper-100 text-ink-800")}>{text}</div>
      </div>
    </div>
  );
}
