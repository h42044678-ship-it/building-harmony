import { supabase } from "@/integrations/supabase/client";
import { dataActions } from "@/store/data";

let currentUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedJson = "";
let pulling = false;
let hydrated = false; // true after first successful pull/push handshake

const PENDING_KEY = "aqari-pending-sync";

function setPending(v: boolean) {
  try { localStorage.setItem(PENDING_KEY, v ? "1" : "0"); } catch {}
}
function isPending() {
  try { return localStorage.getItem(PENDING_KEY) === "1"; } catch { return false; }
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

async function pull(userId: string) {
  // If there are unsynced local (offline) changes, DO NOT overwrite them
  // with the cloud copy — push local up instead so nothing is lost.
  if (isPending()) {
    await pushNow(userId);
    hydrated = true;
    return;
  }
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
        const json = JSON.stringify(data.data);
        dataActions.importData(json);
        lastPushedJson = json;
      } catch (e) { console.warn("import failed", e); }
    } else {
      // no cloud row yet — push current local state
      await pushNow(userId);
    }
  } finally {
    pulling = false;
    hydrated = true;
  }
}

function schedulePush() {
  if (!currentUserId || pulling) return;
  // Mark pending immediately so that if the app is closed before the debounced
  // push flushes, the next launch will still know local has unsynced changes.
  if (hydrated) setPending(true);
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { if (currentUserId) pushNow(currentUserId); }, 1500);
}

export function initCloudSync() {
  if (typeof window === "undefined") return;

  window.addEventListener("aqari-data-changed", schedulePush);
  window.addEventListener("online", () => {
    if (currentUserId && isPending()) pushNow(currentUserId);
  });
  setInterval(() => {
    if (currentUserId && isPending() && navigator.onLine) pushNow(currentUserId);
  }, 30000);

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      currentUserId = session.user.id;
      pull(currentUserId).then(() => {
        if (currentUserId && isPending() && navigator.onLine) pushNow(currentUserId);
      });
    }
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.user) {
      if (currentUserId !== session.user.id) {
        currentUserId = session.user.id;
        hydrated = false;
        pull(currentUserId).then(() => {
          if (currentUserId && isPending() && navigator.onLine) pushNow(currentUserId);
        });
      }
    } else {
      currentUserId = null;
      hydrated = false;
    }
  });
}
