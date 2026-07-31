// src/trpc/init.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import superjson from "superjson";
import prisma from "@/lib/db";

// Create the context with authentication
export const createTRPCContext = cache(async () => {
  try {
    const authData = await auth();
    
    if (!authData || !authData.userId) {
      return {
        userId: null,
        isAuthenticated: false,
        user: null,
      };
    }

    const { userId } = authData;
    
    // Get full user data from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    const name = clerkUser.firstName || clerkUser.username || email || "User";
    
    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // If user doesn't exist by Clerk ID, check by email
    if (!dbUser && email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUserByEmail) {
        // Update the existing user's ID to match Clerk
        // First, delete any sessions/accounts linked to the old ID
        await prisma.$transaction([
          prisma.session.deleteMany({
            where: { userId: existingUserByEmail.id }
          }),
          prisma.account.deleteMany({
            where: { userId: existingUserByEmail.id }
          }),
          // Update the user's ID
          prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              id: userId,
              name,
              email,
              image: clerkUser.imageUrl,
              emailVerified: true,
              updatedAt: new Date(),
            }
          })
        ]);
        
        dbUser = await prisma.user.findUnique({
          where: { id: userId }
        });
      }
    }

    // If still no user, create one
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          image: clerkUser.imageUrl,
          emailVerified: true,
        }
      });
    }
    
    return {
      userId,
      isAuthenticated: true,
      user: {
        id: userId,
        email,
        name,
        image: clerkUser.imageUrl,
        clerkUser,
        dbUser,
      },
    };
  } catch (error) {
    console.error("❌ Error creating tRPC context:", error);
    return {
      userId: null,
      isAuthenticated: false,
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

export const premiumProcedure = protectedProcedure;
export const proProcedure = protectedProcedure;