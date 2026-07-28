// src/app/verify-email/page.tsx
"use client";

import { useSignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyEmailPage() {
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setIsLoading(true);
    try {
      // Use verifications.emailCode.verifyCode
      const result = await signUp.verifications.verifyEmailCode({
        code,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // After verification, try to finalize the sign-up
      const finalizeResult = await signUp.finalize();
      
      if (finalizeResult.error) {
        throw new Error(finalizeResult.error.message);
      }

      // Check if sign-up is complete
      if (signUp.status === "complete") {
        await setActive({ session: signUp.createdSessionId });
        toast.success("Email verified successfully!");
        router.push("/workflows");
      } else {
        toast.info("Please complete the sign-up process");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;

    try {
      // Use verifications.emailCode.sendCode
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast.success("Verification code sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
              >
                Resend Code
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}