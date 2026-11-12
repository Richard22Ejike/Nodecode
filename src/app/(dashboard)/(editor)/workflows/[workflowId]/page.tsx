import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Editor,
  EditorError,
  EditorLoading,
} from "@/features/editor/components/Editor";
import { EditorHeader } from "@/features/editor/components/EditorHeader";
import { WorkflowRoom } from "@/features/editor/components/multiplayer/WorkflowRoom";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { isLiveblocksConfigured } from "@/lib/liveblocks";
import { HydrateClient } from "@/trpc/server";

interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  await requireAuth();

  const { workflowId } = await params;

  prefetchWorkflow(workflowId);

  // Multiplayer needs Liveblocks keys; without them the editor stays single-user
  const multiplayer = isLiveblocksConfigured();

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
          <WorkflowRoom workflowId={workflowId} enabled={multiplayer}>
            <EditorHeader workflowId={workflowId} multiplayer={multiplayer} />
            <main className="flex-1">
              <Editor workflowId={workflowId} multiplayer={multiplayer} />
            </main>
          </WorkflowRoom>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
