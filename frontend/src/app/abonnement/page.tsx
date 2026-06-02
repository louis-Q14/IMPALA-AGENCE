"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  HomeIcon,
  TruckIcon,
  SparklesIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  BellIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SERVICE_PLANS = {
  immobilier: {
    label: "Pack Immobilier",
    description: "Pour les professionnels de l'immobilier",
    price: 29,
    icon: HomeIcon,
    gradient: "from-blue-500 to-indigo-600",
    backHref: "/tableau-de-bord",
    features: [
      "Publication illimitée d'annonces",
      "Photos HD (jusqu'à 10)",
      "Statistiques de vues",
      "Position sur la carte",
      "Contact via chat intégré",
      "Badge Pro vérifié",
      "Mise en avant des annonces",
    ],
  },
  automobile: {
    label: "Pack Automobile",
    description: "Pour garages et loueurs",
    price: 29,
    icon: TruckIcon,
    gradient: "from-amber-500 to-orange-600",
    backHref: "/tableau-de-bord",
    features: [
      "Publication illimitée d'annonces",
      "Calendrier de réservation",
      "Gestion des disponibilités",
      "Paiements intégrés",
      "Avis et notations",
      "Badge Pro vérifié",
      "Statistiques avancées",
    ],
  },
  "immo-auto": {
    label: "Pack Immo & Auto",
    description: "Immobilier + Automobile à prix réduit",
    price: 49,
    icon: SparklesIcon,
    gradient: "from-violet-500 to-purple-700",
    backHref: "/tableau-de-bord",
    features: [
      "Accès complet Immobilier",
      "Accès complet Automobile",
      "Annonces illimitées (les 2 services)",
      "Badge Pro vérifié",
      "Statistiques avancées",
      "Support prioritaire",
    ],
  },
};

const methods = [
  {
    id: "mobile" as const,
    label: "Mobile Money",
    desc: "M-Pesa, Airtel Money, Orange Money",
    icon: DevicePhoneMobileIcon,
    gradient: "from-orange-400 to-orange-600",
  },
  {
    id: "card" as const,
    label: "Carte bancaire",
    desc: "Visa, Mastercard",
    icon: CreditCardIcon,
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    id: "cash" as const,
    label: "Paiement en espèces",
    desc: "Au bureau",
    icon: BanknotesIcon,
    gradient: "from-emerald-400 to-green-600",
  },
];

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const DEFAULT_FORMULAS: Record<string, Array<{ id: string; label: string; badge: string | null; price: number; gradient: string; features: string[] }>> = {
  immobilier: [
    { id: "basic",    label: "Basic",    badge: null,             price: 29000, gradient: "from-slate-400 to-slate-600",   features: ["5 annonces actives", "Photos HD (jusqu'à 5)", "Contact via messagerie", "Statistiques de base"] },
    { id: "standard", label: "Standard", badge: "Populaire",      price: 49000, gradient: "from-blue-500 to-indigo-600",  features: ["20 annonces actives", "Photos HD (jusqu'à 10)", "Position sur la carte", "Badge Pro vérifié", "Statistiques avancées", "Mise en avant des annonces"] },
    { id: "premium",  label: "Premium",  badge: "Meilleure offre", price: 79000, gradient: "from-violet-500 to-purple-700", features: ["Annonces illimitées", "Photos HD (jusqu'à 20)", "Position prioritaire", "Badge Premium vérifié", "Statistiques complètes", "Support prioritaire"] },
  ],
  automobile: [
    { id: "basic",    label: "Basic",    badge: null,             price: 20000, gradient: "from-slate-400 to-slate-600",   features: ["5 annonces actives", "Photos HD (jusqu'à 5)", "Contact via messagerie", "Statistiques de base"] },
    { id: "standard", label: "Standard", badge: "Populaire",      price: 40000, gradient: "from-amber-500 to-orange-600", features: ["20 annonces actives", "Calendrier de réservation", "Badge Pro vérifié", "Statistiques avancées", "Gestion des disponibilités"] },
    { id: "premium",  label: "Premium",  badge: "Meilleure offre", price: 70000, gradient: "from-red-500 to-rose-700",     features: ["Annonces illimitées", "Calendrier prioritaire", "Badge Premium vérifié", "Statistiques complètes", "Support prioritaire"] },
  ],
  "immo-auto": [
    { id: "basic",    label: "Basic",    badge: null,             price: 35000, gradient: "from-slate-400 to-slate-600",    features: ["Accès Immobilier Basic", "Accès Automobile Basic", "10 annonces actives", "Statistiques de base"] },
    { id: "standard", label: "Standard", badge: "Populaire",      price: 55000, gradient: "from-violet-500 to-purple-600", features: ["Accès Immobilier Standard", "Accès Automobile Standard", "40 annonces actives", "Badge Pro vérifié", "Statistiques avancées"] },
    { id: "premium",  label: "Premium",  badge: "Meilleure offre", price: 90000, gradient: "from-purple-600 to-fuchsia-700", features: ["Accès illimité Immobilier + Auto", "Annonces illimitées", "Badge Premium vérifié", "Statistiques complètes", "Support prioritaire"] },
  ],
};
const PROMOS: { code: string; label: string; discount: number }[] = [
  // Décommentez pour activer une promotion :
  // { code: "IMPALA20", label: "Lancement -20%", discount: 20 },
];

