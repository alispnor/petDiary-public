import { useEffect, useState, type FormEvent } from "react";
import api from "../services/api";
import type { Reminder, ReminderType } from "../types";

const TYPE_META: Record<ReminderType, { icon: string; label: string }> = {
  VACCINE: { icon: "💉", label: "Vacina" },
  VET_RETURN: { icon: "🏥", label: "Retorno ao vet" },
  CUSTOM: { icon: "📌", label: "Personalizado" },
};

function formatDue(dateISO: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateISO + "T00:00:00");
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return `venceu há ${Math.abs(diffDays)} dia(s)`;
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "amanhã";
  if (diffDays <= 7) return `em ${diffDays} dias`;
  return new Date(dateISO).toLocaleDateString();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  petId: string;
  petName: string;
}

export default function RemindersSection({ petId, petName }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ReminderType>("VACCINE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateDue, setDateDue] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Reminder[]>(`/pets/${petId}/reminders/`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setType("VACCINE");
    setTitle("");
    setDescription("");
    setDateDue(todayISO());
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.post(`/pets/${petId}/reminders/`, {
        type,
        title: title.trim(),
        description: description.trim(),
        date_due: dateDue,
      });
      reset();
      await load();
    } catch {
      alert("Não foi possível criar o lembrete.");
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async (r: Reminder) => {
    if (!confirm(`Marcar “${r.title}” como resolvido?`)) return;
    try {
      await api.post(`/reminders/${r.id}/dismiss/`);
      await load();
    } catch {
      alert("Não foi possível marcar como resolvido.");
    }
  };

  const handleDelete = async (r: Reminder) => {
    if (!confirm(`Excluir lembrete “${r.title}”?`)) return;
    try {
      await api.delete(`/reminders/${r.id}/`);
      setItems((prev) => prev.filter((it) => it.id !== r.id));
    } catch {
      alert("Não foi possível excluir.");
    }
  };

  const activeCount = items.filter((r) => r.is_active).length;

  return (
    <div className="border-t border-gray-100 mt-3 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-600 hover:text-gray-800"
      >
        <span>
          🔔 {activeCount > 0 ? `${activeCount} lembrete(s) ativo(s)` : "Lembretes"}
        </span>
        <span className="text-gray-400">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="mt-3">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-md bg-brand-teal/10 px-3 py-1.5 text-xs font-semibold text-brand-teal hover:bg-brand-teal/20"
            >
              + Novo lembrete
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 mb-3">
              <div className="flex gap-2">
                {(Object.keys(TYPE_META) as ReminderType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                      type === t
                        ? "bg-brand-teal text-white"
                        : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    {TYPE_META[t].icon} {TYPE_META[t].label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder={`Ex.: V10 anual, retorno do exame…`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={140}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <input
                type="date"
                value={dateDue}
                onChange={(e) => setDateDue(e.target.value)}
                required
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-pill bg-gray-100 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex-1 rounded-pill bg-brand-teal py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-2 text-xs text-gray-400">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="py-2 text-xs text-gray-500 italic">
              Nenhum lembrete para {petName}. Toque em “+ Novo lembrete” para
              agendar uma vacina, retorno ao vet ou outro evento.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-start gap-2 rounded-md border p-2 ${
                    r.is_active
                      ? "border-amber-200 bg-amber-50"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <span className="text-xl">{TYPE_META[r.type].icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDue(r.date_due)} ·{" "}
                      <span className="text-gray-400">
                        {new Date(r.date_due).toLocaleDateString()}
                      </span>
                    </p>
                    {r.description && (
                      <p className="mt-1 text-xs text-gray-600">
                        {r.description}
                      </p>
                    )}
                    {r.notified_at && (
                      <p className="mt-1 text-[10px] text-green-700">
                        ✓ Notificação enviada
                      </p>
                    )}
                    {r.dismissed_at && (
                      <p className="mt-1 text-[10px] text-gray-500">
                        ✓ Resolvido
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {r.is_active && (
                      <button
                        type="button"
                        onClick={() => handleDismiss(r)}
                        title="Marcar como resolvido"
                        className="rounded-md bg-green-100 px-2 py-0.5 text-xs text-green-700 hover:bg-green-200"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      title="Excluir"
                      className="rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
