"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  HomeIcon,
  TruckIcon,
  TrashIcon,
  ClockIcon,
  ArrowRightIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const plans = [
  {
    id: "real_estate",
    name: "Pack Immobilier",
    period: "mois",
    description: "Pour les professionnels de l'immobilier",
    icon: HomeIcon,
    color: "from-blue-500 to-blue-700",
    features: [
      "Publication illimitée d'annonces",
      "Photos HD (jusqu'à 10)",
      "Statistiques de vues",
      "Position sur la carte",
      "Contact via chat intégré",
      "Badge Pro vérifié",
      "Mise en avant des annonces",
    ],
    popular: false,
  },
  {
    id: "auto",
    name: "Pack Automobile",
    period: "mois",
    description: "Pour garages et loueurs",
    icon: TruckIcon,
    color: "from-amber-500 to-orange-600",
    features: [
      "Publication illimitée d'annonces",
      "Calendrier de réservation",
      "Gestion des disponibilités",
      "Paiements intégrés",
      "Avis et notations",
      "Badge Pro vérifié",
      "Statistiques avancées",
    ],
    popular: false,
  },
  {
    id: "immo-auto",
    name: "Pack Immo & Auto",
    period: "mois",
    description: "Immobilier + Automobile à prix réduit",
    icon: SparklesIcon,
    color: "from-violet-500 to-purple-700",
    features: [
      "Accès complet Immobilier",
      "Accès complet Automobile",
      "Annonces illimitées (les 2 services)",
      "Badge Pro vérifié",
      "Statistiques avancées",
      "Support prioritaire",
      "Économie sur l'abonnement combiné",
    ],
    popular: true,
  },
];

const trashPlan = {
  id: "trash",
  name: "Pack Poubelles",
  period: "mois",
  description: "Collecte 1 bac hebdomadaire",
  icon: TrashIcon,
  features: [
    "1 bac par semaine",
    "Notification la veille",
    "Calendrier des passages",
    "Historique & factures",
    "Choix du type de déchet",
    "Annulation gratuite",
  ],
};

const multiImpalaServices = [
  {
    id: "nettoyage",
    emoji: "\uD83E\uDDF9",
    title: "Nettoyage de bureau",
    subtitle: "Service professionnel d'entretien de vos espaces",
    href: "/multi-impala/nettoyage",
    unitLabel: "heure",
    color: "from-blue-400 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    textColor: "text-blue-600 dark:text-blue-400",
    tva: 16,
    tiers: [
      { label: "Petite surface (< 50 m\u00b2)", mult: 1.0 },
      { label: "Surface moyenne (50\u2013150 m\u00b2)", mult: 1.3 },
      { label: "Grande surface (> 150 m\u00b2)", mult: 1.6 },
    ],
    note: "Facturation sur dur\u00e9e r\u00e9elle via QR code",
  },
  {
    id: "repassage",
    emoji: "\uD83D\uDC54",
    title: "Repassage \u00e0 domicile",
    subtitle: "Vos v\u00eatements repass\u00e9s \u00e0 domicile par nos agents",
    href: "/multi-impala/repassage",
    unitLabel: "heure",
    color: "from-purple-400 to-violet-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    textColor: "text-purple-600 dark:text-purple-400",
    tva: 16,
    tiers: [
      { label: "Petit lot (quelques pi\u00e8ces)", mult: 1.0 },
      { label: "Lot moyen", mult: 1.4 },
      { label: "Grand lot (draps, uniformes\u2026)", mult: 1.8 },
    ],
    note: "Facturation sur dur\u00e9e r\u00e9elle via QR code",
  },
  {
    id: "demenagement",
    emoji: "\uD83D\uDE9B",
    title: "D\u00e9m\u00e9nagement",
    subtitle: "Transport et installation de vos biens",
    href: "/multi-impala/demenagement",
    unitLabel: "heure",
    color: "from-orange-400 to-amber-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    textColor: "text-orange-600 dark:text-orange-400",
    tva: 16,
    tiers: [
      { label: "Studio / F1", mult: 1.0 },
      { label: "Appartement F2\u2013F3", mult: 1.5 },
      { label: "Bureau / Open space", mult: 1.8 },
      { label: "Grande maison / villa", mult: 2.2 },
    ],
    note: "Services extras +15 chacun (d\u00e9montage, emballage, stockage, nettoyage post-d\u00e9m\u00e9nagement)",
  },  {
    id: "poubelles",
    emoji: "🗑️",
    title: "Ramassage de poubelles",
    subtitle: "Collecte ponctuelle à domicile par nos agents",
    href: "/multi-impala/poubelles",
    unitLabel: "passage",
    color: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    tva: 16,
    tiers: [
      { label: "1 bac", mult: 1.0 },
      { label: "2–3 bacs", mult: 1.5 },
      { label: "4+ bacs", mult: 2.0 },
    ],
    note: "Tarification par passage · Bacs ≤ 240 L",
  },];

