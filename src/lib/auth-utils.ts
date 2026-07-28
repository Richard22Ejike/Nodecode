// src/lib/auth-utils.ts
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const requireAuth = async () => {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  return userId;
};

// For checking if user has pro
export const requirePro = async () => {
  const { userId, has } = await auth();
  
  if (!userId) {
    redirect("/login");
  }
  
  const hasPro = has({ plan: "pro" });
  
  if (!hasPro) {
    redirect("/subscription");
  }
  
  return { userId, hasPro };
};

// For auth pages (login, signup) - redirect to dashboard if already authenticated
export const requireUnauth = async () => {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/workflows");
  }
  
  return null;
};