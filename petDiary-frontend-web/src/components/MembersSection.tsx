import { useEffect, useState } from "react";
import api from "../services/api";
import type { PetMember } from "../types";
import InviteMemberModal from "./InviteMemberModal";

interface Props {
  petId: string;
  petName: string;
  /** ID do user logado, para destacar/proteger contra auto-remoção. */
  currentUserId: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

export default function MembersSection({ petId, petName, currentUserId }: Props) {
  const [members, setMembers] = useState<PetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const [confirmRemove, setConfirmRemove] = useState<PetMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PetMember[]>(`/pets/${petId}/members/`);
      setMembers(data);
    } catch {
      // silencia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const isOwner = members.some(
    (m) => m.user.id === currentUserId && m.role === "OWNER"
  );

  const handleInvited = (newMember: PetMember, creds: { username: string; password: string }) => {
    setMembers((prev) => [newMember, ...prev]);
    setShowInvite(false);
    setCredentials(creds);
  };

  const handleRemove = async (member: PetMember) => {
    setRemoving(true);
    setError("");
    try {
      await api.delete(`/pets/${petId}/members/${member.id}/`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setConfirmRemove(null);
    } catch {
      setError("Erro ao remover familiar.");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400">Carregando familiares…</p>
      </div>
    );
  }

  // Filtra OWNERs visualmente (já existem como tutor); destaca caretakers
  const caretakers = members.filter((m) => m.role === "CARETAKER");

  return (
    <>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between text-sm text-gray-700 hover:text-brand-teal"
        >
          <span>
            👨‍👩‍👧 <b>{caretakers.length}</b> familiar{caretakers.length !== 1 ? "es" : ""} com acesso
          </span>
          <span className="text-xs">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="mt-3 flex flex-col gap-2">
            {caretakers.length === 0 && (
              <p className="text-xs text-gray-400">
                Nenhum familiar adicionado. Convide alguém pra ajudar a cuidar do {petName}.
              </p>
            )}

            <ul className="flex flex-col gap-2">
              {caretakers.map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {m.user.full_name}
                        <span className="ml-2 rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-medium text-brand-teal">
                          🤝 Familiar
                        </span>
                      </p>
                      <p className="truncate text-xs text-gray-500">{m.user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Adicionado em {formatDate(m.added_at)}
                      </p>
                    </div>
                    {isOwner && m.user.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(m)}
                        className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        🚫 Remover
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="mt-2 w-full rounded-pill border-2 border-brand-teal py-2 text-sm font-semibold text-brand-teal transition hover:bg-brand-teal hover:text-white"
              >
                + Convidar familiar
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-1 text-xs text-red-600">{error}</p>
        )}
      </div>

      {/* Modal de convite */}
      {showInvite && (
        <InviteMemberModal
          petId={petId}
          petName={petName}
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
        />
      )}

      {/* Modal de credenciais geradas */}
      {credentials && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setCredentials(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-gray-800">
              Familiar convidado!
            </h2>
            <p className="mb-4 text-center text-sm text-gray-500">
              Compartilhe estas credenciais com a pessoa. Ela vai trocar a senha
              no primeiro acesso.
            </p>

            <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Usuário:</span>
                <span className="font-bold">{credentials.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Senha temp:</span>
                <span className="font-bold">{credentials.password}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Usuário: ${credentials.username}\nSenha: ${credentials.password}`
                  );
                }}
                className="flex-1 rounded-pill border-2 border-brand-teal py-2.5 text-sm font-semibold text-brand-teal hover:bg-brand-teal hover:text-white"
              >
                Copiar
              </button>
              <button
                type="button"
                onClick={() => setCredentials(null)}
                className="flex-1 btn-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de remoção */}
      {confirmRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => !removing && setConfirmRemove(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
              🚫
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-gray-800">
              Remover familiar?
            </h2>
            <p className="mb-2 text-center text-sm text-gray-600">
              <b>{confirmRemove.user.full_name}</b> não vai mais conseguir acessar o
              prontuário do {petName}.
            </p>
            <p className="mb-6 text-center text-xs text-gray-400">
              ✓ Os registros que essa pessoa adicionou continuam no histórico.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                disabled={removing}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRemove(confirmRemove)}
                disabled={removing}
                className="flex-1 rounded-pill bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {removing ? "Removendo…" : "Confirmar remoção"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
