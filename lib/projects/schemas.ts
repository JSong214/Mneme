import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Project name is required." })
    .trim()
    .min(1, "Project name is required.")
    .max(120, "Project name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .optional()
});

export const deleteProjectSchema = z.object({
  confirmationName: z
    .string({ required_error: "Project confirmation name is required." })
    .trim()
    .min(1, "Project confirmation name is required.")
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
