"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateWorkflow } from "@/features/agent/hooks/use-agent";
import { useApplyWorkflowPlan } from "@/features/agent/hooks/use-apply-plan";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";

export const AgentPanel = ({ workflowId }: { workflowId: string }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [runAfter, setRunAfter] = useState(false);

  const generateWorkflow = useGenerateWorkflow();
  const executeWorkflow = useExecuteWorkflow();
  const { applyPlan, isSaving } = useApplyWorkflowPlan(workflowId);

  const isBusy =
    generateWorkflow.isPending || isSaving || executeWorkflow.isPending;

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error("Describe what the workflow should do");
      return;
    }

    try {
      const { nodes, edges } = await generateWorkflow.mutateAsync({
        workflowId,
        prompt: trimmedPrompt,
      });

      const applied = await applyPlan({ nodes, edges });
      if (!applied) return;

      toast.success(`Agent built ${nodes.length} nodes`);
      setOpen(false);
      setPrompt("");

      if (runAfter) {
        executeWorkflow.mutate({ id: workflowId });
      }
    } catch {
      // Errors are surfaced by the mutation hooks
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="bg-background">
          <SparklesIcon className="size-4" />
          AI Agent
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Build workflow from a prompt</p>
          <p className="text-xs text-muted-foreground">
            The agent adds nodes on top of the current workflow, fills in their
            configuration, and wires them to the existing nodes.
          </p>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Search the web for the latest Next.js release notes, fetch the top result, and summarize it with Gemini"
          className="min-h-[100px] text-sm"
          disabled={isBusy}
        />
        <div className="flex items-center gap-2">
          <Switch
            id="agent-run-after"
            checked={runAfter}
            onCheckedChange={setRunAfter}
            disabled={isBusy}
          />
          <Label htmlFor="agent-run-after" className="text-sm">
            Execute after building
          </Label>
        </div>
        <Button onClick={handleGenerate} disabled={isBusy} className="w-full">
          {isBusy ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {generateWorkflow.isPending
                ? "Building workflow..."
                : "Saving..."}
            </>
          ) : (
            <>
              <SparklesIcon className="size-4" />
              Generate
            </>
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
};
