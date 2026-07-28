// src/features/auth/components/login-form.tsx
"use client";

import { useSignIn, useClerk } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (!signIn) return;

    try {
      // Use the password method for email/password sign-in
      const result = await signIn.password({
        identifier: values.email,
        password: values.password,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // After successful password verification, the sign-in should be complete
      // The status can be checked on the signIn object
      if (signIn.status === "complete") {
        await setActive({ session: signIn.createdSessionId });
        router.push("/workflows");
        toast.success("Welcome back!");
      } else {
        // Handle other statuses
        console.log("Sign-in status:", signIn.status);
        toast.info("Please complete the sign-in process");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Failed to sign in");
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      // Use the Clerk instance to redirect to OAuth
      const clerk = useClerk();
      await clerk.redirectToSignIn({
        redirectUrl: "/sso-callback",
          signInForceRedirectUrl: "/workflows",
     
        // For OAuth, you need to use the strategy parameter
        // This might be available through a different method
      });
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast.error(error.message || "Failed to sign in with provider");
    }
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Login to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isPending}
                    onClick={() => handleOAuthSignIn("github")}
                  >
                    <Image
                      src="/logos/github.svg"
                      alt="Github"
                      height={20}
                      width={20}
                    />
                    Continue with Github
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isPending}
                    onClick={() => handleOAuthSignIn("google")}
                  >
                    <Image
                      src="/logos/google.svg"
                      alt="Google"
                      height={20}
                      width={20}
                    />
                    Continue with Google
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="********"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Signing in..." : "Login"}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don't have an account?{" "}
                  <Link className="underline underline-offset-4" href="/signup">
                    Sign Up
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};