"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

/**
 * Header User Menu (Supabase magic-link)
 * - "Hi <name>" (subtle) · Profile · Sign out  (when logged in)
 * - Profile · Sign in  (when logged out)
 * Uses a shared Supabase client to keep server and client sessions consistent.
 */

export default function UserMenu() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Extract a readable name from session
  const labelFrom = (sess?: Session | null) => {
    const user = sess?.user;
    if (!user) return null;
    const meta: any = user.user_metadata || {};
    return (
      meta.full_name ||
      meta.name ||
      (user.email ? String(user.email).split("@")[0] : null)
    );
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let destroyed = false;

    async function init() {
      // 1. Initial user fetch
      const { data, error } = await supabase.auth.getUser();
      if (!destroyed) {
        if (!error && data?.user) {
          setName(
            labelFrom({
              user: data.user,
              access_token: "",
              token_type: "bearer",
              expires_in: 0,
              refresh_token: "",
              provider_token: null,
            } as any)
          );
        } else {
          setName(null);
        }
        setLoaded(true);
      }

      // 2. Subscribe to auth state changes
      const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
        if (destroyed) return;

        if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
          setName(labelFrom(sess));
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          setName(null);
          router.refresh();
        }
      });

      unsub = () => listener.subscription.unsubscribe();
    }

    init();
    return () => {
      destroyed = true;
      if (unsub) unsub();
    };
  }, [router]);

  if (!loaded) return <span className="text-sm text-gray-400">…</span>;

  // ---- Sign Out ----
  async function handleSignOut() {
    try {
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      await supabase.auth.signOut();
    }
    // Hard reload guarantees cleared cookies + fresh state
    window.location.replace("/");
  }

  // ---- Logged In ----
  if (name) {
    return (
      <div className="flex items-center gap-6">
        {/* Soft greeting, not clickable */}
        <span className="text-sm text-gray-500 italic whitespace-nowrap select-none">
          Hi {name}
        </span>

        <Link
          href="/profile"
          className="text-sm text-gray-800 hover:underline"
        >
          Profile
        </Link>

        <button
          onClick={handleSignOut}
          className="text-sm text-gray-800 hover:text-red-600"
        >
          Sign out
        </button>
      </div>
    );
  }

  // ---- Logged Out ----
  return (
    <div className="flex items-center gap-6">
      <Link
        href="/profile"
        className="text-sm text-gray-800 hover:underline"
      >
        Profile
      </Link>
      <Link
        href="/profile"
        className="text-sm text-gray-800 hover:underline"
      >
        Sign in
      </Link>
    </div>
  );
}
