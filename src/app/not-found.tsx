import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center bg-paper-100 px-6">
      <div className="text-center max-w-md">
        <div className="font-display text-[18px] tracking-[0.2em] text-navy-900 mb-6">IRONWOOD</div>
        <h1 className="text-[32px] text-ink-900">That page isn&apos;t here</h1>
        <p className="mt-3 text-[15px] text-ink-600">The link may be out of date, or the item was removed. Head back to your Command Center.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/app" className="btn btn-primary">Client portal</Link>
          <Link href="/admin" className="btn btn-secondary">Consultant console</Link>
        </div>
      </div>
    </div>
  );
}
