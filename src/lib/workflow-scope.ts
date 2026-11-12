// src/lib/workflow-scope.ts
//
// Who can see a workflow. With an active Clerk organization, the organization's
// workflows are shared by all its members. Without one, the user is in their
// personal workspace and sees only the workflows they created there
// (organizationId = null), which is where all pre-organization workflows live.

export type AuthScope = { userId: string; orgId?: string | null };

// Kept narrow (not Prisma.WorkflowWhereInput) so it can be spread into both
// `where` filters and `findUnique`-style unique selectors.
type WorkflowScope =
  | { organizationId: string }
  | { userId: string; organizationId: null };

export const workflowScope = ({ userId, orgId }: AuthScope): WorkflowScope =>
  orgId ? { organizationId: orgId } : { userId, organizationId: null };

/** Fields to set on a new workflow so it lands in the active workspace. */
export const newWorkflowOwner = ({ userId, orgId }: AuthScope) => ({
  userId,
  organizationId: orgId ?? null,
});
