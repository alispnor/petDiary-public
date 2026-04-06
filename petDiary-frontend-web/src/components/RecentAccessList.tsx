import type { RecentAccess } from "../types";

const MOCK_HISTORY: RecentAccess[] = [
  { id: 1, petName: "Thor", tutor: "Ana Silva", date: "28/03/2026", pin: "482910" },
  { id: 2, petName: "Luna", tutor: "Carlos Mendes", date: "25/03/2026", pin: "173645" },
  { id: 3, petName: "Pipoca", tutor: "Fernanda Lima", date: "20/03/2026", pin: "920384" },
];

export default function RecentAccessList() {
  return (
    <ul className="space-y-3">
      {MOCK_HISTORY.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-gray-100 bg-gray-50 p-3"
        >
          <p className="font-medium text-gray-800">{item.petName}</p>
          <p className="text-sm text-gray-500">Tutor: {item.tutor}</p>
          <p className="text-xs text-gray-400">{item.date}</p>
        </li>
      ))}
    </ul>
  );
}
