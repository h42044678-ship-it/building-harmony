import { BottomNav } from "./BottomNav";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-24 shadow-elevated">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
