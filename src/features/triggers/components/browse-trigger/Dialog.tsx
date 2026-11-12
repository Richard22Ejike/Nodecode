// src/features/triggers/components/browse-trigger/Dialog.tsx
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

export type BrowseTriggerValues = {
  variableName?: string;
  url?: string;
  instruction?: string;
  actions?: string;
  extractSchema?: string;
  timeoutMs?: number;
  selector?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: BrowseTriggerValues;
  onSubmit?: (values: BrowseTriggerValues) => void;
}

export const BrowseTriggerDialog = ({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: Props) => {
  const [variableName, setVariableName] = useState(
    defaultValues?.variableName || "",
  );
  const [url, setUrl] = useState(defaultValues?.url || "");
  const [instruction, setInstruction] = useState(
    defaultValues?.instruction || "",
  );
  const [actions, setActions] = useState(defaultValues?.actions || "[]");
  const [schema, setSchema] = useState(defaultValues?.extractSchema || "");
  const [timeoutMs, setTimeoutMs] = useState(
    String(defaultValues?.timeoutMs || 30000),
  );
  const [selector, setSelector] = useState(defaultValues?.selector || "");

  // Update form when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      setVariableName(defaultValues.variableName || "");
      setUrl(defaultValues.url || "");
      setInstruction(defaultValues.instruction || "");
      setActions(defaultValues.actions || "[]");
      setSchema(defaultValues.extractSchema || "");
      setTimeoutMs(String(defaultValues.timeoutMs || 30000));
      setSelector(defaultValues.selector || "");
    }
  }, [defaultValues]);

  const handleSave = () => {
    if (!url) {
      toast.error("URL is required");
      return;
    }

    try {
      const parsedActions = actions ? JSON.parse(actions) : [];
      const parsedSchema = schema ? JSON.parse(schema) : null;

      const config = {
        variableName: variableName.trim() || undefined,
        url,
        instruction: instruction || "Extract the requested data from the page",
        actions: parsedActions,
        extractSchema: parsedSchema ? JSON.stringify(parsedSchema) : undefined,
        timeoutMs: parseInt(timeoutMs, 10) || 30000,
        selector: selector || undefined,
      };

      // 🔍 LOG: Print the config being saved
      console.log("📝 [BrowseDialog] Saving configuration:");
      console.log("  URL:", config.url);
      console.log("  Instruction:", config.instruction);
      console.log("  Actions:", config.actions);
      console.log("  Extract Schema:", config.extractSchema);
      console.log("  Timeout:", config.timeoutMs);
      console.log("  Selector:", config.selector);
      console.log("  Full config:", JSON.stringify(config, null, 2));

      if (onSubmit) {
        console.log("📤 [BrowseDialog] Calling onSubmit with config");
        onSubmit(config);
        console.log("✅ [BrowseDialog] onSubmit called successfully");
      } else {
        console.warn("⚠️ [BrowseDialog] No onSubmit handler provided");
      }

      toast.success("Configuration saved to the editor.");
      onOpenChange(false);
    } catch (error) {
      console.error("❌ [BrowseDialog] Error saving configuration:", error);
      toast.error("Invalid JSON format in actions or schema");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Browse Trigger Configuration</DialogTitle>
          <DialogDescription>
            Configure website navigation and data extraction
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              placeholder="browseResult"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference the result downstream:{" "}
              {`{{${variableName.trim() || "browseResult"}.extractedData}}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Target URL *</Label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Instruction</Label>
            <Input
              placeholder="Extract the requested data from the page"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Selector (CSS or xPath)</Label>
            <Input
              placeholder=".main-content, article, #content"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to extract from the entire page
            </p>
          </div>

          <div className="space-y-2">
            <Label>Actions (JSON)</Label>
            <Textarea
              placeholder='[{"type":"click","selector":"#button"},{"type":"type","selector":"#input","value":"test"}]'
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Supported actions: click, type, navigate, scroll, wait
            </p>
          </div>

          <div className="space-y-2">
            <Label>Extract Schema (JSON Schema)</Label>
            <Textarea
              placeholder='{"title":{"type":"string"},"price":{"type":"string"}}'
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={4}
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
