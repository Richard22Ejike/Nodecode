// src/trpc/init.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import superjson from "superjson";

// Create the context with authentication
export const createTRPCContext = cache(async () => {
  try {
    const authData = await auth();
    
    if (!authData || !authData.userId) {
      return {
        userId: null,
        isAuthenticated: false,
        hasPro: false,
        hasPremium: false,
        user: null,
      };
    }

    const { userId, has } = authData;
    
    // Get full user data from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Check for both pro and premium plans
    const hasPro = has?.({ plan: "pro" }) || false;
    const hasPremium = has?.({ plan: "premium" }) || false;
    
    return {
      userId,
      isAuthenticated: true,
      hasPro,
      hasPremium: hasPro || hasPremium,
      plan: hasPremium ? "premium" : hasPro ? "pro" : "free",
      user: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress,
        name: user.firstName || user.username || user.emailAddresses[0]?.emailAddress,
        image: user.imageUrl,
        clerkUser: user,
      },
    };
  } catch (error) {
    console.error("❌ Error creating tRPC context:", error);
    return {
      userId: null,
      isAuthenticated: false,
      hasPro: false,
      hasPremium: false,
      plan: "free",
      user: null,
    };
  }
});

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource"
    });
  }
  return next({
    ctx: {
      ...ctx,
      auth: {
        user: ctx.user,
        userId: ctx.userId,
      },
    },
  });
});

// Premium procedure (requires premium subscription)
export const premiumProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource"
    });
  }
  if (!ctx.hasPremium && !ctx.hasPro) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Premium plan required to access this resource"
    });
  }
  return next({
    ctx: {
      ...ctx,
      auth: {
        user: ctx.user,
        userId: ctx.userId,
      },
    },
  });
});

// Pro procedure (requires pro subscription)
export const proProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource"
    });
  }
  if (!ctx.hasPro) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Pro plan required to access this resource"
    });
  }
  return next({
    ctx: {
      ...ctx,
      auth: {
        user: ctx.user,
        userId: ctx.userId,
      },
    },
  });
});