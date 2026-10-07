"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Gauge,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquareText,
  MoreHorizontal,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Briefcase,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSession, useOrgData } from "@/lib/hooks";
import { ROLE_LABEL, isIronwoodRole } from "@/lib/types";
import { Avatar } from "@/components/ui/Primitives";
import { timeAgo } from "@/lib/format";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  mobile?: boolean; // show in bottom bar
}

export function clientNav(counts: { attention: number; signals: number; questions: number }): NavItem[] {
  return [
    { href: "/app", label: "Home", icon: Home, mobile: true },
    { href: "/app/signal", label: "Ironwood Signal", icon: Radio, badge: counts.signals, mobile: true },
    { href: "/app/actions", label: "Action Center", icon: ListChecks, badge: counts.attention, mobile: true },
    { href: "/app/deadlines", label: "Deadlines", icon: CalendarClock, mobile: true },
    { href: "/app/readiness", label: "Readiness", icon: Gauge },
    { href: "/app/gaps", label: "Gaps & Opportunities", icon: AlertTriangle },
    { href: "/app/ask", label: "Ask Ironwood", icon: MessageSquareText, badge: counts.questions },
    { href: "/app/library", label: "Library", icon: BookOpen },
    { href: "/app/activity", label: "Activity", icon: Activity },
    { href: "/app/executive", label: "Executive View", icon: LayoutDashboard },
    { href: "/app/services", label: "Service Coverage", icon: ShieldCheck },
    { href: "/app/profile", label: "Company Profile", icon: Building2 },
  ];
}

