// src/features/triggers/components/search-trigger/Dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SearchTriggerValues = {
  variableName?: string;
  query?: string;
  numResults?: number;
  searchEngine?: "google" | "bing" | "duckduckgo";
  timeoutMs?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: SearchTriggerValues;
  onSubmit?: (values: SearchTriggerValues) => void;
}

export const SearchTriggerDialog = ({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: Props) => {
  const [variableName, setVariableName] = useState(
    defaultValues?.variableName || "",
  );
  const [query, setQuery] = useState(defaultValues?.query || "");
  const [numResults, setNumResults] = useState(
    String(defaultValues?.numResults || 10),
  );
  const [searchEngine, setSearchEngine] = useState<
    "google" | "bing" | "duckduckgo"
  >(defaultValues?.searchEngine || "google");
  const [timeoutMs, setTimeoutMs] = useState(
    String(defaultValues?.timeoutMs || 30000),
  );

  // Update form when defaultValues changes
  useEffect(() => {
    if (defaultValues) {
      setVariableName(defaultValues.variableName || "");
      setQuery(defaultValues.query || "");
      setNumResults(String(defaultValues.numResults || 10));
      setSearchEngine(defaultValues.searchEngine || "google");
      setTimeoutMs(String(defaultValues.timeoutMs || 30000));
    }
  }, [defaultValues]);

  const handleSave = () => {
    if (!query) {
      toast.error("Search query is required");
      return;
    }

    const config = {
      variableName: variableName.trim() || undefined,
      query,
      numResults: parseInt(numResults, 10) || 10,
      searchEngine,
      timeoutMs: parseInt(timeoutMs, 10) || 30000,
    };

    console.log("📝 [SearchDialog] Saving config:", config);

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
          <DialogTitle>Search Trigger Configuration</DialogTitle>
          <DialogDescription>Configure web search parameters</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              placeholder="searchResult"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference the results downstream:{" "}
              {`{{${variableName.trim() || "searchResult"}.results.[0].url}}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Search Query *</Label>
            <Input
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Search Engine</Label>
            <Select
              value={searchEngine}
              onValueChange={(value: typeof searchEngine) =>
                setSearchEngine(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="bing">Bing</SelectItem>
                <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of Results</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={numResults}
              onChange={(e) => setNumResults(e.target.value)}
              placeholder="10"
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
