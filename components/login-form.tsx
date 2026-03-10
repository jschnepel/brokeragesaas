"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/");
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--brand-font-display)" }}
                >
                  Russ Lyon Sotheby&apos;s
                </h1>
                <p className="text-balance text-muted-foreground text-sm">
                  Marketing Intake Platform — Demo Login
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="yong, lex, david, or marcus"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="same as username"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </Field>
              <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Demo accounts:</p>
                <p>
                  <span className="font-mono">yong / yong</span> — Agent
                </p>
                <p>
                  <span className="font-mono">lex / lex</span> — Marketing
                  Manager
                </p>
                <p>
                  <span className="font-mono">david / david</span> — Executive
                </p>
                <p>
                  <span className="font-mono">marcus / marcus</span> — Designer
                </p>
              </div>
            </FieldGroup>
          </form>
          <div
            className="relative hidden md:block"
            style={{ background: "var(--brand-primary)" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div
                className="text-4xl font-light tracking-wide text-white/90 mb-4"
                style={{ fontFamily: "var(--brand-font-display)" }}
              >
                Russ Lyon
              </div>
              <div
                className="text-lg tracking-widest uppercase"
                style={{ color: "var(--brand-accent)" }}
              >
                Sotheby&apos;s International Realty
              </div>
              <div className="mt-8 text-white/50 text-sm max-w-xs">
                Marketing intake, design queue management, and executive
                reporting — all in one platform.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
