// src/features/subscriptions/hooks/use-subscription.ts
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const useSubscription = () => {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) {
        return { activeSubscriptions: [], isPro: false };
      }

      // Access metadata through the user object
      // In Clerk, metadata is available as properties on the user
      const userData = user as any; // Temporary type assertion
      
      // Check for pro plan in metadata
      // Clerk stores metadata in different ways depending on your setup
      const isPro = 
        userData.publicMetadata?.plan === "pro" || 
        userData.privateMetadata?.plan === "pro" ||
        userData.unsafeMetadata?.plan === "pro";

      return {
        activeSubscriptions: isPro ? [{ plan: "pro", status: "active" }] : [],
        isPro,
      };
    },
    enabled: !!user && isLoaded,
  });
};

export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } = useSubscription();

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState?.activeSubscriptions.length > 0;

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  };
};