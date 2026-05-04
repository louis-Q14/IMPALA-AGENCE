"use client";

import Link from "next/link";
import { useState } from "react";
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { LogoFull } from "@/components/Logo";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Veuillez saisir votre adresse email");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'envoi");
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
            Mot de passe oublié
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Email envoyé !
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation valable <strong>1 heure</strong>.
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                Vérifiez vos spams si vous ne trouvez pas l&apos;email.
              </p>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
