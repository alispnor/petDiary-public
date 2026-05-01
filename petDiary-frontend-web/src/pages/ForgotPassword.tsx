import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/", { email: email.trim() });
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md card">
        <div className="mb-8 text-center">
          <img src="/logo-192.png" alt="PetDiary" className="mx-auto h-20 w-20" />
          <h1 className="mt-4 text-3xl font-extrabold text-gradient">
            {t("auth.forgot.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.forgot.subtitle")}</p>
        </div>

        {submitted ? (
          <>
            <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              ✓ {t("auth.forgot.success")}
            </p>
            <Link
              to="/login"
              className="block text-center text-sm font-semibold text-brand-teal hover:underline"
            >
              {t("auth.forgot.back_to_login")}
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder={t("auth.forgot.email_placeholder")}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary"
            >
              {loading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
            </button>
            <Link
              to="/login"
              className="text-center text-sm text-gray-500 hover:text-brand-teal"
            >
              {t("auth.forgot.back_to_login")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
