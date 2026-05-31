import type { Project } from "@prisma/client";

export type ProjectDto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toProjectDto(project: Project): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}
