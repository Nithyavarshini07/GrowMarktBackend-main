"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          {/* Ambient blobs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative bg-surface-container-lowest rounded-2xl p-8 shadow-[0_20px_40px_rgba(11,28,48,0.06)] overflow-hidden">
            {/* Brand */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3">
                <svg className="w-8 h-8 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <h1 className="font-display font-extrabold text-3xl tracking-tighter text-primary">GrowMarket</h1>
              </div>
              <p className="font-body text-xs tracking-widest uppercase text-on-surface-variant/70">Editorial Precision in Data</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 bg-error-container text-on-error-container text-sm px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="font-body text-xs font-bold tracking-widest uppercase text-on-surface-variant" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="curator@GrowMarket.com"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-on-surface text-sm placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-body text-xs font-bold tracking-widest uppercase text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-secondary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-on-surface text-sm placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-body font-bold tracking-widest uppercase py-4 rounded-full shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : "Sign In"}
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-on-surface-variant">
              New to GrowMarkett?{" "}
              <Link href="/register" className="font-bold text-primary hover:text-secondary transition-colors underline decoration-secondary/30 decoration-2 underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-outline-variant/15">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-display font-black text-primary tracking-tight">GrowMarkett</div>
          <p className="font-body text-xs tracking-widest uppercase text-outline/60">© 2024 GrowMarket Inc. Editorial Precision in Data.</p>
        </div>
      </footer>
    </div>
  );
}