const faqs = [
  {
    q: "Puis-je changer de formule en cours de route ?",
    a: "Oui, vous pouvez passer à une formule supérieure à tout moment. Le changement prend effet immédiatement avec un prorata.",
  },
  {
    q: "Comment fonctionne la période d'essai ?",
    a: "Chaque nouveau compte bénéficie de 14 jours d'essai gratuit. Aucune carte bancaire requise.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, vous pouvez annuler à tout moment. L'abonnement reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Carte bancaire (Visa, Mastercard), Mobile Money (M-Pesa, Airtel Money, Orange Money) et paiement en espèces à la fin de l'intervention pour les services Multi-Impala.",
  },
  {
    q: "Comment fonctionne la facturation des services Multi-Impala ?",
    a: "Les services Multi-Impala (nettoyage, repassage, déménagement) sont facturés à l'heure réelle. Un QR code unique est généré à chaque réservation : l'agent le scanne à l'arrivée (début) et au départ (fin). La facture finale, avec TVA 16%, est calculée automatiquement et envoyée par e-mail.",
  },
  {
    q: "La TVA est-elle incluse dans les tarifs affichés ?",
    a: "Les tarifs horaires affichés sont hors taxes (HT). Une TVA de 16% est ajoutée au moment du calcul final. Le montant TTC est toujours clairement indiqué avant confirmation.",
  },
];

