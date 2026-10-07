"use client";

import { useParams } from "next/navigation";
import { ActionDetail } from "@/components/client/ActionDetail";

export default function AdminActionPage() {
  const { id } = useParams<{ id: string }>();
  return <ActionDetail actionId={id} audience="IRONWOOD" backHref="/admin/actions" backLabel="All actions" />;
}
