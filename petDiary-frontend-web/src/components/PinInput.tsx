import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

interface PinInputProps {
  onSubmit: (pin: string) => void;
  loading: boolean;
}

export default function PinInput({ onSubmit, loading }: PinInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs.current[5]?.focus();
    }
  };

  const pin = digits.join("");
  const isComplete = pin.length === 6;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isComplete) onSubmit(pin);
      }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-16 w-14 rounded-xl border-2 border-gray-300 text-center text-2xl font-bold text-indigo-700 transition focus:border-indigo-500 focus:outline-none"
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={!isComplete || loading}
        className="rounded-xl bg-indigo-600 px-10 py-3 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verificando…" : "Acessar Prontuário"}
      </button>
    </form>
  );
}
