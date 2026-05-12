import { Bell, LogOut, Search, Eye, EyeOff, Building2 } from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  userName?: string;
  balance?: number;
  greeting?: string;
}

export function AppHeader({ userName = "علي", balance = 377000, greeting = "صباح الخير" }: AppHeaderProps) {
  const [visible, setVisible] = useState(true);
  const now = new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-6 pb-20 relative shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button aria-label="خروج" className="p-2 rounded-xl hover:bg-white/10 transition">
            <LogOut className="w-5 h-5" />
          </button>
          <button aria-label="إشعارات" className="p-2 rounded-xl hover:bg-white/10 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-crimson rounded-full" />
          </button>
          <button aria-label="بحث" className="p-2 rounded-xl hover:bg-white/10 transition">
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs opacity-80 flex items-center gap-1 justify-end">
              <span>☀</span> {greeting},
            </div>
            <div className="font-bold text-lg">{userName}</div>
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
            {visible ? balance.toLocaleString("en-US") : "••••••"}
            <span className="text-base font-medium opacity-80 mr-1">ر.ي</span>
          </span>
          <button onClick={() => setVisible(v => !v)} aria-label="إظهار الرصيد" className="opacity-80 hover:opacity-100">
            {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-[11px] opacity-60 mt-2">{now}</div>
      </div>
    </header>
  );
}
