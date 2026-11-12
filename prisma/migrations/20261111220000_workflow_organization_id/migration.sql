-- AlterTable: Clerk organization that owns a workflow (NULL = personal workspace).
-- Additive and nullable, so existing workflows are untouched.
ALTER TABLE "Workflow" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "Workflow_organizationId_idx" ON "Workflow"("organizationId");
