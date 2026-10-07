"use client";

import { useState } from "react";
import clsx from "clsx";
import { ExternalLink, FileText } from "lucide-react";
import { formatISO } from "date-fns";
import { useStore, uid } from "@/store/useStore";
import { useSession } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { DomainTag, Pill } from "@/components/ui/Pill";
import { ALL_DOMAINS, DOMAIN_LABEL, type Document, type DocumentCategory, type Domain } from "@/lib/types";
import { daysUntil, fmtDate } from "@/lib/format";

export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  POLICY: "Policies",
  FORM: "Forms",
  TRAINING: "Training",
  HR: "HR",
  DOT: "DOT",
  SAFETY: "Safety",
  CONTRACTOR: "Contractor Compliance",
  GUIDANCE: "Regulatory guidance",
  TEMPLATE: "Templates",
  IRONWOOD: "Ironwood resources",
};

export function DocumentRow({ doc, onEdit }: { doc: Document; onEdit?: (d: Document) => void }) {
  const date = doc.expirationDate ?? doc.reviewDate;
  const days = daysUntil(date);
  const status =
    days === null ? null : days < 0 ? { label: doc.expirationDate ? "Expired" : "Review overdue", tone: "ember" as const } : days <= 30 ? { label: doc.expirationDate ? `Expires in ${days}d` : `Review in ${days}d`, tone: "amber" as const } : { label: doc.expirationDate ? `Expires ${fmtDate(date)}` : `Review ${fmtDate(date)}`, tone: "neutral" as const };
  return (
    <div className="flex gap-4 px-5 py-4">
      <div className="mt-0.5 hidden sm:grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-200 text-ink-500">
        <FileText className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {doc.domain && <DomainTag domain={doc.domain} />}
          <span className="text-[12px] text-ink-500">{CATEGORY_LABEL[doc.category]}</span>
          {status && <Pill tone={status.tone} size="sm">{status.label}</Pill>}
        </div>
        <div className="text-[15px] font-semibold text-ink-900 leading-snug">{doc.title}</div>
        <div className="text-[13.5px] text-ink-500 mt-0.5">{doc.description}</div>
        <div className="text-[12.5px] text-ink-400 mt-1">
          v{doc.version} · {doc.ownerName} · Added {fmtDate(doc.uploadedAt, "MMM d, yyyy")}{doc.fileName ? ` · ${doc.fileName}` : ""}{doc.sizeLabel ? ` (${doc.sizeLabel})` : ""}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {doc.url ? (
          <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
        ) : (
          <span className={clsx("text-[11.5px] text-ink-400")}>Metadata only</span>
        )}
        {onEdit && <button onClick={() => onEdit(doc)} className="text-[12.5px] font-semibold text-navy-700 hover:text-ember-600">Edit</button>}
      </div>
    </div>
  );
}

export function DocumentForm({ open, onClose, orgId, existing }: { open: boolean; onClose: () => void; orgId: string; existing?: Document }) {
  const saveDocument = useStore((s) => s.saveDocument);
  const removeDocument = useStore((s) => s.removeDocument);
  const { user, isIronwood } = useSession();
  const { toast } = useToast();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<DocumentCategory>(existing?.category ?? "POLICY");
  const [domain, setDomain] = useState<Domain | "">(existing?.domain ?? "");
  const [version, setVersion] = useState(existing?.version ?? "1.0");
  const [reviewDate, setReviewDate] = useState(existing?.reviewDate ?? "");
  const [expirationDate, setExpirationDate] = useState(existing?.expirationDate ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [fileName, setFileName] = useState(existing?.fileName ?? "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim()) return setError("Give the document a title.");
    if (url && !/^https?:\/\//i.test(url)) return setError("Links must start with http:// or https://.");
    const doc: Document = {
      id: existing?.id ?? uid("doc"),
      orgId,
      title: title.trim(),
      description: description.trim(),
      category,
      domain: domain || undefined,
      version: version.trim() || "1.0",
      uploadedAt: existing?.uploadedAt ?? formatISO(new Date()),
      ownerName: existing?.ownerName ?? user.name,
      reviewDate: reviewDate || undefined,
      expirationDate: expirationDate || undefined,
      url: url.trim() || undefined,
      fileName: fileName.trim() || undefined,
      sizeLabel: existing?.sizeLabel,
    };
    saveDocument(doc, user.name, isIronwood ? "IRONWOOD" : "CLIENT");
    toast(existing ? "Document updated" : "Document added", doc.title);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={existing ? "Edit document" : "Add document"}
      footer={
        <>
          {existing && <button className="btn btn-ghost text-ember-600 mr-auto" onClick={() => { removeDocument(existing.id); toast("Document removed"); onClose(); }}>Remove</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Save</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-paper-100 px-3.5 py-2.5 text-[12.5px] text-ink-600">
          File uploads are not enabled in demo mode. Record the document&apos;s details and an optional link; cloud storage attaches here when Supabase Storage is configured.
        </div>
        <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[64px]" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>{(Object.keys(CATEGORY_LABEL) as DocumentCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</Select></Field>
          <Field label="Service area"><Select value={domain} onChange={(e) => setDomain(e.target.value as Domain | "")}><option value="">None</option>{ALL_DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Version"><Input value={version} onChange={(e) => setVersion(e.target.value)} /></Field>
          <Field label="Review date"><Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} /></Field>
          <Field label="Expiration"><Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} /></Field>
        </div>
        <Field label="Link" hint="Optional — SharePoint, Google Drive or any URL."><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></Field>
        <Field label="File name"><Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. Handbook-v5.pdf" /></Field>
        {error && <div className="rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-700">{error}</div>}
      </div>
    </Drawer>
  );
}
