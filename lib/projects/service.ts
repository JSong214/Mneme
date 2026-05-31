import { prisma } from "@/lib/db/prisma";
import { createProjectSchema } from "@/lib/projects/schemas";
import { toProjectDto, type ProjectDto } from "@/lib/projects/types";

export async function listProjects(): Promise<ProjectDto[]> {
  const projects = await prisma.project.findMany({
    orderBy: {
      updatedAt: "desc"
    }
  });

  return projects.map(toProjectDto);
}

export async function getProject(projectId: string): Promise<ProjectDto | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  });

  return project ? toProjectDto(project) : null;
}

export async function createProject(
  input: unknown
): Promise<ProjectDto> {
  const data = createProjectSchema.parse(input);
  const description =
    data.description && data.description.length > 0 ? data.description : null;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description
    }
  });

  return toProjectDto(project);
}
