"use client";

import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  type OnConnect,
  type OnDelete,
  type OnEdgesChange,
  type OnNodesChange,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { ErrorView, LoadingView } from "@/components/entity-components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";
import { useSetAtom } from "jotai";
import { nodeComponents } from "@/config/node-components";
import { AgentPanel } from "@/features/agent/components/AgentPanel";
import { GithubImportPanel } from "@/features/agent/components/GithubImportPanel";
import { useWorkflowExecutionStatus } from "@/features/executions/hooks/use-workflow-execution-status";
import { NodeType } from "@/generated/prisma/enums";
import { useExecutionGraph } from "../hooks/use-execution-graph";
import { editorAtom } from "../store/atoms";
import { AddNodeButton } from "./AddNodeButton";
import { ConsolePanel } from "./console/ConsolePanel";
import { ExecuteWorkflowButton } from "./ExecuteWorkflowButton";
import { ExecutionEdge } from "./ExecutionEdge";
import { LiveCursor } from "./multiplayer/LiveCursor";

const edgeTypes = {
  execution: ExecutionEdge,
};

type CanvasProps = {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onDelete?: OnDelete;
  /** Show other people's cursors (multiplayer only). */
  showCursors?: boolean;
};

const EditorCanvas = ({
  workflowId,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDelete,
  showCursors,
}: CanvasProps) => {
  const setEditor = useSetAtom(editorAtom);

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === NodeType.MANUAL_TRIGGER);
  }, [nodes]);

  const { decoratedNodes, decoratedEdges } = useExecutionGraph(nodes, edges);

  return (
    <ResizablePanelGroup direction="vertical" className="size-full">
      <ResizablePanel defaultSize={72} minSize={30}>
        <div className="size-full">
          <ReactFlow
            nodes={decoratedNodes}
            edges={decoratedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDelete={onDelete}
            nodeTypes={nodeComponents}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "execution" }}
            fitView
            onInit={setEditor}
            colorMode="dark"

            // TODO: Explore the settings for optimal user expirience
            // These Allows Selection and concurrent Deletion using Backspace
            // snapGrid={[10, 10]}
            // snapToGrid
            // panOnScroll
            // panOnDrag={false}
            // selectionOnDrag

            // proOptions={{
            //     hideAttribution: true
            // }}
          >
            <Background gap={22} size={1.25} />
            <Controls />
            <MiniMap />
            {showCursors && <Cursors components={{ Cursor: LiveCursor }} />}

            <Panel position="top-left">
              <div className="flex gap-2">
                <AgentPanel workflowId={workflowId} />
                <GithubImportPanel workflowId={workflowId} />
              </div>
            </Panel>
            <Panel position="top-right">
              <AddNodeButton />
            </Panel>
            {hasManualTrigger && (
              <Panel position="bottom-center">
                <ExecuteWorkflowButton workflowId={workflowId} />
              </Panel>
            )}
          </ReactFlow>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={28} minSize={8} maxSize={60}>
        <ConsolePanel workflowId={workflowId} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

/** Single-user canvas: state lives in this tab until saved. */
const LocalEditor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  return (
    <EditorCanvas
      workflowId={workflowId}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    />
  );
};

/**
 * Multiplayer canvas: nodes and edges live in the workflow's Liveblocks room,
 * so everyone in it sees the same canvas. The first person to open an empty
 * room seeds it from the saved workflow. "Save" still writes to the database.
 */
const LiveEditor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  const {
    nodes,
    edges,
    isLoading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<Node, Edge>({
    nodes: { initial: workflow.nodes },
    edges: { initial: workflow.edges },
  });

  if (isLoading) {
    return <LoadingView message="Joining workspace..." />;
  }

  return (
    <EditorCanvas
      workflowId={workflowId}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      showCursors
    />
  );
};

export const Editor = ({
  workflowId,
  multiplayer = false,
}: {
  workflowId: string;
  multiplayer?: boolean;
}) => {
  useWorkflowExecutionStatus();

  return multiplayer ? (
    <LiveEditor workflowId={workflowId} />
  ) : (
    <LocalEditor workflowId={workflowId} />
  );
};

export const EditorLoading = () => {
  return <LoadingView message="Loading Editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error Loading Editor..." />;
};
