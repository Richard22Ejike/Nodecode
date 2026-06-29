import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { polarclient } from "./polar";
import { dash } from "@better-auth/infra";
import prisma from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3002",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
    emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
 
  plugins: [
    dash(),
  //   polar({
  //     client: polarclient,
  //     createCustomerOnSignUp: true,
  //      trustedOrigins: [
  //   "http://localhost:3002",
  //   "http://localhost:3000",
 
  // ],
  //     use: [
  //       checkout({
  //         products: [
  //           {
  //            productId: "95f0d378-4a1f-48e4-baf9-8c0ab0fbd8c8",
  //            slug: "base-pro"
  //           },
  //         ],
  //         successUrl: process.env.POLAR_SUCCESS_URL,
  //         authenticatedUsersOnly: true,
  //       }),
  //       portal(),
  //     ],
  //   }),
  ],
});
