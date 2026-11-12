"use client";

import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    verifyToken?: string;
  };
  onSubmit?: (values: { verifyToken: string }) => void;
}

export const WhatsAppTriggerDialog = ({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const [verifyToken, setVerifyToken] = useState(
    defaultValues?.verifyToken || "nodebase-whatsapp",
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/whatsapp?workflowId=${workflowId}`;
  const isLocalDev = baseUrl.includes("localhost");

  useEffect(() => {
    if (open) {
      setVerifyToken(defaultValues?.verifyToken || "nodebase-whatsapp");
    }
  }, [open, defaultValues?.verifyToken]);

  const copyText = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSave = () => {
    if (!verifyToken.trim()) {
      toast.error("Verify token is required");
      return;
    }
    onSubmit?.({ verifyToken: verifyToken.trim() });
    toast.success("WhatsApp trigger saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>WhatsApp Trigger</DialogTitle>
          <DialogDescription>
            Receive WhatsApp messages through Meta Cloud API and start this
            workflow. Incoming text is available as {"{{text}}"} and the sender
            as {"{{chatId}}"}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-verify-token">Verify Token</Label>
            <Input
              id="whatsapp-verify-token"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="nodebase-whatsapp"
            />
            <p className="text-xs text-muted-foreground">
              Use this same string as the Verify token in the Meta Developer
              webhook settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-webhook-url">Callback URL</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp-webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => copyText(webhookUrl, "Callback URL copied")}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Setup Instructions</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                Create a WhatsApp app in the{" "}
                <span className="font-medium text-foreground">
                  Meta Developer Dashboard
                </span>{" "}
                and add the WhatsApp product.
              </li>
              <li>
                Copy the{" "}
                <span className="font-medium text-foreground">
                  permanent access token
                </span>{" "}
                into a WhatsApp credential in this app.
              </li>
              {isLocalDev && (
                <li>
                  Expose localhost with ngrok so Meta can reach the callback
                  URL. Set{" "}
                  <span className="font-mono">NEXT_PUBLIC_APP_URL</span> to that
                  HTTPS URL.
                </li>
              )}
              <li>
                In WhatsApp &gt; Configuration &gt; Webhook, paste the callback
                URL and verify token above, then subscribe to{" "}
                <span className="font-mono">messages</span>.
              </li>
              <li>
                Send a message to your WhatsApp business number. The workflow
                runs with {"{{text}}"} and {"{{chatId}}"}.
              </li>
              <li>
                Add a{" "}
                <span className="font-medium text-foreground">
                  WhatsApp Message
                </span>{" "}
                action node to reply, using {"{{chatId}}"} as the recipient.
              </li>
            </ol>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
