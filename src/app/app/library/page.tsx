"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader, Card, Chips, EmptyState } from "@/components/ui/Primitives";
import { Input } from "@/components/ui/Form";
import { DocumentRow, DocumentForm, CATEGORY_LABEL } from "@/components/client/Documents";
import type { Document, DocumentCategory } from "@/lib/types";

export default function LibraryPage() {
  const { activeOrgId, canEdit } = useSession();
  const data = useOrgData(activeOrgId);
  const [category, setCategory] = useState<DocumentCategory | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Document | null | "new">(null);
  if (!data) return null;

  const docs = data.documents
    .filter((d) => category === "ALL" || d.category === category)
    .filter((d) => !q || `${d.title} ${d.description} ${d.fileName ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const cats = (Object.keys(CATEGORY_LABEL) as DocumentCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c], count: data.documents.filter((d) => d.category === c).length })).filter((c) => c.count > 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Document & Resource Library"
        title="Your documents"
        description="Policies, forms, programs, training materials and Ironwood resources — with versions and review dates."
        actions={canEdit ? <button onClick={() => setEditing("new")} className="btn btn-primary"><Plus className="h-4 w-4" /> Add document</button> : undefined}
      />
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents" className="pl-9" />
      </div>
      <Chips options={cats} value={category} onChange={setCategory} />
      {docs.length === 0 ? (
        <EmptyState title="No documents here yet" body="Ironwood adds resources as work is completed. Your team can record policies and forms too." />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {docs.map((d) => <DocumentRow key={d.id} doc={d} onEdit={canEdit ? setEditing : undefined} />)}
        </Card>
      )}
      {editing && <DocumentForm open onClose={() => setEditing(null)} orgId={data.org.id} existing={editing === "new" ? undefined : editing} />}
    </div>
  );
}
