"use client";

import { useParams } from "next/navigation";
import { ActionDetail } from "@/components/client/ActionDetail";

export default function ClientActionPage() {
  const { id } = useParams<{ id: string }>();
  return <ActionDetail actionId={id} audience="CLIENT" backHref="/app/actions" backLabel="Action Center" />;
}
