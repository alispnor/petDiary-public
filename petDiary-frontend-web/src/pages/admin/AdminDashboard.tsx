import { useEffect, useState } from "react";
import api from "../../services/api";

interface Kpis {
  mrr_brl: string;
  total_users: number;
  new_users_30d: number;
  pro_active: number;
  canceled_30d: number;
  churn_rate: number;
  tickets_pending: number;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Kpis>("/admin/kpis/")
      .then(({ data }) => setKpis(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Carregando…</p>;
  if (!kpis) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Resumo</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="💰"
          label="MRR mensal"
          value={`R$ ${kpis.mrr_brl}`}
          accent="text-green-600"
        />
        <KpiCard
          icon="👥"
          label="Usuários totais"
          value={kpis.total_users.toString()}
          subtitle={`+${kpis.new_users_30d} nos últimos 30d`}
        />
        <KpiCard
          icon="⭐"
          label="Assinantes PRO"
          value={kpis.pro_active.toString()}
        />
        <KpiCard
          icon="📉"
          label="Churn 30d"
          value={`${kpis.churn_rate.toFixed(1)}%`}
          subtitle={`${kpis.canceled_30d} cancelamentos`}
          accent={kpis.churn_rate > 5 ? "text-red-600" : ""}
        />
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-800">💬 Tickets pendentes</h2>
        <p className="mt-2 text-3xl font-extrabold text-amber-600">
          {kpis.tickets_pending}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Spec 03 (suporte) ainda será implementada com modelo SupportTicket.
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, subtitle, accent,
}: { icon: string; label: string; value: string; subtitle?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
        <span className="text-base">{icon}</span> {label}
      </div>
      <div className={`mt-2 text-2xl font-extrabold ${accent ?? "text-gray-800"}`}>
        {value}
      </div>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
