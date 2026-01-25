"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          setMessage(error.message);
          return;
        }
        setMessage("Check your inbox for a login link.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        setMessage("Account created. You can log in now.");
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f6f1ea_0%,_#f3f3ee_45%,_#ffffff_100%)] px-6">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/70 bg-white/90 p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Data Strategy Canvas
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
              Welcome back
            </h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-xs font-semibold text-white">
            P
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-full bg-zinc-100 p-1 text-xs font-medium text-zinc-500">
          {[
            { label: "Login", value: "login" },
            { label: "Sign up", value: "signup" },
            { label: "Magic link", value: "magic" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value as Mode)}
              className={`rounded-full px-3 py-2 transition ${
                mode === item.value
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "hover:text-zinc-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-zinc-700">
            <span className="font-medium text-zinc-800">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
              placeholder="you@company.com"
            />
          </label>

          {mode !== "magic" ? (
            <label className="flex flex-col gap-2 text-sm text-zinc-700">
              <span className="font-medium text-zinc-800">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
                placeholder="••••••••"
              />
            </label>
          ) : null}

          {message ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mode === "login" && "Log in"}
            {mode === "signup" && "Create account"}
            {mode === "magic" && "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}
