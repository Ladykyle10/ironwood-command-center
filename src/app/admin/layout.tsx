"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/shell/AppShell";
import { useSession } from "@/lib/hooks";

/** Ironwood console guard — client roles are redirected to their portal. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isIronwood } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isIronwood) router.replace("/app");
  }, [isIronwood, router]);

  if (!isIronwood) return null;
  return <AdminShell>{children}</AdminShell>;
}
