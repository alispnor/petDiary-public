import type { ClinicalRecord } from "../types";

interface TimelineProps {
  records: ClinicalRecord[];
}

export default function Timeline({ records }: TimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">
        Histórico Clínico
      </h3>

      {records.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum registro encontrado.</p>
      )}

      <ol className="relative border-l-2 border-indigo-200 pl-6">
        {records.map((r) => (
          <li key={r.id} className="mb-6">
            <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-indigo-400" />

            <div
              className={`rounded-lg p-4 shadow-sm ${
                r.type === "ai"
                  ? "border-l-4 border-amber-400 bg-amber-50"
                  : "border-l-4 border-indigo-400 bg-white"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">{r.title}</h4>
                <span className="text-xs text-gray-400">{r.date}</span>
              </div>
              <p className="text-sm text-gray-600">{r.description}</p>
              <p className="mt-2 text-xs font-medium text-gray-400">
                {r.type === "ai" ? "🤖 " : "👤 "}
                {r.author}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
