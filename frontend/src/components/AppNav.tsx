"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Megaphone, 
  Send, 
  Calendar, 
  BarChart3, 
  Trophy, 
  Settings,
  Sparkles,
  LogOut,
  Search,
  Plus
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/curator", label: "Strategist", Icon: Sparkles },
  { href: "/campaigns", label: "Campaigns", Icon: Megaphone },
  { href: "/publish", label: "Publish", Icon: Send },
  { href: "/schedule", label: "Schedule", Icon: Calendar },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/competitors", label: "Competitors", Icon: Trophy },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function AppNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Sidebar */}
        <motion.aside 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-8 px-4 z-50 border-r border-outline-variant/5 shadow-2xl shadow-primary/5"
        >
          {/* Brand */}
          <Link href="/dashboard" className="mb-12 px-4 group block cursor-pointer">
            <div className="relative">
              <span className="text-3xl font-display font-black tracking-tighter text-primary block group-hover:scale-[1.02] transition-transform">GrowMarket</span>
              <span className="font-body tracking-[0.25em] text-[11px] font-bold uppercase text-secondary/70 mt-1 block">The Data Curator</span>
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
            {navLinks.map(link => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group flex items-center gap-3 py-3.5 px-4 rounded-2xl transition-all duration-300 font-display tracking-tight text-sm font-semibold"
                >
                  {active && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent border-l-4 border-secondary rounded-2xl z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <span className={`relative z-10 transition-colors duration-300 ${active ? "text-secondary" : "text-on-surface/40 group-hover:text-primary"}`}>
                    <link.Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  </span>
                  
                  <span className={`relative z-10 uppercase text-xs tracking-wide transition-colors duration-300 ${active ? "text-primary font-bold" : "text-on-surface/60 group-hover:text-primary"}`}>
                    {link.label}
                  </span>

                  {active && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 w-1.5 h-1.5 rounded-full bg-secondary shadow-sm shadow-secondary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* New Design CTA */}
          <div className="mt-8 px-2">
            <Link
              href="/publish"
              className="relative group w-full py-4 rounded-2xl bg-primary text-white font-display font-bold tracking-widest text-xs uppercase shadow-xl shadow-primary/20 flex items-center justify-center gap-2 overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Plus size={16} strokeWidth={3} />
              Publish Design
            </Link>
          </div>
        </motion.aside>

        {/* Top App Bar */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 right-0 w-[calc(100%-16rem)] h-20 z-40 bg-surface-bright/40 backdrop-blur-2xl border-b border-outline-variant/10 flex items-center justify-between px-10"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" />
              <input
                className="w-full bg-surface-container-low/50 border border-transparent group-hover:border-outline-variant/20 focus:border-primary/30 rounded-full py-2.5 pl-11 pr-4 text-sm font-body outline-none transition-all text-on-surface placeholder:text-on-surface/30"
                placeholder="Find narratives & insights..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="h-8 w-px bg-outline-variant/10" />
             
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface/30 hover:text-error transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-black font-display text-primary leading-none uppercase tracking-tight">{user.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest leading-none">Premium Curator</p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-20 group-hover:opacity-40 transition" />
                <div className="relative w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-display font-black text-primary text-base border border-white/10 shadow-sm overflow-hidden">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </motion.header>
      </AnimatePresence>
    </>
  );
}

