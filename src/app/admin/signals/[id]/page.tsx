"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { SignalEditor } from "@/components/admin/SignalEditor";
import { EmptyState } from "@/components/ui/Primitives";

export default function EditSignalPage() {
  const { id } = useParams<{ id: string }>();
  const signal = useStore((s) => s.signals).find((x) => x.id === id);
  if (!signal) return <EmptyState title="Signal not found" action={<Link href="/admin/signals" className="btn btn-secondary">All Signals</Link>} />;
  return <SignalEditor key={signal.id} existing={signal} />;
}
