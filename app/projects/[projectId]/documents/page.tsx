import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { DocumentsClient } from "@/app/projects/[projectId]/documents/documents-client";
import { listProjectDocuments } from "@/lib/documents/service";
import { getProject } from "@/lib/projects/service";

export const dynamic = "force-dynamic";

type DocumentsPageProps = {
  params: {
    projectId: string;
  };
};

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { projectId } = params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  const result = await listProjectDocuments(projectId);

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

        <DocumentsClient
          projectId={project.id}
          projectName={project.name}
          initialDocuments={result.documents}
          initialSummary={result.summary}
        />
      </div>
    </PageShell>
  );
}
