import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { AskClient } from "@/app/projects/[projectId]/ask/ask-client";
import { listProjectAskRuns } from "@/lib/ask/service";
import { listProjectDocuments } from "@/lib/documents/service";
import { getProject } from "@/lib/projects/service";

export const dynamic = "force-dynamic";

type AskPageProps = {
  params: {
    projectId: string;
  };
};

export default async function AskPage({ params }: AskPageProps) {
  const { projectId } = params;
  const [project, result, documentResult] = await Promise.all([
    getProject(projectId),
    listProjectAskRuns(projectId),
    listProjectDocuments(projectId)
  ]);

  if (!project) {
    notFound();
  }

  if (!result || !documentResult) {
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

        <AskClient
          projectId={project.id}
          projectName={project.name}
          initialRuns={result.runs}
          sourceDocuments={documentResult.documents.map((document) => ({
            id: document.id,
            fileName: document.fileName
          }))}
        />
      </div>
    </PageShell>
  );
}
