"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LogoFull } from "@/components/Logo";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Lien invalide — token manquant.");
      return;
    }

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${API}/auth/verify-email/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setStatus("success");
          // Redirect to dashboard after 3 seconds
          setTimeout(() => router.push("/tableau-de-bord"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Vérification impossible.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erreur de connexion. Réessayez plus tard.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <LogoFull className="h-8 w-auto" />
          </Link>
        </div>

        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)] text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Vérification en cours…
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Veuillez patienter quelques instants.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Email vérifié ! 🎉
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Votre compte est maintenant activé. Vous allez être redirigé vers votre tableau de bord…
              </p>
              <Link
                href="/tableau-de-bord"
                className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all shadow-md"
              >
                Accéder au tableau de bord
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Vérification échouée
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {message}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/inscription"
                  className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all shadow-md"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/connexion"
                  className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-all"
                >
                  Se connecter
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
