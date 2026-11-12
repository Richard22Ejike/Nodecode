import { Handle, type HandleProps } from "@xyflow/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type BaseHandleProps = HandleProps;

export function BaseHandle({
  className,
  children,
  ...props
}: ComponentProps<typeof Handle>) {
  return (
    <Handle
      {...props}
      className={cn(
        "size-2.5 rounded-full border-2 border-line bg-card",
        className,
      )}
    >
      {children}
    </Handle>
  );
}
