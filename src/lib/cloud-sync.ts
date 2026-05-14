import { supabase } from "@/integrations/supabase/client";
import { dataActions, type AppData } from "@/store/data";

let currentUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedJson = "";
let pulling = false;

const PENDING_KEY = "aqari-pending-sync";

function setPending(v: boolean) {
  try { localStorage.setItem(PENDING_KEY, v ? "1" : "0"); } catch {}
}
function isPending() {
  try { return localStorage.getItem(PENDING_KEY) === "1"; } catch { return false; }
}

async function pull(userId: string) {
  pulling = true;
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) { console.warn("pull failed", error); return; }
    if (data?.data) {
      try {
        dataActions.importData(JSON.stringify(data.data));
        lastPushedJson = JSON.stringify(data.data);
      } catch (e) { console.warn("import failed", e); }
    } else {
      // no cloud row yet — push current local state
      await pushNow(userId);
    }
  } finally {
    pulling = false;
  }
}

async function pushNow(userId: string) {
  const json = dataActions.exportData();
  if (json === lastPushedJson) { setPending(false); return; }
  if (!navigator.onLine) { setPending(true); return; }
  const { error } = await supabase
    .from("user_data")
    .upsert({ user_id: userId, data: JSON.parse(json), updated_at: new Date().toISOString() });
  if (error) {
    console.warn("push failed", error);
    setPending(true);
  } else {
    lastPushedJson = json;
    setPending(false);
  }
}

function schedulePush() {
  if (!currentUserId || pulling) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { if (currentUserId) pushNow(currentUserId); }, 1500);
}

export function initCloudSync() {
  if (typeof window === "undefined") return;

  // listen to data changes
  window.addEventListener("aqari-data-changed", schedulePush);
  // back online — flush
  window.addEventListener("online", () => {
    if (currentUserId && isPending()) pushNow(currentUserId);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      currentUserId = session.user.id;
      pull(currentUserId);
    }
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.user) {
      if (currentUserId !== session.user.id) {
        currentUserId = session.user.id;
        pull(currentUserId);
      }
    } else {
      currentUserId = null;
    }
  });
}
