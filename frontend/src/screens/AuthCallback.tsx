import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import { STORAGE_KEYS } from "../lib/constants";

export function AuthCallback() {
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Claim guest data if a local UUID exists
        const guestUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (guestUserId) {
          try {
            await api.claimProfile(guestUserId);
          } catch {
            // Ignore claim errors — user can still proceed
          }
          localStorage.removeItem(STORAGE_KEYS.USER_ID);
        }

        // Small delay to let AuthProvider's onAuthStateChange settle
        await new Promise((r) => setTimeout(r, 100));

        // Check if profile exists to determine new vs returning user
        try {
          const profile = await api.getProfile();
          if (profile) {
            navigate("/app", { replace: true });
          } else {
            navigate("/onboarding", { replace: true });
          }
        } catch {
          navigate("/onboarding", { replace: true });
        }
      } else {
        navigate("/auth", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
        <p className="font-data text-[12px] text-stone/50">Signing you in…</p>
      </div>
    </div>
  );
}
