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
import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { generateGoogleFormScript } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoogleFormTriggerDialog = ({ onOpenChange, open }: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;

  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const wehbookUrl = `${baseURL}/api/webhooks/google-form?workflowId=${workflowId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(wehbookUrl);
      toast.success("Webhook URL Copied to Clipboard!");
    } catch (error) {
      toast.error("Failed to Copy the webhook URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Google Form Trigger Configuration</DialogTitle>
          <DialogDescription>
            Use this Webhook URL in your Google Form's Apps Script to trigger
            this workflow when a form is submitted
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={wehbookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Setup Instructions</h4>
            <div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your Google Form</li>
                <li>Click the three dots menu → Script Editor</li>
                <li>Copy and Paste the script below</li>
                <li>Replace WEBHOOK_URL with your webhook URL above</li>
                <li>Save and click triggers → Add Trigger</li>
                <li>Choose: Form form → On form submit → Save</li>
              </ol>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <h4 className="font-medium text-sm">Google App Script</h4>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const script = await generateGoogleFormScript(wehbookUrl);
                try {
                  await navigator.clipboard.writeText(script);
                  toast.success("Script copied to clipboard");
                } catch (error) {
                  toast.error("Failed to copy script");
                }
              }}
            >
              <CopyIcon className="size-4 mr-2" />
              Copy Google App Script
            </Button>
            <p className="text-xs text-muted-foreground">
              This script includes your webhook URL and handles form submission
            </p>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Available Variables</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {"{{googleForm.respondentEmail}}"}
                  </code>
                  - Respondent Email
                </li>
                <li>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {"{{googleForm.responses['Question Name']}}"}
                  </code>
                  - Specific Answer
                </li>
                <li>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {"{{googleForm.responses}}"}
                  </code>
                  - All responses as JSON
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
