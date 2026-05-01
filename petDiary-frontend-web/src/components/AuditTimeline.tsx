import { useEffect, useState } from "react";
import api from "../services/api";
import type { AuditAction, AuditEntry, PaginatedResponse } from "../types";

interface Props {
  petId: string;
}

const ACTION_ICON: Record<AuditAction, string> = {
  CREATE: "✏️",
  UPDATE: "📝",
  DELETE: "🗑",
  REVOKE: "🚫",
  CLAIM: "🔑",
};

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Excluiu",
  REVOKE: "Revogou",
  CLAIM: "Acessou",
};

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  TUTOR: { label: "Tutor", cls: "bg-brand-teal/10 text-brand-teal" },
  VET: { label: "Veterinário", cls: "bg-brand-orange/10 text-brand-orange" },
  SYSTEM: { label: "Sistema", cls: "bg-gray-200 text-gray-600" },
  "": { label: "—", cls: "bg-gray-100 text-gray-500" },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.floor((now - t) / 1000);

  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return formatDateTime(iso);
}

export default function AuditTimeline({ petId }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<PaginatedResponse<AuditEntry>>(
          `/pets/${petId}/audit/`,
          { params: { page_size: 100 } }
        );
        if (!cancelled) setEntries(data.results);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o histórico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [petId]);

  if (loading) {
    return <p className="text-center text-sm text-gray-400">Carregando histórico…</p>;
  }

  if (error) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400">
        Nenhuma alteração registrada ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((e) => {
        const role = ROLE_BADGE[e.actor_role_snapshot] ?? ROLE_BADGE[""]!;
        return (
          <li
            key={e.id}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 hover:bg-gray-50"
          >
            <div className="shrink-0 text-2xl">{ACTION_ICON[e.action] ?? "•"}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800">
                  {e.actor_name_snapshot}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${role.cls}`}>
                  {role.label}
                </span>
                <span className="text-sm text-gray-500">
                  {ACTION_LABEL[e.action]} <span className="font-medium text-gray-600">{e.entity_type}</span>
                </span>
              </div>
              {e.description && (
                <p className="mt-1 text-sm text-gray-600">{e.description}</p>
              )}
              <p
                className="mt-1 text-xs text-gray-400"
                title={formatDateTime(e.created_at)}
              >
                {formatRelative(e.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
