"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "@/components/shell/AppShell";
import { useSession } from "@/lib/hooks";

/**
 * Client portal guard. Client users always have an organization; Ironwood
 * users must pick a client to view (see /admin/clients → "View as client").
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { activeOrg, isIronwood } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!activeOrg && isIronwood) router.replace("/admin/clients?pick=1");
  }, [activeOrg, isIronwood, router]);

  if (!activeOrg) return null;
  return <ClientShell>{children}</ClientShell>;
}
