import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { BriefClient } from "@/app/projects/[projectId]/brief/brief-client";
import { getProjectBrief } from "@/lib/brief/service";

export const dynamic = "force-dynamic";

type BriefPageProps = {
  params: {
    projectId: string;
  };
};

export default async function BriefPage({ params }: BriefPageProps) {
  const brief = await getProjectBrief(params.projectId);

  if (!brief) {
    notFound();
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <Link
          href={`/projects/${brief.project.id}`}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          {brief.project.name}
        </Link>

        <BriefClient brief={brief} />
      </div>
    </PageShell>
  );
}
