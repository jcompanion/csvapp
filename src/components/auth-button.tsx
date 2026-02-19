"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Mail, Loader2 } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (!error) setSent(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
          {user.email}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs gap-1.5">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="flex items-center gap-2">
        {sent ? (
          <span className="text-xs text-green-600 dark:text-green-400">Check your email ✓</span>
        ) : (
          <>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-8 px-3 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-44 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
            <Button size="sm" onClick={handleLogin} disabled={loading || !email} className="h-8 text-xs bg-gradient-to-r from-orange-500 to-rose-500 text-white">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={() => { setShowLogin(false); setSent(false); }} className="h-8 text-xs">
          ✕
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)} className="text-xs gap-1.5">
      <LogIn className="h-3.5 w-3.5" />
      Sign in
    </Button>
  );
}