export function adminNav(counts: { queue: number; drafts: number }): NavItem[] {
  return [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, mobile: true },
    { href: "/admin/clients", label: "Clients", icon: Users, mobile: true },
    { href: "/admin/signals", label: "Signals", icon: Radio, badge: counts.drafts, mobile: true },
    { href: "/admin/queue", label: "Consultant Queue", icon: Inbox, badge: counts.queue, mobile: true },
    { href: "/admin/actions", label: "All Actions", icon: ClipboardList },
    { href: "/admin/work", label: "Ironwood Work", icon: Briefcase },
    { href: "/admin/requirements", label: "Readiness Rules", icon: Sparkles },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/app" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children, nav, area }: { children: ReactNode; nav: NavItem[]; area: "client" | "admin" }) {
  const pathname = usePathname();
  const branding = useStore((s) => s.branding);
  const { user, activeOrg, isIronwood } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  const mobileItems = nav.filter((n) => n.mobile).slice(0, 4);
  const overflow = nav.filter((n) => !mobileItems.includes(n));

  return (
    <div className="min-h-dvh bg-paper-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-navy-900 text-paper-100 lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Link href={area === "admin" ? "/admin" : "/app"} className="block">
            <div className="font-display text-[20px] tracking-[0.2em] leading-none text-white">{branding.logoText}</div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-300">{area === "admin" ? "Consultant Console" : "Command Center"}</div>
          </Link>
        </div>
        {area === "client" && activeOrg && (
          <div className="mx-4 mb-3 rounded-lg bg-navy-800/80 px-3 py-2.5 border border-navy-700">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300">Organization</div>
            <div className="mt-0.5 text-[13.5px] font-semibold text-white leading-snug">{activeOrg.name}</div>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto scroll-thin px-3 pb-4">
          {nav.map((n) => {
            const active = isActive(pathname, n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition mb-0.5",
                  active ? "bg-white/[0.08] text-white" : "text-navy-200 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <Icon className={clsx("h-[18px] w-[18px] shrink-0", active ? "text-ember-300" : "text-navy-300 group-hover:text-navy-200")} />
                <span className="flex-1 truncate">{n.label}</span>
                {!!n.badge && <span className="tabular rounded-full bg-ember-500 px-1.5 py-0.5 text-[11px] font-bold text-white min-w-[20px] text-center">{n.badge}</span>}
              </Link>
            );
          })}
        </nav>
        {isIronwood && (
          <div className="px-3 pb-3">
            <Link
              href={area === "admin" ? "/app" : "/admin"}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-navy-200 hover:bg-white/[0.05] hover:text-white"
            >
              {area === "admin" ? <Users className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
              {area === "admin" ? "Open client portal" : "Back to console"}
            </Link>
          </div>
        )}
        <div className="border-t border-navy-700 px-5 py-4 text-[11.5px] text-navy-300 leading-relaxed">
          Support · {branding.supportPhone}
          <br />
          {branding.supportEmail}
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-[248px] flex min-h-dvh flex-col">
        <TopBar area={area} />
        {area === "client" && isIronwood && activeOrg && <ViewingAsBanner orgName={activeOrg.name} />}
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8 max-w-[1240px] w-full">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-5">
          {mobileItems.map((n) => {
            const active = isActive(pathname, n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className={clsx("relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold", active ? "text-navy-900" : "text-ink-400")}>
                <Icon className={clsx("h-5 w-5", active && "text-ember-500")} />
                <span className="truncate max-w-[72px]">{n.label.replace("Ironwood ", "").replace(" Center", "")}</span>
                {!!n.badge && <span className="absolute top-1.5 right-[22%] h-2 w-2 rounded-full bg-ember-500 ring-2 ring-white" />}
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold", overflow.some((n) => isActive(pathname, n.href)) ? "text-navy-900" : "text-ink-400")}>
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-8 animate-slide-up shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-display text-[20px] text-ink-900">More</div>
              <button onClick={() => setMoreOpen(false)} className="btn btn-ghost btn-sm" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {overflow.map((n) => {
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} className="flex items-center gap-2.5 rounded-lg border border-ink-100 bg-paper-50 px-3 py-3 text-[14px] font-medium text-ink-800">
                    <Icon className="h-4.5 w-4.5 text-navy-600" />
                    <span className="truncate">{n.label}</span>
                    {!!n.badge && <span className="ml-auto tabular rounded-full bg-ember-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{n.badge}</span>}
                  </Link>
                );
              })}
              {isIronwood && (
                <Link href={area === "admin" ? "/app" : "/admin"} className="flex items-center gap-2.5 rounded-lg border border-ink-100 bg-navy-900 px-3 py-3 text-[14px] font-medium text-white col-span-2">
                  {area === "admin" ? <Users className="h-4.5 w-4.5" /> : <LogOut className="h-4.5 w-4.5" />}
                  {area === "admin" ? "Open client portal" : "Back to console"}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      <span className="hidden">{user.id}</span>
    </div>
  );
}

function ViewingAsBanner({ orgName }: { orgName: string }) {
  return (
    <div className="bg-steel-50 border-b border-steel-200 px-4 py-2 text-[13px] text-steel-700 sm:px-6 lg:px-10 flex items-center gap-3 flex-wrap">
      <span className="font-semibold">Viewing as client:</span>
      <span>{orgName}</span>
      <Link href="/admin/clients" className="ml-auto font-semibold hover:underline">Switch client</Link>
      <Link href="/admin" className="font-semibold hover:underline">Console</Link>
    </div>
  );
}

/* ---------------- Top bar ---------------- */

function TopBar({ area }: { area: "client" | "admin" }) {
  const branding = useStore((s) => s.branding);
  const { user, activeOrg } = useSession();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-100 bg-paper-100/90 backdrop-blur px-4 sm:px-6 lg:px-10">
      <div className="lg:hidden flex items-center gap-2 min-w-0">
        <span className="font-display text-[15px] tracking-[0.18em] text-navy-900">{branding.logoText}</span>
        {area === "client" && activeOrg && <span className="truncate text-[12.5px] text-ink-500 border-l border-ink-200 pl-2">{activeOrg.name}</span>}
      </div>
      <div className="hidden lg:block text-[13px] text-ink-500">
        {area === "admin" ? "Ironwood Business Consulting · Consultant Console" : branding.portalName}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <NotificationBell area={area} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

function NotificationBell({ area }: { area: "client" | "admin" }) {
  const { activeOrgId } = useSession();
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllRead);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const audience = area === "admin" ? "IRONWOOD" : "CLIENT";
  const items = notifications
    .filter((n) => n.audience === audience && (audience === "IRONWOOD" || n.orgId === activeOrgId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-sm relative" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-ember-500 px-1 text-[10.5px] font-bold text-white grid place-items-center tabular">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] rounded-xl border border-ink-100 bg-white shadow-[var(--shadow-float)] animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <div className="font-semibold text-[14px] text-ink-900">Notifications</div>
            {unread > 0 && (
              <button onClick={() => markAll(audience, activeOrgId ?? undefined)} className="text-[12.5px] font-semibold text-navy-700 hover:text-ember-600">Mark all read</button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-thin">
            {items.length === 0 && <div className="px-4 py-8 text-center text-[13.5px] text-ink-500">You&apos;re all caught up.</div>}
            {items.slice(0, 20).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                  if (n.href) router.push(n.href);
                }}
                className={clsx("w-full text-left px-4 py-3 border-b border-ink-100 last:border-0 hover:bg-paper-100 transition flex gap-3", !n.read && "bg-ember-50/40")}
              >
                <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-ember-500")} />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink-900 leading-snug">{n.title}</span>
                  <span className="block text-[12.5px] text-ink-500 mt-0.5 leading-snug">{n.body}</span>
                  <span className="block text-[11px] text-ink-400 mt-1">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
          <Link href={area === "admin" ? "/admin" : "/app/notifications"} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-center text-[12.5px] font-semibold text-navy-700 hover:bg-paper-100 border-t border-ink-100">
            {area === "admin" ? "Go to dashboard" : "View all notifications"}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Demo-mode role switcher. Replace with Supabase Auth session menu in production. */
function UserMenu({ user }: { user: ReturnType<typeof useSession>["user"] }) {
  const users = useStore((s) => s.users);
  const organizations = useStore((s) => s.organizations);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const ironwood = users.filter((u) => isIronwoodRole(u.role));
  const clients = organizations.map((o) => ({ org: o, users: users.filter((u) => u.orgId === o.id) }));

  const choose = (id: string) => {
    const u = users.find((x) => x.id === id)!;
    setCurrentUser(id);
    setOpen(false);
    router.push(isIronwoodRole(u.role) ? "/admin" : "/app");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-paper-200 transition">
        <Avatar name={user.name} size="sm" tone={isIronwoodRole(user.role) ? "ember" : "navy"} />
        <span className="hidden sm:block text-left">
          <span className="block text-[13px] font-semibold text-ink-900 leading-tight">{user.name}</span>
          <span className="block text-[11px] text-ink-500 leading-tight">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,340px)] rounded-xl border border-ink-100 bg-white shadow-[var(--shadow-float)] animate-fade-up overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100">
            <div className="text-[13px] font-semibold text-ink-900">Switch demo user</div>
            <div className="text-[12px] text-ink-500">Demo mode — replaces sign-in. See README for Supabase Auth.</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-thin py-1">
            <div className="eyebrow px-4 pt-2 pb-1">Ironwood</div>
            {ironwood.map((u) => (
              <UserRow key={u.id} name={u.name} sub={`${ROLE_LABEL[u.role]}${u.title ? " · " + u.title : ""}`} active={u.id === user.id} onClick={() => choose(u.id)} tone="ember" />
            ))}
            {clients.map(({ org, users: us }) => (
              <div key={org.id}>
                <div className="eyebrow px-4 pt-3 pb-1">{org.name}</div>
                {us.map((u) => (
                  <UserRow key={u.id} name={u.name} sub={`${ROLE_LABEL[u.role]} · ${u.title}`} active={u.id === user.id} onClick={() => choose(u.id)} tone="navy" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ name, sub, active, onClick, tone }: { name: string; sub: string; active: boolean; onClick: () => void; tone: "ember" | "navy" }) {
  return (
    <button onClick={onClick} className={clsx("flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-paper-100 transition", active && "bg-paper-200")}>
      <Avatar name={name} size="sm" tone={tone} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink-900 truncate">{name}</span>
        <span className="block text-[11.5px] text-ink-500 truncate">{sub}</span>
      </span>
      {active && <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-sage-600">Current</span>}
    </button>
  );
}

/** Convenience wrapper for the client area: computes nav badges from org data. */
export function ClientShell({ children }: { children: ReactNode }) {
  const { activeOrgId } = useSession();
  const data = useOrgData(activeOrgId);
  const nav = clientNav({
    attention: data ? data.openActions.filter((a) => a.status !== "WAITING_ON_IRONWOOD").length : 0,
    signals: data ? data.matches.filter((m) => (m.status === "APPLIES" || m.status === "WATCH") && !m.acknowledgedAt).length : 0,
    questions: data ? data.questions.filter((q) => q.status === "FOLLOW_UP_REQUIRED").length : 0,
  });
  return <AppShell nav={nav} area="client">{children}</AppShell>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const questions = useStore((s) => s.questions);
  const signals = useStore((s) => s.signals);
  const nav = adminNav({
    queue: questions.filter((q) => q.status === "NEW" || q.status === "FOLLOW_UP_REQUIRED").length,
    drafts: signals.filter((s) => s.status === "DRAFT").length,
  });
  return <AppShell nav={nav} area="admin">{children}</AppShell>;
}
