"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppNav from "@/components/AppNav";

/* ─── Animated counter ───────────────────────────────────────── */
function AnimCount({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!to) return;
    let cur = 0;
    const step = to / 36;
    const t = setInterval(() => {
      cur += step;
      if (cur >= to) { setV(to); clearInterval(t); }
      else setV(Math.floor(cur));
    }, 18);
    return () => clearInterval(t);
  }, [to]);
  return <>{v.toLocaleString()}{suffix}</>;
}

/* ─── Animated bar ───────────────────────────────────────────── */
function Bar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 150); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

/* ─── Inline SVG sparkline ───────────────────────────────────── */
function Sparkline({ vals, color }: { vals: number[]; color: string }) {
  if (vals.length < 2) return null;
  const max = Math.max(...vals) || 1;
  const w = 100 / (vals.length - 1);
  const pts = vals.map((v, i) => `${i * w},${100 - (v / max) * 80}`).join(" ");
  const fill = pts + ` ${(vals.length - 1) * w},100 0,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Donut ring ─────────────────────────────────────────────── */
function Donut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 200); return () => clearTimeout(t); }, []);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let cursor = 0;
  return (
    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
      {segments.map((s, i) => {
        const pct = (s.value / total) * 100;
        const dash = go ? pct : 0;
        const off = -cursor;
        cursor += pct;
        return (
          <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={s.value ? s.color : "transparent"}
            strokeWidth="3.5" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={off}
            strokeLinecap="round"
            style={{ transition: `stroke-dasharray 1s ease ${i * 0.12}s` }} />
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"posts" | "published" | "scheduled">("posts");

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) api.analytics.get().then((d: any) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const st = data?.stats ?? {};
  const ts = data?.timeSeries ?? [];
  const pb = data?.platformBreakdown ?? [];
  const sb = data?.statusBreakdown ?? [];
  const da = data?.dayActivity ?? [];

  const chartVals = ts.map((t: any) => t[metric] ?? 0);
  const metricTotal = ts.reduce((s: number, t: any) => s + (t[metric] ?? 0), 0);

  const kpis = [
    { label: "Total Posts", value: st.totalPosts ?? 0, note: `${st.draftPosts ?? 0} drafts`, color: "#00152a" },
    { label: "Published", value: st.publishedPosts ?? 0, note: `${st.successRate ?? 0}% success rate`, color: "#006e2f" },
    { label: "Scheduled", value: st.scheduledPosts ?? 0, note: "Pending publish", color: "#102a43" },
    { label: "Failed", value: st.failedPosts ?? 0, note: "Needs attention", color: "#ba1a1a" },
  ];

  const METRIC_OPTIONS = [
    { key: "posts" as const, label: "All Posts", color: "#00152a" },
    { key: "published" as const, label: "Published", color: "#006e2f" },
    { key: "scheduled" as const, label: "Scheduled", color: "#102a43" },
  ];
  const activeColor = METRIC_OPTIONS.find(m => m.key === metric)?.color ?? "#00152a";

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-16 px-8">

        {/* Header */}
        <div className="mb-10 relative">
          <div className="absolute -left-8 top-0 w-1 h-full rounded-full" style={{ background: "linear-gradient(180deg, #00152a, #006e2f)" }} />
          <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-body font-semibold mb-1.5">Performance Overview</p>
          <h1 className="font-display text-4xl font-extrabold text-primary leading-tight">Analytics</h1>
          <p className="text-on-surface-variant text-sm font-body mt-2 max-w-lg">
            All data is live from your account — posts, platforms, and publishing activity.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {kpis.map((k, i) => (
            <div key={k.label}
              className="relative rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/10 shadow-glass overflow-hidden group hover:-translate-y-0.5 transition-transform cursor-default">
              {/* accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: k.color }} />
              <p className="text-[10px] uppercase tracking-widest font-body text-on-surface/50 mb-2">{k.label}</p>
              <p className="font-display text-4xl font-extrabold text-primary leading-none mb-1.5">
                {loading ? <span className="inline-block w-12 h-8 bg-surface-container-high rounded animate-pulse" /> : <AnimCount to={k.value} />}
              </p>
              <p className="text-[11px] font-body text-on-surface/40">{k.note}</p>
            </div>
          ))}
        </div>

        {/* Chart + Platform mix */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

          {/* Weekly chart */}
          <div className="xl:col-span-2 rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/10 shadow-glass">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-primary">Weekly Activity</h2>
                <p className="text-on-surface/40 text-xs font-body mt-0.5">
                  {loading ? "—" : `${metricTotal} total over last 8 weeks`}
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {METRIC_OPTIONS.map(m => (
                  <button key={m.key} onClick={() => setMetric(m.key)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-body font-bold uppercase tracking-widest transition-all border"
                    style={metric === m.key
                      ? { backgroundColor: m.color, color: "#fff", borderColor: "transparent" }
                      : { backgroundColor: "transparent", color: "rgba(11,28,48,0.5)", borderColor: "rgba(195,198,206,0.4)" }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-24 rounded-xl bg-surface-container animate-pulse" />
            ) : ts.length === 0 ? (
              <div className="h-24 rounded-xl bg-surface-container flex items-center justify-center">
                <p className="text-on-surface/30 font-body text-sm">No activity yet — start creating posts!</p>
              </div>
            ) : (
              <>
                <div className="h-24 mb-3">
                  <Sparkline vals={chartVals} color={activeColor} />
                </div>
                <div className="flex justify-between px-0.5">
                  {ts.map((t: any, i: number) => (
                    <div key={i} className="text-center flex-1">
                      <p className="font-display font-bold text-primary text-sm">{t[metric] ?? 0}</p>
                      <p className="text-[9px] text-on-surface/30 font-body mt-0.5">{t.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Platform donut */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/10 shadow-glass">
            <h2 className="font-display font-bold text-lg text-primary mb-1">Platform Mix</h2>
            <p className="text-on-surface/40 text-xs font-body mb-5">By posts created</p>
            {loading ? (
              <div className="h-40 rounded-xl bg-surface-container animate-pulse" />
            ) : pb.every((p: any) => p.count === 0) ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-on-surface/30 font-body text-sm text-center">Create posts to see platform breakdown</p>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <div className="relative shrink-0 w-28 h-28">
                  <Donut segments={pb.map((p: any) => ({ value: p.count, color: p.color, label: p.name }))} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-bold text-primary text-lg">{st.totalPosts ?? 0}</span>
                    <span className="text-[9px] text-on-surface/40 font-body uppercase tracking-widest">Posts</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {pb.map((p: any) => (
                    <div key={p.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-body text-on-surface/60">{p.name}</span>
                        <span className="text-[11px] font-display font-bold text-primary">{p.count}</span>
                      </div>
                      <Bar pct={p.value} color={p.color} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status + Day heatmap */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Status breakdown */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/10 shadow-glass">
            <h2 className="font-display font-bold text-lg text-primary mb-1">Status Breakdown</h2>
            <p className="text-on-surface/40 text-xs font-body mb-6">Cumulative post outcomes</p>
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-8 rounded-xl bg-surface-container animate-pulse mb-3" />)
              : sb.map((s: any) => (
                <div key={s.label} className="mb-4 last:mb-0">
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-body text-on-surface/70">{s.label}</span>
                    </div>
                    <span className="text-sm font-display font-bold text-primary">{s.value}</span>
                  </div>
                  <Bar pct={st.totalPosts ? (s.value / st.totalPosts) * 100 : 0} color={s.color} />
                </div>
              ))}
          </div>

          {/* Day of week heatmap */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/10 shadow-glass">
            <h2 className="font-display font-bold text-lg text-primary mb-1">Best Days to Post</h2>
            <p className="text-on-surface/40 text-xs font-body mb-6">Based on your actual creation history</p>
            {loading ? (
              <div className="h-28 rounded-xl bg-surface-container animate-pulse" />
            ) : da.every((d: any) => d.count === 0) ? (
              <div className="h-28 flex items-center justify-center">
                <p className="text-on-surface/30 font-body text-sm">No history yet</p>
              </div>
            ) : (
              <div className="flex items-end gap-2 h-28">
                {da.map((d: any) => {
                  const maxCount = Math.max(...da.map((x: any) => x.count)) || 1;
                  const heightPct = (d.count / maxCount) * 100;
                  const isMax = d.count === maxCount;
                  return (
                    <div key={d.label} className="flex flex-col items-center flex-1 gap-1.5">
                      <span className="text-[10px] font-display font-bold text-primary opacity-60">{d.count || ""}</span>
                      <div className="w-full rounded-t-lg transition-all duration-700" style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        backgroundColor: isMax ? "#006e2f" : d.count > 0 ? "#102a43" : "#e5eeff",
                        opacity: d.count > 0 ? 1 : 0.4,
                      }} />
                      <span className="text-[10px] font-body text-on-surface/50">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {da.some((d: any) => d.count > 0) && (
              <p className="mt-4 text-[11px] font-body text-secondary font-semibold">
                ★ Best day: {da.reduce((best: any, d: any) => d.count > (best?.count ?? 0) ? d : best, null)?.label}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}