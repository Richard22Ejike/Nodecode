// src/features/executions/components/browser/nodes.tsx
//
// Canvas nodes for the browser-automation and email nodes. Each is a thin spec
// handed to createConfigNode; the execution logic lives in each node's
// executor.ts next to its folder.
import {
  BotIcon,
  EyeIcon,
  LinkIcon,
  MailIcon,
  MousePointerClickIcon,
  ScanTextIcon,
} from "lucide-react";
import { createConfigNode } from "./createConfigNode";

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const truncate = (value: string, max = 48) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export const OpenUrlNode = createConfigNode({
  name: "Open URL",
  icon: LinkIcon,
  defaultVariable: "openUrl",
  dialogTitle: "Open URL",
  dialogDescription:
    "Navigate the shared browser to a page. Result fields: url, title.",
  fields: [
    {
      key: "url",
      label: "URL",
      kind: "input",
      required: true,
      placeholder: "https://example.com or {{previous.url}}",
    },
  ],
  emptyDescription: "Navigate the browser to a URL",
  describe: (data) => {
    const url = text(data.url);
    return url ? `Open ${truncate(url)}` : undefined;
  },
});

export const ActNode = createConfigNode({
  name: "Act",
  icon: MousePointerClickIcon,
  defaultVariable: "act",
  dialogTitle: "Act",
  dialogDescription:
    "Click, type or otherwise interact with the page using plain English. Result fields: success, message, actionDescription, url.",
  fields: [
    {
      key: "instruction",
      label: "Instruction",
      kind: "textarea",
      required: true,
      rows: 4,
      placeholder: "Click the 'Browse courses' button",
    },
  ],
  emptyDescription: "Click or type on the page with natural language",
  describe: (data) => {
    const instruction = text(data.instruction);
    return instruction ? truncate(instruction) : undefined;
  },
});

export const ObserveNode = createConfigNode({
  name: "Observe",
  icon: EyeIcon,
  defaultVariable: "observe",
  dialogTitle: "Observe",
  dialogDescription:
    "Find elements on the page without touching them. Result fields: matches (a list of selector and description).",
  fields: [
    {
      key: "instruction",
      label: "What to look for",
      kind: "textarea",
      required: true,
      rows: 4,
      placeholder: "Find all clickable links in the navigation bar",
    },
  ],
  emptyDescription: "Find clickable elements on the page",
  describe: (data) => {
    const instruction = text(data.instruction);
    return instruction ? truncate(instruction) : undefined;
  },
});

export const ExtractNode = createConfigNode({
  name: "Extract",
  icon: ScanTextIcon,
  defaultVariable: "extract",
  dialogTitle: "Extract",
  dialogDescription:
    "Pull specific data off the current page. Result fields: extraction.",
  fields: [
    {
      key: "instruction",
      label: "What to extract",
      kind: "textarea",
      required: true,
      rows: 4,
      placeholder: "Extract the first five quotes and their authors",
    },
  ],
  emptyDescription: "Extract data from the page",
  describe: (data) => {
    const instruction = text(data.instruction);
    return instruction ? truncate(instruction) : undefined;
  },
});

export const AgentNode = createConfigNode({
  name: "Agent",
  icon: BotIcon,
  defaultVariable: "agent",
  dialogTitle: "Agent",
  dialogDescription:
    "Give the agent a goal in plain English and it drives the browser on its own until the job is done. Result fields: success, completed, message.",
  fields: [
    {
      key: "instruction",
      label: "Goal",
      kind: "textarea",
      required: true,
      rows: 6,
      placeholder:
        "Configure a Porsche 911 with the sport exhaust and give me a summary of the build",
    },
    {
      key: "maxSteps",
      label: "Max steps",
      kind: "number",
      placeholder: "20",
      help: "Upper limit on browser actions the agent may take. Default 20.",
    },
  ],
  emptyDescription: "Let an AI agent complete a goal in the browser",
  describe: (data) => {
    const instruction = text(data.instruction);
    return instruction ? truncate(instruction) : undefined;
  },
});

export const SendEmailNode = createConfigNode({
  name: "Send Email",
  icon: MailIcon,
  defaultVariable: "email",
  dialogTitle: "Send Email",
  dialogDescription:
    "Send an email with Resend. Result fields: id. Until you verify a domain in Resend, you can only send to your own Resend account address.",
  fields: [
    {
      key: "to",
      label: "To",
      kind: "input",
      required: true,
      placeholder: "you@example.com (comma-separate for several)",
    },
    {
      key: "subject",
      label: "Subject",
      kind: "input",
      required: true,
      placeholder: "Your build is ready",
    },
    {
      key: "body",
      label: "Body",
      kind: "textarea",
      required: true,
      rows: 8,
      placeholder: "{{extract.extraction}}",
    },
  ],
  emptyDescription: "Send an email with Resend",
  describe: (data) => {
    const to = text(data.to);
    return to ? `To ${truncate(to)}` : undefined;
  },
});
