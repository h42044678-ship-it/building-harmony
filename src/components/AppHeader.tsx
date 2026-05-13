import { Bell, LogOut, Eye, EyeOff, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { computeOverallBalance, useAppData } from "@/store/data";

interface AppHeaderProps {
  balance?: number;
}

function getGreeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
}

export function AppHeader({ balance }: AppHeaderProps) {
  const [visible, setVisible] = useState(true);
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("أهلاً");
  const navigate = useNavigate();
  const data = useAppData();
  const computedBalance = balance ?? computeOverallBalance(data);

  useEffect(() => {
    setGreeting(getGreeting(new Date()));
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
      const display = meta.full_name || meta.name || user?.email?.split("@")[0] || "";
      setUserName(display);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-6 pb-20 relative shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} aria-label="خروج" className="p-2 rounded-xl hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
          </button>
          <button aria-label="إشعارات" className="p-2 rounded-xl hover:bg-white/10 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-crimson rounded-full" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs opacity-80 flex items-center gap-1 justify-end">
              <span>☀</span> {greeting},
            </div>
            <div className="font-bold text-lg min-h-6">{userName || "\u00A0"}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white grid place-items-center shadow-card">
            <Building2 className="w-6 h-6 text-navy" />
          </div>
        </div>
      </div>

      <div className="text-center mt-7">
        <div className="text-xs opacity-75">الرصيد المتاح</div>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {visible ? computedBalance.toLocaleString("en-US") : "••••••"}
            <span className="text-base font-medium opacity-80 mr-1">ر.ي</span>
          </span>
          <button onClick={() => setVisible((v) => !v)} aria-label="إظهار الرصيد" className="opacity-80 hover:opacity-100">
            {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
