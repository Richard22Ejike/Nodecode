// src/features/auth/components/register-form.tsx
"use client";

import { useSignUp, useClerk } from "@clerk/nextjs";
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

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const router = useRouter();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    if (!signUp) return;

    try {
      // Create the sign-up with email and password
      const result = await signUp.create({
        emailAddress: values.email,
        password: values.password,
        firstName: values.name?.split(" ")[0] || "",
        lastName: values.name?.split(" ").slice(1).join(" ") || "",
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Check if sign-up is complete
      if (signUp.status === "complete") {
        await setActive({ session: signUp.createdSessionId });
        router.push("/workflows");
        toast.success("Account created successfully!");
      } else {
        // Handle other statuses
        console.log("Sign-up status:", signUp.status);
        
        // If email verification is required
        if (signUp.status === "missing_requirements" || signUp.status === "abandoned") {
          // Send verification email
          const verificationResult = await signUp.verifications.sendEmailCode();
          if (verificationResult.error) {
            throw new Error(verificationResult.error.message);
          }
          toast.info("Please check your email for verification");
          // Redirect to verification page
          router.push("/verify-email");
        } else {
          toast.info("Please complete the sign-up process");
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Failed to create account");
    }
  };

  const handleOAuthSignUp = async (provider: "google" | "github") => {
    try {
      const clerk = useClerk();
      await clerk.redirectToSignUp({
        redirectUrl: "/sso-callback",
        signUpForceRedirectUrl: "/workflows",
      });
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast.error(error.message || "Failed to sign up with provider");
    }
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Get Started</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
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
                    onClick={() => handleOAuthSignUp("github")}
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
                    onClick={() => handleOAuthSignUp("google")}
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
                      Or sign up with email
                    </span>
                  </div>
                </div>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="John Doe"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
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
                    {isPending ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link className="underline underline-offset-4" href="/login">
                    Sign In
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