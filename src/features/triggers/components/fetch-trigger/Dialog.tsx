// src/features/triggers/components/fetch-trigger/Dialog.tsx
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
import { Switch } from "@/components/ui/switch";

export type FetchTriggerValues = {
  variableName?: string;
  url?: string;
  selector?: string;
  markdown?: boolean;
  includeImages?: boolean;
  timeoutMs?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: FetchTriggerValues;
  onSubmit?: (values: FetchTriggerValues) => void;
}

export const FetchTriggerDialog = ({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: Props) => {
  const [variableName, setVariableName] = useState(
    defaultValues?.variableName || "",
  );
  const [url, setUrl] = useState(defaultValues?.url || "");
  const [selector, setSelector] = useState(defaultValues?.selector || "");
  const [markdown, setMarkdown] = useState(defaultValues?.markdown ?? true);
  const [includeImages, setIncludeImages] = useState(
    defaultValues?.includeImages ?? false,
  );
  const [timeoutMs, setTimeoutMs] = useState(
    String(defaultValues?.timeoutMs || 30000),
  );

  // Update form when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      setVariableName(defaultValues.variableName || "");
      setUrl(defaultValues.url || "");
      setSelector(defaultValues.selector || "");
      setMarkdown(defaultValues.markdown ?? true);
      setIncludeImages(defaultValues.includeImages ?? false);
      setTimeoutMs(String(defaultValues.timeoutMs || 30000));
    }
  }, [defaultValues]);

  const handleSave = () => {
    if (!url) {
      toast.error("URL is required");
      return;
    }

    const config = {
      variableName: variableName.trim() || undefined,
      url,
      selector: selector || undefined,
      markdown,
      includeImages,
      timeoutMs: parseInt(timeoutMs, 10) || 30000,
    };

    console.log("📝 [FetchDialog] Saving config:", config);

    if (onSubmit) {
      onSubmit(config);
    }

    toast.success("Configuration saved!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fetch Trigger Configuration</DialogTitle>
          <DialogDescription>
            Configure how to fetch and process page content
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              placeholder="fetchResult"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference the result downstream:{" "}
              {`{{${variableName.trim() || "fetchResult"}.markdownContent}}`}
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
            <Label>Selector (CSS or xPath)</Label>
            <Input
              placeholder=".main-content, article, #content"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to fetch the entire page
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="markdown"
                checked={markdown}
                onCheckedChange={setMarkdown}
              />
              <Label htmlFor="markdown">Convert to Markdown</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="images"
                checked={includeImages}
                onCheckedChange={setIncludeImages}
              />
              <Label htmlFor="images">Include Images</Label>
            </div>
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
