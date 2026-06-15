"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api, SocialStatus } from "@/lib/api";
import AppNav from "@/components/AppNav";

const PLATFORMS = [
  { key: "linkedin",  label: "LinkedIn",    oauthKey: "linkedin", bg: "bg-blue-600", color: "text-white"   },
  { key: "facebook",  label: "Facebook",    oauthKey: "meta",     bg: "bg-indigo-600", color: "text-white" },
  { key: "instagram", label: "Instagram",   oauthKey: "meta",     bg: "bg-pink-600",   color: "text-white" },
  { key: "twitter",   label: "Twitter / X", oauthKey: "twitter",  bg: "bg-on-surface", color: "text-white" },
] as const;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.social.status();
      setSocialStatus(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) loadStatus(); }, [user, loadStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") || params.get("error")) {
      loadStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadStatus]);

  const handleConnect = (oauthKey: string) => {
    const token = localStorage.getItem("token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${baseUrl}/social-auth/${oauthKey}?token=${token}`;
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    setDisconnecting(platform);
    try { await api.social.disconnect(platform); await loadStatus(); }
    catch { /* ignore */ }
    finally { setDisconnecting(null); }
  };

  const isConnected = (key: string) => !!(socialStatus as any)?.[key]?.connected;
  const connectedName = (key: string) => {
    const s = (socialStatus as any)?.[key];
    return s?.profileName || s?.pageName || null;
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-12 px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-on-surface/50 font-body font-semibold">Configuration</p>
          <h1 className="font-display text-3xl font-extrabold text-on-surface mt-1">Settings</h1>
          <p className="text-on-surface-variant text-sm font-body mt-1">Manage your account and social connections.</p>
        </div>

        {/* Profile card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 mb-8 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-display font-bold text-2xl shadow-lg shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">{user.name}</h2>
            <p className="text-sm text-on-surface/60 font-body">{user.email}</p>
            <span className="mt-1 inline-block text-[10px] uppercase tracking-widest font-body font-bold text-secondary">Premium Curator</span>
          </div>
        </div>

        {/* Social Connections */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-on-surface mb-1">Connected Accounts</h2>
          <p className="text-sm text-on-surface/60 font-body mb-6">
            Connect your social accounts to enable automatic publishing when scheduled posts become due.
          </p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {PLATFORMS.map(platform => {
                const connected = isConnected(platform.key);
                const name = connectedName(platform.key);
                const isDisconnecting = disconnecting === platform.key;

                return (
                  <div
                    key={platform.key}
                    className={`bg-surface-container-lowest rounded-xl p-6 border transition-all ${
                      connected ? "border-secondary/30 bg-secondary/5" : "border-outline-variant/15"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform.bg} ${platform.color} font-bold`}>
                        {platform.key[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-sm text-on-surface">{platform.label}</h3>
                        {connected && name && (
                          <p className="text-xs text-secondary font-body">{name}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full font-body ${
                        connected ? "bg-secondary/10 text-secondary" : "bg-surface-container text-on-surface/40"
                      }`}>
                        {connected ? "✓ Connected" : "Not connected"}
                      </span>
                    </div>

                    {connected ? (
                      <button
                        onClick={() => handleDisconnect(platform.key)}
                        disabled={isDisconnecting}
                        className="w-full py-2.5 rounded-lg bg-error-container/30 text-error text-sm font-body font-semibold hover:bg-error-container/50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isDisconnecting && <div className="w-3 h-3 border border-error border-t-transparent rounded-full animate-spin" />}
                        Disconnect {platform.label}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleConnect(platform.oauthKey)}
                          className="w-full py-2.5 rounded-lg bg-surface-container text-on-surface/70 text-sm font-body font-semibold hover:bg-primary hover:text-white transition-all"
                        >
                          Connect {platform.label}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/social-auth/mock/${platform.key}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                              });
                              loadStatus();
                            } catch (e) { alert('Mock failed'); }
                          }}
                          className="w-full py-1.5 rounded-lg border border-dashed border-outline-variant/30 text-on-surface/40 text-[10px] font-body font-bold hover:bg-secondary/5 hover:text-secondary hover:border-secondary/20 transition-all uppercase tracking-widest"
                        >
                          Demo Bypass (Instant Connect)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instagram note */}
        <div className="mt-6 bg-surface-container-lowest rounded-xl p-5 border-l-4 border-l-amber-400">
          <div className="flex gap-3">
            <span className="text-amber-400 text-lg shrink-0">⚠</span>
            <p className="text-xs text-on-surface/70 font-body">
              <strong className="text-amber-600">Instagram note:</strong> Publishing requires a publicly accessible image URL.
              Localhost images will not work — deploy to a live server or use a tunnel like{" "}
              <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">ngrok</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}