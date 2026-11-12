// src/features/subscriptions/hooks/use-subscription.ts

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const useSubscription = () => {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          activeSubscriptions: [],
          isPro: false,
        };
      }

      // Get subscription info from Clerk metadata
      // You can store subscription data in Clerk's metadata
      const isPro =
        user.publicMetadata?.plan === "pro" ||
        user.unsafeMetadata?.plan === "pro";

      const subscriptionStatus =
        user.publicMetadata?.subscriptionStatus ||
        user.unsafeMetadata?.subscriptionStatus ||
        null;

      // If you have a backend API, you can fetch subscription from there
      // const response = await fetch('/api/subscription');
      // const data = await response.json();
      // return data;

      return {
        activeSubscriptions: isPro
          ? [
              {
                id: user.publicMetadata?.subscriptionId || "pro",
                plan: "pro",
                status: subscriptionStatus || "active",
              },
            ]
          : [],
        isPro,
        subscriptionStatus,
      };
    },
    enabled: !!user && isLoaded,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } = useSubscription();

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0;

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  };
};
