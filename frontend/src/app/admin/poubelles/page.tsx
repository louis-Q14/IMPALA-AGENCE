"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TrashIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
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
  freqAdjust: { "2x/semaine": string; "3x/semaine": string; "Sp\u00e9ciale collecte": string };
  unite?: string;
}

const defaultPlanConfig: PlanConfig = {
  basic: { label: "Basic", price: "15", frequency: "1x/semaine", bins: 1, color: "from-gray-400 to-gray-500" },
  standard: { label: "Standard", price: "29", frequency: "2x/semaine", bins: 3, color: "from-blue-400 to-blue-600" },
  premium: { label: "Premium", price: "49", frequency: "3x/semaine", bins: 5, color: "from-purple-400 to-purple-600" },
  freqAdjust: { "2x/semaine": "25", "3x/semaine": "50", "Sp\u00e9ciale collecte": "75" },
};

interface Subscription {
  id: number;
  user: string;
  email: string;
  zone: string;
  plan: "basic" | "standard" | "premium";
  frequency: string;
  bins: number;
  status: "active" | "paused" | "cancelled" | "pending";
  nextPickup: string;
  amount: string;
  startDate?: string;
  address?: string;
  collectDays?: string[];
  discount?: { type: string; percent: number; startsAt: string; endsAt: string };
  globalDiscount?: { type: string; percent: number; startsAt: string; endsAt: string };
}

const initialSubscriptions: Subscription[] = [];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper to get admin JWT token
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

// API helpers for discount persistence
const saveDiscountToAPI = async (email: string, discountType: string, percent: number, startsAt: string, endsAt: string) => {
  try {
    const token = getToken();
    if (!token) return;
    // Convert FR dates (dd/mm/yyyy) to ISO (yyyy-mm-dd) for API
    const toISO = (d: string) => { const [day, month, year] = d.split("/"); return `${year}-${month}-${day}`; };
    await fetch(`${API}/admin/trash/discounts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, discountType, percent, startsAt: toISO(startsAt), endsAt: toISO(endsAt) }),
    });
  } catch (e) { console.error("saveDiscountToAPI error:", e); }
};

const removeDiscountFromAPI = async (email: string) => {
  try {
    const token = getToken();
    if (!token) return;
    await fetch(`${API}/admin/trash/discounts/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) { console.error("removeDiscountFromAPI error:", e); }
};

const savePlanConfigToAPI = async (config: PlanConfig) => {
  try {
    const token = getToken();
    if (!token) return;
    await fetch(`${API}/admin/trash/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planConfig: config }),
    });
  } catch (e) { console.error("savePlanConfigToAPI error:", e); }
};

const saveSubscriptionToAPI = async (sub: Subscription) => {
  try {
    const token = getToken();
    if (!token) return;
    await fetch(`${API}/admin/trash/subscriptions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: sub.email,
        fullName: sub.user,
        plan: sub.plan,
        frequency: sub.frequency,
        bins: sub.bins,
        amount: sub.amount,
        status: sub.status,
        collectDays: sub.collectDays || [],
        zone: sub.zone,
        address: sub.address || "",
        startDate: sub.startDate || "",
        nextPickup: sub.nextPickup || "",
      }),
    });
  } catch (e) { console.error("saveSubscriptionToAPI error:", e); }
};

