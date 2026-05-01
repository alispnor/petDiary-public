import api from "./api";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b !== undefined) binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

/**
 * Registra service worker, pede permissão, faz subscribe e envia ao
 * backend. Retorna `true` se conseguiu, `false` se não há suporte ou o
 * usuário negou.
 *
 * Não bloqueia: falha silenciosa (loga no console).
 */
export async function registerWebPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.warn("[notifications] sw.register falhou:", e);
    return false;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return false;

  // Pega VAPID public key do backend
  let vapidKey = "";
  try {
    const { data } = await api.get<{ vapid_public_key: string }>(
      "/notifications/web-push/vapid-public-key/"
    );
    vapidKey = data.vapid_public_key || "";
  } catch {
    // segue sem chave — em DEV o backend retorna ""
  }
  if (!vapidKey) {
    // Sem VAPID configurado — não dá pra subscribe. Notificações in-app
    // ainda funcionam normalmente (a tela /notifications consulta o
    // backend), só não recebe push real.
    console.info("[notifications] VAPID public key vazia — push real desabilitado");
    return false;
  }

  let subscription: PushSubscription;
  try {
    subscription =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));
  } catch (e) {
    console.warn("[notifications] subscribe falhou:", e);
    return false;
  }

  const json = subscription.toJSON();
  try {
    await api.post("/notifications/devices/register/", {
      platform: "web",
      web_push_endpoint: json.endpoint || subscription.endpoint,
      web_push_p256dh:
        json.keys?.p256dh ||
        arrayBufferToBase64(subscription.getKey("p256dh")),
      web_push_auth:
        json.keys?.auth ||
        arrayBufferToBase64(subscription.getKey("auth")),
    });
    return true;
  } catch (e) {
    console.warn("[notifications] register backend falhou:", e);
    return false;
  }
}

export async function unregisterWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await api.post("/notifications/devices/unregister/", {
      web_push_endpoint: sub.endpoint,
    });
    await sub.unsubscribe();
  } catch {
    // ignora
  }
}
