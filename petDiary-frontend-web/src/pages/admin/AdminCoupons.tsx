import { useEffect, useState, type FormEvent } from "react";
import api from "../../services/api";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  is_valid: boolean;
  created_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [validUntil, setValidUntil] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await api.get<{ results?: Coupon[] } | Coupon[]>("/admin/coupons/");
    const list = Array.isArray(data) ? data : (data.results ?? []);
    setCoupons(list);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/admin/coupons/", {
        code: code.trim().toUpperCase(),
        discount_percent: Number(discount),
        valid_until: new Date(validUntil + "T23:59:59").toISOString(),
        max_uses: Number(maxUses),
        is_active: true,
      });
      setCode(""); setDiscount("20"); setValidUntil(""); setMaxUses("100");
      await load();
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    await api.post(`/admin/coupons/${id}/deactivate/`);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Cupons</h1>

      <form onSubmit={handleCreate} className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-700">+ Criar cupom</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input type="text" placeholder="Código (ex: NATAL30)" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="% desconto" value={discount}
            onChange={(e) => setDiscount(e.target.value)} min="1" max="100" required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)} required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="Limite de usos" value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)} min="1" required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={creating} className="mt-3 btn-primary px-6">
          {creating ? "Criando…" : "Criar cupom"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Válido até</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum cupom criado ainda.
                </td>
              </tr>
            ) : coupons.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-mono font-semibold text-brand-teal">{c.code}</td>
                <td className="px-4 py-2">{c.discount_percent}%</td>
                <td className="px-4 py-2 text-xs">{c.current_uses}/{c.max_uses}</td>
                <td className="px-4 py-2 text-xs">{new Date(c.valid_until).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">
                  {c.is_valid ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Ativo</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {c.is_active && (
                    <button
                      onClick={() => handleDeactivate(c.id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Desativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
