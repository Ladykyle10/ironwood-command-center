"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks";

export default function Index() {
  const router = useRouter();
  const { isIronwood } = useSession();
  useEffect(() => {
    router.replace(isIronwood ? "/admin" : "/app");
  }, [isIronwood, router]);
  return null;
}
