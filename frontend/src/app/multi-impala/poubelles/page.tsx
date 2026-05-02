"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TrashIcon,
  CheckCircleIcon,
  BellAlertIcon,
  MapPinIcon,
  ArrowRightIcon,
  PauseCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  PlayIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface PlanFormule {
  label: string;
  price: string;
  frequency: string;
  bins: number;
  color: string;
}
interface PlanConfig {
  basic: PlanFormule;
  standard: PlanFormule;
  premium: PlanFormule;
  freqAdjust: { "2x/semaine": string; "3x/semaine": string; "Spéciale collecte": string };
  unite?: string;
}
const defaultPlanConfig: PlanConfig = {
  basic: { label: "Basic", price: "15", frequency: "1x/semaine", bins: 1, color: "from-gray-400 to-gray-500" },
  standard: { label: "Standard", price: "29", frequency: "2x/semaine", bins: 3, color: "from-blue-400 to-blue-600" },
  premium: { label: "Premium", price: "49", frequency: "3x/semaine", bins: 5, color: "from-purple-400 to-purple-600" },
  freqAdjust: { "2x/semaine": "25", "3x/semaine": "50", "Spéciale collecte": "75" },
};

const allDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const shortDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PoubellesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [planConfig, setPlanConfig] = useState<PlanConfig>(defaultPlanConfig);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "standard" | "premium">("basic");
  const [selectedFrequency, setSelectedFrequency] = useState("1x/semaine");
  const [bins, setBins] = useState(1);
  const [address, setAddress] = useState("");
  const [collectDays, setCollectDays] = useState<string[]>(["Lundi"]);
  const [subscribed, setSubscribed] = useState(false);
  const [subStatus, setSubStatus] = useState<"active" | "paused" | "cancelled" | "pending">("pending");
  const [globalPromo, setGlobalPromo] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const [userDiscount, setUserDiscount] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [nextPickup, setNextPickup] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPlan, setSavedPlan] = useState<"basic" | "standard" | "premium">("basic");
  const [savedFrequency, setSavedFrequency] = useState("1x/semaine");
  const [savedDays, setSavedDays] = useState<string[]>(["Lundi"]);

  const loadData = async () => {
    // Load user address from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?.adresse) setAddress(user.adresse);
    } catch {}

    // Load plan config + global promo from API (database)
    try {
      const res = await fetch(`${API}/trash/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.planConfig) setPlanConfig(data.planConfig);
        if (data.globalPromo) {
          const p = data.globalPromo;
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const end = p.endsAt ? new Date(p.endsAt) : null;
          if (!end || end >= now) setGlobalPromo(p);
          else setGlobalPromo(null);
        } else {
          setGlobalPromo(null);
        }
      }
    } catch {
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem("poubelles_planConfig");
        if (stored) setPlanConfig(JSON.parse(stored));
      } catch {}
    }

    // Load individual discount from API (database)
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch(`${API}/trash/my-discount`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.discount) {
            const d = data.discount;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const end = d.endsAt ? new Date(d.endsAt) : null;
            if (!end || end >= now) setUserDiscount(d);
          }
        }
      }
    } catch {}

    // Load admin-managed subscription from API to sync selections
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch(`${API}/trash/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            const s = data.subscription;
            if (s.plan && ["basic", "standard", "premium"].includes(s.plan)) {
              setSelectedPlan(s.plan as "basic" | "standard" | "premium");
            }
            if (s.frequency) setSelectedFrequency(s.frequency);
            if (s.bins) setBins(s.bins);
            if (s.collectDays && s.collectDays.length > 0) setCollectDays(s.collectDays);
            if (s.address) setAddress(s.address);
            if (s.startDate) setStartDate(s.startDate);
            if (s.nextPickup) setNextPickup(s.nextPickup);
            if (["active", "paused", "cancelled", "pending"].includes(s.status)) {
              setSubscribed(true);
              setSubStatus(s.status as "active" | "paused" | "cancelled" | "pending");
            }
            // Track saved values for change detection
            if (s.plan) setSavedPlan(s.plan as "basic" | "standard" | "premium");
            if (s.frequency) setSavedFrequency(s.frequency);
            if (s.collectDays && s.collectDays.length > 0) setSavedDays(s.collectDays);
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    const onVisibility = () => { if (document.visibilityState === "visible") loadData(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const plan = planConfig[selectedPlan];
  const currency = (planConfig.unite === "CDF" || planConfig.unite === "USD") ? planConfig.unite : "$";
  const defaultFreq: Record<string, string> = { basic: planConfig.basic.frequency, standard: planConfig.standard.frequency, premium: planConfig.premium.frequency };
  const basePrice = parseInt(plan.price) || 0;
  const freqIsDefault = selectedFrequency === defaultFreq[selectedPlan] || (selectedFrequency === "1x/semaine" && selectedPlan === "basic");
  const surchargePercent = !freqIsDefault ? (parseInt(planConfig.freqAdjust[selectedFrequency as keyof typeof planConfig.freqAdjust]) || 0) : 0;
  const priceBeforeDiscount = freqIsDefault ? basePrice : Math.round(basePrice * (1 + surchargePercent / 100));
  let price = priceBeforeDiscount;
  if (globalPromo) price = Math.round(price * (1 - globalPromo.percent / 100));
  if (userDiscount) price = Math.round(price * (1 - userDiscount.percent / 100));
  const hasDiscount = globalPromo || userDiscount;
  const TVA_RATE = 0.16;
  const tvaAmount = Math.round(price * TVA_RATE);
  const priceWithTva = price + tvaAmount;
  const collectesPerMonth = selectedFrequency === "1x/semaine" ? "4/mois" : selectedFrequency === "2x/semaine" ? "8/mois" : selectedFrequency === "3x/semaine" ? "12/mois" : "Sur demande";

  const toggleDay = (day: string) => {
    setCollectDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubscribe = async () => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    if (!user) {
      router.push("/inscription?service=trash");
      return;
    }
    // Save subscription via API so admin and client stay in sync
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API}/trash/my-subscription`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: user.email,
            fullName: user.full_name || `${user.nom || ""} ${user.prenom || ""}`.trim(),
            plan: selectedPlan,
            frequency: selectedFrequency,
            bins,
            amount: `${price} ${currency}/mois`,
            status: "active",
            collectDays,
            zone: "",
            address,
            startDate: new Date().toLocaleDateString("fr-FR"),
            nextPickup: "-",
          }),
        });
      }
    } catch {}
    setSubscribed(true);
    setSubStatus("pending");
    setStartDate(new Date().toLocaleDateString("fr-FR"));
    setSavedPlan(selectedPlan);
    setSavedFrequency(selectedFrequency);
    setSavedDays([...collectDays]);
  };

  const hasChanges = subscribed && (
    selectedPlan !== savedPlan ||
    selectedFrequency !== savedFrequency ||
    JSON.stringify(collectDays.sort()) !== JSON.stringify([...savedDays].sort())
  );

  const updateSubscription = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!token || !user) return;
      const res = await fetch(`${API}/trash/my-subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: user.email,
          fullName: user.full_name || `${user.nom || ""} ${user.prenom || ""}`.trim(),
          plan: selectedPlan,
          frequency: selectedFrequency,
          bins,
          amount: `${price} ${currency}/mois`,
          collectDays,
          zone: "",
          address,
          startDate: startDate || new Date().toLocaleDateString("fr-FR"),
          nextPickup: nextPickup || "-",
        }),
      });
      if (res.ok) {
        setSavedPlan(selectedPlan);
        setSavedFrequency(selectedFrequency);
        setSavedDays([...collectDays]);
      }
    } catch {}
    setSaving(false);
  };

  const updateMyStatus = async (newStatus: "paused" | "cancelled") => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/trash/my-subscription/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSubStatus(newStatus);
        setShowCancelConfirm(false);
      }
    } catch {}
    setStatusLoading(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Ramassage Poubelles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center">
              <TrashIcon className="w-6 h-6 text-white" />
            </div>
            Ramassage Poubelles
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Abonnez-vous au service de collecte à domicile
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {subscribed ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Read-only subscription details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status banner */}
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                subStatus === "active"
                  ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30"
                  : subStatus === "pending"
                  ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30"
                  : subStatus === "paused"
                  ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30"
                  : "bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30"
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  subStatus === "active" ? "bg-emerald-500/20" : subStatus === "pending" ? "bg-blue-500/20" : subStatus === "paused" ? "bg-amber-500/20" : "bg-red-500/20"
                }`}>
                  {subStatus === "active" ? (
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                  ) : subStatus === "pending" ? (
                    <ClockIcon className="w-6 h-6 text-blue-500" />
                  ) : subStatus === "paused" ? (
                    <PauseCircleIcon className="w-6 h-6 text-amber-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${
                    subStatus === "active" ? "text-emerald-500" : subStatus === "pending" ? "text-blue-500" : subStatus === "paused" ? "text-amber-500" : "text-red-500"
                  }`}>
                    {subStatus === "active" ? "Abonnement actif" : subStatus === "pending" ? "En attente de validation" : subStatus === "paused" ? "Abonnement en pause" : "Abonnement résilié"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {subStatus === "active"
                      ? "Votre abonnement au service de ramassage poubelles est activé"
                      : subStatus === "pending"
                      ? "Votre abonnement sera activé après confirmation du paiement par l'administrateur"
                      : subStatus === "paused"
                      ? "Votre abonnement a été mis en pause"
                      : "Votre abonnement a été résilié"}
                  </p>
                </div>
              </div>

              {/* Promo/discount banners */}
              {globalPromo && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="font-semibold text-emerald-400">{globalPromo.type}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Promotion active{globalPromo.endsAt ? ` jusqu'au ${new Date(globalPromo.endsAt).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                </div>
              )}
              {userDiscount && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 flex items-center gap-3">
                  <span className="text-2xl">🏷️</span>
                  <div>
                    <p className="font-semibold text-purple-400">{userDiscount.type}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Remise personnelle{userDiscount.endsAt ? ` jusqu'au ${new Date(userDiscount.endsAt).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Formule */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  📋 Votre formule
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["basic", "standard", "premium"] as const).map((key) => {
                    const p = planConfig[key];
                    const isActive = selectedPlan === key;
                    return (
                      <button
                        key={key}
                        onClick={() => { setSelectedPlan(key); setBins(planConfig[key].bins); setSelectedFrequency(planConfig[key].frequency); }}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all cursor-pointer hover:shadow-md ${
                          isActive
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-[var(--border-color)] hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                            <span className="text-white text-sm font-bold">{p.label.charAt(0)}</span>
                          </div>
                          {isActive && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                        </div>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg">{p.label}</h3>
                        <p className="text-2xl font-extrabold text-primary mt-1">{p.price} {currency}<span className="text-sm font-normal text-[var(--text-muted)]">/mois</span></p>
                        <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                          <p>📦 {p.bins} bac{p.bins > 1 ? "s" : ""} inclus</p>
                          <p>🕐 {p.frequency}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fréquence */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  🕐 Fréquence de collecte
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["1x/semaine", "2x/semaine", "3x/semaine", "Spéciale collecte"].map((freq) => {
                    const isActive = selectedFrequency === freq;
                    return (
                      <button
                        key={freq}
                        onClick={() => setSelectedFrequency(freq)}
                        className={`px-3 py-3 rounded-xl border-2 text-center text-sm font-medium cursor-pointer transition-all hover:shadow-sm ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-primary/40 hover:text-[var(--text-secondary)]"
                        }`}
                      >
                        {freq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jours de collecte */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  📅 Jours de collecte
                </h2>
                <div className="grid grid-cols-7 gap-2">
                  {allDays.map((day, idx) => {
                    const isSelected = collectDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`flex flex-col items-center py-3 rounded-xl border-2 text-xs font-medium cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-primary/40 hover:text-[var(--text-secondary)]"
                        }`}
                      >
                        <span className="font-bold">{shortDays[idx]}</span>
                      </button>
                    );
                  })}
                </div>
                {collectDays.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Sélectionné : <span className="font-medium text-[var(--text-secondary)]">{collectDays.join(", ")}</span>
                  </p>
                )}
              </div>

              {/* Adresse */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  📍 Adresse de collecte
                </h2>
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <div className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]">
                    {address || <span className="text-[var(--text-muted)]">Non renseignée</span>}
                  </div>
                </div>
              </div>

              {/* Durée et dates de l'abonnement */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-primary" />
                  Durée de l&apos;abonnement
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                      <CalendarDaysIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{startDate || "-"}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Date de début</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                      <TrashIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{nextPickup || "-"}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Prochaine collecte</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
                      <ClockIcon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {startDate ? (() => {
                        const parts = startDate.split("/");
                        const start = parts.length === 3 ? new Date(+parts[2], +parts[1] - 1, +parts[0]) : new Date(startDate);
                        const diff = Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
                        return diff < 30 ? `${diff} jour${diff > 1 ? "s" : ""}` : `${Math.floor(diff / 30)} mois`;
                      })() : "-"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">Ancienneté</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${
                      subStatus === "active" ? "from-emerald-400 to-green-500" : subStatus === "pending" ? "from-blue-400 to-indigo-500" : subStatus === "paused" ? "from-amber-400 to-orange-500" : "from-red-400 to-rose-500"
                    } flex items-center justify-center`}>
                      {subStatus === "active" ? <CheckCircleIcon className="w-5 h-5 text-white" /> : subStatus === "pending" ? <ClockIcon className="w-5 h-5 text-white" /> : subStatus === "paused" ? <PauseCircleIcon className="w-5 h-5 text-white" /> : <XCircleIcon className="w-5 h-5 text-white" />}
                    </div>
                    <p className={`text-sm font-bold ${
                      subStatus === "active" ? "text-emerald-500" : subStatus === "pending" ? "text-blue-500" : subStatus === "paused" ? "text-amber-500" : "text-red-500"
                    }`}>
                      {subStatus === "active" ? "Actif" : subStatus === "pending" ? "En attente" : subStatus === "paused" ? "En pause" : "Résilié"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">Statut</p>
                  </div>
                </div>
              </div>

              {/* Résumé facturation */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  💰 Résumé facturation
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Mensuel TTC", value: `${priceWithTva} ${currency}/mois`, oldValue: hasDiscount && priceBeforeDiscount !== price ? `${Math.round(priceBeforeDiscount * (1 + TVA_RATE))} ${currency}` : null, color: "from-emerald-400 to-green-500", icon: "💵" },
                    { label: "Collectes", value: collectesPerMonth, oldValue: null, color: "from-blue-400 to-blue-500", icon: "📦" },
                    { label: "Depuis", value: startDate || new Date().toLocaleDateString("fr-FR"), oldValue: null, color: "from-purple-400 to-purple-500", icon: "📅" },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                        <span className="text-lg">{s.icon}</span>
                      </div>
                      {s.oldValue && <p className="text-xs line-through text-[var(--text-muted)]">{s.oldValue}</p>}
                      <p className={`text-sm font-bold ${s.oldValue ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>{s.value}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gestion du compte */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  ⚙️ Gérer mon abonnement
                </h2>
                <div className="space-y-3">
                  {subStatus === "pending" && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-5 h-5 text-blue-500" />
                        <p className="font-semibold text-blue-600 dark:text-blue-400">En attente de validation</p>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Votre demande d&apos;abonnement a été envoyée. L&apos;administrateur doit confirmer votre paiement pour activer le service.
                      </p>
                    </div>
                  )}
                  {subStatus === "active" && (
                    <>
                      <button
                        onClick={() => updateMyStatus("paused")}
                        disabled={statusLoading}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                          <PauseCircleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-600 dark:text-amber-400">Mettre en pause</p>
                          <p className="text-xs text-[var(--text-muted)]">Suspendre temporairement les collectes</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shrink-0">
                          <XCircleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-red-600 dark:text-red-400">Résilier l&apos;abonnement</p>
                          <p className="text-xs text-[var(--text-muted)]">Arrêter définitivement le service</p>
                        </div>
                      </button>
                    </>
                  )}
                  {subStatus === "paused" && (
                    <>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <ClockIcon className="w-5 h-5 text-blue-500" />
                          <p className="font-semibold text-blue-600 dark:text-blue-400">Abonnement en pause</p>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          Contactez l&apos;administrateur pour réactiver votre abonnement.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shrink-0">
                          <XCircleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-red-600 dark:text-red-400">Résilier l&apos;abonnement</p>
                          <p className="text-xs text-[var(--text-muted)]">Arrêter définitivement le service</p>
                        </div>
                      </button>
                    </>
                  )}
                  {subStatus === "cancelled" && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-5 h-5 text-blue-500" />
                        <p className="font-semibold text-blue-600 dark:text-blue-400">Abonnement résilié</p>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Contactez l&apos;administrateur pour réactiver votre abonnement.
                      </p>
                    </div>
                  )}
                </div>

                {/* Cancel confirmation modal */}
                {showCancelConfirm && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      <p className="font-semibold text-red-600 dark:text-red-400">Confirmer la résiliation</p>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Êtes-vous sûr de vouloir résilier votre abonnement ? Vous pourrez le réactiver à tout moment.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateMyStatus("cancelled")}
                        disabled={statusLoading}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {statusLoading ? "Résiliation..." : "Oui, résilier"}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Récapitulatif</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Formule</span>
                    <span className="font-medium text-[var(--text-primary)]">{plan.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Fréquence</span>
                    <span className="font-medium text-[var(--text-primary)]">{selectedFrequency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Bacs</span>
                    <span className="font-medium text-[var(--text-primary)]">{bins}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Jours</span>
                    <span className="font-medium text-[var(--text-primary)] text-right max-w-[140px]">
                      {collectDays.length > 0 ? collectDays.map(d => d.slice(0, 3)).join(", ") : "-"}
                    </span>
                  </div>
                  {hasDiscount && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-emerald-500 text-sm">🏷️</span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Remise appliquée</span>
                      </div>
                      {globalPromo && (
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-emerald-600 dark:text-emerald-300">{globalPromo.type}</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">-{globalPromo.percent}%</span>
                        </div>
                      )}
                      {userDiscount && (
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-purple-600 dark:text-purple-300">{userDiscount.type}</span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-300">-{userDiscount.percent}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="border-t border-[var(--border-color)] pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Prix de base</span>
                      <span className={`font-medium ${hasDiscount ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{priceBeforeDiscount} {currency}/mois</span>
                    </div>
                    {hasDiscount && priceBeforeDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Remise totale</span>
                        <span className="font-medium text-emerald-500">-{priceBeforeDiscount - price} {currency} ({Math.round((1 - price / priceBeforeDiscount) * 100)}%)</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Sous-total HT</span>
                      <span className="font-medium text-[var(--text-primary)]">{price} {currency}/mois</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">TVA (16%)</span>
                      <span className="font-medium text-[var(--text-primary)]">{tvaAmount} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)] mt-2">
                      <span className="font-semibold text-[var(--text-primary)]">Total mensuel TTC</span>
                      <span className={`text-2xl font-bold ${hasDiscount ? "text-emerald-500" : "text-primary"}`}>{priceWithTva} {currency}/mois</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/multi-impala/poubelles/paiement"
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                    hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Payer
                  <CreditCardIcon className="w-4 h-4" />
                </Link>

                {hasChanges && (
                  <button
                    onClick={updateSubscription}
                    disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold
                      hover:bg-emerald-600 shadow-md transition-all flex items-center justify-center gap-2
                      disabled:opacity-50 mt-3"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        Enregistrer les modifications
                        <CheckCircleIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <BellAlertIcon className="w-4 h-4" />
                    <span>Notification la veille du passage</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Annulation gratuite à tout moment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== Left: Subscription Form ===== */}
          <div className="lg:col-span-2 space-y-8">
            {/* Promo banner */}
            {globalPromo && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-semibold text-emerald-400">{globalPromo.type}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Promotion active{globalPromo.endsAt ? ` jusqu'au ${new Date(globalPromo.endsAt).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
              </div>
            )}
            {userDiscount && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                <div>
                  <p className="font-semibold text-purple-400">{userDiscount.type}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Remise personnelle{userDiscount.endsAt ? ` jusqu'au ${new Date(userDiscount.endsAt).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
              </div>
            )}
            {/* Step 1: Choose Plan */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">1</span>
                Choisissez votre formule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["basic", "standard", "premium"] as const).map((key) => {
                  const p = planConfig[key];
                  const isActive = selectedPlan === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedPlan(key);
                        setSelectedFrequency(p.frequency);
                        setBins(p.bins);
                        setCollectDays(key === "basic" ? ["Lundi"] : key === "standard" ? ["Lundi", "Jeudi"] : ["Lundi", "Mercredi", "Vendredi"]);
                      }}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      {key === "premium" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white text-[10px] font-bold uppercase tracking-wider">
                          Populaire
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                          <span className="text-white text-sm font-bold">{p.label.charAt(0)}</span>
                        </div>
                        {isActive && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg">{p.label}</h3>
                      <p className="text-2xl font-extrabold text-primary mt-1">{p.price} {currency}<span className="text-sm font-normal text-[var(--text-muted)]">/mois</span></p>
                      {(globalPromo || userDiscount) && (() => {
                        let discounted = parseInt(p.price) || 0;
                        if (globalPromo) discounted = Math.round(discounted * (1 - globalPromo.percent / 100));
                        if (userDiscount) discounted = Math.round(discounted * (1 - userDiscount.percent / 100));
                        return discounted < (parseInt(p.price) || 0) ? (
                          <p className="text-sm mt-0.5">
                            <span className="line-through text-[var(--text-muted)]">{p.price} {currency}</span>
                            <span className="ml-1 text-emerald-500 font-bold">{discounted} {currency}</span>
                          </p>
                        ) : null;
                      })()}
                      <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                        <p>📦 {p.bins} bac{p.bins > 1 ? "s" : ""} inclus</p>
                        <p>🕐 {p.frequency}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Fréquence de collecte */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">2</span>
                Fréquence de collecte
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-4 ml-9">
                Choisissez la fréquence de passage souhaitée
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["1x/semaine", "2x/semaine", "3x/semaine", "Spéciale collecte"].map((freq) => {
                  const isDefault = freq === defaultFreq[selectedPlan];
                  const hasSurcharge = !isDefault && freq !== "1x/semaine" && planConfig.freqAdjust[freq as keyof typeof planConfig.freqAdjust];
                  const isActive = selectedFrequency === freq;
                  return (
                    <button
                      key={freq}
                      onClick={() => setSelectedFrequency(freq)}
                      className={`px-3 py-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      {freq}
                      {isDefault && <span className="block text-[10px] opacity-60 mt-0.5">inclus</span>}
                      {hasSurcharge && <span className="block text-[10px] opacity-60 mt-0.5">+{planConfig.freqAdjust[freq as keyof typeof planConfig.freqAdjust]}%</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Collect Days */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">3</span>
                Jours de collecte
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-4 ml-9">
                Choisissez vos jours de passage préférés
              </p>
              <div className="grid grid-cols-7 gap-2">
                {allDays.map((day, idx) => {
                  const isSelected = collectDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`flex flex-col items-center py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <span className="font-bold">{shortDays[idx]}</span>
                    </button>
                  );
                })}
              </div>
              {collectDays.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Sélectionné : <span className="font-medium text-[var(--text-secondary)]">{collectDays.join(", ")}</span>
                </p>
              )}
            </div>

            {/* Step 4: Address */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">4</span>
                Adresse de collecte
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-4 ml-9">
                Adresse renseignée lors de votre inscription
              </p>
              <div className="relative">
                <MapPinIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <div className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]">
                  {address || <span className="text-[var(--text-muted)]">Connectez-vous pour afficher votre adresse</span>}
                </div>
              </div>
            </div>

            {/* Résumé facturation */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                💰 Résumé facturation
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Mensuel TTC", value: `${priceWithTva} ${currency}/mois`, oldValue: hasDiscount && priceBeforeDiscount !== price ? `${Math.round(priceBeforeDiscount * (1 + TVA_RATE))} ${currency}` : null, color: "from-emerald-400 to-green-500", icon: "💵" },
                  { label: "Collectes", value: collectesPerMonth, oldValue: null, color: "from-blue-400 to-blue-500", icon: "📦" },
                  { label: "Depuis", value: new Date().toLocaleDateString("fr-FR"), oldValue: null, color: "from-purple-400 to-purple-500", icon: "📅" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    {s.oldValue && <p className="text-xs line-through text-[var(--text-muted)]">{s.oldValue}</p>}
                    <p className={`text-sm font-bold ${s.oldValue ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>{s.value}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>


          </div>

          {/* ===== Right: Summary ===== */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Récapitulatif</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Formule</span>
                  <span className="font-medium text-[var(--text-primary)]">{plan.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Fréquence</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedFrequency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Bacs</span>
                  <span className="font-medium text-[var(--text-primary)]">{plan.bins}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Jours</span>
                  <span className="font-medium text-[var(--text-primary)] text-right max-w-[140px]">
                    {collectDays.length > 0 ? collectDays.map(d => d.slice(0, 3)).join(", ") : "-"}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-emerald-500 text-sm">🏷️</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Remise appliquée</span>
                    </div>
                    {globalPromo && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-emerald-600 dark:text-emerald-300">{globalPromo.type}</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">-{globalPromo.percent}%</span>
                      </div>
                    )}
                    {userDiscount && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-purple-600 dark:text-purple-300">{userDiscount.type}</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-300">-{userDiscount.percent}%</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="border-t border-[var(--border-color)] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Prix de base</span>
                    <span className={`font-medium ${hasDiscount ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{priceBeforeDiscount} {currency}/mois</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Remise totale</span>
                      <span className="font-medium text-emerald-500">-{priceBeforeDiscount - price} {currency} ({Math.round((1 - price / priceBeforeDiscount) * 100)}%)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Sous-total HT</span>
                    <span className="font-medium text-[var(--text-primary)]">{price} {currency}/mois</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">TVA (16%)</span>
                    <span className="font-medium text-[var(--text-primary)]">{tvaAmount} {currency}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)] mt-2">
                    <span className="font-semibold text-[var(--text-primary)]">Total mensuel TTC</span>
                    <span className={`text-2xl font-bold ${hasDiscount ? "text-emerald-500" : "text-primary"}`}>{priceWithTva} {currency}/mois</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2"
              >
                Souscrire
                <ArrowRightIcon className="w-4 h-4" />
              </button>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <BellAlertIcon className="w-4 h-4" />
                  <span>Notification la veille du passage</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Annulation gratuite à tout moment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
