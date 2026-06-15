"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api, SocialStatus, GeneratedPost } from "@/lib/api";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const PLATFORMS = [
  { key: "linkedin",  label: "LinkedIn",    icon: "in", color: "#0077b5", desc: "Professional network" },
  { key: "facebook",  label: "Facebook",    icon: "f",  color: "#1877f2", desc: "Community reach" },
  { key: "instagram", label: "Instagram",   icon: "ig", color: "#e1306c", desc: "Visual storytelling" },
  { key: "twitter",   label: "Twitter / X", icon: "𝕏",  color: "#111",    desc: "Real-time conversation" },
] as const;

type PlatformKey = typeof PLATFORMS[number]["key"];
type PublishResult = { platform: string; status: string; error?: string };
type Tab = "compose" | "select";

export default function PublishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  /* compose state */
  const [tab, setTab] = useState<Tab>("compose");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /* existing posts */
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [step, setStep] = useState<"compose" | "done">("compose");
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) {
      api.social.status().then(setSocialStatus).catch(() => {});
    }
  }, [user]);

  /* load existing posts for "select design" tab */
  useEffect(() => {
    if (tab === "select" && posts.length === 0) {
      setPostsLoading(true);
      api.posts.list().then(setPosts).catch(() => setPosts([])).finally(() => setPostsLoading(false));
    }
  }, [tab]);

  const isConnected = (key: string) => !!(socialStatus as any)?.[key]?.connected;
  const togglePlatform = (key: PlatformKey) =>
    setSelectedPlatforms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);

  /* ── AI: Generate caption from topic ───────────────────── */
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const platform = selectedPlatforms[0] || "linkedin";
      const post = await api.content.generateFromIdea({
        prompt: aiTopic,
        platform,
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }) as any,
      });
      const generated = Array.isArray(post) ? post[0] : post;
      const text = [generated.headline, ...(generated.points || []), generated.cta].filter(Boolean).join("\n\n");
      setCaption(text);
      if (generated.generatedImageUrl) setImageUrl(generated.generatedImageUrl);
    } catch (e: any) {
      alert("AI generation failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  /* ── AI: Enhance existing caption ──────────────────────── */
  const handleEnhance = async () => {
    if (!caption.trim()) return;
    setEnhancing(true);
    try {
      const platform = selectedPlatforms[0] || "linkedin";
      const post = await api.content.generateFromIdea({
        prompt: `Rewrite and enhance this social media caption to be more engaging and professional:\n\n${caption}`,
        platform,
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }) as any,
      });
      const generated = Array.isArray(post) ? post[0] : post;
      const text = [generated.headline, ...(generated.points || []), generated.cta].filter(Boolean).join("\n\n");
      setCaption(text);
    } catch (e: any) {
      alert("Enhancement failed: " + e.message);
    } finally {
      setEnhancing(false);
    }
  };

  /* ── Use an existing post ───────────────────────────────── */
  const applyPost = (post: GeneratedPost) => {
    setSelectedPost(post);
    const text = [post.headline, ...(post.points || []), post.cta].filter(Boolean).join("\n\n");
    setCaption(text);
    if (post.editedImageUrl || post.generatedImageUrl) {
      setImageUrl(post.editedImageUrl || post.generatedImageUrl || "");
    }
    setTab("compose");
  };

  /* ── Local file upload ──────────────────────────────────── */
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        // strip data:image/...;base64, prefix
        const base64 = dataUrl.split(",")[1];
        try {
          const res = await api.image.uploadCustom(base64);
          setImageUrl(res.imageUrl);
        } catch (err: any) {
          alert("Upload failed: " + (err.message || "Unknown error"));
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
    }
  }, []);

  /* ── Drag drop ──────────────────────────────────────────── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // If files dropped from OS file explorer
    if (e.dataTransfer.files?.length) {
      handleFileSelect(e.dataTransfer.files[0]);
      return;
    }
    // If URL text dropped
    const text = e.dataTransfer.getData("text/plain");
    if (text?.startsWith("http")) setImageUrl(text);
  }, [handleFileSelect]);

  /* ── Publish ────────────────────────────────────────────── */
  const handlePublish = async () => {
    if (!caption.trim() || !selectedPlatforms.length) return;
    setPublishing(true);
    try {
      const res = await api.publish.now({ caption, imageUrl: imageUrl || undefined, platforms: selectedPlatforms });
      setResults(res.results);
      setStep("done");
    } catch (err: any) {
      setResults([{ platform: "system", status: "failed", error: err.message }]);
      setStep("done");
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setCaption(""); setImageUrl(""); setSelectedPlatforms([]); setAiTopic("");
    setResults(null); setStep("compose"); setSelectedPost(null); setTab("compose");
  };

  if (authLoading || !user) return null;

  /* ── Results screen ─────────────────────────────────────── */
  if (step === "done" && results) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <AppNav />
        <main className="ml-64 pt-20 pb-16 px-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-extrabold text-primary">Publish Results</h1>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-glass space-y-4">
            {results.map(r => (
              <div key={r.platform}
                className={`flex items-center justify-between px-5 py-4 rounded-xl border ${r.status === "published" ? "border-secondary/30 bg-secondary/5" : "border-error/20 bg-error-container/10"}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold ${r.status === "published" ? "text-secondary" : "text-error"}`}>
                    {r.status === "published" ? "✓" : "✗"}
                  </span>
                  <div>
                    <p className="font-display font-semibold text-base text-primary capitalize">{r.platform}</p>
                    {r.error && <p className="text-sm text-error font-body mt-0.5">{r.error}</p>}
                  </div>
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${r.status === "published" ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={reset} className="flex-1 py-4 rounded-xl bg-surface-container text-on-surface font-display font-bold text-base hover:bg-surface-container-high transition-all">
              Publish Another
            </button>
            <button onClick={() => router.push("/campaigns")} className="flex-1 py-4 rounded-xl bg-primary text-white font-display font-bold text-base hover:bg-primary/90 transition-all">
              View in Campaigns →
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ── Main compose screen ────────────────────────────────── */
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-16 px-8">
        {/* Header */}
        <div className="mb-10 relative">
          <div className="absolute -left-8 top-0 w-1 h-full rounded-full bg-gradient-to-b from-primary to-secondary" />
          <p className="text-xs uppercase tracking-[0.3em] text-secondary font-body font-semibold mb-1.5">Instant Publish</p>
          <h1 className="font-display text-4xl font-extrabold text-primary leading-tight">Publish Design</h1>
          <p className="text-on-surface-variant text-base font-body mt-2">
            Share your design directly to connected social accounts — no scheduling needed.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* ── LEFT PANEL ───────────────────────────────── */}
          <div className="xl:col-span-3 space-y-6">

            {/* Tab switcher */}
            <div className="flex gap-2 bg-surface-container rounded-xl p-1">
              {([["compose", "✍ Compose New"], ["select", "📂 Select Existing Post"]] as const).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-body font-semibold transition-all ${tab === t ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface/50 hover:text-on-surface"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── COMPOSE TAB ── */}
            {tab === "compose" && (
              <>
                {/* AI Caption Builder */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">✨</span>
                    <h2 className="font-display font-bold text-lg text-primary">AI Caption Generator</h2>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAIGenerate()}
                      placeholder='Enter a topic, e.g. "Future of AI in marketing"'
                      className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-base font-body text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary/40 transition-all"
                    />
                    <button
                      onClick={handleAIGenerate}
                      disabled={aiLoading || !aiTopic.trim()}
                      className="px-5 py-3 rounded-xl bg-primary text-white font-display font-bold text-sm disabled:opacity-40 hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
                    >
                      {aiLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span>Generate</span>}
                    </button>
                  </div>
                  <p className="mt-2.5 text-xs text-on-surface/40 font-body">
                    AI will generate a caption for the selected platform. Select a platform first for best results.
                  </p>
                </div>

                {/* Caption */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-4">
                    <label className="font-display font-bold text-base text-primary">
                      Caption <span className="text-error">*</span>
                    </label>
                    <button
                      onClick={handleEnhance}
                      disabled={enhancing || !caption.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-secondary/30 text-secondary font-body font-semibold text-xs hover:bg-secondary/5 transition-all disabled:opacity-40"
                    >
                      {enhancing ? <div className="w-3 h-3 border border-secondary/40 border-t-secondary rounded-full animate-spin" /> : "✨"}
                      {enhancing ? "Enhancing..." : "AI Enhance"}
                    </button>
                  </div>
                  {selectedPost && (
                    <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-secondary/5 border border-secondary/15">
                      <span className="text-secondary text-sm">📎</span>
                      <p className="text-sm font-body text-on-surface/70 flex-1 truncate">Using: <strong className="text-primary">{selectedPost.headline}</strong></p>
                      <button onClick={() => { setSelectedPost(null); setCaption(""); }} className="text-xs text-on-surface/30 hover:text-error">✕</button>
                    </div>
                  )}
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write your caption, or use AI Generate above to create one automatically..."
                    rows={7}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-base font-body text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary/40 transition-all resize-none"
                  />
                  <p className="mt-2 text-xs text-on-surface/40 font-body">
                    {caption.length} characters{caption.length > 280 ? " · will be trimmed to 280 for Twitter" : ""}
                  </p>
                </div>

                {/* Image */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-4">
                    <label className="font-display font-bold text-base text-primary">Design Image <span className="text-on-surface/30 text-sm font-body font-normal">(optional)</span></label>
                    {imageUrl && (
                      <button onClick={() => setImageUrl("")}
                        className="text-xs font-body font-bold text-error/60 hover:text-error transition-colors flex items-center gap-1">
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ""; }}
                  />

                  {/* Drop zone / preview */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !imageUrl && fileInputRef.current?.click()}
                    className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden cursor-pointer ${
                      dragOver ? "border-primary bg-primary/5" :
                      imageUrl ? "border-outline-variant/20 cursor-default" :
                      "border-outline-variant/25 bg-surface-container hover:border-primary/40 hover:bg-primary/3"
                    }`}
                    style={{ minHeight: 180 }}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-body text-on-surface/50">Uploading image...</p>
                      </div>
                    ) : imageUrl ? (
                      <div className="relative group">
                        <img src={imageUrl} alt="Preview" className="w-full object-cover rounded-xl" style={{ maxHeight: 280 }} onError={() => setImageUrl("")} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl flex items-center justify-center">
                          <button
                            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="opacity-0 group-hover:opacity-100 px-4 py-2 rounded-full bg-white/90 text-primary font-body font-bold text-sm transition-all">
                            Change Image
                          </button>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setImageUrl(""); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-error transition-all z-10">✕</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-6 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <svg className="w-7 h-7 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-body font-semibold text-on-surface/60">
                            <span className="text-primary font-bold">Click to browse</span> or drag & drop
                          </p>
                          <p className="text-xs text-on-surface/30 font-body mt-1">PNG, JPG, WebP, GIF · Max 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OR paste URL */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex-1 h-px bg-outline-variant/20" />
                    <span className="text-xs text-on-surface/30 font-body uppercase tracking-widest">or paste URL</span>
                    <div className="flex-1 h-px bg-outline-variant/20" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://... external image URL"
                    value={imageUrl.startsWith("http") ? imageUrl : ""}
                    onChange={e => setImageUrl(e.target.value)}
                    className="mt-3 w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-base font-body text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary/40 transition-all"
                  />
                </div>
              </>
            )}

            {/* ── SELECT EXISTING TAB ── */}
            {tab === "select" && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
                <h2 className="font-display font-bold text-lg text-primary mb-1">Select an Existing Post</h2>
                <p className="text-sm text-on-surface/50 font-body mb-5">Pick any draft or post from your Campaigns to publish it now.</p>
                {postsLoading ? (
                  <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-surface-container animate-pulse" />)}</div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <p className="text-on-surface/40 font-body text-base mb-3">No posts found.</p>
                    <Link href="/dashboard" className="text-secondary font-body font-semibold text-sm hover:underline">Go create a post →</Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto">
                    {posts.map(post => (
                      <button key={post._id} onClick={() => applyPost(post)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-secondary/30 hover:bg-secondary/5 ${selectedPost?._id === post._id ? "border-secondary/40 bg-secondary/8" : "border-outline-variant/15 bg-surface-container"}`}>
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high shrink-0 flex items-center justify-center">
                          {post.editedImageUrl || post.generatedImageUrl
                            ? <img src={post.editedImageUrl || post.generatedImageUrl} alt="" className="w-full h-full object-cover" />
                            : <svg className="w-5 h-5 text-on-surface/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-base text-primary truncate">{post.headline}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-body text-on-surface/40 capitalize">{post.platform}</span>
                            <span className="text-xs font-body text-on-surface/30">·</span>
                            <span className={`text-xs font-body font-bold ${post.status === "published" ? "text-secondary" : post.status === "failed" ? "text-error" : "text-on-surface/50"}`}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                        {selectedPost?._id === post._id && <span className="text-secondary text-lg shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL — Platforms + Publish ─────────── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Platform selector */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h2 className="font-display font-bold text-base text-primary mb-4">Select Platforms</h2>
              <div className="space-y-3">
                {PLATFORMS.map(p => {
                  const connected = isConnected(p.key);
                  const selected = selectedPlatforms.includes(p.key);
                  return (
                    <button key={p.key} onClick={() => connected && togglePlatform(p.key)} disabled={!connected}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${!connected ? "opacity-40 cursor-not-allowed border-outline-variant/10" : selected ? "border-secondary/40 bg-secondary/5" : "border-outline-variant/15 hover:border-outline-variant/30"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: p.color }}>
                        {p.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-base text-primary">{p.label}</p>
                        <p className="text-xs text-on-surface/50 font-body mt-0.5">{p.desc}</p>
                      </div>
                      {connected ? (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-secondary bg-secondary text-white" : "border-outline-variant/40"}`}>
                          {selected && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                      ) : (
                        <span className="text-[10px] font-body font-bold uppercase tracking-widest text-on-surface/30 bg-surface-container px-2 py-1 rounded-full shrink-0">Not Connected</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!Object.values(socialStatus || {}).some((v: any) => v?.connected) && (
                <p className="mt-3 text-sm text-error font-body">
                  ⚠ No accounts connected.{" "}
                  <Link href="/settings" className="underline font-semibold">Settings →</Link>
                </p>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-surface-container rounded-xl p-5 space-y-3">
              {[
                { ok: !!caption.trim(), label: "Caption written" },
                { ok: selectedPlatforms.length > 0, label: `Platform selected (${selectedPlatforms.length})` },
                { ok: !!imageUrl, label: "Image added (optional)" },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${c.ok ? "border-secondary bg-secondary text-white" : "border-outline-variant/40"}`}>
                    {c.ok && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                  <span className={`text-sm font-body ${c.ok ? "text-on-surface/70" : "text-on-surface/40"}`}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={publishing || !caption.trim() || !selectedPlatforms.length}
              className="w-full py-5 rounded-xl bg-primary text-white font-display font-bold text-lg tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
            >
              {publishing ? (
                <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Publishing to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""}...</>
              ) : (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Publish Now{selectedPlatforms.length > 0 && ` · ${selectedPlatforms.length}`}</>
              )}
            </button>
            <p className="text-center text-sm text-on-surface/30 font-body">
              Published posts appear in <Link href="/campaigns" className="underline text-secondary">Campaigns</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
