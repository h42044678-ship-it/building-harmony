import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { supabase } from "@/integrations/supabase/client";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      if (!session && location.pathname !== "/auth") {
        navigate({ to: "/auth" });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        navigate({ to: "/auth" });
      } else {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/40">
        <div className="text-navy text-sm font-semibold opacity-70">جارٍ التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-24 shadow-elevated">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
