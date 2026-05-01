import { useState } from "react";
import api from "../services/api";
import type { ActiveAccess } from "../types";

interface Props {
  petId: string;
  accesses: ActiveAccess[];
  onRevoked: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function VetAccessSection({ petId, accesses, onRevoked }: Props) {
  const list = accesses.filter((a) => a.pet.id === petId);
  const [open, setOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await api.post(`/access/tokens/${tokenId}/revoke/`);
      setConfirmingId(null);
      onRevoked();
    } catch {
      // silencia — caller pode mostrar erro global
    } finally {
      setRevokingId(null);
    }
  };

  if (list.length === 0) {
    return (
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400">
          🩺 Nenhum veterinário com acesso ativo
        </p>
      </div>
    );
  }

  const confirmingItem = list.find((a) => a.id === confirmingId);

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm text-gray-700 hover:text-brand-teal"
      >
        <span>
          🩺 <b>{list.length}</b> veterinário{list.length > 1 ? "s" : ""} com acesso
        </span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="mt-3 flex flex-col gap-2">
          {list.map((acc) => (
            <li
              key={acc.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {acc.vet.full_name}
                  </p>
                  {acc.vet.clinic_name && (
                    <p className="truncate text-xs text-gray-500">
                      {acc.vet.clinic_name}
                      {acc.vet.crmv ? ` · ${acc.vet.crmv}` : ""}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Última visita: {formatDate(acc.last_visit)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmingId(acc.id)}
                  className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  🚫 Revogar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de confirmação de revogação */}
      {confirmingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => !revokingId && setConfirmingId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
              🚫
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-gray-800">
              Revogar acesso?
            </h2>
            <p className="mb-2 text-center text-sm text-gray-600">
              <b>{confirmingItem.vet.full_name}</b>
              {confirmingItem.vet.clinic_name && ` (${confirmingItem.vet.clinic_name})`}
              {" "}não vai mais conseguir ver o prontuário do seu pet.
            </p>
            <p className="mb-6 text-center text-xs text-gray-400">
              ✓ Os registros que ele já adicionou continuam no histórico.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                disabled={revokingId !== null}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRevoke(confirmingItem.id)}
                disabled={revokingId !== null}
                className="flex-1 rounded-pill bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {revokingId ? "Revogando…" : "Confirmar revogação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
