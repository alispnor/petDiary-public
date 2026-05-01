import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { Attachment } from "../types";
import WebcamCapture from "./WebcamCapture";

interface Props {
  petId: string;
  recordId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string, name: string): string {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "🖼";
  if (m === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "📕";
  if (m.startsWith("audio/")) return "🎵";
  if (m.startsWith("video/")) return "🎬";
  if (m.startsWith("text/")) return "📄";
  return "📎";
}

/**
 * Lista anexos do record + botão upload + ações (ver/baixar/imprimir/remover).
 *
 * Resolve URLs com Authorization header via fetch + blob URL (axios não
 * deixa colocar o header no <img src> ou <a href> direto).
 */
export default function AttachmentsList({ petId, recordId }: Props) {
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Attachment[]>(
        `/pets/${petId}/health-records/${recordId}/attachments/`
      );
      setItems(data);
    } catch {
      setError("Não foi possível carregar anexos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId, recordId]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", file.name);
      await api.post(
        `/pets/${petId}/health-records/${recordId}/attachments/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      await load();
    } catch {
      setError("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleWebcamCapture = async (file: File) => {
    setShowWebcam(false);
    await uploadFile(file);
  };

  /** Resolve URL autenticada → blob → window.open (view, download, print). */
  const fetchAndOpen = async (
    url: string,
    mode: "view" | "download" | "print",
    fileName: string,
    mime: string,
  ) => {
    try {
      const res = await fetch(`${api.defaults.baseURL}${url}`.replace("/api/v1/api/v1/", "/api/v1/"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: mime || "application/octet-stream" }));

      if (mode === "download") {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (mode === "print") {
        const w = window.open(blobUrl, "_blank");
        if (w) w.addEventListener("load", () => w.print());
      } else {
        window.open(blobUrl, "_blank");
      }

      // Revoga após 60s pra não vazar memória
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      setError("Erro ao abrir arquivo.");
    }
  };

  const handleDelete = async (att: Attachment) => {
    if (!window.confirm(`Remover "${att.file_name}"?`)) return;
    try {
      await api.delete(`/attachments/${att.id}/`);
      setItems((prev) => prev.filter((a) => a.id !== att.id));
    } catch {
      setError("Erro ao remover.");
    }
  };

  return (
    <div
      className={`mt-3 border-t border-gray-100 pt-2 transition-all ${
        dragOver ? "bg-brand-teal/5 ring-2 ring-brand-teal rounded-lg" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className="text-xs text-gray-500">
          📎 {items.length} anexo{items.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer text-xs font-semibold text-brand-teal hover:underline">
            + Anexar
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowWebcam(true)}
            disabled={uploading}
            className="text-xs font-semibold text-brand-teal hover:underline"
          >
            📷 Webcam
          </button>
        </div>
      </div>

      {dragOver && (
        <p className="text-xs text-brand-teal text-center py-2">
          Solte o arquivo aqui para enviar
        </p>
      )}
      {uploading && <p className="text-xs text-gray-400">Enviando…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {showWebcam && (
        <WebcamCapture
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {loading ? null : (
        <ul className="flex flex-col gap-1">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 text-xs"
            >
              <span className="text-base">{iconFor(a.mime_type, a.file_name)}</span>
              <span className="flex-1 truncate font-medium text-gray-700">
                {a.file_name}
              </span>
              <span className="text-gray-400">{formatSize(a.file_size)}</span>
              <button
                type="button"
                onClick={() => fetchAndOpen(a.view_url, "view", a.file_name, a.mime_type)}
                title="Visualizar"
                className="rounded px-1 hover:bg-gray-200"
              >
                👁
              </button>
              <button
                type="button"
                onClick={() => fetchAndOpen(a.download_url, "download", a.file_name, a.mime_type)}
                title="Baixar"
                className="rounded px-1 hover:bg-gray-200"
              >
                ⬇
              </button>
              <button
                type="button"
                onClick={() => fetchAndOpen(a.view_url, "print", a.file_name, a.mime_type)}
                title="Imprimir"
                className="rounded px-1 hover:bg-gray-200"
              >
                🖨
              </button>
              <button
                type="button"
                onClick={() => handleDelete(a)}
                title="Remover"
                className="rounded px-1 text-red-500 hover:bg-red-50"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
