import { useNavigate } from "react-router-dom";
import type { AccessHistory, AccessStatus } from "../types";

interface Props {
  items: AccessHistory[];
  loading: boolean;
}

const STATUS_LABEL: Record<AccessStatus, string> = {
  ACTIVE: "Ativo",
  EXPIRED: "Expirado",
  REVOKED: "Revogado",
};

const STATUS_CLASS: Record<AccessStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  REVOKED: "bg-red-100 text-red-700",
};

const SPECIES_EMOJI: Record<string, string> = {
  DOG: "🐕",
  CAT: "🐱",
  BIRD: "🐦",
  OTHER: "🐾",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function AccessHistorySidebar({ items, loading }: Props) {
  const navigate = useNavigate();

  const handleClick = (item: AccessHistory) => {
    if (item.status === "ACTIVE") {
      navigate(`/clinical/${item.pet.id}`);
    } else {
      // status badge já indica; apenas feedback discreto
      const reason = item.status === "REVOKED"
        ? "O tutor revogou o seu acesso a este pet."
        : "Seu acesso a este pet expirou. Peça um novo PIN ao tutor.";
      // eslint-disable-next-line no-alert
      alert(reason);
    }
  };

  return (
    <aside className="w-80 shrink-0 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-bold text-gray-800">Pets visitados</h2>
        <p className="mt-1 text-xs text-gray-500">
          Histórico dos PINs que você usou
        </p>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
        {loading ? (
          <p className="px-5 py-6 text-center text-sm text-gray-400">
            Carregando…
          </p>
        ) : items.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-gray-400">
            Nenhum pet visitado ainda. Use um PIN ao lado para começar.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 p-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleClick(item)}
                  className={`w-full rounded-lg p-3 text-left transition ${
                    item.status === "ACTIVE"
                      ? "hover:bg-brand-teal/5 cursor-pointer"
                      : "cursor-default opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-2xl">
                        {SPECIES_EMOJI[item.pet.species] ?? "🐾"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">
                          {item.pet.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          Tutor: {item.tutor.full_name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Última visita: {formatDate(item.last_visit)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