export default function AdminPoubelles() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [draftSub, setDraftSub] = useState<Subscription | null>(null);
  const [draftPlanConfig, setDraftPlanConfig] = useState<PlanConfig>(defaultPlanConfig);
  const [deleteConfirm, setDeleteConfirm] = useState<Subscription | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "gerence">("details");
  const [saved, setSaved] = useState(false);
  const [promoStartDate, setPromoStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [promoEndDate, setPromoEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [planConfig, setPlanConfig] = useState<PlanConfig>(defaultPlanConfig);
  const currency = (planConfig.unite === "CDF" || planConfig.unite === "USD") ? planConfig.unite : "CDF";
  const [globalPromo, setGlobalPromo] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const planPrices = { basic: planConfig.basic.price, standard: planConfig.standard.price, premium: planConfig.premium.price };
  const freqAdjust = planConfig.freqAdjust;
  const defaultFreq: Record<string, string> = { basic: planConfig.basic.frequency, standard: planConfig.standard.frequency, premium: planConfig.premium.frequency };
  const calcAmount = (plan: "basic" | "standard" | "premium", freq: string, config?: PlanConfig) => {
    const cfg = config || planConfig;
    const prices = { basic: cfg.basic.price, standard: cfg.standard.price, premium: cfg.premium.price };
    const adj = cfg.freqAdjust;
    const defFreq: Record<string, string> = { basic: cfg.basic.frequency, standard: cfg.standard.frequency, premium: cfg.premium.frequency };
    const base = parseInt(prices[plan]) || 0;
    const planDefault = defFreq[plan];
    if (freq === planDefault || freq === "1x/semaine" && plan === "basic") return `${base} ${currency}/mois`;
    const pct = parseInt(adj[freq as keyof typeof adj]) || 0;
    return `${Math.round(base * (1 + pct / 100))} ${currency}/mois`;
  };
  const calcFinalAmount = (s: Subscription, config?: PlanConfig) => {
    const cfg = config || planConfig;
    let base = parseInt(cfg[s.plan].price) || 0;
    const planDefault = cfg[s.plan].frequency;
    if (s.frequency !== planDefault) {
      const pct = parseInt(cfg.freqAdjust[s.frequency as keyof typeof cfg.freqAdjust]) || 0;
      base = Math.round(base * (1 + pct / 100));
    }
    if (s.globalDiscount) base = Math.round(base * (1 - s.globalDiscount.percent / 100));
    if (s.discount) base = Math.round(base * (1 - s.discount.percent / 100));
    return `${base} ${currency}/mois`;
  };
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  useEffect(() => { setMounted(true); }, []); 

  // Load all data from DB on mount
  useEffect(() => {
    const loadFromDB = async () => {
      const token = getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      // Load subscriptions from DB
      try {
        const res = await fetch(`${API}/admin/trash/subscriptions`, { headers });
        if (res.ok) {
          const rows = await res.json();
          if (rows.length > 0) {
            const dbSubs: Subscription[] = rows.map((r: { id: number; email: string; full_name: string; zone: string; plan: string; frequency: string; bins: number; status: string; next_pickup: string; amount: string; start_date: string; address: string; collect_days: string[] }, idx: number) => ({
              id: r.id || idx + 1,
              user: r.full_name,
              email: r.email,
              zone: r.zone || "",
              plan: (r.plan || "basic") as "basic" | "standard" | "premium",
              frequency: r.frequency || "1x/semaine",
              bins: r.bins || 1,
              status: (r.status || "active") as "active" | "paused" | "cancelled",
              nextPickup: r.next_pickup || "-",
              amount: r.amount || "15 CDF/mois",
              startDate: r.start_date || "",
              address: r.address || "",
              collectDays: r.collect_days || [],
            }));
            setSubs(dbSubs);
          }
        }
      } catch (e) { console.error("Load subs error:", e); }

      // Load planConfig and globalPromo from DB
      try {
        const res = await fetch(`${API}/admin/trash/config`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.planConfig) {
            setPlanConfig(data.planConfig);
          }
          if (data.globalPromo) {
            // Convert ISO dates to FR format for display
            const toFR = (d: string) => {
              if (!d || d.includes("/")) return d;
              const dt = new Date(d);
              return dt.toLocaleDateString("fr-FR");
            };
            setGlobalPromo({
              type: data.globalPromo.type,
              percent: data.globalPromo.percent,
              startsAt: toFR(data.globalPromo.startsAt),
              endsAt: toFR(data.globalPromo.endsAt),
            });
          }
        }
      } catch (e) { console.error("Load config error:", e); }

      // Load individual discounts from DB and merge into subs
      try {
        const res = await fetch(`${API}/admin/trash/discounts`, { headers });
        if (res.ok) {
          const discounts = await res.json();
          if (discounts.length > 0) {
            setSubs(prev => prev.map(s => {
              const d = discounts.find((disc: { email: string }) => disc.email.toLowerCase() === s.email.toLowerCase());
              if (d) {
                return {
                  ...s,
                  discount: {
                    type: d.discount_type,
                    percent: d.percent,
                    startsAt: new Date(d.starts_at).toLocaleDateString("fr-FR"),
                    endsAt: new Date(d.ends_at).toLocaleDateString("fr-FR"),
                  },
                };
              }
              return s;
            }));
          }
        }
      } catch (e) { console.error("Load discounts error:", e); }
    };
    loadFromDB();
  }, []);
  // Check expired discounts and global promo, revert to plan defaults
  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const parseFR = (d: string) => { const [day, month, year] = d.split("/"); return new Date(`${year}-${month}-${day}`); };
    // Check global promo expiration
    if (globalPromo?.endsAt && parseFR(globalPromo.endsAt) < now) {
      setGlobalPromo(null);
      setSubs(prev => prev.map(s => {
        const cleared = { ...s, globalDiscount: undefined };
        return { ...cleared, amount: calcFinalAmount(cleared) };
      }));
      return;
    }
    // Check individual discount expiration
    setSubs(prev => {
      let anyChanged = false;
      const updated = prev.map(s => {
        let sub = s;
        let subChanged = false;
        if (sub.discount?.endsAt && parseFR(sub.discount.endsAt) < now) {
          sub = { ...sub, discount: undefined };
          subChanged = true;
        }
        if (sub.globalDiscount?.endsAt && parseFR(sub.globalDiscount.endsAt) < now) {
          sub = { ...sub, globalDiscount: undefined };
          subChanged = true;
        }
        if (subChanged) {
          sub = { ...sub, amount: calcFinalAmount(sub) };
          anyChanged = true;
        }
        return sub;
      });
      return anyChanged ? updated : prev;
    });
  }, [planConfig, globalPromo]);
  const prevSubIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (selectedSub && selectedSub.id !== prevSubIdRef.current) {
      setDragPos(null);
      setModalTab("details");
      setDraftSub({ ...selectedSub });
      setDraftPlanConfig({ ...planConfig });
      setSaved(false);
    }
    prevSubIdRef.current = selectedSub?.id ?? null;
  }, [selectedSub]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const currentX = dragPos?.x ?? 0;
    const currentY = dragPos?.y ?? 0;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: currentX, origY: currentY };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setDragPos({
        x: dragRef.current.origX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (ev.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dragPos]);

  const updateStatus = (subId: number, newStatus: "active" | "paused" | "cancelled" | "pending") => {
    const nextPickup = newStatus === "active" ? new Date(Date.now() + 7 * 86400000).toLocaleDateString("fr-FR") : "-";
    const sub = subs.find(s => s.id === subId);
    if (!sub) return;
    const updatedSub: Subscription = { ...sub, status: newStatus, nextPickup };
    setSubs((prev) => prev.map((s) => s.id === subId ? updatedSub : s));
    if (selectedSub?.id === subId) {
      setSelectedSub((prev) => prev ? { ...prev, status: newStatus, nextPickup } : null);
    }
    // Persist status change to database immediately
    saveSubscriptionToAPI(updatedSub);
  };

  const deleteSub = (sub: Subscription) => {
    setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    if (selectedSub?.id === sub.id) setSelectedSub(null);
    setDeleteConfirm(null);
    // Delete from database
    (async () => {
      try {
        const token = getToken();
        if (!token) return;
        await fetch(`${API}/admin/trash/subscriptions/${encodeURIComponent(sub.email)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) { console.error("deleteSubscriptionFromAPI error:", e); }
    })();
  };



  const filtered = subs.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (
      search &&
      !s.user.toLowerCase().includes(search.toLowerCase()) &&
      !s.zone.toLowerCase().includes(search.toLowerCase()) &&
      !s.email.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const activeCount = subs.filter((s) => s.status === "active").length;
  const pausedCount = subs.filter((s) => s.status === "paused").length;
  const cancelledCount = subs.filter((s) => s.status === "cancelled").length;
  const monthlyRevenue = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + parseInt(s.amount), 0);

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Poubelles</h1>
          <p className="text-sm text-[var(--text-muted)]">Gestion des abonnements collecte</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Abonnements actifs", value: activeCount, color: "bg-emerald-500" },
          { label: "En pause", value: pausedCount, color: "bg-amber-500" },
          { label: "R\u00e9sili\u00e9s", value: cancelledCount, color: "bg-red-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white font-bold text-sm`}
            >
              {s.value}
            </div>
            <span className="text-sm font-medium text-[var(--text-secondary)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou zone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Tous" },
            { key: "active", label: "Actifs" },
            { key: "paused", label: "En pause" },
            { key: "cancelled", label: "R\u00e9sili\u00e9s" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-primary text-white"
                  : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <TrashIcon className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucun abonnement trouv\u00e9</h3>
          <p className="text-sm text-[var(--text-muted)]">Modifiez vos filtres ou ajoutez un nouvel abonnement.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {["Abonn\u00e9", "Zone", "Formule", "Fr\u00e9quence", "Bacs", "Montant", "Prochain passage", "Statut", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((sub) => (
                  <tr
                    key={sub.id}
                    className={`transition-all ${
                      sub.status === "paused"
                        ? "bg-amber-50/50 dark:bg-amber-900/5"
                        : sub.status === "cancelled"
                          ? "bg-red-50/30 dark:bg-red-900/5"
                          : "hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-xs">
                          {sub.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{sub.user}</p>
                          <p className="text-xs text-[var(--text-muted)]">{sub.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                        <MapPinIcon className="w-4 h-4" /> {sub.zone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          sub.plan === "premium"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : sub.plan === "standard"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{sub.frequency}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)] font-medium">{sub.bins}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{sub.amount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                        <CalendarDaysIcon className="w-4 h-4" /> {sub.nextPickup}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          sub.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : sub.status === "paused"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {sub.status === "active" ? "Actif" : sub.status === "paused" ? "En pause" : "R\u00e9sili\u00e9"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {sub.status === "pending" && (
                          <button
                            onClick={() => updateStatus(sub.id, "active")}
                            title="Confirmer paiement & activer"
                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status === "active" && (
                          <button
                            onClick={() => updateStatus(sub.id, "paused")}
                            title="Mettre en pause"
                            className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all"
                          >
                            <PauseCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status === "paused" && (
                          <button
                            onClick={() => updateStatus(sub.id, "active")}
                            title="R\u00e9activer"
                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                          >
                            <PlayCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status === "cancelled" && (
                          <button
                            onClick={() => updateStatus(sub.id, "active")}
                            title="R\u00e9abonner"
                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status !== "cancelled" && (
                          <button
                            onClick={() => updateStatus(sub.id, "cancelled")}
                            title="R\u00e9silier"
                            className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSub(sub)}
                          title="D\u00e9tails"
                          className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(sub)}
                          title="Supprimer"
                          className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal — glassmorphism draggable */}
      {mounted && selectedSub && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { setDraftSub(null); setDraftPlanConfig(planConfig); setSelectedSub(null); }}>
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl
              bg-white/20 dark:bg-gray-900/20 backdrop-blur-2xl
              shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]
              border-[0.5px] border-gray-300/50 dark:border-gray-500/30
              ring-[0.5px] ring-gray-400/20 dark:ring-gray-400/10"
            style={dragPos ? { transform: `translate(${dragPos.x}px, ${dragPos.y}px)` } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — draggable */}
            <div
              className="shrink-0 px-6 pt-5 pb-4 cursor-grab active:cursor-grabbing select-none
              bg-white dark:bg-gray-900 rounded-t-3xl
              border-b border-[0.5px] border-gray-300/30 dark:border-gray-500/20"
              onMouseDown={onDragStart}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg ${
                  selectedSub.status === "active"
                    ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white"
                    : selectedSub.status === "pending"
                    ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                    : selectedSub.status === "paused"
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                    : "bg-gradient-to-br from-red-400 to-red-600 text-white"
                }`}>
                  {selectedSub.user.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedSub.user}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSub.email}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  selectedSub.status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : selectedSub.status === "pending"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : selectedSub.status === "paused"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                  {selectedSub.status === "active" ? "Actif" : selectedSub.status === "pending" ? "En attente" : selectedSub.status === "paused" ? "En pause" : "Résilié"}
                </span>
              </div>
              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setModalTab("details")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    modalTab === "details"
                      ? "bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/5"
                  }`}
                >
                  📋 Détails
                </button>
                <button
                  onClick={() => setModalTab("gerence")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    modalTab === "gerence"
                      ? "bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/5"
                  }`}
                >
                  ⚙️ Gérence
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">

              {modalTab === "details" && (<>
                {/* Statut du compte */}
                {selectedSub.status === "pending" && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800/40 flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">En attente de validation</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Ce compte sera activé après confirmation du paiement</p>
                    </div>
                    <button
                      onClick={() => { updateStatus(selectedSub.id, "active"); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium text-sm
                        hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/25"
                    >
                      <CheckCircleIcon className="w-4 h-4" /> Activer
                    </button>
                  </div>
                )}

                {/* Choix du client */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-blue-500 dark:text-blue-400">📦</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Choix du client</h4>
                  </div>
                  <div className="divide-y divide-white/30 dark:divide-white/5">
                    {[
                      { label: "Formule", value: selectedSub.plan.charAt(0).toUpperCase() + selectedSub.plan.slice(1) },
                      { label: "Fréquence", value: selectedSub.frequency },
                      { label: "Nombre de bacs", value: String(selectedSub.bins) },
                      { label: "Jours de collecte", value: selectedSub.collectDays?.length ? selectedSub.collectDays.join(", ") : "Non définis" },
                      { label: "Montant", value: selectedSub.amount },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Localisation */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-emerald-500 dark:text-emerald-400">📍</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Localisation</h4>
                  </div>
                  <div className="divide-y divide-white/30 dark:divide-white/5">
                    {[
                      { label: "Zone", value: selectedSub.zone || "Non renseignée" },
                      { label: "Adresse", value: selectedSub.address || "Non renseignée" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Durée de l'abonnement */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-amber-500 dark:text-amber-400">📅</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Durée de l&apos;abonnement</h4>
                  </div>
                  <div className="divide-y divide-white/30 dark:divide-white/5">
                    {[
                      { label: "Date de début", value: selectedSub.startDate || "—" },
                      { label: "Prochain passage", value: selectedSub.nextPickup || "—" },
                      { label: "Prochain renouvellement", value: (() => {
                        if (!selectedSub.startDate || selectedSub.startDate === "—") return "—";
                        const parts = selectedSub.startDate.split("/");
                        if (parts.length !== 3) return "—";
                        const start = new Date(+parts[2], +parts[1] - 1, +parts[0]);
                        const now = new Date();
                        const renewal = new Date(start);
                        while (renewal <= now) renewal.setMonth(renewal.getMonth() + 1);
                        return renewal.toLocaleDateString("fr-FR");
                      })() },
                      { label: "Ancienneté", value: (() => {
                        if (!selectedSub.startDate || selectedSub.startDate === "—") return "—";
                        const parts = selectedSub.startDate.split("/");
                        if (parts.length !== 3) return "—";
                        const start = new Date(+parts[2], +parts[1] - 1, +parts[0]);
                        const now = new Date();
                        const diffMs = now.getTime() - start.getTime();
                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        if (days < 30) return `${days} jour${days > 1 ? "s" : ""}`;
                        const months = Math.floor(days / 30);
                        return `${months} mois`;
                      })() },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              {modalTab === "gerence" && draftSub && (<>
                {/* Modifier la formule */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-purple-500 dark:text-purple-400">🔄</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Changer de formule</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3 px-4 py-3">
                    {(["basic", "standard", "premium"] as const).map((plan) => {
                      const draftPrices = { basic: draftPlanConfig.basic.price, standard: draftPlanConfig.standard.price, premium: draftPlanConfig.premium.price };
                      const planInfo = {
                        basic: { label: "Basic", price: `${draftPrices.basic} FC/mois`, color: "from-gray-400 to-gray-500", features: `1 bac • ${defaultFreq.basic}` },
                        standard: { label: "Standard", price: `${draftPrices.standard} FC/mois`, color: "from-blue-400 to-blue-600", features: `3 bacs • ${defaultFreq.standard}` },
                        premium: { label: "Premium", price: `${draftPrices.premium} FC/mois`, color: "from-purple-400 to-purple-600", features: `5 bacs • ${defaultFreq.premium}` },
                      };
                      const info = planInfo[plan];
                      const isActive = draftSub.plan === plan;
                      return (
                        <button
                          key={plan}
                          onClick={() => {
                            if (!isActive) {
                              const newFreq = defaultFreq[plan];
                              const newAmount = calcAmount(plan, newFreq, draftPlanConfig);
                              setDraftSub({ ...draftSub, plan, amount: newAmount, frequency: newFreq });
                              setSaved(false);
                            }
                          }}
                          className={`relative p-3 rounded-xl border text-center transition-all ${
                            isActive
                              ? "border-white/40 dark:border-white/20 bg-white/20 dark:bg-white/10 ring-2 ring-blue-400/50"
                              : "border-white/20 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/5"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{info.label[0]}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{info.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{info.price}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{info.features}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modifier la fréquence */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-blue-500 dark:text-blue-400">🕐</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Fréquence de collecte</h4>
                  </div>
                  <div className="flex gap-2 px-4 py-3">
                    {["1x/semaine", "2x/semaine", "3x/semaine", "Spéciale collecte"].map((freq) => {
                      const isDefault = freq === defaultFreq[draftSub.plan];
                      const hasSurcharge = !isDefault && freq !== "1x/semaine" && draftPlanConfig.freqAdjust[freq as keyof typeof draftPlanConfig.freqAdjust];
                      return (
                        <button
                          key={freq}
                          onClick={() => {
                            if (draftSub.frequency !== freq) {
                              const newAmount = calcAmount(draftSub.plan, freq, draftPlanConfig);
                              setDraftSub({ ...draftSub, frequency: freq, amount: newAmount });
                              setSaved(false);
                            }
                          }}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            draftSub.frequency === freq
                              ? "bg-blue-500/20 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400/50"
                              : "bg-white/10 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10"
                          }`}
                        >
                          {freq}
                          {isDefault && <span className="block text-[9px] opacity-60">inclus</span>}
                          {hasSurcharge && <span className="block text-[9px] opacity-60">+{draftPlanConfig.freqAdjust[freq as keyof typeof draftPlanConfig.freqAdjust]}%</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Promotions & remises */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-amber-500 dark:text-amber-400">🏷️</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Promotions & remises</h4>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {/* Global promo display */}
                    {draftSub.globalDiscount && (
                      <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/5 border border-purple-400/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{draftSub.globalDiscount.type}</span>
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">-{draftSub.globalDiscount.percent}%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Du <span className="font-medium">{draftSub.globalDiscount.startsAt}</span> au <span className="font-medium">{draftSub.globalDiscount.endsAt}</span>
                        </p>
                        <p className="text-[9px] text-purple-500/70 dark:text-purple-400/50 mt-0.5">Promotion globale (tous les clients)</p>
                      </div>
                    )}
                    {/* Individual promo display or form */}
                    {draftSub?.discount ? (
                      <>
                      <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-400/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{draftSub.discount.type}</span>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">-{draftSub.discount.percent}%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Du <span className="font-medium">{draftSub.discount.startsAt}</span> au <span className="font-medium">{draftSub.discount.endsAt}</span>
                        </p>
                        <p className="text-[9px] text-amber-500/70 dark:text-amber-400/50 mt-0.5">Promotion individuelle</p>
                      </div>
                      <button
                        onClick={() => {
                          if (!draftSub) return;
                          const cleared = { ...draftSub, discount: undefined };
                          setDraftSub({ ...cleared, amount: calcFinalAmount(cleared, draftPlanConfig) });
                          setSaved(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-red-500/10 dark:bg-red-500/5 border border-red-400/20 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        Retirer la promotion individuelle
                      </button>
                      </>
                    ) : (
                      <>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Remise 10%", percent: 10, type: "Remise fid\u00e9lit\u00e9" },
                          { label: "Remise 20%", percent: 20, type: "Remise parrainage" },
                          { label: "Remise 30%", percent: 30, type: "Promo sp\u00e9ciale" },
                          { label: "Remise 50%", percent: 50, type: "Offre exceptionnelle" },
                        ].map((promo) => (
                          <button
                            key={promo.label}
                            onClick={() => {
                              if (!draftSub) return;
                              const withDiscount = {
                                ...draftSub,
                                discount: {
                                  type: promo.type,
                                  percent: promo.percent,
                                  startsAt: new Date(promoStartDate).toLocaleDateString("fr-FR"),
                                  endsAt: new Date(promoEndDate).toLocaleDateString("fr-FR"),
                                },
                              };
                              setDraftSub({ ...withDiscount, amount: calcFinalAmount(withDiscount, draftPlanConfig) });
                              setSaved(false);
                            }}
                            className="p-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/5
                              hover:bg-amber-500/10 dark:hover:bg-amber-500/5 hover:border-amber-400/30 transition-all text-left"
                          >
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{promo.label}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{promo.type}</p>
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">D{"\u00e9"}but de la promotion</label>
                          <input
                            id={`promo-start-${draftSub.id}`}
                            type="date"
                            value={promoStartDate}
                            onChange={(e) => setPromoStartDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10
                              text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fin de la promotion</label>
                          <input
                            id={`promo-end-${draftSub.id}`}
                            type="date"
                            value={promoEndDate}
                            onChange={(e) => setPromoEndDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10
                              text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">S{"\u00e9"}lectionnez les dates puis cliquez sur une remise pour l&apos;appliquer. {"\u00c0"} expiration, le tarif par d{"\u00e9"}faut sera r{"\u00e9"}tabli automatiquement.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Calendrier de collecte */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-blue-500 dark:text-blue-400">📅</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Calendrier de collecte</h4>
                  </div>
                  <p className="px-4 text-[10px] text-gray-500 dark:text-gray-400 mb-2">Sélectionnez les jours de passage pour la collecte</p>
                  <div className="grid grid-cols-7 gap-1.5 px-4 py-2">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, idx) => {
                      const fullDay = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][idx];
                      const isSelected = (draftSub.collectDays || []).includes(fullDay);
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            const current = draftSub.collectDays || [];
                            const newDays = isSelected
                              ? current.filter(d => d !== fullDay)
                              : [...current, fullDay];
                            setDraftSub({ ...draftSub, collectDays: newDays });
                            setSaved(false);
                          }}
                          className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-blue-500/20 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400/50"
                              : "bg-white/10 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10"
                          }`}
                        >
                          <span className="text-[10px] font-semibold">{day}</span>
                          {isSelected && <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </button>
                      );
                    })}
                  </div>
                  {(draftSub.collectDays || []).length > 0 && (
                    <p className="px-4 mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                      Jours choisis : <span className="font-medium">{(draftSub.collectDays || []).join(", ")}</span>
                    </p>
                  )}
                </div>

                {/* Résumé facturation */}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                    <span className="text-green-500 dark:text-green-400">💰</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Résumé facturation</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3 px-4 py-3">
                    {[
                      { label: "Mensuel", value: draftSub.amount, color: "from-emerald-400 to-green-500", icon: "💵" },
                      { label: "Collectes", value: draftSub.frequency === "1x/semaine" ? "4/mois" : draftSub.frequency === "2x/semaine" ? "8/mois" : draftSub.frequency === "3x/semaine" ? "12/mois" : "Sur demande", color: "from-blue-400 to-blue-500", icon: "📦" },
                      { label: "Depuis", value: draftSub.startDate || "-", color: "from-purple-400 to-purple-500", icon: "📅" },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-3 rounded-xl bg-white/10 dark:bg-white/5">
                        <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                          <span className="text-xs">{s.icon}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}


            </div>
            <div className="shrink-0 px-6 py-4
              border-t border-[0.5px] border-gray-300/30 dark:border-gray-500/20
              bg-white/10 dark:bg-gray-900/10 backdrop-blur-2xl rounded-b-3xl flex gap-3">
              {modalTab === "gerence" ? (
                <>
                  <button
                    onClick={() => {
                      if (draftSub && draftPlanConfig) {
                        // Commit draft to real state
                        const finalSub = { ...draftSub, amount: calcFinalAmount(draftSub, draftPlanConfig) };
                        setSubs(prev => prev.map(s => String(s.id) === String(finalSub.id) ? finalSub : s));
                        setSelectedSub(finalSub);
                        setPlanConfig(draftPlanConfig);
                        setSaved(true);
                        // Persist discount to database via API
                        if (finalSub.discount) {
                          saveDiscountToAPI(finalSub.email, finalSub.discount.type, finalSub.discount.percent, finalSub.discount.startsAt, finalSub.discount.endsAt);
                        } else {
                          removeDiscountFromAPI(finalSub.email);
                        }
                        // Also persist plan config if changed
                        savePlanConfigToAPI(draftPlanConfig);
                        // Persist subscription data to database
                        saveSubscriptionToAPI(finalSub);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                      text-white font-medium transition-all text-sm shadow-lg
                      ${saved
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25"
                      }`}
                  >
                    {saved ? "✓ Enregistré" : "✓ Enregistrer"}
                  </button>
                  <button
                    onClick={() => { setDraftSub(null); setDraftPlanConfig(planConfig); setSelectedSub(null); }}
                    className="px-6 py-2.5 rounded-xl border border-white/20 dark:border-white/10 text-sm font-medium
                      text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/5 transition-all backdrop-blur-sm"
                  >
                    Fermer
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setDraftSub(null); setDraftPlanConfig(planConfig); setSelectedSub(null); }}
                  className="ml-auto px-6 py-2.5 rounded-xl border border-white/20 dark:border-white/10 text-sm font-medium
                    text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/5 transition-all backdrop-blur-sm"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer cet abonnement ?</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Vous \u00eates sur le point de supprimer d\u00e9 d\u00e9finitivement l&apos;abonnement de{" "}
                <span className="font-semibold text-[var(--text-primary)]">{deleteConfirm.user}</span>.
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-2 font-medium">
                Cette action est irr\u00e9versible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteSub(deleteConfirm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm"
              >
                <TrashIcon className="w-4 h-4" /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
