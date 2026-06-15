"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api, GeneratedPost, SocialStatus } from "@/lib/api";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Globe,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

/* ─── 3D Tilt Card Component ────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function onMouseMove(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX - width / 2);
    y.set(mouseY - height / 2);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      className={`relative group ${className}`}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      <div className="relative h-full bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-8 shadow-xl shadow-black/5 bg-clip-padding backdrop-blur-sm transition-colors group-hover:bg-surface-bright/50">
        {children}
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, trend, up }: { label: string; value: string; trend: string; up: boolean }) {
  return (
    <TiltCard className="h-full">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs uppercase tracking-[0.15em] text-on-surface/40 font-black font-display">{label}</span>
        <div className={`p-2 rounded-xl ${up ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
          {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </div>
      </div>
      <h3 className="text-5xl font-black font-display text-primary tracking-tighter mb-4">{value}</h3>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold font-body ${up ? "text-secondary" : "text-error"}`}>
          {up ? "+" : "-"}{trend}
        </span>
        <span className="text-[11px] text-on-surface/30 font-bold uppercase tracking-[0.15em] font-body">vs last 30d</span>
      </div>
    </TiltCard>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [idea, setIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [demoPost, setDemoPost] = useState<GeneratedPost | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [p, s] = await Promise.all([api.posts.list(), api.social.status()]);
      setPosts(p);
      setSocialStatus(s);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleGenerateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    router.push(`/curator?q=${encodeURIComponent(idea)}`);
  };

  if (authLoading || !user) return null;

  const scheduled = posts.filter(p => p.status === "scheduled");
  const published = posts.filter(p => p.status === "published");
  const recent = posts.slice(0, 5);

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary selection:text-white">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 60, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-secondary/5 blur-[150px] rounded-full"
        />
      </div>

      <AppNav />

      <main className="relative z-10 ml-64 pt-28 pb-20 px-10">
        {/* Welcome Section */}
        <section className="mb-12 flex justify-between items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 px-2.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-black uppercase tracking-widest border border-secondary/20">
                Growmarket Pro
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            </div>
            <h1 className="font-display text-5xl font-black text-primary tracking-tighter">
              Hello, {user.name.split(" ")[0]}
            </h1>
            <p className="text-on-surface-variant font-medium text-lg mt-1 opacity-70">
              Your narrative intelligence dashboard is ready.
            </p>
          </motion.div>
          <div className="flex items-center gap-3">
             <Link href="/schedule" className="p-3 px-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-sm font-bold font-display hover:bg-surface-bright transition-all flex items-center gap-2 shadow-sm">
               <Clock size={16} className="text-on-surface/40" />
               View Calendar
             </Link>
          </div>
        </section>

        {/* Global Search / Gen AI Area */}
        <section className="mb-16">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleGenerateIdea} 
            className="relative group max-w-4xl"
          >
            <div className={`absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-[3rem] blur-xl opacity-10 group-focus-within:opacity-25 transition duration-1000 ${generating ? "opacity-30 animate-pulse" : ""}`} />
            <div className="relative flex items-center bg-white border border-outline-variant/10 rounded-[2.5rem] p-3 pl-8 shadow-2xl overflow-hidden ring-4 ring-primary/5">
               <input 
                  type="text" 
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={generating}
                  placeholder="Drop a seed (e.g. 'Ethical AI Sustainability') and watch our curator refine it..." 
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
                 Curate Idea
               </button>
            </div>
          </motion.form>

          <AnimatePresence>
            {generateError && (
              <motion.div 
                initial={{ opacity:0, y: -10 }} animate={{ opacity:1, y: 0 }} exit={{ opacity:0 }}
                className="mt-4 flex items-center gap-3 px-6 py-4 bg-error-container/10 border border-error/10 rounded-3xl"
              >
                <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error">⚠</div>
                <p className="text-sm text-error font-bold flex-1">{generateError}</p>
                <button onClick={() => setGenerateError(null)} className="text-error/40 hover:text-error">✕</button>
              </motion.div>
            )}

            {demoPost && (
              <motion.div 
                initial={{ opacity:0, scale: 0.95 }} animate={{ opacity:1, scale: 1 }}
                className="mt-8 p-10 bg-gradient-to-br from-surface-bright to-surface-container-low border border-primary/5 rounded-[3rem] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Sparkles size={120} className="text-primary" />
                </div>
                <div className="relative z-10">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">
                    <Sparkles size={14} /> New Insight Curated
                  </span>
                  <h3 className="font-display font-black text-4xl text-primary leading-tight max-w-3xl mb-6">{demoPost.headline}</h3>
                  <div className="flex items-center gap-6">
                    <Link href="/campaigns" className="bg-primary text-white px-8 py-4 rounded-2xl font-display font-black text-xs uppercase tracking-widest hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20">
                      Refine Content
                    </Link>
                    <div className="flex -space-x-3">
                         {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-surface-container-highest border-4 border-white flex items-center justify-center text-[10px] font-black">{i}</div>)}
                         <div className="pl-6 text-[11px] font-bold text-on-surface/40 uppercase tracking-widest py-3">Suggested Iterations</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard label="Total Production" value={String(posts.length)} trend="14.2%" up={true} />
          </motion.div>
          <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard label="Scheduled Reach" value={String(scheduled.length)} trend="0.9%" up={true} />
          </motion.div>
          <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatCard label="Live Impressions" value={String(published.length)} trend={published.length > 0 ? "2.1%" : "0.0%"} up={published.length > 0} />
          </motion.div>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-12 gap-10">
          {/* Recent Feed */}
          <div className="col-span-12 xl:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black font-display text-primary tracking-tight">Recent Narratives</h2>
                <p className="text-sm text-on-surface/40 font-bold uppercase tracking-widest mt-1">Latest curated intelligence</p>
              </div>
              <Link href="/campaigns" className="text-xs font-black uppercase tracking-widest text-secondary group flex items-center gap-2">
                History Hub <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-3xl bg-surface-container-low animate-pulse" />)
              ) : recent.length === 0 ? (
                <TiltCard className="py-24 flex flex-col items-center justify-center text-center">
                  <Globe size={48} strokeWidth={1} className="text-on-surface/10 mb-4" />
                  <p className="text-on-surface/30 font-display font-black uppercase tracking-widest">Awaiting First Insight</p>
                </TiltCard>
              ) : (
                recent.map((post, idx) => (
                  <motion.div 
                    key={post._id} 
                    initial={{ opacity:0, x: -10 }} 
                    animate={{ opacity:1, x: 0 }} 
                    transition={{ delay: idx * 0.05 }}
                    className="group relative flex items-center gap-6 p-5 bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] hover:bg-white transition-all hover:shadow-2xl hover:shadow-primary/5"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-low flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                      {post.generatedImageUrl || post.editedImageUrl ? (
                        <img src={post.editedImageUrl || post.generatedImageUrl} alt={post.headline} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-tr from-primary/5 to-secondary/5 text-primary/20 font-black tracking-tighter italic">AI</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{post.platform}</span>
                        <div className="w-1 h-1 rounded-full bg-on-surface/10" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          post.status === "published" ? "text-emerald-500" :
                          post.status === "scheduled" ? "text-primary" : "text-on-surface/30"
                        }`}>{post.status}</span>
                      </div>
                      <h4 className="font-display font-black text-lg text-primary truncate tracking-tight">{post.headline}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-on-surface/20 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                       <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Link href={`/publish?edit=${post._id}`} className="p-2 rounded-full hover:bg-primary/5 text-primary flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                           Edit <ArrowRight size={12} />
                         </Link>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Network Health 3D */}
          <div className="col-span-12 xl:col-span-4">
             <div className="bg-primary/5 rounded-[3rem] p-10 relative overflow-hidden h-full border border-primary/5">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 blur-[60px] rounded-full" />
                <div className="relative z-10 mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-secondary" />
                    <span className="text-xs font-black text-secondary uppercase tracking-[0.15em]">Network Guard</span>
                  </div>
                  <h3 className="font-display font-black text-3xl text-primary tracking-tight">System Status</h3>
                </div>

                <div className="space-y-6">
                  {["linkedin", "instagram", "facebook", "twitter"].map((plat, i) => {
                    const conn = (socialStatus as any)?.[plat]?.connected;
                    return (
                      <motion.div 
                        key={plat}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-4 group cursor-default"
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-sm transition-all duration-500 ${
                           conn ? "bg-white text-primary shadow-xl shadow-primary/10 rotate-3 group-hover:rotate-0" : "bg-primary/5 text-primary/20"
                         }`}>
                           {plat.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center justify-between">
                             <p className={`font-display font-black text-sm uppercase tracking-wider ${conn ? "text-primary" : "text-primary/20"}`}>{plat}</p>
                             {conn ? <CheckCircle2 size={12} className="text-secondary" /> : <div className="w-1.5 h-1.5 rounded-full bg-primary/10" />}
                           </div>
                           <div className="w-full h-1 bg-primary/5 rounded-full mt-2 overflow-hidden">
                             {conn && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.5 + i*0.1, duration: 2 }} className="h-full bg-secondary" />}
                           </div>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>

                <Link href="/settings" className="mt-12 block py-5 bg-primary text-white text-center rounded-2xl font-display font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Manage Integration Hub
                </Link>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}