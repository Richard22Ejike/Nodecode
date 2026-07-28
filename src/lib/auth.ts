// lib/auth.ts
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Remove better-auth imports and use Clerk instead
export { auth, clerkClient };

// Helper to check if user has pro plan
export async function checkUserHasPro() {
  const { userId, has } = await auth();
  
  if (!userId) {
    return { isAuthenticated: false, hasPro: false };
  }

  const hasPro = has({ plan: "pro" });
  return { isAuthenticated: true, hasPro };
}

// Get GitHub token from Clerk
export async function getGitHubToken(userId: string) {
  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  return tokens.data[0]?.token;
}