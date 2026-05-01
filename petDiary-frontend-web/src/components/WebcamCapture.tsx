import { useEffect, useRef, useState } from "react";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

/**
 * Modal de captura de foto via webcam.
 *
 * Usa navigator.mediaDevices.getUserMedia (HTTPS obrigatório em produção;
 * em localhost funciona via HTTP).
 *
 * Trade-offs:
 * - facingMode: "environment" preferido (câmera traseira em mobile-web);
 *   fallback automático para frontal se não houver traseira
 * - Snapshot via canvas → blob → File com nome `webcam-<timestamp>.jpg`
 * - track.stop() obrigatório no cleanup pra liberar a webcam
 */
export default function WebcamCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Não foi possível acessar a câmera: ${msg}`);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const handleSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.85));
  };

  const handleConfirm = () => {
    if (!snapshot) return;
    fetch(snapshot)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `webcam-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">📷 Tirar foto pela webcam</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
            <p className="mt-2 text-xs text-gray-500">
              Verifique permissões do navegador e se sua webcam está conectada.
            </p>
          </div>
        ) : snapshot ? (
          <>
            <img src={snapshot} alt="Captura" className="w-full rounded-lg" />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setSnapshot(null)}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                ↻ Refazer
              </button>
              <button type="button" onClick={handleConfirm} className="flex-1 btn-primary">
                ✓ Usar foto
              </button>
            </div>
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black"
              autoPlay
              playsInline
              muted
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button type="button" onClick={handleSnapshot} className="flex-1 btn-primary">
                📸 Capturar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