export default function TarifsPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currency, setCurrency] = useState("CDF");
  const [globalPromo, setGlobalPromo] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({
    real_estate: 0, auto: 0, "immo-auto": 0, trashBasic: 0,
    nettoyage: 0, repassage: 0, demenagement: 0, poubelles: 0,
  });

  // Add-service modal state
  const [addServiceModal, setAddServiceModal] = useState<{
    serviceId: string;
    serviceName: string;
    redirectUrl: string;
  } | null>(null);
  const [addServiceLoading, setAddServiceLoading] = useState(false);
  const [addServiceError, setAddServiceError] = useState("");

  // Checks user auth and whether they already have the service.
  // - Not logged in → goes to /inscription?service=X
  // - Logged in + has service → goes to the service page
  // - Logged in + no service → opens "add service" modal
  const handleServiceClick = useCallback((serviceId: string, serviceName: string, redirectUrl: string) => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
      router.push(`/inscription?service=${serviceId}`);
      return;
    }

    // Check if service already in user's services array
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
        // Redirect to payment/booking page
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

  useEffect(() => {
    // Fetch trash config (currency + basic price)
    fetch(`${API}/trash/config`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.planConfig) {
          const unite = data.planConfig.unite;
          if (unite === "CDF" || unite === "USD") setCurrency(unite);
          const basicPrice = parseFloat(data.planConfig.basic?.price);
          if (!isNaN(basicPrice) && basicPrice > 0)
            setPrices(p => ({ ...p, trashBasic: basicPrice }));
        }
        if (data?.globalPromo) {
          const gp = data.globalPromo;
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const start = new Date(gp.startsAt);
          const end = new Date(gp.endsAt); end.setHours(23, 59, 59, 999);
          if (today >= start && today <= end) setGlobalPromo(gp);
        }
      })
      .catch(() => {});

    // Fetch tarifs-frais for each service
    // Fetch immo-auto standard formula price
    fetch(`${API}/tarifs-frais/public-config/immo-auto`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.config?.standard) {
          const p = parseFloat(data.config.standard);
          if (!isNaN(p) && p > 0) setPrices(prev => ({ ...prev, "immo-auto": p }));
        }
      }).catch(() => {});

    const mappings: { service: string; key: string; type: string }[] = [
      { service: "immobilier,general", key: "real_estate", type: "abonnement" },
      { service: "automobile,general", key: "auto", type: "abonnement" },
      { service: "nettoyage", key: "nettoyage", type: "frais_fixe" },
      { service: "repassage", key: "repassage", type: "frais_fixe" },
      { service: "demenagement", key: "demenagement", type: "frais_fixe" },
      { service: "poubelles", key: "poubelles", type: "frais_fixe" },
    ];
    mappings.forEach(({ service, key, type }) => {
      fetch(`${API}/tarifs-frais/public?service=${service}`)
        .then(r => r.ok ? r.json() : [])
        .then((tarifs: Array<{ type: string; montant: number; unite: string }>) => {
          const tarif = tarifs.find(t => t.type === type && t.montant > 0) || tarifs.find(t => t.montant > 0);
          if (tarif) {
            setPrices(p => ({ ...p, [key]: tarif.montant }));
            if (tarif.unite === "CDF" || tarif.unite === "USD") setCurrency(tarif.unite);
          }
        })
        .catch(() => {});
    });
  }, []);

  const getPrice = (key: string) =>
    annual ? Math.round((prices[key] || 0) * 10) : (prices[key] || 0);

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

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
              Vous souhaitez souscrire au service <strong>{addServiceModal.serviceName}</strong>.
            </p>
            <div className="mb-4 p-4 rounded-xl bg-[var(--bg-secondary)] space-y-2">
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="mt-0.5 text-primary font-bold">1.</span>
                <span>Confirmez votre réservation ci-dessous. Votre demande sera enregistrée et transmise à l&apos;administration.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="mt-0.5 text-primary font-bold">2.</span>
                <span>Vous serez redirigé vers la page de tarification pour effectuer votre paiement.</span>
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

      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text-primary)]">
            Tarifs simples et transparents
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Abonnements mensuels pour l&apos;immobilier et l&apos;automobile · Services Multi-Impala facturés à la durée réelle.
          </p>

          {/* Toggle Annual/Monthly */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                !annual
                  ? "bg-primary text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                annual
                  ? "bg-primary text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Annuel
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-accent text-white text-xs">
                -17%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── Abonnements ── */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Abonnements</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Pour l&apos;immobilier, l&apos;automobile et la collecte de poubelles</p>
        </div>

        {/* Main Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto w-full items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all hover:shadow-xl ${
                plan.popular ? "border-primary shadow-lg" : "border-[var(--border-color)]"
              }`}
            >
              <div className="p-8 bg-[var(--bg-card)] flex flex-col flex-1">
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  {plan.popular && (
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold uppercase tracking-wide">
                      Populaire
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {getPrice(plan.id) > 0 ? (
                    <>
                      <span className="text-4xl font-bold text-[var(--text-primary)]">
                        {fmt(getPrice(plan.id))} {currency}
                      </span>
                      <span className="text-[var(--text-muted)]">/{annual ? "an" : "mois"}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-[var(--text-muted)] animate-pulse">Chargement...</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (plan.id === "auto") router.push("/abonnement?service=automobile");
                    else if (plan.id === "immo-auto") router.push("/abonnement?service=immo-auto");
                    else router.push("/abonnement?service=immobilier");
                  }}
                  className="mt-6 w-full block text-center py-3 rounded-xl font-semibold transition-all bg-blue-700 text-white hover:bg-blue-800 shadow-md"
                >
                  Commencer
                </button>

                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-[var(--text-secondary)]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trash Plan */}
        <div className={`relative p-8 rounded-2xl bg-[var(--bg-card)] border mb-20 overflow-hidden ${globalPromo ? "border-amber-400/50" : "border-[var(--border-color)]"}`}>
          {globalPromo && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold py-2">
              <span>🏷️</span>
              <span>Promo en cours : -{globalPromo.percent}% jusqu&apos;au {new Date(globalPromo.endsAt).toLocaleDateString("fr-FR")}</span>
            </div>
          )}
          <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${globalPromo ? "mt-6" : ""}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{trashPlan.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{trashPlan.description}</p>
                <div className="flex flex-wrap gap-4 mt-3">
                  {trashPlan.features.map((f) => (
                    <span key={f} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                      <CheckIcon className="w-4 h-4 text-accent" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                {globalPromo && getPrice("trashBasic") > 0 && (
                  <div className="text-sm text-[var(--text-muted)] line-through">
                    {fmt(getPrice("trashBasic"))} {currency}
                  </div>
                )}
                {getPrice("trashBasic") > 0 ? (
                  <>
                    <span className={`text-3xl font-bold ${globalPromo ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-primary)]"}`}>
                      {globalPromo
                        ? fmt(Math.round(getPrice("trashBasic") * (1 - globalPromo.percent / 100)))
                        : fmt(getPrice("trashBasic"))} {currency}
                    </span>
                    <span className="text-[var(--text-muted)]">/{annual ? "an" : "mois"}</span>
                  </>
                ) : (
                  <span className="text-xl font-semibold text-[var(--text-muted)] animate-pulse">Chargement...</span>
                )}
              </div>
              <button
                onClick={() => handleServiceClick("trash", "Ramassage de Poubelles", "/multi-impala/poubelles")}
                className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover shadow-md transition-all"
              >
                Souscrire
              </button>
            </div>
          </div>
        </div>

        {/* ── Multi-Impala Services ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">✦</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Services Multi-Impala</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] ml-11">
            Facturation à la durée réelle · TVA 16% incluse · Paiement après intervention via QR code
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {multiImpalaServices.map((svc) => (
            <div
              key={svc.id}
              className={`rounded-2xl bg-[var(--bg-card)] border ${svc.border} overflow-hidden hover:shadow-xl transition-all flex flex-col`}
            >
              {/* Card header */}
              <div className={`p-4 ${svc.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center text-base shadow-md flex-shrink-0`}>
                    {svc.emoji}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{svc.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] truncate">{svc.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className={`text-lg font-bold ${svc.textColor}`}>
                    {(prices[svc.id] || 0) > 0 ? `${fmt(prices[svc.id])} ${currency}` : <span className="text-sm font-normal text-[var(--text-muted)] animate-pulse">Chargement...</span>}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">/ {svc.unitLabel} · HT</span>
                </div>
              </div>

              {/* Tiers */}
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Grille tarifaire</p>
                <div className="space-y-1">
                  {svc.tiers.map((tier, i) => {
                    const base = prices[svc.id] || 0;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-color)] last:border-0">
                        <span className="text-[var(--text-secondary)] mr-2">{tier.label}</span>
                        <div className="text-right flex-shrink-0">
                          {base > 0 ? (
                            <>
                              <span className={`font-semibold ${svc.textColor}`}>{fmt(Math.round(base * tier.mult))} {currency}</span>
                              <span className="text-[var(--text-muted)] ml-0.5">(×{tier.mult})</span>
                            </>
                          ) : (
                            <span className="text-[var(--text-muted)] animate-pulse">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-start gap-1.5 p-2.5 rounded-xl bg-[var(--bg-secondary)]">
                  <ClockIcon className={`w-3.5 h-3.5 ${svc.textColor} flex-shrink-0 mt-0.5`} />
                  <p className="text-xs text-[var(--text-muted)] leading-snug">{svc.note}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2.5">
                  <span>TVA 16% incluse</span>
                  <span className="font-medium text-[var(--text-secondary)]">Après intervention</span>
                </div>

                <div className="mt-auto pt-8">
                  <button
                    onClick={() => handleServiceClick(svc.id, svc.title, svc.href)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${svc.color} text-white font-semibold text-sm hover:opacity-90 transition-all shadow-md`}
                  >
                    Réserver maintenant
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] text-center mb-10">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-[var(--text-primary)]">{faq.q}</span>
                  <span className={`text-[var(--text-muted)] transition-transform text-xl leading-none ${openFaq === i ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


