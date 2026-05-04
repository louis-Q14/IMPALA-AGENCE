"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { LogoFull } from "@/components/Logo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Lien invalide. Veuillez refaire une demande de réinitialisation.");
  }, [token]);

  const passwordsMatch = confirmPassword === "" || password === confirmPassword;
  const isValid = password.length >= 8 && password === confirmPassword && token !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValid) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/connexion"), 3000);
      } else {
        setError(data.error || "Erreur lors de la réinitialisation");
      }
    } catch {
      setError("Service indisponible. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center mb-2">
            <LogoFull className="h-12 w-auto" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
          {success ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Mot de passe mis à jour !
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
              <Link
                href="/connexion"
                className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoFocus
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="mt-1 text-xs text-red-500">Au moins 8 caractères requis</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className={`w-full pl-12 pr-12 py-3 rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors
                      ${confirmPassword.length > 0
                        ? passwordsMatch
                          ? "border-green-500 focus:border-green-500"
                          : "border-red-500 focus:border-red-500"
                        : "border-[var(--border-color)] focus:border-primary"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
                {confirmPassword.length > 0 && passwordsMatch && password.length >= 8 && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Les mots de passe correspondent</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
              </button>
            </form>
          )}
        </div>

        {!success && (
          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/connexion" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
