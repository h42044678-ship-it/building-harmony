import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { QuickServices } from "@/components/QuickServices";
import { BuildingView } from "@/components/BuildingView";
import { SearchBar } from "@/components/SearchBar";
import { QuickActions } from "@/components/QuickActions";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <MobileShell>
      <AppHeader />
      <QuickServices />
      <SearchBar />
      <BuildingView />
      <QuickActions />
    </MobileShell>
  );
}
