import { useEffect, useState, type FormEvent } from "react";
import api from "../../services/api";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string;
  max_uses: number;
  max_per_user: number;
  current_uses: number;
  is_active: boolean;
  is_valid: boolean;
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  discount_percent: number;
  final_price_brl: string;
  redeemed_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [validUntil, setValidUntil] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [maxPerUser, setMaxPerUser] = useState("1");
  const [creating, setCreating] = useState(false);

  const [reportFor, setReportFor] = useState<Coupon | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

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
        max_per_user: Number(maxPerUser),
        is_active: true,
      });
      setCode(""); setDiscount("20"); setValidUntil("");
      setMaxUses("100"); setMaxPerUser("1");
      await load();
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    await api.post(`/admin/coupons/${id}/deactivate/`);
    await load();
  };

  const handleViewReport = async (coupon: Coupon) => {
    setReportFor(coupon);
    setLoadingReport(true);
    try {
      const { data } = await api.get<{ redemptions: Redemption[] }>(
        `/admin/coupons/${coupon.id}/redemptions/`
      );
      setRedemptions(data.redemptions);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Cupons</h1>

      <form onSubmit={handleCreate} className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-700">+ Criar cupom</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input type="text" placeholder="Código" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="% desconto" value={discount}
            onChange={(e) => setDiscount(e.target.value)} min="1" max="100" required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)} required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="Total de usos" value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)} min="1" required
            title="Quantidade total de usos do cupom (todos usuários somados)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input type="number" placeholder="Por usuário" value={maxPerUser}
            onChange={(e) => setMaxPerUser(e.target.value)} min="1" required
            title="Cada usuário pode usar este cupom no máximo X vezes"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          <b>Total de usos</b> = soma de todos os resgates · <b>Por usuário</b> = limite individual
        </p>
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
              <th className="px-4 py-3">Usos (total / por user)</th>
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
                <td className="px-4 py-2 text-xs">
                  {c.current_uses}/{c.max_uses} · max {c.max_per_user}/user
                </td>
                <td className="px-4 py-2 text-xs">{new Date(c.valid_until).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">
                  {c.is_valid ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Ativo</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-2 flex gap-1">
                  <button
                    onClick={() => handleViewReport(c)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    📊 Relatório
                  </button>
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

      {/* Modal de relatório */}
      {reportFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setReportFor(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl my-auto max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  📊 Relatório de uso — <span className="font-mono text-brand-teal">{reportFor.code}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {reportFor.discount_percent}% off · {reportFor.current_uses}/{reportFor.max_uses} usos totais
                </p>
              </div>
              <button onClick={() => setReportFor(null)}
                className="text-2xl text-gray-400 hover:text-gray-600">×</button>
            </div>

            {loadingReport ? (
              <p className="text-center text-gray-400 py-8">Carregando…</p>
            ) : redemptions.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Este cupom ainda não foi usado por ninguém.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Usuário</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Desconto</th>
                    <th className="px-3 py-2">Pago</th>
                    <th className="px-3 py-2">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium">{r.user_name}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{r.user_email}</td>
                      <td className="px-3 py-2">{r.discount_percent}%</td>
                      <td className="px-3 py-2">R$ {r.final_price_brl}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {new Date(r.redeemed_at).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
