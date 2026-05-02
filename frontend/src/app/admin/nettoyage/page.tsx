"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, XCircleIcon, ClockIcon,
  ArrowPathIcon, XMarkIcon, SparklesIcon, ExclamationTriangleIcon, TrashIcon,
} from "@heroicons/react/24/outline";

interface PricingConfig {
  small: { label: string; price: string; duration: number };
  medium: { label: string; price: string; duration: number };
  large: { label: string; price: string; duration: number };
  unite?: string;
}

const defaultPricingConfig: PricingConfig = {
  small: { label: "Petit bureau", price: "25", duration: 2 },
  medium: { label: "Bureau moyen", price: "45", duration: 4 },
  large: { label: "Grand bureau", price: "75", duration: 6 },
  unite: "CDF",
};

interface Booking {
  id: number;
  client: string;
  email: string;
  address: string;
  company?: string;
  surface: "small" | "medium" | "large";
  duration: number;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  amount: string;
  notes?: string;
  startDate?: string;
  discount?: { type: string; percent: number; startsAt: string; endsAt: string };
  globalDiscount?: { type: string; percent: number; startsAt: string; endsAt: string };
}

const SURFACE_LABELS: Record<string, string> = {
  small: "Petit bureau (< 50 m2)",
  medium: "Bureau moyen (50-150 m2)",
  large: "Grand bureau (> 150 m2)",
};

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  confirmed: { label: "Confirme", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  in_progress: { label: "En cours", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" },
  completed: { label: "Termine", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  cancelled: { label: "Annule", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

const saveDiscountToAPI = async (email: string, discountType: string, percent: number, startsAt: string, endsAt: string) => {
  try {
    const token = getToken(); if (!token) return;
    const toISO = (d: string) => { const [day, month, year] = d.split("/"); return `${year}-${month}-${day}`; };
    await fetch(`${API}/admin/nettoyage/discounts`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, discountType, percent, startsAt: toISO(startsAt), endsAt: toISO(endsAt) }) });
  } catch (e) { console.error(e); }
};
const removeDiscountFromAPI = async (email: string) => {
  try { const token = getToken(); if (!token) return; await fetch(`${API}/admin/nettoyage/discounts/${encodeURIComponent(email)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
};
const saveConfigToAPI = async (config: PricingConfig) => {
  try { const token = getToken(); if (!token) return; await fetch(`${API}/admin/nettoyage/config`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ pricingConfig: config }) }); } catch (e) { console.error(e); }
};
const saveBookingToAPI = async (b: Booking) => {
  try { const token = getToken(); if (!token) return; await fetch(`${API}/admin/nettoyage/bookings`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: b.email, fullName: b.client, address: b.address, company: b.company || "", surface: b.surface, duration: b.duration, date: b.date || "", time: b.time || "", amount: b.amount || "", notes: b.notes || "", status: b.status }) }); } catch (e) { console.error(e); }
};

export default function AdminNettoyage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [draft, setDraft] = useState<Booking | null>(null);
  const [draftConfig, setDraftConfig] = useState<PricingConfig>(defaultPricingConfig);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(defaultPricingConfig);
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "gerence">("details");
  const [saved, setSaved] = useState(false);
  const [promoStart, setPromoStart] = useState(new Date().toISOString().split("T")[0]);
  const [promoEnd, setPromoEnd] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [globalPromo, setGlobalPromo] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const currency = pricingConfig.unite || "CDF";
  const fmtStoredAmount = (raw: string) => {
    if (!raw) return "—";
    if (raw.includes("CDF") || raw.includes("FC")) return raw;
    const num = parseFloat(raw.replace(/[^\d.]/g, ""));
    if (isNaN(num)) return raw;
    return currency === "CDF"
      ? Math.round(num).toLocaleString("fr-FR") + " CDF"
      : num.toFixed(2) + " FC";
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const load = async () => {
      const token = getToken(); if (!token) return;
      const h = { Authorization: `Bearer ${token}` };
      try {
        const r = await fetch(`${API}/admin/nettoyage/bookings`, { headers: h });
        if (r.ok) {
          const rows = await r.json();
          if (rows.length > 0) setBookings(rows.map((row: Record<string, unknown>, i: number) => ({
            id: (row.id as number) || i + 1, client: (row.full_name as string) || "",
            email: (row.email as string) || "", address: (row.address as string) || "",
            company: (row.company as string) || "",
            surface: ((row.surface as string) || "small") as "small" | "medium" | "large",
            duration: (row.duration as number) || 2, date: (row.date as string) || "",
            time: (row.time as string) || "", status: ((row.status as string) || "pending") as Booking["status"],
            amount: (row.amount as string) || "", notes: (row.notes as string) || "",
            startDate: (row.start_date as string) || "",
          })));
        }
      } catch (e) { console.error(e); }
      try {
        const r = await fetch(`${API}/admin/nettoyage/config`, { headers: h });
        if (r.ok) {
          const d = await r.json();
          if (d.pricingConfig) setPricingConfig(d.pricingConfig);
          if (d.globalPromo) {
            const toFR = (s: string) => (!s || s.includes("/")) ? s : new Date(s).toLocaleDateString("fr-FR");
            setGlobalPromo({ type: d.globalPromo.type, percent: d.globalPromo.percent, startsAt: toFR(d.globalPromo.startsAt), endsAt: toFR(d.globalPromo.endsAt) });
          }
        }
      } catch (e) { console.error(e); }
      try {
        const r = await fetch(`${API}/admin/nettoyage/discounts`, { headers: h });
        if (r.ok) {
          const ds = await r.json();
          if (ds.length > 0) setBookings(prev => prev.map(b => {
            const d = ds.find((x: { email: string }) => x.email.toLowerCase() === b.email.toLowerCase());
            return d ? { ...b, discount: { type: d.discount_type, percent: d.percent, startsAt: new Date(d.starts_at).toLocaleDateString("fr-FR"), endsAt: new Date(d.ends_at).toLocaleDateString("fr-FR") } } : b;
          }));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  useEffect(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const parseFR = (d: string) => { const [day, month, year] = d.split("/"); return new Date(`${year}-${month}-${day}`); };
    if (globalPromo?.endsAt && parseFR(globalPromo.endsAt) < now) { setGlobalPromo(null); return; }
    setBookings(prev => {
      let changed = false;
      const updated = prev.map(b => {
        let s = b; let dirty = false;
        if (s.discount?.endsAt && parseFR(s.discount.endsAt) < now) { s = { ...s, discount: undefined }; dirty = true; }
        if (s.globalDiscount?.endsAt && parseFR(s.globalDiscount.endsAt) < now) { s = { ...s, globalDiscount: undefined }; dirty = true; }
        if (dirty) changed = true; return s;
      });
      return changed ? updated : prev;
    });
  }, [pricingConfig, globalPromo]);

  const prevIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (selected && selected.id !== prevIdRef.current) {
      setDragPos(null); setModalTab("details"); setDraft({ ...selected }); setDraftConfig({ ...pricingConfig }); setSaved(false);
    }
    prevIdRef.current = selected?.id ?? null;
  }, [selected]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const cx = dragPos?.x ?? 0; const cy = dragPos?.y ?? 0;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: cx, origY: cy };
    const onMove = (ev: MouseEvent) => { if (!dragRef.current) return; setDragPos({ x: dragRef.current.origX + (ev.clientX - dragRef.current.startX), y: dragRef.current.origY + (ev.clientY - dragRef.current.startY) }); };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [dragPos]);

  const calcAmount = (s: "small" | "medium" | "large", cfg?: PricingConfig) =>
    `${(cfg || pricingConfig)[s].price} ${currency}/seance`;
  const calcFinalAmount = (b: Booking, cfg?: PricingConfig) => {
    const c = cfg || pricingConfig; let base = parseInt(c[b.surface].price) || 0;
    if (b.globalDiscount) base = Math.round(base * (1 - b.globalDiscount.percent / 100));
    if (b.discount) base = Math.round(base * (1 - b.discount.percent / 100));
    return `${base} ${currency}/seance`;
  };

  const updateStatus = (id: number, status: Booking["status"]) => {
    const b = bookings.find(bk => bk.id === id); if (!b) return;
    const updated = { ...b, status };
    setBookings(prev => prev.map(bk => bk.id === id ? updated : bk));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    saveBookingToAPI(updated);
  };

  const deleteBooking = (b: Booking) => {
    setBookings(prev => prev.filter(bk => bk.id !== b.id));
    if (selected?.id === b.id) setSelected(null);
    setDeleteConfirm(null);
    (async () => { try { const t = getToken(); if (!t) return; await fetch(`${API}/admin/nettoyage/bookings/${encodeURIComponent(b.email)}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); } catch (e) { console.error(e); } })();
  };

  const filtered = bookings.filter(b => {
    if (filter !== "all" && b.status !== filter) return false;
    const q = search.toLowerCase();
    if (q && !b.client.toLowerCase().includes(q) && !b.email.toLowerCase().includes(q) && !b.address.toLowerCase().includes(q)) return false;
    return true;
  });
  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  if (!mounted) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nettoyage de bureau</h1>
          <p className="text-sm text-[var(--text-muted)]">Gestion des reservations de nettoyage</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total reservations", value: counts.all, icon: SparklesIcon, color: "bg-sky-500" },
          { label: "En attente", value: counts.pending, icon: ClockIcon, color: "bg-amber-500" },
          { label: "Terminees", value: counts.completed, icon: CheckCircleIcon, color: "bg-emerald-500" },
          { label: "Annulees", value: counts.cancelled, icon: XCircleIcon, color: "bg-red-500" },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className={`w-9 h-9 rounded-xl ${k.color} flex items-center justify-center mb-3`}><k.icon className="w-5 h-5 text-white" /></div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{k.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par client, email ou adresse..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filter === s ? "bg-sky-600 text-white" : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
              {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
              <span className="ml-1.5 text-xs opacity-70">{counts[s as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4"><SparklesIcon className="w-7 h-7 text-sky-500" /></div>
            <p className="text-[var(--text-secondary)] font-medium">Aucune reservation</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Les reservations clients apparaitront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {["Client", "Surface", "Date & Heure", "Duree", "Montant", "Statut", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-[var(--bg-hover)] transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 font-bold text-xs">
                          {b.client.split(" ").map((n: string) => n[0]).join("").slice(0, 3)}
                        </div>
                        <div><p className="text-sm font-medium text-[var(--text-primary)]">{b.client}</p><p className="text-xs text-[var(--text-muted)]">{b.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{SURFACE_LABELS[b.surface] ?? b.surface}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{b.date} a {b.time}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{b.duration}h</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{fmtStoredAmount(b.amount)}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[b.status].color}`}>{STATUS_CONFIG[b.status].label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {b.status === "pending" && <button onClick={() => updateStatus(b.id, "confirmed")} title="Confirmer" className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-all"><CheckCircleIcon className="w-4 h-4" /></button>}
                        {b.status === "confirmed" && <button onClick={() => updateStatus(b.id, "completed")} title="Termine" className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-all"><ArrowPathIcon className="w-4 h-4" /></button>}
                        {(b.status === "pending" || b.status === "confirmed") && <button onClick={() => updateStatus(b.id, "cancelled")} title="Annuler" className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 transition-all"><XCircleIcon className="w-4 h-4" /></button>}
                        {b.status === "cancelled" && <button onClick={() => updateStatus(b.id, "pending")} title="Reouvrir" className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 hover:bg-amber-200 transition-all"><ArrowPathIcon className="w-4 h-4" /></button>}
                        <button onClick={() => setSelected(b)} title="Details" className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-all"><EyeIcon className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(b)} title="Supprimer" className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 transition-all"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mounted && selected && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { setDraft(null); setSelected(null); }}>
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] border-[0.5px] border-gray-300/50 dark:border-gray-500/30"
            style={dragPos ? { transform: `translate(${dragPos.x}px, ${dragPos.y}px)` } : undefined}
            onClick={e => e.stopPropagation()}>
            <div className="shrink-0 px-6 pt-5 pb-4 cursor-grab active:cursor-grabbing select-none bg-white dark:bg-gray-900 rounded-t-3xl border-b border-[0.5px] border-gray-300/30 dark:border-gray-500/20" onMouseDown={onDragStart}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg ${selected.status === "completed" ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white" : selected.status === "pending" ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : selected.status === "confirmed" ? "bg-gradient-to-br from-sky-400 to-sky-600 text-white" : "bg-gradient-to-br from-red-400 to-red-600 text-white"}`}>
                  {selected.client.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selected.client}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selected.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[selected.status].color}`}>{STATUS_CONFIG[selected.status].label}</span>
                  <button onClick={() => { setDraft(null); setSelected(null); }} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"><XMarkIcon className="w-4 h-4 text-gray-500" /></button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {(["details", "gerence"] as const).map(tab => (
                  <button key={tab} onClick={() => setModalTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${modalTab === tab ? "bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/5"}`}>
                    {tab === "details" ? "Details" : "Gerence"}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              {modalTab === "details" && (<>
                {selected.status === "pending" && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center"><ExclamationTriangleIcon className="w-5 h-5 text-amber-600" /></div>
                    <div className="flex-1"><p className="text-sm font-semibold text-amber-800 dark:text-amber-300">En attente de confirmation</p></div>
                    <button onClick={() => updateStatus(selected.id, "confirmed")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium text-sm hover:from-emerald-600 hover:to-green-700 transition-all"><CheckCircleIcon className="w-4 h-4" /> Confirmer</button>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1"><span className="text-sm font-semibold text-gray-800 dark:text-white">Details reservation</span></div>
                  <div className="divide-y divide-white/30 dark:divide-white/5">
                    {[
                      { label: "Surface", value: SURFACE_LABELS[selected.surface] ?? selected.surface },
                      { label: "Duree", value: `${selected.duration}h` },
                      { label: "Date et heure", value: `${selected.date} a ${selected.time}` },
                      { label: "Montant", value: fmtStoredAmount(selected.amount) },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1"><span className="text-sm font-semibold text-gray-800 dark:text-white">Localisation</span></div>
                  <div className="divide-y divide-white/30 dark:divide-white/5">
                    {[{ label: "Adresse", value: selected.address || "Non renseignee" }, ...(selected.company ? [{ label: "Entreprise", value: selected.company }] : [])].map(item => (
                      <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.notes && <p className="px-4 py-3 rounded-xl bg-white/10 dark:bg-white/5 text-sm text-gray-500 dark:text-gray-400 italic">{selected.notes}</p>}
              </>)}

              {modalTab === "gerence" && draft && (<>
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1"><span className="text-sm font-semibold text-gray-800 dark:text-white">Changer la formule</span></div>
                  <div className="grid grid-cols-3 gap-3 px-4 py-3">
                    {(["small", "medium", "large"] as const).map(s => {
                      const info = {
                        small: { label: "Petit", color: "from-gray-400 to-gray-500", desc: `${draftConfig.small.price} ${currency}`, sub: `${draftConfig.small.duration}h` },
                        medium: { label: "Moyen", color: "from-sky-400 to-sky-600", desc: `${draftConfig.medium.price} ${currency}`, sub: `${draftConfig.medium.duration}h` },
                        large: { label: "Grand", color: "from-indigo-400 to-indigo-600", desc: `${draftConfig.large.price} ${currency}`, sub: `${draftConfig.large.duration}h` },
                      };
                      const isActive = draft.surface === s;
                      return (
                        <button key={s} onClick={() => { if (!isActive) { setDraft({ ...draft, surface: s, duration: draftConfig[s].duration, amount: calcAmount(s, draftConfig) }); setSaved(false); } }}
                          className={`relative p-3 rounded-xl border text-center transition-all ${isActive ? "border-white/40 dark:border-white/20 bg-white/20 dark:bg-white/10 ring-2 ring-sky-400/50" : "border-white/20 dark:border-white/5 hover:bg-white/10"}`}>
                          {isActive && <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center"><span className="text-white text-xs">v</span></div>}
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${info[s].color} flex items-center justify-center`}><span className="text-white text-xs font-bold">{info[s].label[0]}</span></div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{info[s].label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{info[s].desc}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{info[s].sub}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1"><span className="text-sm font-semibold text-gray-800 dark:text-white">Promotions et remises</span></div>
                  <div className="px-4 py-3 space-y-3">
                    {draft.globalDiscount && (
                      <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/5 border border-purple-400/20">
                        <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{draft.globalDiscount.type}</span><span className="text-xs font-bold text-purple-600 dark:text-purple-400">-{draft.globalDiscount.percent}%</span></div>
                        <p className="text-[9px] text-purple-500/70 mt-0.5">Promotion globale</p>
                      </div>
                    )}
                    {draft.discount ? (
                      <>
                        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-400/20">
                          <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{draft.discount.type}</span><span className="text-xs font-bold text-amber-600 dark:text-amber-400">-{draft.discount.percent}%</span></div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Du {draft.discount.startsAt} au {draft.discount.endsAt}</p>
                        </div>
                        <button onClick={() => { const c = { ...draft, discount: undefined }; setDraft({ ...c, amount: calcFinalAmount(c, draftConfig) }); setSaved(false); }} className="w-full px-3 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all">Retirer la promotion individuelle</button>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {[{ label: "Remise 10%", percent: 10, type: "Remise fidelite" }, { label: "Remise 20%", percent: 20, type: "Remise parrainage" }, { label: "Remise 30%", percent: 30, type: "Promo speciale" }, { label: "Remise 50%", percent: 50, type: "Offre exceptionnelle" }].map(promo => (
                            <button key={promo.label} onClick={() => { const w = { ...draft, discount: { type: promo.type, percent: promo.percent, startsAt: new Date(promoStart).toLocaleDateString("fr-FR"), endsAt: new Date(promoEnd).toLocaleDateString("fr-FR") } }; setDraft({ ...w, amount: calcFinalAmount(w, draftConfig) }); setSaved(false); }}
                              className="p-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-white/15 hover:bg-amber-500/10 hover:border-amber-400/30 transition-all text-left">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{promo.label}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">{promo.type}</p>
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Debut</label><input type="date" value={promoStart} onChange={e => setPromoStart(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50" /></div>
                          <div><label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fin</label><input type="date" value={promoEnd} onChange={e => setPromoEnd(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50" /></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1"><span className="text-sm font-semibold text-gray-800 dark:text-white">Resume facturation</span></div>
                  <div className="grid grid-cols-3 gap-3 px-4 py-3">
                    {[{ label: "Montant", value: draft.amount, color: "from-emerald-400 to-green-500" }, { label: "Duree", value: `${draft.duration}h`, color: "from-sky-400 to-sky-500" }, { label: "Date", value: draft.date || "-", color: "from-purple-400 to-purple-500" }].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-xl bg-white/10 dark:bg-white/5">
                        <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${s.color}`}></div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-[0.5px] border-gray-300/30 dark:border-gray-500/20 bg-white/10 dark:bg-gray-900/10 rounded-b-3xl flex gap-3">
              {modalTab === "gerence" ? (
                <>
                  <button onClick={() => {
                    if (draft && draftConfig) {
                      const final = { ...draft, amount: calcFinalAmount(draft, draftConfig) };
                      setBookings(prev => prev.map(b => b.id === final.id ? final : b));
                      setSelected(final); setPricingConfig(draftConfig); setSaved(true);
                      if (final.discount) saveDiscountToAPI(final.email, final.discount.type, final.discount.percent, final.discount.startsAt, final.discount.endsAt);
                      else removeDiscountFromAPI(final.email);
                      saveConfigToAPI(draftConfig); saveBookingToAPI(final);
                    }
                  }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all text-sm shadow-lg ${saved ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700"}`}>
                    {saved ? "Enregistre" : "Enregistrer"}
                  </button>
                  <button onClick={() => { setDraft(null); setSelected(null); }} className="px-6 py-2.5 rounded-xl border border-white/20 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/30 transition-all">Fermer</button>
                </>
              ) : (
                <button onClick={() => { setDraft(null); setSelected(null); }} className="ml-auto px-6 py-2.5 rounded-xl border border-white/20 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/30 transition-all">Fermer</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4"><ExclamationTriangleIcon className="w-7 h-7 text-red-600" /></div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer cette reservation ?</h3>
              <p className="text-sm text-[var(--text-muted)]">Suppression definitive de la reservation de <span className="font-semibold">{deleteConfirm.client}</span>.</p>
              <p className="text-sm text-red-500 mt-2 font-medium">Cette action est irreversible.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">Annuler</button>
              <button onClick={() => deleteBooking(deleteConfirm)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm"><TrashIcon className="w-4 h-4" /> Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
