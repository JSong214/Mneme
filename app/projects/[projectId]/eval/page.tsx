import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { EvalClient } from "@/app/projects/[projectId]/eval/eval-client";
import { listProjectEval } from "@/lib/eval/service";
import { getProject } from "@/lib/projects/service";

export const dynamic = "force-dynamic";

type EvalPageProps = {
  params: {
    projectId: string;
  };
};

export default async function EvalPage({ params }: EvalPageProps) {
  const { projectId } = params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  const result = await listProjectEval(projectId);

  if (!result) {
    notFound();
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          {project.name}
        </Link>

        <EvalClient
          projectId={project.id}
          projectName={project.name}
          initialCases={result.cases}
          initialSummary={result.summary}
        />
      </div>
    </PageShell>
  );
}
