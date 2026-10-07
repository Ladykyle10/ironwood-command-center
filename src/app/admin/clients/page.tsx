"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useClientSummaries } from "@/lib/admin-data";
import { PageHeader } from "@/components/ui/Primitives";
import { ClientTable } from "@/components/admin/ClientTable";

function ClientsInner() {
  const rows = useClientSummaries();
  const pick = useSearchParams().get("pick") === "1";
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Client Management"
        title={pick ? "Choose a client to view" : "Clients"}
        description={pick ? "The client portal shows one organization at a time. Pick which client you want to see it as." : "Every organization Ironwood serves — readiness by domain, what needs attention, and who is assigned."}
        actions={<Link href="/admin/clients/new" className="btn btn-primary"><Plus className="h-4 w-4" /> New client</Link>}
      />
      <ClientTable rows={rows} pickMode={pick} />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsInner />
    </Suspense>
  );
}
