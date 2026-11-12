"use client";

import { OrganizationSwitcher, useOrganization } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Switch between your personal workspace and your organizations. Workflows,
 * runs and the multiplayer canvas are all scoped to the active one, so when it
 * changes we drop cached data and refetch rather than show the old workspace.
 */
export const OrgSwitcher = () => {
  const { organization, isLoaded } = useOrganization();
  const queryClient = useQueryClient();
  const router = useRouter();
  const activeOrgId = organization?.id ?? null;
  const previous = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    if (previous.current !== undefined && previous.current !== activeOrgId) {
      queryClient.clear();
      router.refresh();
    }
    previous.current = activeOrgId;
  }, [isLoaded, activeOrgId, queryClient, router]);

  return (
    <OrganizationSwitcher
      hidePersonal={false}
      afterSelectOrganizationUrl="/workflows"
      afterSelectPersonalUrl="/workflows"
      afterCreateOrganizationUrl="/workflows"
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger: "w-full justify-between px-2",
        },
      }}
    />
  );
};
