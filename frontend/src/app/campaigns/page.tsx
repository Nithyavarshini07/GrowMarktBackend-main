"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api, GeneratedPost } from "@/lib/api";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-container text-on-surface/60",
  scheduled: "bg-primary-container/30 text-primary",
  published: "bg-secondary/10 text-secondary",
  failed: "bg-error-container/30 text-error",
};

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | GeneratedPost["status"]>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.posts.list();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadPosts();
  }, [user, loadPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
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
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-12 px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-on-surface/50 font-body font-semibold">
            Content Hub
          </p>
          <h1 className="font-display text-3xl font-extrabold text-on-surface mt-1">
            Campaigns
          </h1>
          <p className="text-on-surface-variant text-sm font-body mt-1">
            All your AI-generated posts — drafts, scheduled, published, and
            failed.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(["all", "scheduled", "published", "draft", "failed"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-xs font-body font-bold uppercase tracking-wider transition-all ${
                  filter === s
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container text-on-surface/60 hover:bg-surface-container-high"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1.5 opacity-60">{counts[s]}</span>
              </button>
            ),
          )}
          <button
            onClick={loadPosts}
            className="ml-auto px-4 py-2 rounded-full text-xs font-body font-bold uppercase tracking-wider bg-surface-container text-on-surface/60 hover:bg-surface-container-high transition-all flex items-center gap-2"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-surface-container animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-on-surface/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-on-surface/40 font-body text-sm font-medium">
              No {filter === "all" ? "" : filter} posts yet
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-secondary font-body text-sm font-semibold hover:underline"
            >
              Go to dashboard to create →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((post) => (
              <article
                key={post._id}
                className="bg-surface-container-lowest rounded-xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-surface-container-low transition-all"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0">
                  {post.editedImageUrl || post.generatedImageUrl ? (
                    <img
                      src={post.editedImageUrl || post.generatedImageUrl}
                      alt={post.headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-on-surface/20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[post.status] || STATUS_STYLES.draft}`}
                    >
                      {post.status}
                    </span>
                    <span className="text-[10px] font-body font-bold uppercase tracking-wider text-on-surface/40 ">
                      {post.platform}
                    </span>
                    <span className="text-[10px] text-on-surface/30 font-body">
                      {post.day}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-on-surface text-sm truncate">
                    {post.headline}
                  </h3>
                  <p className="text-xs text-on-surface/50 font-body mt-0.5">
                    {post.points?.slice(0, 2).join(" • ")}
                  </p>
                  {post.status === "failed" && post.errorMessage && (
                    <p className="text-xs text-error mt-1">
                      ⚠ {post.errorMessage}
                    </p>
                  )}
                </div>

                {/* Date + Delete */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-on-surface/30 font-body">
                    {post.scheduledTime
                      ? new Date(post.scheduledTime).toLocaleDateString()
                      : new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(post._id)}
                    disabled={deleting === post._id}
                    className="text-[10px] font-body font-bold uppercase tracking-wider text-error hover:text-white hover:bg-error px-3 py-1.5 rounded-full transition-all border border-error/30 flex items-center gap-1.5"
                  >
                    {deleting === post._id ? (
                      <div className="w-3 h-3 border border-error border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
