// Registers the PWA service worker, with guards for Lovable preview iframes.
export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  let isInIframe = false;
  try { isInIframe = window.self !== window.top; } catch { isInIframe = true; }

  const host = window.location.hostname;
  const isPreviewHost = host.includes("lovableproject.com") || host.includes("id-preview--");

  if (isInIframe || isPreviewHost) {
    // unregister any leftover SW in preview/iframe
    navigator.serviceWorker.getRegistrations?.().then((regs) => regs.forEach((r) => r.unregister()));
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW register failed", e));
  });
}
