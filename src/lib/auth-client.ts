// // src/lib/clerk-auth.ts
// import { auth, clerkClient } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// export { auth, clerkClient };

// export async function getCurrentUser() {
//   const { userId, sessionClaims, has } = await auth();
  
//   if (!userId) {
//     return null;
//   }

//   const client = await clerkClient();
//   const user = await client.users.getUser(userId);
  
//   return {
//     id: userId,
//     email: user.emailAddresses[0]?.emailAddress,
//     name: user.firstName || user.username || user.emailAddresses[0]?.emailAddress,
//     image: user.imageUrl,
//     hasPro: has({ plan: "pro" }),
//     metadata: user.privateMetadata,
//   };
// }

// export async function checkProAccess() {
//   const { userId, has } = await auth();
  
//   if (!userId) {
//     return { isAuthenticated: false, hasPro: false };
//   }

//   return {
//     isAuthenticated: true,
//     hasPro: has({ plan: "pro" }),
//   };
// }

// export async function getGitHubToken(userId: string) {
//   const client = await clerkClient();
//   const tokens = await client.users.getUserOauthAccessToken(userId, "github");
//   return tokens.data[0]?.token;
// }