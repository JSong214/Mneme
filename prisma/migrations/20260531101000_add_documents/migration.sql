CREATE TYPE "document_status" AS ENUM ('processing', 'ready', 'failed');

CREATE TABLE "documents" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "status" "document_status" NOT NULL DEFAULT 'processing',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_projectId_createdAt_idx" ON "documents"("projectId", "createdAt");

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_projectId_fkey"
  FOREIGN KEY ("projectId")
  REFERENCES "projects"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
