import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

/**
 * Sino com badge de unread. Polling discreto a cada 60s.
 *
 * Quando WebSocket (Spec 07) entrar, substituir polling por subscribe.
 */
export default function NotificationsBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;

    const fetchCount = async () => {
      try {
        const { data } = await api.get<{ count: number }>(
          "/notifications/unread-count/"
        );
        if (alive) setCount(data.count);
      } catch {
        // silencioso
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative rounded-md bg-gray-100 px-3 py-1.5 text-base hover:bg-gray-200"
      title="Notificações"
    >
      🔔
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
