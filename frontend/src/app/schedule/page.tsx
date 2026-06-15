"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api, GeneratedPost, SocialStatus } from "@/lib/api";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", icon: "in", bg: "bg-blue-600" },
  { key: "facebook", label: "Facebook", icon: "f", bg: "bg-indigo-600" },
  { key: "instagram", label: "Instagram", icon: "ig", bg: "bg-pink-600" },
  { key: "twitter", label: "Twitter / X", icon: "𝕏", bg: "bg-neutral-900" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-container text-on-surface/60",
  scheduled: "bg-primary/10 text-primary",
  published: "bg-secondary/10 text-secondary",
  failed: "bg-error-container/30 text-error",
};

function formatDateTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDateTimeInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  /* ── queue state ─────────────────────────────── */
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "scheduled" | "published" | "failed"
  >("scheduled");
  const [deleting, setDeleting] = useState<string | null>(null);

  /* ── compose state ───────────────────────────── */
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformKey>("linkedin");
  const [scheduledAt, setScheduledAt] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)),
  );
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  /* ── social status ───────────────────────────── */
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadPosts = useCallback(async () => {
    try {
      setQueueLoading(true);
      const data = await api.posts.list();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      api.social
        .status()
        .then(setSocialStatus)
        .catch(() => {});
    }
  }, [user, loadPosts]);

  const isConnected = (key: string) =>
    !!(socialStatus as any)?.[key]?.connected;

  const handleSchedule = async () => {
    if (!caption.trim() || !scheduledAt) return;
    setScheduling(true);
    setScheduleSuccess(null);
    setScheduleError(null);
    try {
      await api.schedule.create({
        content: caption,
        image: imageUrl || undefined,
        platform,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      setCaption("");
      setImageUrl("");
      setScheduledAt(
        toLocalDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)),
      );
      setScheduleSuccess(
        `Scheduled for ${formatDateTime(new Date(scheduledAt).toISOString())} on ${platform}!`,
      );
      await loadPosts();
    } catch (err: any) {
      setScheduleError(err.message || "Failed to schedule post.");
    } finally {
      setScheduling(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this scheduled post?")) return;
    setDeleting(id);
    try {
      await api.posts.delete(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  };

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const counts = {
    all: posts.length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-16 px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-on-surface/50 font-body font-semibold">
            Content Calendar
          </p>
          <h1 className="font-display text-3xl font-extrabold text-on-surface mt-1">
            Schedule
          </h1>
          <p className="text-on-surface-variant text-sm font-body mt-1">
            Plan your posts in advance — they publish automatically at the
            scheduled time.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* ── Left: Compose ─────────────────── */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h2 className="font-display font-bold text-lg text-on-surface mb-5 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Compose Post
              </h2>

              {/* Platform selector */}
              <div className="mb-5">
                <label className="block text-[10px] font-body font-bold uppercase tracking-widest text-on-surface/50 mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const connected = isConnected(p.key);
                    const active = platform === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => connected && setPlatform(p.key)}
                        disabled={!connected}
                        title={
                          !connected
                            ? `Connect ${p.label} in Settings`
                            : p.label
                        }
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all text-sm font-display font-semibold ${
                          !connected
                            ? "opacity-35 cursor-not-allowed border-outline-variant/10"
                            : active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline-variant/20 hover:border-primary/30 text-on-surface/70"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.bg} text-white text-[10px] font-bold shrink-0`}
                        >
                          {p.icon}
                        </span>
                        {p.label.split(" /")[0]}
                        {!connected && (
                          <span className="ml-auto text-[9px] uppercase tracking-widest opacity-50">
                            Off
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!Object.values(socialStatus || {}).some(
                  (v: any) => v?.connected,
                ) && (
                  <p className="mt-2 text-[11px] text-amber-500 font-body">
                    ⚠ No accounts connected.{" "}
                    <Link href="/settings" className="underline font-semibold">
                      Go to Settings
                    </Link>
                    .
                  </p>
                )}
              </div>

              {/* Caption */}
              <div className="mb-5">
                <label className="block text-[10px] font-body font-bold uppercase tracking-widest text-on-surface/50 mb-2">
                  Caption <span className="text-error">*</span>
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your post caption..."
                  rows={5}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary/40 transition-all resize-none"
                />
                <p className="mt-1 text-[10px] text-on-surface/30 font-body">
                  {caption.length} chars
                  {caption.length > 280 && platform === "twitter"
                    ? " — will be trimmed to 280 for Twitter"
                    : ""}
                </p>
              </div>

              {/* Image URL */}
              <div className="mb-5">
                <label className="block text-[10px] font-body font-bold uppercase tracking-widest text-on-surface/50 mb-2">
                  Image URL{" "}
                  <span className="text-on-surface/30">(optional)</span>
                </label>
                {imageUrl && (
                  <div className="relative mb-2 rounded-xl overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-32 object-cover"
                      onError={() => setImageUrl("")}
                    />
                    <button
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary/40 transition-all"
                />
              </div>

              {/* Date/Time */}
              <div className="mb-6">
                <label className="block text-[10px] font-body font-bold uppercase tracking-widest text-on-surface/50 mb-2">
                  Schedule Date & Time <span className="text-error">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={toLocalDateTimeInput(new Date())}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-body text-on-surface outline-none focus:border-primary/40 transition-all"
                />
                {scheduledAt && (
                  <p className="mt-1 text-[10px] text-on-surface/40 font-body">
                    Will publish on{" "}
                    {formatDateTime(new Date(scheduledAt).toISOString())}
                  </p>
                )}
              </div>

              {/* Feedback */}
              {scheduleSuccess && (
                <div className="mb-4 flex items-start gap-2 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3">
                  <span className="text-secondary text-lg leading-none">✓</span>
                  <p className="text-sm text-secondary font-body">
                    {scheduleSuccess}
                  </p>
                </div>
              )}
              {scheduleError && (
                <div className="mb-4 flex items-start gap-2 bg-error-container/30 border border-error/20 rounded-xl px-4 py-3">
                  <span className="text-error text-lg leading-none">✗</span>
                  <p className="text-sm text-error font-body">
                    {scheduleError}
                  </p>
                </div>
              )}

              <button
                onClick={handleSchedule}
                disabled={scheduling || !caption.trim() || !scheduledAt}
                className="w-full py-4 rounded-xl bg-primary text-white font-display font-bold text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scheduling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Schedule Post
                  </>
                )}
              </button>
            </div>

            {/* Quick tips */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <h3 className="font-display font-semibold text-sm text-on-surface mb-3">
                ⏱ How It Works
              </h3>
              <ul className="space-y-2 text-xs text-on-surface/60 font-body">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">1.</span>
                  Compose your caption and select a platform.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">2.</span>
                  Pick a future date and time — the server runs a background job
                  every minute.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">3.</span>
                  When the time arrives the post is published automatically.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">4.</span>
                  View results in the queue or in Campaigns.
                </li>
              </ul>
            </div>
          </div>

          {/* ── Right: Queue ───────────────────── */}
          <div className="xl:col-span-3">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Post Queue
                </h2>
                <button
                  onClick={loadPosts}
                  className="text-[10px] font-body font-bold uppercase tracking-widest text-on-surface/40 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(["scheduled", "published", "failed", "all"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-body font-bold uppercase tracking-wider transition-all ${
                        filter === s
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface-container text-on-surface/50 hover:bg-surface-container-high"
                      }`}
                    >
                      {s}
                      <span className="ml-1 opacity-60">
                        {s === "all"
                          ? counts.all
                          : counts[s as keyof typeof counts]}
                      </span>
                    </button>
                  ),
                )}
              </div>

              {/* List */}
              {queueLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-surface-container animate-pulse"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-7 h-7 text-on-surface/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-on-surface/40 font-body text-sm">
                    No {filter === "all" ? "" : filter} posts yet
                  </p>
                  {filter === "scheduled" && (
                    <p className="text-on-surface/30 font-body text-xs mt-1">
                      Compose a post on the left to schedule it.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {filtered.map((post) => (
                    <div
                      key={post._id}
                      className="flex items-start gap-4 bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high shrink-0 flex items-center justify-center">
                        {post.editedImageUrl || post.generatedImageUrl ? (
                          <img
                            src={post.editedImageUrl || post.generatedImageUrl}
                            alt={post.headline}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg
                            className="w-5 h-5 text-on-surface/20"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`text-[9px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[post.status] || STATUS_STYLES.draft}`}
                          >
                            {post.status}
                          </span>
                          <span className="text-[9px] font-body font-bold uppercase tracking-wider text-on-surface/40">
                            {post.platform}
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-sm text-on-surface truncate">
                          {post.headline}
                        </h3>
                        {post.status === "failed" && post.errorMessage && (
                          <p className="text-[11px] text-error font-body mt-0.5 line-clamp-1">
                            ⚠ {post.errorMessage}
                          </p>
                        )}
                        <p className="text-[11px] text-on-surface/40 font-body mt-1 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {post.scheduledTime
                            ? formatDateTime(
                                post.scheduledTime as unknown as string,
                              )
                            : formatDateTime(
                                post.createdAt as unknown as string,
                              )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex flex-col gap-2 items-end">
                        <button
                          onClick={() => handleDelete(post._id)}
                          disabled={deleting === post._id}
                          className="text-[9px] font-body font-bold uppercase tracking-widest text-error/60 hover:text-error hover:bg-error-container/30 px-2.5 py-1.5 rounded-full transition-all border border-error/20 flex items-center gap-1"
                        >
                          {deleting === post._id ? (
                            <div className="w-3 h-3 border border-error border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
