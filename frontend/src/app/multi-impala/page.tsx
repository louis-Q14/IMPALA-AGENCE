"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const services = [
  {
    id: "poubelles",
    icon: "🗑️",
    title: "Ramassage de poubelles",
    description: "Abonnez-vous à notre service de collecte à domicile. Choisissez votre formule, fréquence et jours de passage.",
    href: "/multi-impala/poubelles",
    available: true,
    badge: null,
    gradient: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "nettoyage",
    icon: "🧹",
    title: "Nettoyage de bureau",
    description: "Service professionnel de nettoyage pour vos espaces de travail. Interventions ponctuelles ou abonnements hebdomadaires.",
    href: "/multi-impala/nettoyage",
    available: true,
    badge: null,
    gradient: "from-blue-400 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "repassage",
    icon: "👔",
    title: "Repassage à domicile",
    description: "Confiez votre linge à nos prestataires qualifiés. Intervention à domicile selon vos disponibilités.",
    href: "/multi-impala/repassage",
    available: true,
    badge: null,
    gradient: "from-purple-400 to-violet-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "demenagement",
    icon: "🚛",
    title: "Déménagement",
    description: "Organisez votre déménagement sereinement. Nos équipes prennent en charge le transport et l'installation de vos biens.",
    href: "/multi-impala/demenagement",
    available: true,
    badge: null,
    gradient: "from-orange-400 to-amber-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    textColor: "text-orange-600 dark:text-orange-400",
  },
];

export default function MultiImpalaPage() {
  const router = useRouter();

  const [addServiceModal, setAddServiceModal] = useState<{
    serviceId: string;
    serviceName: string;
    redirectUrl: string;
  } | null>(null);
  const [addServiceLoading, setAddServiceLoading] = useState(false);
  const [addServiceError, setAddServiceError] = useState("");

  const handleServiceClick = useCallback((serviceId: string, serviceName: string, redirectUrl: string) => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
      router.push(`/inscription?service=${serviceId}`);
      return;
    }

    const userServices: Array<{ service: string; status?: string } | string> = user.services || [];
    const hasService = userServices.some((s) =>
      typeof s === "string" ? s === serviceId : s.service === serviceId
    );

    if (hasService) {
      router.push(redirectUrl);
    } else {
      setAddServiceModal({ serviceId, serviceName, redirectUrl });
      setAddServiceError("");
    }
  }, [router]);

  const handleAddServiceConfirm = async () => {
    if (!addServiceModal) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push(`/inscription?service=${addServiceModal.serviceId}`);
      return;
    }
    setAddServiceLoading(true);
    setAddServiceError("");
    try {
      const res = await fetch(`${API}/auth/request-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ service: addServiceModal.serviceId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Notify admin via localStorage
        const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
        const raw = localStorage.getItem("user");
        const user = raw ? JSON.parse(raw) : null;
        notifications.unshift({
          id: `svc-${Date.now()}`,
          title: "Demande d\u2019ajout de service",
          message: `${user?.full_name || "Un utilisateur"} souhaite ajouter : ${addServiceModal.serviceName} (en attente de paiement)`,
          type: "utilisateur",
          link: "/admin/utilisateurs",
          read: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("admin_notifications", JSON.stringify(notifications));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("admin-notification"));
        // Redirect to the service page to complete booking/payment
        setAddServiceModal(null);
        router.push(addServiceModal.redirectUrl);
      } else {
        setAddServiceError(data.error || "Erreur lors de la demande");
      }
    } catch {
      setAddServiceError("Service indisponible, veuillez r\u00e9essayer");
    } finally {
      setAddServiceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Add-Service Modal */}
      {addServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Accéder au service</h3>
              <button
                onClick={() => setAddServiceModal(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Vous souhaitez accéder au service <strong>{addServiceModal.serviceName}</strong>.
            </p>
            <div className="mb-4 p-4 rounded-xl bg-[var(--bg-secondary)] space-y-2">
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="mt-0.5 text-primary font-bold">1.</span>
                <span>Confirmez votre réservation ci-dessous. Votre demande sera transmise à l&apos;administration.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="mt-0.5 text-primary font-bold">2.</span>
                <span>Vous serez redirigé vers la page de commande pour effectuer votre paiement.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="mt-0.5 text-primary font-bold">3.</span>
                <span>Après validation du paiement par l&apos;admin, vous aurez accès au service depuis votre tableau de bord.</span>
              </div>
            </div>
            {addServiceError && (
              <p className="text-sm text-red-500 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">{addServiceError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setAddServiceModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddServiceConfirm}
                disabled={addServiceLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-60"
              >
                {addServiceLoading ? "Envoi en cours..." : "Confirmer ma réservation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">✦</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">IMPALA-AGENCE</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
                Multi-Impala
              </h1>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mt-4">
            Tous vos services du quotidien en un seul endroit. Choisissez le service dont vous avez besoin et abonnez-vous en quelques minutes.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-8">Nos services disponibles</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`group relative rounded-2xl border bg-[var(--bg-card)] overflow-hidden shadow-sm transition-all duration-300
                ${service.available
                  ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer border-[var(--border-color)]"
                  : "opacity-75 border-[var(--border-color)] cursor-default"
                }`}
            >
              {/* Top gradient bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${service.gradient}`} />

              <div className="p-6">
                {/* Icon + Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${service.bg} border ${service.border} flex items-center justify-center text-3xl`}>
                    {service.icon}
                  </div>
                  {service.badge && (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${service.bg} ${service.border} border ${service.textColor}`}>
                      {service.badge}
                    </span>
                  )}
                  {service.available && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Disponible
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-[17px] font-bold text-[var(--text-primary)] mb-2">{service.title}</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">{service.description}</p>

                {/* CTA */}
                {service.available ? (
                  <button
                    onClick={() => handleServiceClick(service.id, service.title, service.href)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${service.gradient} shadow-md hover:shadow-lg hover:opacity-90 transition-all`}
                  >
                    Accéder au service
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    En cours de développement
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 flex items-start gap-4">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">D&apos;autres services arrivent bientôt</p>
            <p className="text-[13px] text-[var(--text-secondary)]">
              IMPALA-AGENCE développe continuellement de nouveaux services pour simplifier votre quotidien. Restez connecté pour découvrir les prochaines nouveautés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
