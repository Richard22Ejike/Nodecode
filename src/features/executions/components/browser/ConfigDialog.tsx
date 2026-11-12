// src/features/executions/components/browser/ConfigDialog.tsx
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
import type { UpstreamChip } from "./upstream-chips";

export type FieldConfig = {
  key: string;
  label: string;
  kind: "input" | "textarea" | "number";
  placeholder?: string;
  required?: boolean;
  help?: string;
  rows?: number;
};

export type ConfigValues = Record<string, string | number | undefined>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultVariable: string;
  fields: FieldConfig[];
  defaultValues?: ConfigValues;
  /** Values produced by nodes upstream of this one, offered as click-to-insert chips. */
  chips?: UpstreamChip[];
  onSubmit: (values: ConfigValues) => void;
}

const toText = (value: string | number | undefined) =>
  value === undefined ? "" : String(value);

export const ConfigDialog = ({
  open,
  onOpenChange,
  title,
  description,
  defaultVariable,
  fields,
  defaultValues,
  chips = [],
  onSubmit,
}: Props) => {
  const [variableName, setVariableName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  // Chips insert into whichever text field was edited last (else the first one)
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Re-seed the form from the saved node data each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setVariableName(toText(defaultValues?.variableName));
    setValues(
      Object.fromEntries(
        fields.map((field) => [field.key, toText(defaultValues?.[field.key])]),
      ),
    );
  }, [open, defaultValues, fields]);

  const insertToken = (token: string) => {
    const target =
      activeKey ?? fields.find((field) => field.kind !== "number")?.key ?? null;
    if (!target) return;
    setValues((prev) => {
      const current = prev[target] ?? "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      return { ...prev, [target]: `${current}${separator}${token}` };
    });
  };

  const handleSave = () => {
    for (const field of fields) {
      if (field.required && !values[field.key]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    const config: ConfigValues = {
      variableName: variableName.trim() || undefined,
    };
    for (const field of fields) {
      const raw = values[field.key] ?? "";
      if (field.kind === "number") {
        const parsed = Number.parseInt(raw, 10);
        config[field.key] = Number.isNaN(parsed) ? undefined : parsed;
      } else {
        config[field.key] = raw;
      }
    }

    onSubmit(config);
    toast.success("Configuration saved!");
    onOpenChange(false);
  };

  const variable = variableName.trim() || defaultVariable;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              placeholder={defaultVariable}
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference this node&apos;s result downstream with{" "}
              <code>{`{{${variable}}}`}</code> (or a field such as{" "}
              <code>{`{{${variable}.field}}`}</code>).
            </p>
          </div>

          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>
                {field.label}
                {field.required ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>
              {field.kind === "textarea" ? (
                <Textarea
                  onFocus={() => setActiveKey(field.key)}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  rows={field.rows ?? 5}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              ) : (
                <Input
                  onFocus={() => setActiveKey(field.key)}
                  type={field.kind === "number" ? "number" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              )}
              {field.help ? (
                <p className="text-xs text-muted-foreground">{field.help}</p>
              ) : null}
            </div>
          ))}

          {chips.length > 0 && (
            <div className="space-y-2">
              <Label>Data from previous nodes</Label>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <button
                    key={chip.token}
                    type="button"
                    title={`From ${chip.nodeName} · inserts ${chip.token}`}
                    onClick={() => insertToken(chip.token)}
                    className="rounded-full border bg-muted px-2.5 py-0.5 font-mono text-xs transition-colors hover:bg-accent"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click a value to insert it into the field you were editing.
              </p>
            </div>
          )}

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