function checkAndSendNotif(sub: { startDate: string; annual: boolean }, serviceKey: string, planLabel: string) {
  if (typeof window === "undefined" || !( "Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const start = new Date(sub.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (sub.annual) end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remaining = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (remaining > 0 && remaining <= 7) {
    const lastKey = `notif_${serviceKey}_last`;
    const last = localStorage.getItem(lastKey);
    const daysSince = last
      ? Math.floor((today.getTime() - new Date(last).getTime()) / 86400000)
      : 999;
    if (daysSince >= 7) {
      new Notification("Abonnement IMPALA-AGENCE", {
        body: `Votre ${planLabel} expire dans ${remaining} jour(s). Renouvelez pour continuer.`,
        icon: "/favicon.ico",
      });
      localStorage.setItem(lastKey, today.toISOString());
    }
  }
}

interface DbTarif { id: number; nom: string; type: string; montant: number; unite: "CDF" | "USD" | "%"; description: string | null; }
interface PendingRequest { requestId: string; submittedAt: string; formula: string; formulaLabel?: string; amount: number; unite?: string; paymentMethod: string; annual: boolean; }

function AbonnementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceKey = (searchParams.get("service") || "immobilier") as keyof typeof SERVICE_PLANS;
  const plan = SERVICE_PLANS[serviceKey] || SERVICE_PLANS.immobilier;
  const Icon = plan.icon;

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"paiement" | "suivi">("paiement");
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card" | "cash">("mobile");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [subData, setSubData] = useState<{ startDate: string; annual: boolean } | null>(null);
  const [calOffset, setCalOffset] = useState(0);
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied">("default");
  const [paySuccess, setPaySuccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [formula, setFormula] = useState<string>("standard");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; label: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [backendSub, setBackendSub] = useState<{ startDate: string; endDate: string; annual: boolean } | null>(null);
  const [dbTarifs, setDbTarifs] = useState<DbTarif[]>([]);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/connexion"); return; }
    const saved = localStorage.getItem(`abonnement_${serviceKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { startDate: string; annual: boolean };
        setSubData(parsed);
        setTab("suivi");
        checkAndSendNotif(parsed, serviceKey, plan.label);
      } catch { /* ignore */ }
    }
    const savedPending = localStorage.getItem(`pending_${serviceKey}`);
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending) as PendingRequest;
        setPendingRequest(parsed);
        if (!saved) setTab("suivi");
      } catch { /* ignore */ }
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifStatus(Notification.permission as "default" | "granted" | "denied");
    }
    const svcMap: Record<string, string> = { immobilier: "real_estate", automobile: "auto", "immo-auto": "immo_auto" };
    const svcType = svcMap[serviceKey];
    (async () => {
      try {
        const [meRes, tarifRes] = await Promise.all([
          fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/tarifs-frais/public-config/${serviceKey}`),
        ]);
        if (meRes.ok) {
          const me = await meRes.json();
          if (svcType && Array.isArray(me.services)) {
            const svc = me.services.find((s: { service: string; status: string; startDate?: string; endDate?: string }) => s.service === svcType && s.status === "active");
            if (svc) {
              // Service is active — clear pending regardless of whether startDate is set
              const startIso = svc.startDate || new Date().toISOString();
              const endIso = svc.endDate || new Date(new Date(startIso).getTime() + 30 * 86400000).toISOString();
              const isAnnual = svc.endDate ? Math.round((new Date(svc.endDate).getTime() - new Date(startIso).getTime()) / 86400000) > 60 : false;
              setBackendSub({ startDate: startIso, endDate: endIso, annual: isAnnual });
              setPendingRequest(null);
              localStorage.removeItem(`pending_${serviceKey}`);
              if (!saved) setTab("suivi");
            }
          }
        }
        if (tarifRes.ok) {
          const tarifData = await tarifRes.json();
          if (tarifData?.config) {
            const cfg = tarifData.config;
            const unite = (cfg.unite || "CDF") as "CDF" | "USD" | "%";
            setDbTarifs([
              { id: 1 as unknown as number, nom: "Basic",    type: "abonnement", montant: parseFloat(cfg.basic)    || 0, unite, description: "basic" },
              { id: 2 as unknown as number, nom: "Standard", type: "abonnement", montant: parseFloat(cfg.standard) || 0, unite, description: "standard" },
              { id: 3 as unknown as number, nom: "Premium",  type: "abonnement", montant: parseFloat(cfg.premium)  || 0, unite, description: "premium" },
            ].filter(f => f.montant > 0));
          }
        }
      } catch { /* ignore */ }
    })();
  }, [router, serviceKey, plan.label]);

  const requestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm as "default" | "granted" | "denied");
    if (perm === "granted" && subData) checkAndSendNotif(subData, serviceKey, plan.label);
  };

  const dbAbonnements = dbTarifs.filter(t => t.type === "abonnement");
  const SERVICE_GRADIENTS: Record<string, string[]> = {
    immobilier: ["from-slate-400 to-slate-600", "from-blue-500 to-indigo-600", "from-violet-500 to-purple-700"],
    automobile: ["from-slate-400 to-slate-600", "from-amber-500 to-orange-600", "from-red-500 to-rose-700"],
    "immo-auto": ["from-slate-400 to-slate-600", "from-violet-500 to-purple-600", "from-purple-600 to-fuchsia-700"],
  };
  const GRADIENTS = SERVICE_GRADIENTS[serviceKey] ?? SERVICE_GRADIENTS.immobilier;
  const BADGES: (string | null)[] = [null, "Populaire", "Meilleure offre"];
  // Use named IDs so formula state "basic"/"standard"/"premium" always matches
  const FORMULA_KEYS = ["basic", "standard", "premium"];
  const activeFormulas = dbAbonnements.length > 0
    ? dbAbonnements.map((t, i) => ({
        id: t.description || FORMULA_KEYS[i] || String(t.id),
        label: t.nom,
        badge: BADGES[i] ?? null,
        price: Number(t.montant),
        unite: t.unite,
        gradient: GRADIENTS[i] ?? GRADIENTS[1],
        features: [],
      }))
    : (DEFAULT_FORMULAS[serviceKey] ?? DEFAULT_FORMULAS.immobilier).map((f, i) => ({ ...f, unite: "CDF" as const, gradient: GRADIENTS[i] ?? f.gradient }));
  const selectedFormula = activeFormulas.find(f => f.id === formula)
    ?? activeFormulas[Math.floor(activeFormulas.length / 2)]
    ?? activeFormulas[0];
  const currSymbol = selectedFormula?.unite === "USD" ? "USD" : "FC";
  const basePrice = selectedFormula?.price ?? 0;
  const annualBasePrice = Math.round(basePrice * 10);
  const rawPrice = annual ? annualBasePrice : basePrice;
  const discountAmt = appliedPromo ? Math.round(rawPrice * appliedPromo.discount / 100) : 0;
  const price = rawPrice - discountAmt;

  const applyPromo = () => {
    const found = PROMOS.find(p => p.code.toLowerCase() === promoCode.trim().toLowerCase());
    if (found) { setAppliedPromo(found); setPromoError(""); }
    else { setAppliedPromo(null); setPromoError("Code invalide ou expiré."); }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/subscriptions/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ service_type: serviceKey, payment_method: paymentMethod, amount: price, formula, annual }),
      });
      const data = await res.json();
      if (res.ok) {
        const pending: PendingRequest = {
          requestId: data.request_id,
          submittedAt: new Date().toISOString(),
          formula,
          formulaLabel: selectedFormula?.label,
          amount: price,
          unite: currSymbol,
          paymentMethod,
          annual,
        };
        localStorage.setItem(`pending_${serviceKey}`, JSON.stringify(pending));
        setPendingRequest(pending);
        setPaySuccess(true);
        setTimeout(() => { setPaySuccess(false); setTab("suivi"); }, 2500);
      }
    } catch { /* ignore */ }
    setProcessing(false);
  };
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const calData = (() => {
    const activeSub = backendSub || subData;
    if (!activeSub) return null;
    const start = new Date(activeSub.startDate);
    start.setHours(0, 0, 0, 0);
    const end = backendSub
      ? (() => { const e = new Date(backendSub.endDate); e.setHours(0,0,0,0); return e; })()
      : (() => { const e = new Date(start); if (activeSub.annual) e.setFullYear(e.getFullYear() + 1); else e.setMonth(e.getMonth() + 1); return e; })();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = Math.max(Math.round((end.getTime() - start.getTime()) / 86400000), 1);
    const consumedDays = Math.min(Math.max(Math.round((today.getTime() - start.getTime()) / 86400000), 0), totalDays);
    const remainingDays = totalDays - consumedDays;
    const progressPct = Math.round((consumedDays / totalDays) * 100);
    const baseDate = new Date(start.getFullYear(), start.getMonth() + calOffset, 1);
    const calYear = baseDate.getFullYear();
    const calMonth = baseDate.getMonth();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const dayOffset = (firstDay + 6) % 7;
    const cells = Array.from({ length: dayOffset + daysInMonth }, (_, i) => i < dayOffset ? null : i - dayOffset + 1);
    return { start, end, today, totalDays, consumedDays, remainingDays, progressPct, calYear, calMonth, cells, annual: activeSub.annual };
  })();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {paySuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/30 font-semibold text-sm">
          <ClockIcon className="w-5 h-5 shrink-0" />
          Demande soumise — En attente d&apos;approbation admin
        </div>
      )}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={plan.backHref} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-4">
            <ArrowLeftIcon className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Abonnement</h1>
              <p className="text-sm text-[var(--text-secondary)]">{plan.label}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-1 mb-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 w-fit">
          <button onClick={() => setTab("paiement")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "paiement" ? "bg-primary text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
            <CreditCardIcon className="w-4 h-4" /> Paiement
          </button>
          {(subData || backendSub || pendingRequest) && (
            <button onClick={() => { setTab("suivi"); setCalOffset(0); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "suivi" ? "bg-primary text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
              <CalendarDaysIcon className="w-4 h-4" /> Mon abonnement
              {pendingRequest && !backendSub && !subData && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
            </button>
          )}
        </div>

        {tab === "paiement" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Période de facturation</h2>
              <div className="flex gap-3">
                <button onClick={() => setAnnual(false)} className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${!annual ? "border-primary bg-primary/5 text-primary" : "border-[var(--border-color)] text-[var(--text-secondary)]"}`}>
                  Mensuel — {basePrice} {currSymbol}/mois
                </button>
                <button onClick={() => setAnnual(true)} className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all relative ${annual ? "border-primary bg-primary/5 text-primary" : "border-[var(--border-color)] text-[var(--text-secondary)]"}`}>
                  Annuel — {annualBasePrice} {currSymbol}/an
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">-17%</span>
                </button>
              </div>
            </div>

            {(dbAbonnements.length > 0 || serviceKey === "immobilier" || serviceKey === "automobile" || serviceKey === "immo-auto") && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Formule d&apos;abonnement</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeFormulas.map((f) => {
                  const isActive = formula === f.id;
                  return (
                    <button key={f.id} onClick={() => setFormula(f.id)} className={`relative p-5 rounded-xl border-2 text-left transition-all cursor-pointer hover:shadow-md ${isActive ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-[var(--border-color)] hover:border-primary/40"}`}>
                      {f.badge && <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap bg-gradient-to-r ${f.gradient}`}>{f.badge}</span>}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center`}>
                          <span className="text-white text-sm font-bold">{f.label[0]}</span>
                        </div>
                        {isActive && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg">{f.label}</h3>
                      <p className="text-2xl font-extrabold text-primary mt-1">
                        {annual ? Math.round(f.price * 10) : f.price}{" "}{f.unite === "USD" ? "USD" : "FC"}
                        <span className="text-sm font-normal text-[var(--text-muted)]">/{annual ? "an" : "mois"}</span>
                      </p>
                      {f.features.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {f.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{feat}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {(dbAbonnements.length > 0 || serviceKey === "immobilier" || serviceKey === "automobile" || serviceKey === "immo-auto") && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Promotions &amp; Remises</h2>
              {PROMOS.length === 0 && !appliedPromo ? (
                <p className="text-sm text-[var(--text-muted)] italic">Aucune promotion active pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {PROMOS.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {PROMOS.map((p) => (
                        <span key={p.code} className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          {p.label} — {p.discount}% de réduction
                        </span>
                      ))}
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{appliedPromo.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">-{appliedPromo.discount}% appliqués — économie de {discountAmt} {currSymbol}</p>
                      </div>
                      <button onClick={() => { setAppliedPromo(null); setPromoCode(""); }} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors">Retirer</button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }} onKeyDown={(e) => e.key === "Enter" && applyPromo()} placeholder="Entrez un code promo" className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm" />
                <button onClick={applyPromo} className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all">Appliquer</button>
              </div>
              {promoError && <p className="mt-2 text-xs text-red-500">{promoError}</p>}
            </div>
            )}

            {(dbAbonnements.length > 0 || serviceKey === "immobilier" || serviceKey === "automobile" || serviceKey === "immo-auto") && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Résumé de facturation</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">{selectedFormula.label}</span><span className="font-medium text-[var(--text-primary)]">{rawPrice} {currSymbol}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Période</span><span className="font-medium text-[var(--text-primary)]">{annual ? "Annuelle" : "Mensuelle"}</span></div>
                {annual && <div className="flex justify-between text-sm"><span className="text-emerald-500">Économie annuelle (-17%)</span><span className="font-medium text-emerald-500">-{Math.round(selectedFormula.price * 12 - annualBasePrice)} {currSymbol}</span></div>}
                {appliedPromo && <div className="flex justify-between text-sm"><span className="text-emerald-500">Code promo ({appliedPromo.code})</span><span className="font-medium text-emerald-500">-{discountAmt} {currSymbol}</span></div>}
                <div className="border-t border-[var(--border-color)] pt-2.5 flex justify-between items-center">
                  <span className="font-semibold text-[var(--text-primary)]">Total</span>
                  <span className="text-2xl font-bold text-primary">{price} {currSymbol}</span>
                </div>
              </div>
            </div>
            )}

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Résumé de la commande</h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                  <div><p className="font-medium text-[var(--text-primary)]">{plan.label}</p><p className="text-xs text-[var(--text-muted)]">{annual ? "Facturation annuelle" : "Facturation mensuelle"}</p></div>
                </div>
                <p className="text-lg font-bold text-primary">{price} {currSymbol}/{annual ? "an" : "mois"}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Mode de paiement</h2>
              <div className="space-y-3">
                {methods.map((m) => {
                  const MIcon = m.icon;
                  const isActive = paymentMethod === m.id;
                  return (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${isActive ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-[var(--border-color)] hover:border-[var(--border-hover)]"}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0`}><MIcon className="w-6 h-6 text-white" /></div>
                      <div className="flex-1"><p className="font-medium text-[var(--text-primary)]">{m.label}</p><p className="text-xs text-[var(--text-muted)]">{m.desc}</p></div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? "border-primary" : "border-[var(--border-color)]"}`}>
                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "mobile" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Numéro Mobile Money</h2>
                <div className="relative">
                  <DevicePhoneMobileIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+243 XXX XXX XXX" className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">Un SMS de confirmation sera envoyé à ce numéro</p>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informations de carte</h2>
                <div className="space-y-4">
                  <div><label className="text-sm text-[var(--text-secondary)] mb-1 block">Numéro de carte</label><input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm text-[var(--text-secondary)] mb-1 block">Expiration</label><input type="text" placeholder="MM/AA" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" /></div>
                    <div><label className="text-sm text-[var(--text-secondary)] mb-1 block">CVC</label><input type="text" placeholder="XXX" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" /></div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "cash" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Paiement en espèces</h2>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">Instructions</p>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">1.</span>Présentez-vous à nos bureaux avec votre pièce d&apos;identité</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">2.</span>Effectuez le paiement au comptoir</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">3.</span>Vous recevrez un reçu par SMS et e-mail</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Total à payer</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">{plan.label}</span><span className="font-medium text-[var(--text-primary)]">{price} {currSymbol}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Période</span><span className="font-medium text-[var(--text-primary)]">1 {annual ? "an" : "mois"}</span></div>
                {annual && <div className="flex justify-between text-sm"><span className="text-emerald-500">Économie (-17%)</span><span className="font-medium text-emerald-500">-{basePrice * 12 - annualBasePrice} FC</span></div>}
                <div className="border-t border-[var(--border-color)] pt-3">
                  <div className="flex justify-between items-center"><span className="font-semibold text-[var(--text-primary)]">Total</span><span className="text-2xl font-bold text-primary">{price} {currSymbol}</span></div>
                </div>
              </div>
              <button onClick={handlePay} disabled={processing || (paymentMethod === "mobile" && !phoneNumber.trim())} className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {processing ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Traitement...</>) : (<>Payer {price} {currSymbol}<CreditCardIcon className="w-4 h-4" /></>)}
              </button>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <ShieldCheckIcon className="w-4 h-4" /><span>Paiement sécurisé et chiffré</span>
              </div>
            </div>
          </div>
        </div>
        )}
        {tab === "suivi" && (
        <div className="space-y-8">
          {pendingRequest && !backendSub && !subData && (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <ClockIcon className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    Demande en attente d&apos;approbation
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Votre demande d&apos;abonnement a bien été soumise. Un administrateur va l&apos;examiner et l&apos;activer prochainement.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Formule</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{pendingRequest.formulaLabel ?? activeFormulas.find(f => f.id === pendingRequest.formula)?.label ?? pendingRequest.formula}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Montant</p>
                      {(() => {
                        // Try to resolve live price from DB config for the stored formula
                        const liveFormula = activeFormulas.find(f => f.id === pendingRequest.formula || f.label.toLowerCase() === pendingRequest.formula.toLowerCase());
                        const displayAmount = liveFormula ? (pendingRequest.annual ? Math.round(liveFormula.price * 10) : liveFormula.price) : pendingRequest.amount;
                        const displayUnite = liveFormula ? (liveFormula.unite === "USD" ? "USD" : "FC") : (pendingRequest.unite ?? currSymbol);
                        return <p className="text-sm font-semibold text-[var(--text-primary)]">{displayAmount} {displayUnite}</p>;
                      })()}
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Période</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{pendingRequest.annual ? "Annuel" : "Mensuel"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Soumis le</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{new Date(pendingRequest.submittedAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(backendSub || subData) && calData && (
          <>
            {notifStatus !== "granted" && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <BellIcon className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="flex-1 text-sm text-amber-600 dark:text-amber-400">Activez les notifications pour être alerté chaque fin de semaine du temps restant.</p>
                {notifStatus === "default" && <button onClick={requestNotifications} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all shrink-0">Activer</button>}
              </div>
            )}

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-lg font-semibold text-[var(--text-primary)]">{plan.label}</h2><p className="text-sm text-[var(--text-muted)]">{calData.annual ? "Abonnement annuel" : "Abonnement mensuel"}</p></div>
                <div className="ml-auto text-right"><p className="text-2xl font-bold text-emerald-500">{calData.remainingDays}</p><p className="text-xs text-[var(--text-muted)]">jours restants</p></div>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2"><span>{calData.consumedDays} jours consommés</span><span>{calData.progressPct}%</span></div>
              <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-4"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${calData.progressPct}%` }} /></div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]"><span>Début : {calData.start.toLocaleDateString("fr-FR")}</span><span>Expiration : {calData.end.toLocaleDateString("fr-FR")}</span></div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCalOffset(o => o - 1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all">‹</button>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{MONTH_NAMES[calData.calMonth]} {calData.calYear}</h3>
                <button onClick={() => setCalOffset(o => o + 1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all">›</button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {["L","M","M","J","V","S","D"].map((d, i) => <div key={i} className="flex items-center justify-center h-8 text-xs font-semibold text-[var(--text-muted)]">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {calData.cells.map((day, i) => {
                  if (day === null) return <div key={i} />;
                  const cellDate = new Date(calData.calYear, calData.calMonth, day);
                  cellDate.setHours(0, 0, 0, 0);
                  const isToday = cellDate.getTime() === calData.today.getTime();
                  const isConsumed = cellDate >= calData.start && cellDate < calData.today && cellDate < calData.end;
                  const isRemaining = cellDate > calData.today && cellDate < calData.end;
                  const isStart = cellDate.getTime() === calData.start.getTime();
                  const isEnd = cellDate.getTime() === calData.end.getTime();
                  return (
                    <div key={i} className="flex items-center justify-center py-0.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isToday ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/40" : isStart || isEnd ? "bg-primary/20 text-primary border border-primary/50" : isConsumed ? "bg-blue-500/20 text-blue-500" : isRemaining ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "text-[var(--text-muted)]"}`}>
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><div className="w-3 h-3 rounded-full bg-blue-500/60" /> Consommé</div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" /> Aujourd&apos;hui</div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><div className="w-3 h-3 rounded-full bg-emerald-500/60" /> Restant</div>
              </div>
            </div>
          </>
          )}

          <div className="flex gap-3">
            <button onClick={() => setTab("paiement")} className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all">
              {pendingRequest && !backendSub ? "Modifier la demande" : "Renouveler"}
            </button>
            <Link href="/tableau-de-bord" className="px-5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-all">
              Tableau de bord
            </Link>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AbonnementContent />
    </Suspense>
  );
}