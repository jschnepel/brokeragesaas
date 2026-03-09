"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
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
      callbackUrl,
    });

    if (res?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 16,
              color: "#0F2B4F",
              letterSpacing: "0.05em",
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            RUSS LYON{" "}
            <span style={{ color: "#C9A96E" }}>SOTHEBY&apos;S</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "#9CA3AF",
              fontWeight: 600,
            }}
          >
            Agent Platform
          </div>
        </div>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 28,
            fontWeight: 300,
            color: "#0F2B4F",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Sign In
        </h1>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "#9CA3AF",
                marginBottom: 6,
              }}
            >
              Username
            </label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yong, lex, or david"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "#9CA3AF",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="same as username"
            />
          </div>
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "#F9F7F4",
            borderRadius: 4,
            fontSize: 12,
            color: "#6B7280",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: "#9CA3AF",
              marginBottom: 6,
            }}
          >
            Demo Accounts
          </div>
          <div>
            <strong>yong / yong</strong> — Agent view
          </div>
          <div>
            <strong>lex / lex</strong> — Marketing Manager
          </div>
          <div>
            <strong>david / david</strong> — Executive
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
