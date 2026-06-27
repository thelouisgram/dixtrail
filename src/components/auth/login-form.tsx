"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Logo } from "@/components/brand/logo";
import { SignInButton, type SignInStatus } from "@/components/auth/sign-in-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

const SUCCESS_REDIRECT_MS = 650;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<SignInStatus>("idle");
  const [shakeButton, setShakeButton] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const isBusy = status !== "idle";

  async function onSubmit(data: LoginInput) {
    setError("");
    setShakeButton(false);
    setStatus("loading");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setStatus("idle");
      setShakeButton(true);
      if (result.code === "rate_limit") {
        setError("Too many login attempts. Please try again in 15 minutes.");
      } else {
        setError("Invalid email or password");
      }
      return;
    }

    setStatus("success");
    await new Promise((resolve) => setTimeout(resolve, SUCCESS_REDIRECT_MS));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md animate-fade-in-up">
      <CardHeader className="items-center space-y-4 text-center">
        <Logo href="/" size="lg" />
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isBusy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="animate-fade-in-up text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="animate-fade-in-up text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="animate-fade-in-up rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <SignInButton status={status} shake={shakeButton} />
        </form>
      </CardContent>
    </Card>
  );
}
