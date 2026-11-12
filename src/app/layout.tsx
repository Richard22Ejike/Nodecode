// src/app/layout.tsx

import { ClerkProvider } from "@clerk/nextjs";
import { Provider } from "jotai";
import type { Metadata } from "next";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

// UI voice: Instrument Sans (crisp, slightly condensed, readable at 13px).
// Data voice: Spline Sans Mono for node ids, variables, JSON and durations.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nodebase – Workflow Automation",
  description: "Build and run automated workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} ${splineMono.variable} antialiased`}
      >
        <ClerkProvider
          signInForceRedirectUrl="/workflows"
          signUpForceRedirectUrl="/workflows"
        >
          <TRPCReactProvider>
            <NuqsAdapter>
              <Provider>
                {children}
                <Toaster />
              </Provider>
            </NuqsAdapter>
          </TRPCReactProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
