// src/features/auth/components/auth-layout.tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirect("/workflows");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="bg-background bg-dot-grid flex min-h-svh flex-col justify-center items-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center gap-2 self-center font-semibold tracking-[-0.01em]">
            <Image
              src="/logos/logo.svg"
              alt="Logo"
              height={30}
              width={30}
              className="h-[30px] w-[30px] shrink-0"
            />
            Nodebase
          </div>
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background bg-dot-grid flex min-h-svh flex-col justify-center items-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-semibold tracking-[-0.01em]"
        >
          <Image
            src="/logos/logo.svg"
            alt="Logo"
            height={30}
            width={30}
            className="h-[30px] w-[30px] shrink-0"
          />
          Nodebase
        </Link>
        {children}
      </div>
    </div>
  );
};
