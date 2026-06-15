"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  aggressive: { badge: "bg-error-container/40 text-on-error-container border-error/20",   dot: "#ba1a1a", label: "Aggressive" },
  rising:     { badge: "bg-secondary/10 text-secondary border-secondary/20",               dot: "#006e2f", label: "Rising ↑" },
  stable:     { badge: "bg-primary-container/30 text-on-primary-container border-primary/10", dot: "#00152a", label: "Stable" },
  caution:    { badge: "bg-surface-container text-on-surface/60 border-outline-variant/20", dot: "#43474d", label: "Caution ⚠" },
  declining:  { badge: "bg-surface-container text-on-surface/40 border-outline-variant/10", dot: "#c3c6ce", label: "Declining ↓" },
};

const INSIGHT_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  alert:       { bg: "bg-error-container/20",  border: "border-error/25",      icon: "⚠" },
  opportunity: { bg: "bg-secondary/5",         border: "border-secondary/20",  icon: "💡" },
  info:        { bg: "bg-surface-container",   border: "border-outline-variant/20", icon: "ℹ" },
};

/* ─── Score ring (SVG) ───────────────────────────────────────── */
function ScoreRing({ score, isUser, size = 60 }: { score: number; isUser?: boolean; size?: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 300); return () => clearTimeout(t); }, []);
  const r = 14;
  const c = 2 * Math.PI * r;
  const dash = go ? (score / 100) * c : 0;
  const color = isUser ? "#006e2f" : "#00152a";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 36 36" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#e5eeff" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-extrabold text-primary" style={{ fontSize: size * 0.24 }}>{score}</span>
      </div>
    </div>
  );
}

/* ─── Radar chart ────────────────────────────────────────────── */
function Radar({
  user, benchmark,
}: {
  user: { label: string; value: number }[];
  benchmark: { label: string; value: number }[];
}) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 500); return () => clearTimeout(t); }, []);
  const size = 200;
  const c = size / 2;
  const r = size * 0.36;
  const n = user.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (value: number, i: number, scale = 1) => ({
    x: c + ((value / 100) * r * scale) * Math.cos(angle(i)),
    y: c + ((value / 100) * r * scale) * Math.sin(angle(i)),
  });

  const path = (data: { value: number }[]) =>
    data.map((d, i) => { const p = pt(d.value, i, go ? 1 : 0); return `${i === 0 ? "M" : "L"}${p.x},${p.y}`; }).join(" ") + "Z";

  return (
    <svg width={size} height={size} className="overflow-visible">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} fill="none" stroke="#e5eeff" strokeWidth="0.8"
          points={user.map((_, i) => { const p = pt(100, i, f); return `${p.x},${p.y}`; }).join(" ")} />
      ))}
      {user.map((_, i) => {
        const p = pt(100, i);
        return <line key={i} x1={c} y1={c} x2={p.x} y2={p.y} stroke="#e5eeff" strokeWidth="0.6" />;
      })}
      {/* Benchmark */}
      <path d={path(benchmark)} fill="rgba(0,21,42,0.08)" stroke="#00152a" strokeWidth="1.5"
        style={{ transition: "d 1.2s ease" }} />
      {/* User */}
      <path d={path(user)} fill="rgba(0,110,47,0.15)" stroke="#006e2f" strokeWidth="1.5"
        style={{ transition: "d 1.2s ease" }} />
      {/* Labels */}
      {user.map((d, i) => {
        const p = pt(100, i, 1.22);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="6.5" fill="#43474d" fontFamily="Inter, sans-serif">{d.label}</text>
        );
      })}
    </svg>
  );
}

