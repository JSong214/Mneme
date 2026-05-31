import { PageShell } from "@/components/page-shell";
import { listProjects } from "@/lib/projects/service";
import { ProjectsClient } from "@/app/projects/projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <PageShell>
      <ProjectsClient initialProjects={projects} />
    </PageShell>
  );
}
