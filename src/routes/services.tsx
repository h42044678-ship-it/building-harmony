import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { QuickActions } from "@/components/QuickActions";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "الخدمات — عمارة المنصور" }] }),
  component: () => (
    <MobileShell>
      <header className="bg-gradient-navy text-navy-foreground header-curve px-5 pt-8 pb-10 text-center shadow-elevated">
        <h1 className="text-xl font-extrabold">الخدمات</h1>
        <p className="text-xs opacity-75 mt-1">جميع الخدمات والإجراءات</p>
      </header>
      <QuickActions />
    </MobileShell>
  ),
});
