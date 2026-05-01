import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const items = [
    { to: "/admin", label: "📊 Resumo", end: true },
    { to: "/admin/users", label: "👥 Usuários" },
    { to: "/admin/coupons", label: "💰 Cupons" },
    { to: "/admin/tickets", label: "💬 Suporte" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-gray-900 text-white p-4 flex flex-col gap-2">
        <div className="mb-6">
          <div className="text-lg font-extrabold text-gradient">PetDiary</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Admin
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-brand-teal text-white font-semibold"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-700 pt-3">
          <p className="text-xs text-gray-400 truncate">{user?.full_name}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
