import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BuildingView } from "@/components/BuildingView";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <MobileShell>
      <AppHeader />
      <BuildingView />
    </MobileShell>
  );
}
