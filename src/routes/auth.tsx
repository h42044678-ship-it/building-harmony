import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Lock, Mail, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — عمارة المنصور" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40 grid place-items-center px-4">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-elevated overflow-hidden">
        <div className="bg-gradient-navy text-navy-foreground header-curve px-6 pt-10 pb-14 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white grid place-items-center shadow-card">
            <Building2 className="w-8 h-8 text-navy" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold">عمارة المنصور</h1>
          <p className="text-xs opacity-80 mt-1">إدارة آمنة لبيانات العقار</p>
        </div>

        <div className="px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-card p-1 grid grid-cols-2 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`py-2 rounded-xl text-sm font-bold transition ${mode === "login" ? "bg-navy text-navy-foreground" : "text-navy/70"}`}
            >
              تسجيل دخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`py-2 rounded-xl text-sm font-bold transition ${mode === "signup" ? "bg-navy text-navy-foreground" : "text-navy/70"}`}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3 pb-6">
            <div className="flex items-center gap-2 bg-secondary/70 rounded-2xl px-4 py-3 border border-border">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                dir="ltr"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2 bg-secondary/70 rounded-2xl px-4 py-3 border border-border">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                dir="ltr"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <div className="text-xs text-crimson bg-crimson/10 rounded-xl px-3 py-2 text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-crimson text-crimson-foreground rounded-2xl py-3 font-bold shadow-crimson active:scale-[.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
