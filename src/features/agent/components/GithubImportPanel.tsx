"use client";

import { GithubIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useImportFromGithub } from "@/features/agent/hooks/use-agent";
import { useApplyWorkflowPlan } from "@/features/agent/hooks/use-apply-plan";

export const GithubImportPanel = ({ workflowId }: { workflowId: string }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [instructions, setInstructions] = useState("");

  const importFromGithub = useImportFromGithub();
  const { applyPlan, isSaving } = useApplyWorkflowPlan(workflowId);

  const isBusy = importFromGithub.isPending || isSaving;

  const handleImport = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error("Paste a GitHub URL to a repo, folder, or file");
      return;
    }

    try {
      const { nodes, edges, filesImported } =
        await importFromGithub.mutateAsync({
          workflowId,
          url: trimmedUrl,
          instructions: instructions.trim() || undefined,
        });

      const applied = await applyPlan({ nodes, edges });
      if (!applied) return;

      toast.success(
        `Imported ${filesImported.length} file${filesImported.length === 1 ? "" : "s"} into ${nodes.length} nodes`,
      );
      setOpen(false);
      setUrl("");
      setInstructions("");
    } catch {
      // Errors are surfaced by the mutation hooks
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="bg-background">
          <GithubIcon className="size-4" />
          Import Code
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Import code from GitHub</p>
          <p className="text-xs text-muted-foreground">
            The agent reads the code and breaks it into connected Script nodes,
            one per logical stage, with data flowing between them. Works best
            with a single file or a small public repo.
          </p>
        </div>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/blob/main/script.js"
          className="text-sm"
          disabled={isBusy}
        />
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Optional instructions, e.g. only import the scraping logic"
          className="min-h-[60px] text-sm"
          disabled={isBusy}
        />
        <Button onClick={handleImport} disabled={isBusy} className="w-full">
          {isBusy ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {importFromGithub.isPending ? "Reading code..." : "Saving..."}
            </>
          ) : (
            <>
              <GithubIcon className="size-4" />
              Import
            </>
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
};
