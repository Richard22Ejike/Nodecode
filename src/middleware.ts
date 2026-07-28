// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId, has } = await auth();
  const path = req.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = [
    "/workflows",
    "/credentials", 
    "/executions",
    "/subscription",
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // Define pro routes
  const proRoutes = ["/subscription"];
  const isProRoute = proRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // Handle authentication
  if (!userId && isProtectedRoute) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("redirect_url", path);
    return NextResponse.redirect(signInUrl);
  }

  // Handle pro access
  if (userId && isProRoute) {
    const hasPro = has({ plan: "pro" });
    if (!hasPro) {
      return NextResponse.redirect(new URL("/subscription/upgrade", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};