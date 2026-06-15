"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { 
  Zap, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Layers,
  MousePointer2,
  Cpu,
  Fingerprint,
  Radio,
  Globe,
  BarChart3
} from "lucide-react";

/* ─── Magnetic Button Component ─────────────────────────────── */
function MagneticButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouse(e: React.MouseEvent) {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.35);
    y.set((clientY - centerY) * 0.35);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  
  const yHero = useTransform(scrollYProgress, [0, 0.4], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.94]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-surface-bright text-primary selection:bg-secondary selection:text-white overflow-x-hidden">
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0], x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -left-[5%] w-[50%] h-[60%] bg-primary/[0.04] blur-[150px] rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 0], x: [0, -60, 0], y: [0, -30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -right-[15%] w-[60%] h-[70%] bg-secondary/[0.05] blur-[200px] rounded-full"
        />
      </div>

      {/* Modern Grid Navigation */}
      <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none px-6">
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="pointer-events-auto w-full max-w-7xl h-20 bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-glass px-8 lg:px-12 flex items-center justify-between"
        >
          <div className="grid grid-cols-2 lg:grid-cols-3 items-center h-full w-full">
            {/* Left: Logo */}
            <div className="flex justify-start">
               <Link href="/" className="flex items-center gap-3 group">
                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-black text-xl shadow-lg transition-transform group-hover:rotate-6">G</div>
                 <span className="text-xl font-display font-black tracking-tighter text-primary">GrowMarket</span>
               </Link>
            </div>
            
            {/* Center: Links */}
            <div className="hidden lg:flex justify-center items-center gap-10">
              {["Mechanism", "Intelligence", "Analytics", "Network"].map((item) => (
                <Link key={item} href={`#${item.toLowerCase()}`} className="text-xs font-black uppercase tracking-[0.2em] text-primary/30 hover:text-primary transition-all hover:tracking-[0.3em]">{item}</Link>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex justify-end items-center gap-6 lg:gap-8">
              <Link href="/login" className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-colors">Sign In</Link>
              <MagneticButton>
                <Link href="/register" className="bg-primary text-white px-8 py-4 rounded-[2rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/25 hover:bg-primary/95 transition-all block whitespace-nowrap">
                  Experience the engine
                </Link>
              </MagneticButton>
            </div>
          </div>
        </motion.nav>
      </div>

      <main className="relative z-10 pt-64 lg:pt-80 px-10 xl:px-20 min-h-screen flex flex-col items-center">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: yHero }}
          className="max-w-7xl w-full text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-secondary/5 border border-secondary/10 mb-12"
          >
            <Radio size={14} className="text-secondary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">Autonomous Narrative Generation v2.5</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl lg:text-[11rem] font-display font-black tracking-tighter text-primary leading-[0.82] mb-12"
          >
            Data <span className="text-secondary italic">Refined</span><br />
            into Narrative.
          </motion.h1>

          <motion.p className="max-w-3xl mx-auto text-on-surface-variant text-xl lg:text-3xl font-medium opacity-50 font-body leading-[1.2] mb-20">
            The world&apos;s most advanced social intelligence engine. <br className="hidden lg:block"/>
            We don&apos;t just post content—we curate impact through high-fidelity automation.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 mb-40">
            <MagneticButton>
              <Link href="/register" className="group relative bg-primary text-white px-14 py-7 rounded-[2rem] font-display font-black text-xs uppercase tracking-[0.25em] flex items-center gap-4 overflow-hidden shadow-2xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <span className="relative z-10">Initialize Engine</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform duration-500" />
              </Link>
            </MagneticButton>
            <Link href="#mechanism" className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 hover:text-primary transition-all flex items-center gap-3">
              Explore the Mechanism <ChevronRight size={14} />
            </Link>
          </div>

          {/* Visual UI Preview */}
          <motion.div className="w-full max-w-7xl relative mx-auto group perspective-2000">
            <div className="aspect-[21/9] rounded-[4.5rem] bg-gradient-to-br from-white/80 to-surface-container-low/40 border border-white/40 shadow-glass backdrop-blur-2xl relative overflow-hidden">
               <div className="absolute inset-0 p-6">
                  <div className="w-full h-full rounded-[3.8rem] bg-gradient-to-b from-white to-surface-container-low border border-outline-variant/10 shadow-inner flex items-center justify-center gap-12 relative overflow-hidden">
                     {[0,1,2,3].map(i => (
                       <motion.div key={i} animate={{ height: [200, 300, 200] }} transition={{ duration: 4+i, repeat: Infinity }} className="w-44 rounded-[2rem] bg-gradient-to-t from-primary/5 to-secondary/5 border border-primary/5" />
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Features */}
      <section id="mechanism" className="py-60 px-10 max-w-7xl mx-auto">
         <div className="text-center mb-32">
            <h2 className="text-6xl lg:text-9xl font-display font-black tracking-tighter text-primary leading-[0.9]">Intelligence <br /> Multiplied.</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Autonomous Refinement", icon: Cpu },
              { title: "Cross-Network Sync", icon: Globe },
              { title: "Real-time Benchmarking", icon: BarChart3 }
            ].map((f, i) => (
              <div key={i} className="p-12 rounded-[3.5rem] bg-surface-container-low/40 border border-primary/[0.03] hover:shadow-glass hover:bg-white transition-all">
                 <div className="w-16 h-16 rounded-2xl bg-secondary text-white flex items-center justify-center mb-10"><f.icon size={28} /></div>
                 <h3 className="text-3xl font-display font-black text-primary mb-5">{f.title}</h3>
                 <p className="text-on-surface-variant font-medium text-lg opacity-60">Engineered for absolute impact and brand integrity.</p>
              </div>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-10 bg-white border-t border-primary/[0.03]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-[10px] font-black">G</div>
            <span className="text-xl font-display font-black tracking-tighter">GrowMarket</span>
          </div>
          <div className="flex items-center gap-10">
            {["Privacy", "Terms", "Security", "Ethics"].map(l => (
              <a key={l} href="#" className="text-xs font-black uppercase tracking-[0.2em] text-primary/30 hover:text-primary transition-all">{l}</a>
            ))}
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/10">© 2026 Space-Age Narrative Intelligence Corp.</p>
        </div>
      </footer>
    </div>
  );
}