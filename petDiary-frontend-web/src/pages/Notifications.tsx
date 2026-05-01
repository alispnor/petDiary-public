import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { AppNotification, NotificationType } from "../types";

const TYPE_ICON: Record<NotificationType, string> = {
  VACCINE: "💉",
  VET_RETURN: "🏥",
  PAYMENT_DUE: "💳",
  PAYMENT_OK: "✅",
  PIN_GENERATED: "🔑",
  VET_ACCESS_CLAIMED: "🩺",
  SYSTEM: "📢",
};

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString();
}

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ results: AppNotification[] }>(
        "/notifications/?page_size=50"
      );
      setItems(data.results);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTap = async (n: AppNotification) => {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read/`);
        setItems((prev) =>
          prev.map((it) =>
            it.id === n.id
              ? { ...it, is_read: true, read_at: new Date().toISOString() }
              : it
          )
        );
      } catch {}
    }
    const screen = n.data?.screen;
    if (screen === "Subscription") navigate("/conta");
    else if (screen === "PetDashboard" && n.data?.petId) {
      navigate(`/clinical/${n.data.petId}`);
    } else if (screen === "PetDashboard") {
      navigate("/tutor");
    }
  };

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await api.post("/notifications/read-all/");
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((it) => ({ ...it, is_read: true, read_at: now }))
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (n: AppNotification) => {
    if (!confirm(`Excluir “${n.title}”?`)) return;
    try {
      await api.delete(`/notifications/${n.id}/`);
      setItems((prev) => prev.filter((it) => it.id !== n.id));
    } catch {
      alert("Não foi possível excluir.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Limpar todas as notificações? Esta ação não pode ser desfeita."))
      return;
    setBusy(true);
    try {
      await api.delete("/notifications/clear-all/");
      setItems([]);
    } finally {
      setBusy(false);
    }
  };

  const hasUnread = items.some((it) => !it.is_read);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/tutor"
            className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
          >
            ← {t("common.back", "Voltar")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            🔔 {t("notifications.title", "Notificações")}
          </h1>
        </div>
        {(hasUnread || items.length > 0) && (
          <div className="flex gap-2">
            {hasUnread && (
              <button
                onClick={handleMarkAll}
                disabled={busy}
                className="rounded-md bg-brand-teal/10 px-3 py-1.5 text-sm font-semibold text-brand-teal hover:bg-brand-teal/20 disabled:opacity-50"
              >
                ✓ {t("notifications.mark_all", "Marcar todas lidas")}
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={busy}
                className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                🗑 {t("notifications.clear_all", "Limpar tudo")}
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-5xl">🔔</div>
          <h2 className="mt-3 text-lg font-bold text-gray-700">
            {t("notifications.empty_title", "Sem notificações")}
          </h2>
          <p className="mt-2 mx-auto max-w-md text-sm text-gray-500">
            {t(
              "notifications.empty_text",
              "Você verá aqui lembretes de vacina, retorno ao vet, vencimento de pagamento e quando algum vet acessar o prontuário."
            )}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                n.is_read
                  ? "border-gray-200 bg-white"
                  : "border-brand-teal/40 bg-brand-teal/5"
              }`}
            >
              <button
                className="flex flex-1 items-start gap-3 text-left"
                onClick={() => handleTap(n)}
              >
                <span className="text-2xl">{TYPE_ICON[n.type] || "📢"}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatRelative(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand-orange" />
                )}
              </button>
              <button
                onClick={() => handleDelete(n)}
                title="Excluir"
                className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
