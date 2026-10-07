"use client";

import { useSession, useOrgData } from "@/lib/hooks";
import { PageHeader } from "@/components/ui/Primitives";
import { ProfileEditor } from "@/components/client/ProfileEditor";

export default function ProfilePage() {
  const { activeOrgId, canEdit, isIronwood } = useSession();
  const data = useOrgData(activeOrgId);
  if (!data) return null;
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow="Company Profile"
        title={data.org.name}
        description="This profile drives everything else: which Signals apply, which requirements count toward readiness, and what Ask Ironwood knows about you. Keep it current and the rest stays accurate."
      />
      <ProfileEditor org={data.org} canEdit={canEdit} mode={isIronwood ? "IRONWOOD" : "CLIENT"} />
    </div>
  );
}
