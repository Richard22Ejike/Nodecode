"use client";

import { useOthers, useSelf } from "@liveblocks/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_SHOWN = 4;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type Person = { key: string; name: string; avatar?: string; color: string };

/** Who else has this workflow open right now (you first, then others). */
export const PresenceAvatars = () => {
  const self = useSelf();
  const others = useOthers();

  const people: Person[] = [];
  if (self) {
    people.push({
      key: `self-${self.connectionId}`,
      name: `${self.info.name} (you)`,
      avatar: self.info.avatar,
      color: self.info.color,
    });
  }
  for (const other of others) {
    people.push({
      key: `c-${other.connectionId}`,
      name: other.info.name,
      avatar: other.info.avatar,
      color: other.info.color,
    });
  }

  if (people.length === 0) return null;

  const shown = people.slice(0, MAX_SHOWN);
  const extra = people.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((person) => (
        <Tooltip key={person.key}>
          <TooltipTrigger asChild>
            <Avatar
              className="size-7 border-2 ring-2 ring-background"
              style={{ borderColor: person.color }}
            >
              {person.avatar && (
                <AvatarImage src={person.avatar} alt={person.name} />
              )}
              <AvatarFallback className="text-[10px]">
                {initials(person.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{person.name}</TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 && (
        <div className="flex size-7 items-center justify-center rounded-full border-2 bg-muted font-mono text-[10px] font-medium tabular-nums ring-2 ring-background">
          +{extra}
        </div>
      )}
    </div>
  );
};
