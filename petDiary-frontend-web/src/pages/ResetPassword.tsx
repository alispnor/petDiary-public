import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import api from "../services/api";
import PasswordInput from "../components/PasswordInput";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t("auth.reset.errors.min_length"));
      return;
    }
    if (newPassword !== confirm) {
      setError(t("auth.reset.errors.mismatch"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password/", {
        token,
        new_password: newPassword,
      });
      setDone(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError(t("auth.reset.errors.invalid_or_expired"));
      } else {
        setError(t("auth.reset.errors.generic"));
      }
    } finally {
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
            {t("auth.reset.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.reset.subtitle")}</p>
        </div>

        {done ? (
          <>
            <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              ✓ {t("auth.reset.success")}
            </p>
            <Link
              to="/login"
              className="block text-center text-sm font-semibold text-brand-teal hover:underline"
            >
              {t("auth.reset.go_to_login")}
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordInput
              placeholder={t("auth.reset.new_password")}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <PasswordInput
              placeholder={t("auth.reset.confirm_password")}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirm}
              className="btn-primary"
            >
              {loading ? t("auth.reset.submitting") : t("auth.reset.submit")}
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
