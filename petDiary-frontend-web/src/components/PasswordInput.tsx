import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);
  const { className = "", ...rest } = props;

  return (
    <div className="relative">
      <input
        {...rest}
        type={visible ? "text" : "password"}
        className={`w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-brand-teal focus:outline-none ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 transition hover:text-brand-teal"
      >
        {visible ? "🙈" : "👁"}
      </button>
    </div>
  );
}
