"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import { SettingsIcon, TrashIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface WorkflowNodeProps {
  children: ReactNode;
  showToolbar?: boolean;
  onDelete?: () => void;
  onSettings?: () => void;
  name?: string;
  description?: string;
}

export const WorkflowNode = ({
  children,
  showToolbar = true,
  onDelete,
  onSettings,
  name,
  description,
}: WorkflowNodeProps) => {
  return (
    <>
      {showToolbar && (
        <NodeToolbar>
          <div className="flex gap-0.5 rounded-md border bg-card p-0.5 shadow-sm">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onSettings}
              aria-label="Node settings"
            >
              <SettingsIcon className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onDelete}
              aria-label="Delete node"
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </NodeToolbar>
      )}
      {children}
      {name && (
        <NodeToolbar
          position={Position.Bottom}
          isVisible
          className="max-w-[200px] text-center"
        >
          <p className="text-[13px] leading-tight font-medium">{name}</p>
          {description && (
            <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
              {description}
            </p>
          )}
        </NodeToolbar>
      )}
    </>
  );
};
