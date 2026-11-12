"use client";

import { useAuth } from "@clerk/nextjs";
import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import {
  BotIcon,
  CodeIcon,
  EyeIcon,
  FileTextIcon,
  Globe2Icon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  MousePointerClickIcon,
  MousePointerIcon,
  ScanTextIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { isPremiumNodeType } from "@/features/subscriptions/lib/premium-nodes";
import { NodeType } from "@/generated/prisma/enums";
import { logoClass } from "@/lib/logo-class";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger Manually",
    description:
      "Runs the flow on clicking a button. Good for getting started quickly",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.TELEGRAM,
    label: "Telegram Trigger",
    description: "Runs the flow when the bot receives a message",
    icon: "/logos/telegram.svg",
  },
  {
    type: NodeType.WHATSAPP_TRIGGER,
    label: "WhatsApp Trigger",
    description: "Runs the flow when a WhatsApp message is received",
    icon: "/logos/whatsapp.svg",
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description: "Runs the flow when Google Form is submitted",
    icon: "/logos/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description: "Runs the flow when Stripe Event is Captured",
    icon: "/logos/stripe.svg",
  },
];

const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.BROWSE_TRIGGER,
    label: "Browse",
    description: "Navigate, click, type, and extract data from websites",
    icon: Globe2Icon,
  },
  {
    type: NodeType.FETCH_TRIGGER,
    label: "Fetch",
    description:
      "Retrieve page content as clean markdown, fast and lightweight",
    icon: FileTextIcon,
  },
  {
    type: NodeType.SEARCH_TRIGGER,
    label: "Search",
    description: "Query the web and get structured results",
    icon: SearchIcon,
  },
  {
    type: NodeType.OPEN_URL,
    label: "Open URL",
    description: "Navigate the shared browser to a page",
    icon: LinkIcon,
  },
  {
    type: NodeType.ACT,
    label: "Act",
    description: "Click or type on the page using plain English",
    icon: MousePointerClickIcon,
  },
  {
    type: NodeType.OBSERVE,
    label: "Observe",
    description: "Find clickable elements and other things on the page",
    icon: EyeIcon,
  },
  {
    type: NodeType.EXTRACT,
    label: "Extract",
    description: "Pull specific data off the current page",
    icon: ScanTextIcon,
  },
  {
    type: NodeType.AGENT,
    label: "Agent",
    description: "Give a goal and let an AI agent drive the browser",
    icon: BotIcon,
  },
  {
    type: NodeType.SEND_EMAIL,
    label: "Send Email",
    description: "Send an email with Resend",
    icon: MailIcon,
  },
  {
    type: NodeType.SCRIPT,
    label: "Script",
    description: "Run custom JavaScript with access to previous node results",
    icon: CodeIcon,
  },
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Makes an HTTP Request",
    icon: GlobeIcon,
  },
  {
    type: NodeType.GEMINI,
    label: "Gemini",
    description: "Uses Google Gemini to generate text",
    icon: "/logos/gemini.svg",
  },
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "Uses OpenAI to generate text",
    icon: "/logos/openai.svg",
  },
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send a message to Discord",
    icon: "/logos/discord.svg",
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send a message to Slack",
    icon: "/logos/slack.svg",
  },
  {
    type: NodeType.TELEGRAM_SEND,
    label: "Telegram Message",
    description: "Send a Telegram message, or reply to an incoming chat",
    icon: "/logos/telegram.svg",
  },
  {
    type: NodeType.WHATSAPP,
    label: "WhatsApp Message",
    description: "Send a WhatsApp message, or reply to an incoming chat",
    icon: "/logos/whatsapp.svg",
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/** Look up a node type's label and icon (used by the run console). */
export const findNodeOption = (type: string): NodeTypeOption | undefined =>
  [...triggerNodes, ...executionNodes].find((node) => node.type === type);

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const { has } = useAuth();
  const router = useRouter();
  const isPro = has?.({ plan: "pro" }) ?? false;

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      // Premium nodes send free users to the upgrade page instead of adding
      if (isPremiumNodeType(selection.type) && !isPro) {
        toast.error(`The ${selection.label} node requires the Pro plan`);
        onOpenChange(false);
        router.push("/upgrade");
        return;
      }

      // Check if trying to add a manual trigger, when one already exists
      if (selection.type === NodeType.MANUAL_TRIGGER) {
        const nodes = getNodes();

        const hasManualTrigger = nodes.some(
          (node) => node.type === NodeType.MANUAL_TRIGGER,
        );
        if (hasManualTrigger) {
          toast.error("Only one manual trigger is allowed per workflow");
          return;
        }
      }

      setNodes((nodes) => {
        const hasInitialTrigger = nodes.some(
          (node) => node.type === NodeType.INITIAL,
        );

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const flowPosition = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5 * 200),
          y: centerY + (Math.random() - 0.5 * 200),
        });

        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        };

        if (hasInitialTrigger) {
          return [newNode];
        }

        return [...nodes, newNode];
      });
      onOpenChange(false);
    },
    [setNodes, getNodes, onOpenChange, screenToFlowPosition, isPro, router],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>What Triggers this workflow?</SheetTitle>
          <SheetDescription>
            A trigger is a step that starts your workflow.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {triggerNodes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <button
                type="button"
                key={nodeType.type}
                className="block w-full justify-start h-auto py-6 px-4 rounded-none cursor-pointer text-left hover:bg-accent focus-visible:bg-accent transition-colors duration-150"
                onClick={() => handleNodeSelect(nodeType)}
              >
                <div className="flex items-center gap-6 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    // biome-ignore lint/performance/noImgElement: local SVG logos gain nothing from next/image
                    <img
                      src={Icon}
                      alt={nodeType.label}
                      className={cn(
                        "size-5 object-contain rounded-sm",
                        logoClass(Icon),
                      )}
                    />
                  ) : (
                    <Icon className="size-5 shrink-0" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="flex items-center gap-1.5 font-medium text-sm">
                      {nodeType.label}
                      {isPremiumNodeType(nodeType.type) && !isPro && (
                        <LockIcon className="size-3 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {nodeType.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <Separator className="my-2" />
        <div className="mt-2">
          <h4 className="text-sm font-medium text-muted-foreground px-4 py-2">
            Actions
          </h4>
          {executionNodes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <button
                type="button"
                key={nodeType.type}
                className="block w-full justify-start h-auto py-6 px-4 rounded-none cursor-pointer text-left hover:bg-accent focus-visible:bg-accent transition-colors duration-150"
                onClick={() => handleNodeSelect(nodeType)}
              >
                <div className="flex items-center gap-6 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    // biome-ignore lint/performance/noImgElement: local SVG logos gain nothing from next/image
                    <img
                      src={Icon}
                      alt={nodeType.label}
                      className={cn(
                        "size-5 object-contain rounded-sm",
                        logoClass(Icon),
                      )}
                    />
                  ) : (
                    <Icon className="size-5 shrink-0" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="flex items-center gap-1.5 font-medium text-sm">
                      {nodeType.label}
                      {isPremiumNodeType(nodeType.type) && !isPro && (
                        <LockIcon className="size-3 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {nodeType.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
