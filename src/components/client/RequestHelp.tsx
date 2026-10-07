"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Primitives";
import { Field, Textarea } from "@/components/ui/Form";
import { DOMAIN_LABEL, type Domain } from "@/lib/types";

/** Consultative "Ironwood support is available" request — enters the consultant queue as a question. */
export function RequestHelp({ open, onClose, orgId, domain, subject, detail }: { open: boolean; onClose: () => void; orgId: string; domain: Domain; subject: string; detail?: string }) {
  const { user } = useSession();
  const submitQuestion = useStore((s) => s.submitQuestion);
  const { toast } = useToast();
  const router = useRouter();
  const [text, setText] = useState(`Requesting Ironwood support for ${DOMAIN_LABEL[domain]}: ${subject}.${detail ? `\n\n${detail}` : ""}\n\nPlease let us know what the next step would look like.`);

  const send = () => {
    const q = submitQuestion(orgId, user.id, user.name, text.trim(), domain);
    toast("Request sent to Ironwood", "A consultant will follow up with next steps.");
    onClose();
    router.push(`/app/ask/${q.id}`);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Request Ironwood support" footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={send}>Send request</button></>}>
      <p className="text-[14px] text-ink-600 mb-4 leading-relaxed">
        {DOMAIN_LABEL[domain]} is not currently part of your active Ironwood services. Send this request and a consultant will reach out — no commitment.
      </p>
      <Field label="Message">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[160px]" />
      </Field>
    </Drawer>
  );
}
