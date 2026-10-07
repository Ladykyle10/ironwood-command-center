"use client";

import Link from "next/link";
import clsx from "clsx";
import { useSession, useOrgData } from "@/lib/hooks";
import { useStore } from "@/store/useStore";
import { PageHeader, Card, EmptyState } from "@/components/ui/Primitives";
import { timeAgo } from "@/lib/format";

export default function NotificationsPage() {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllRead);
  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Notifications"
        title="Updates for your team"
        description="Deadlines, assigned actions, applicable Signals, document expirations and consultant responses. Email delivery can be enabled in production."
        actions={data.unread > 0 ? <button onClick={() => markAll("CLIENT", data.org.id)} className="btn btn-secondary">Mark all read</button> : undefined}
      />
      {data.notifications.length === 0 ? (
        <EmptyState title="You're all caught up" body="New updates will appear here." />
      ) : (
        <Card padded={false} className="divide-y divide-ink-100">
          {data.notifications.map((n) => (
            <Link key={n.id} href={n.href ?? "/app"} onClick={() => markRead(n.id)} className={clsx("flex gap-3 px-5 py-4 hover:bg-paper-50 transition", !n.read && "bg-ember-50/40")}>
              <span className={clsx("mt-2 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-ember-500")} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-ink-900">{n.title}</div>
                <div className="text-[13.5px] text-ink-600 mt-0.5">{n.body}</div>
                <div className="text-[12px] text-ink-400 mt-1">{timeAgo(n.createdAt)}</div>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
