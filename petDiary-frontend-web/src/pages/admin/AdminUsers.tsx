import { useEffect, useState } from "react";
import api from "../../services/api";

interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  plan_type: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (q: string = "") => {
    setLoading(true);
    try {
      const { data } = await api.get<{ results: AdminUser[] }>(
        "/admin/users/", { params: q ? { q } : {} }
      );
      setUsers(data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">👥 Usuários</h1>
        <input
          type="text"
          placeholder="Buscar nome, email, username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
          className="w-80 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cadastrado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-800">{u.full_name}</div>
                    <div className="text-xs text-gray-400">@{u.username}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{u.email || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      u.role === "VET" ? "bg-brand-orange/15 text-brand-orange" :
                      "bg-brand-teal/15 text-brand-teal"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.plan_type === "PRO" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.plan_type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {u.is_active ? (
                      <span className="text-green-600">●</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-400">
                    {new Date(u.date_joined).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
