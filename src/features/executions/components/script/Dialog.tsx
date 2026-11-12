// src/features/executions/components/script/Dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SCRIPT_PLACEHOLDER = `// Previous node results are available on \`context\`.
// Whatever you return becomes this node's result.
// await and fetch are supported.

const urls = context.searchResult.results.map(r => r.url);
const response = await fetch(urls[0]);
return {
  status: response.status,
  firstUrls: urls.slice(0, 3),
};`;

export type ScriptValues = {
  variableName?: string;
  script?: string;
  timeoutMs?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: ScriptValues;
  onSubmit?: (values: ScriptValues) => void;
}

export const ScriptDialog = ({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: Props) => {
  const [variableName, setVariableName] = useState(
    defaultValues?.variableName || "",
  );
  const [script, setScript] = useState(defaultValues?.script || "");
  const [timeoutMs, setTimeoutMs] = useState(
    String(defaultValues?.timeoutMs || 30000),
  );

  useEffect(() => {
    if (defaultValues) {
      setVariableName(defaultValues.variableName || "");
      setScript(defaultValues.script || "");
      setTimeoutMs(String(defaultValues.timeoutMs || 30000));
    }
  }, [defaultValues]);

  const handleSave = () => {
    if (!script.trim()) {
      toast.error("Script is required");
      return;
    }

    const config = {
      variableName: variableName.trim() || undefined,
      script,
      timeoutMs: parseInt(timeoutMs, 10) || 30000,
    };

    if (onSubmit) {
      onSubmit(config);
    }

    toast.success("Configuration saved!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Script Configuration</DialogTitle>
          <DialogDescription>
            Write JavaScript that runs during the workflow. The code is the body
            of an async function: read previous results from{" "}
            <code className="text-xs">context</code> and{" "}
            <code className="text-xs">return</code> a JSON-serializable value.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              placeholder="scriptResult"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference the result downstream:{" "}
              {`{{${variableName.trim() || "scriptResult"}}}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Script *</Label>
            <Textarea
              placeholder={SCRIPT_PLACEHOLDER}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={14}
              className="font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(e.target.value)}
              placeholder="30000"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Configuration</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
