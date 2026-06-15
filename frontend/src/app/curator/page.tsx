"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { api, GeneratedPost, SocialStatus } from "@/lib/api";
import AppNav from "@/components/AppNav";
import TuiImageEditor from "@/components/TuiImageEditor";

import { 
  Sparkles, 
  Calendar, 
  Zap, 
  Trash2, 
  Edit3, 
  Send, 
  Clock, 
  Linkedin,
  Instagram,
  Facebook
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLATFORMS = ["linkedin", "instagram", "facebook"];

function CuratorContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdea = searchParams.get("q");

  const [idea, setIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, GeneratedPost[]>>({});
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  
  /* Editing State */
  const [editingPost, setEditingPost] = useState<GeneratedPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  
  /* Image Generation State */
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);

  const isPlanEmpty = Object.keys(weeklyPlan).length === 0;

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  
  useEffect(() => {
    if (user) {
      api.social.status().then(setSocialStatus).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (initialIdea && !generating && isPlanEmpty) {
      setIdea(initialIdea);
      performWeeklyGeneration(initialIdea);
    }
  }, [initialIdea, user]);

  const performWeeklyGeneration = async (topic: string) => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const plan = await api.content.generateWeekly({ prompt: topic });
      setWeeklyPlan(plan as any);
    } catch (err: any) {
      alert("Failed to generate weekly plan: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateWeekly = async (e: React.FormEvent) => {
    e.preventDefault();
    performWeeklyGeneration(idea);
  };

  const handleGenerateImage = async (postId: string) => {
    setGeneratingImageFor(postId);
    try {
      const updatedPost = await api.image.generate(postId);
      setWeeklyPlan(prev => {
        const newPlan = { ...prev };
        Object.keys(newPlan).forEach(plt => {
          newPlan[plt] = newPlan[plt].map(p => p._id === postId ? updatedPost : p);
        });
        return newPlan;
      });
    } catch (err: any) {
      alert("Image generation failed: " + err.message);
    } finally {
      setGeneratingImageFor(null);
    }
  };

  const openEditor = (post: GeneratedPost) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleSaveEditedImage = async (base64: string) => {
    if (!editingPost) return;
    setSavingImage(true);
    try {
      const updatedPost = await api.image.save(editingPost._id, base64);
      setWeeklyPlan(prev => {
        const newPlan = { ...prev };
        Object.keys(newPlan).forEach(plt => {
          newPlan[plt] = newPlan[plt].map(p => p._id === editingPost._id ? updatedPost : p);
        });
        return newPlan;
      });
      setIsEditorOpen(false);
      setEditingPost(null);
    } catch (err: any) {
      alert("Failed to save image: " + err.message);
    } finally {
      setSavingImage(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AppNav />
      <main className="ml-64 pt-20 pb-16 px-8">
        
        <AnimatePresence>
          {isEditorOpen && editingPost && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-surface-container-highest flex flex-col p-4 md:p-10 overflow-hidden"
            >
              <TuiImageEditor 
                imageUrl={editingPost.editedImageUrl || editingPost.generatedImageUrl || ""}
                onSave={handleSaveEditedImage}
                onBack={() => setIsEditorOpen(false)}
                saving={savingImage}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Narrative Curator</span>
          </div>
          <h1 className="font-display text-5xl font-black text-primary tracking-tighter leading-none mb-4">
            Weekly Strategist
          </h1>
          <p className="text-on-surface-variant text-lg font-medium opacity-70 max-w-2xl">
            Transform a single seed into a high-performance content calendar for the entire week.
          </p>
        </div>

        <section className="mb-16">
          <form onSubmit={handleGenerateWeekly} className="relative group max-w-4xl">
            <div className={`absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-[3rem] blur-xl opacity-10 group-focus-within:opacity-25 transition duration-1000 ${generating ? "opacity-30 animate-pulse" : ""}`} />
            <div className="relative flex items-center bg-white border border-outline-variant/10 rounded-[2.5rem] p-3 pl-8 shadow-2xl overflow-hidden ring-4 ring-primary/5">
               <input 
                  type="text" 
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={generating}
                  placeholder="E.g. 'Launch of our sustainable yoga wear brand' ..." 
                  className="w-full py-4 bg-transparent border-none outline-none font-display font-black text-xl text-primary placeholder:text-on-surface/20"
               />
               <button 
                type="submit"
                disabled={generating || !idea.trim()}
                className="bg-primary text-white pl-8 pr-10 py-5 rounded-[2rem] font-display font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-3"
               >
                 {generating ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                 ) : (
                    <Zap size={18} fill="currentColor" />
                 )}
                 Generate week
               </button>
            </div>
          </form>
        </section>

        {isPlanEmpty ? (
          <section className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-surface-container-low flex items-center justify-center text-primary/10 mb-6">
              <Calendar size={48} strokeWidth={1} />
            </div>
            <h3 className="font-display font-black text-2xl text-on-surface/40 uppercase tracking-widest mb-2">No active strategy</h3>
            <p className="text-on-surface/30 font-medium font-body max-w-xs">Drop a seed above to build your 7-day social narrative.</p>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black font-display text-primary tracking-tight">Your 7-Day Narrative</h2>
              <div className="flex gap-2">
                 <button className="p-3 px-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-xs font-black uppercase tracking-widest text-primary hover:bg-surface-bright transition-all">Download Plan</button>
                 <button className="p-3 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Approve All</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-6">
              {DAYS.map((day, dIdx) => (
                <div key={day} className="flex flex-col gap-6">
                  <div className="flex flex-col items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">{day.slice(0, 3)}</span>
                    <div className="w-8 h-1 rounded-full bg-primary/20" />
                  </div>
                  
                  {PLATFORMS.map(platform => {
                    const post = (weeklyPlan[platform] || []).find(p => p.day === day);
                    if (!post) return null;

                    const isGenerating = generatingImageFor === post._id;
                    const hasImage = !!(post.editedImageUrl || post.generatedImageUrl);

                    return (
                      <motion.div 
                        key={post._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dIdx * 0.05 }}
                        className="group relative bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 hover:shadow-2xl hover:shadow-primary/5 hover:bg-white transition-all overflow-hidden"
                      >
                         <div className="aspect-square rounded-xl bg-surface-container-low mb-4 overflow-hidden relative group/img">
                            {hasImage ? (
                              <img src={post.editedImageUrl || post.generatedImageUrl} alt="" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                <Sparkles size={24} className="text-primary/10 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/20">Design Required</p>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                               {!hasImage ? (
                                 <button 
                                  onClick={() => handleGenerateImage(post._id)}
                                  disabled={isGenerating}
                                  className="w-full py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                 >
                                   {isGenerating ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Zap size={12} fill="currentColor" />}
                                   Generate AI
                                 </button>
                               ) : (
                                 <button 
                                  onClick={() => openEditor(post)}
                                  className="w-full py-2 bg-white text-primary rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                 >
                                   <Edit3 size={12} /> Edit TUI
                                 </button>
                               )}
                            </div>
                         </div>

                         <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-secondary">{platform}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-secondary' : 'bg-on-surface/10'}`} />
                            </div>
                            <h4 className="text-xs font-black text-primary line-clamp-2 leading-tight">{post.headline}</h4>
                            <p className="text-[10px] text-on-surface/40 font-medium line-clamp-2">{post.points[0]}</p>
                         </div>

                         <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/publish?edit=${post._id}`} className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:text-secondary transition-colors">
                               Post <Send size={10} />
                            </Link>
                            <button className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 hover:text-error transition-colors">
                               <Trash2 size={10} />
                            </button>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function CuratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <CuratorContent />
    </Suspense>
  );
}