export default function CompetitorsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"leaderboard" | "radar" | "insights">("leaderboard");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) api.competitors.get().then((d: any) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const leaderboard = data?.leaderboard ?? [];
  const insights = data?.insights ?? [];
  const radarData = data?.radarData;
  const userStats = data?.userStats;
  const userScore = data?.userScore ?? 0;
  const userEntry = leaderboard.find((c: any) => c.isUser);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-16 px-8">

        {/* Header */}
        <div className="mb-10 relative flex items-start justify-between">
          <div>
            <div className="absolute -left-8 top-0 w-1 h-full rounded-full bg-gradient-to-b from-primary to-secondary" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-body font-semibold mb-1.5">Market Intelligence</p>
            <h1 className="font-display text-4xl font-extrabold text-primary leading-tight">Competitors</h1>
            <p className="text-on-surface-variant text-sm font-body mt-2 max-w-lg">
              Your score is calculated from real account data. Benchmarks are industry averages.
            </p>
          </div>
          {/* Your score card */}
          {!loading && (
            <div className="rounded-2xl p-5 bg-surface-container-lowest border border-secondary/20 shadow-glass flex items-center gap-4">
              <ScoreRing score={userScore} isUser size={72} />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-secondary font-body">Your Score</p>
                <p className="font-display font-bold text-primary text-base">
                  Rank #{userEntry?.rank ?? "—"} of {leaderboard.length}
                </p>
                <p className="text-[11px] text-on-surface/40 font-body mt-0.5">
                  {userStats?.connectedPlatforms?.length ?? 0} platform{userStats?.connectedPlatforms?.length !== 1 ? "s" : ""} · {userStats?.postsLast7d ?? 0} posts this week
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-7">
          {(["leaderboard", "insights", "radar"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2.5 rounded-full text-[11px] font-body font-bold uppercase tracking-widest transition-all border"
              style={tab === t
                ? { background: "#00152a", color: "#fff", borderColor: "transparent" }
                : { background: "transparent", color: "rgba(11,28,48,0.5)", borderColor: "rgba(195,198,206,0.4)" }}>
              {t === "leaderboard" ? "🏆 Leaderboard" : t === "insights" ? "💡 Insights" : "📡 Radar"}
            </button>
          ))}
        </div>

        {/* ── LEADERBOARD ───────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="space-y-3">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface-container animate-pulse" />)
              : leaderboard.map((c: any) => {
                  const st = STATUS_STYLES[c.status] ?? STATUS_STYLES.stable;
                  const isHov = hovered === c.id;
                  const competitorPlatforms = c.platforms ?? c.connectedPlatforms ?? [];
                  const postsThisWeek = c.postsThisWeek ?? c.postsLast7d ?? 0;
                  const industry = c.industry ?? "Tracked competitor";
                  return (
                    <div key={c.id}
                      onMouseEnter={() => setHovered(c.id)}
                      onMouseLeave={() => setHovered(null)}
                      className={`relative rounded-2xl p-5 border flex items-center gap-5 transition-all duration-200 cursor-default ${
                        c.isUser
                          ? "border-secondary/30 bg-surface-container-lowest"
                          : "border-outline-variant/10 bg-surface-container-lowest"
                      } ${isHov ? "shadow-glass -translate-y-px" : ""}`}>
                      {/* User highlight bar */}
                      {c.isUser && <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-secondary" />}

                      {/* Rank */}
                      <span className="font-display font-extrabold text-xl shrink-0 w-7 text-center"
                        style={{ color: c.rank === 1 ? "#b45309" : c.rank === 2 ? "#64748b" : c.rank === 3 ? "#92400e" : "#c3c6ce" }}>
                        {c.rank <= 3 ? ["🥇","🥈","🥉"][c.rank-1] : c.rank}
                      </span>

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-extrabold text-sm shrink-0 ${
                        c.isUser ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
                      }`}>
                        {c.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <h3 className="font-display font-bold text-primary text-sm truncate">{c.name}</h3>
                          {c.isBenchmark && (
                            <span className="text-[9px] text-on-surface/30 font-body uppercase tracking-widest border border-outline-variant/30 px-1.5 py-0.5 rounded-full">benchmark</span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface/50 font-body">{industry}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {competitorPlatforms.map((p: string) => (
                            <span key={p} className="text-[9px] font-body text-on-surface/40 bg-surface-container px-1.5 py-0.5 rounded capitalize">{p}</span>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden xl:flex items-center gap-6 shrink-0 text-center">
                        <div>
                          <p className="font-display font-bold text-primary text-sm">{postsThisWeek}</p>
                          <p className="text-[9px] text-on-surface/30 font-body">Posts/wk</p>
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm" style={{ color: String(c.growth).startsWith("-") ? "#ba1a1a" : "#006e2f" }}>{c.growth}</p>
                          <p className="text-[9px] text-on-surface/30 font-body">Growth</p>
                        </div>
                        <div>
                          <p className="font-display font-bold text-primary text-sm">{c.successRate}</p>
                          <p className="text-[9px] text-on-surface/30 font-body">Success</p>
                        </div>
                      </div>

                      <ScoreRing score={c.score} isUser={c.isUser} size={52} />

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-body font-bold uppercase tracking-widest border shrink-0 ${st.badge}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
          </div>
        )}

        {/* ── INSIGHTS ─────────────────────────────────── */}
        {tab === "insights" && (
          <div className="space-y-4 max-w-2xl">
            {loading
              ? [...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />)
              : insights.length === 0
              ? (
                <div className="rounded-2xl p-12 text-center bg-surface-container-lowest border border-outline-variant/10">
                  <p className="text-on-surface/40 font-body">No insights yet — create some posts to unlock data-driven recommendations.</p>
                </div>
              )
              : insights.map((ins: any) => {
                  const st = INSIGHT_STYLES[ins.type] ?? INSIGHT_STYLES.info;
                  const actionLabel = ins.action ?? "View campaigns";
                  const href =
                    actionLabel === "Schedule a post" || actionLabel === "Create a post"
                      ? "/publish"
                      : actionLabel === "Connect more accounts"
                        ? "/settings"
                        : "/campaigns";
                  return (
                    <div key={ins.id} className={`rounded-2xl p-5 border ${st.bg} ${st.border} hover:-translate-y-px transition-transform cursor-default`}>
                      <div className="flex items-start gap-4">
                        <span className="text-2xl shrink-0 mt-0.5">{st.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-primary text-sm mb-1">{ins.title}</p>
                          <p className="text-[12px] text-on-surface/60 font-body leading-relaxed">{ins.description}</p>
                          <Link href={href}
                            className="mt-3 inline-block text-[11px] font-body font-semibold text-secondary hover:underline">
                            {actionLabel} →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}

        {/* ── RADAR ────────────────────────────────────── */}
        {tab === "radar" && radarData && (
          <div className="rounded-2xl p-8 bg-surface-container-lowest border border-outline-variant/10 shadow-glass">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center">
              <div className="flex flex-col items-center">
                <h2 className="font-display font-bold text-xl text-primary mb-1">Performance Radar</h2>
                <p className="text-on-surface/40 text-xs font-body mb-6">You vs. industry benchmark</p>
                <Radar user={radarData.userScore} benchmark={radarData.benchmarkScore} />
                <div className="flex items-center gap-6 mt-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-xs text-on-surface/60 font-body">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-on-surface/60 font-body">Industry Avg.</span>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                {radarData.userScore.map((d: { label: string; value: number }, i: number) => {
                  const bench = radarData.benchmarkScore[i];
                  const delta = d.value - bench.value;
                  return (
                    <div key={d.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-body text-on-surface/70">{d.label}</span>
                        <div className="flex items-center gap-3 text-sm font-display font-bold">
                          <span className="text-secondary">{d.value}</span>
                          <span className="text-on-surface/20 text-xs">vs</span>
                          <span className="text-primary">{bench.value}</span>
                          <span className={`text-[11px] font-body font-bold ${delta >= 0 ? "text-secondary" : "text-error"}`}>
                            {delta >= 0 ? `+${delta}` : delta}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="absolute h-full rounded-full transition-all duration-1000 bg-primary/30" style={{ width: `${bench.value}%` }} />
                        <div className="absolute h-full rounded-full transition-all duration-1000 bg-secondary" style={{ width: `${d.value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}