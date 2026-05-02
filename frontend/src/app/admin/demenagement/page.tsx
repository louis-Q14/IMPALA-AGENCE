"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, XCircleIcon, ClockIcon,
  ArrowPathIcon, XMarkIcon, TruckIcon, ExclamationTriangleIcon, TrashIcon,
} from "@heroicons/react/24/outline";

interface PricingConfig {
  studio: { label: string; price: string; duration: number };
  appartement: { label: string; price: string; duration: number };
  bureau: { label: string; price: string; duration: number };
  maison: { label: string; price: string; duration: number };
  unite?: string;
}

const defaultPricingConfig: PricingConfig = {
  studio: { label: "Studio / F1", price: "80", duration: 3 },
  appartement: { label: "Appartement F2-F3", price: "150", duration: 6 },
  bureau: { label: "Bureau / Open space", price: "200", duration: 8 },
  maison: { label: "Grande maison / villa", price: "300", duration: 12 },
  unite: "CDF",
};

interface Booking {
  id: number;
  client: string;
  email: string;
  addressFrom: string;
  addressTo: string;
  volume: "studio" | "appartement" | "bureau" | "maison";
  extras?: string[];
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

const VOLUME_LABELS: Record<string, string> = {
  studio: "Studio / F1",
  appartement: "Appartement F2-F3",
  bureau: "Bureau / Open space",
  maison: "Grande maison / villa",
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
    await fetch(`${API}/admin/demenagement/discounts`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, discountType, percent, startsAt: toISO(startsAt), endsAt: toISO(endsAt) }) });
  } catch (e) { console.error(e); }
};
const removeDiscountFromAPI = async (email: string) => {
  try { const token = getToken(); if (!token) return; await fetch(`${API}/admin/demenagement/discounts/${encodeURIComponent(email)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
};
const saveConfigToAPI = async (config: PricingConfig) => {
  try { const token = getToken(); if (!token) return; await fetch(`${API}/admin/demenagement/config`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ pricingConfig: config }) }); } catch (e) { console.error(e); }
};
const saveBookingToAPI = async (b: Booking) => {
  try { const token = getToken(); if (!token) return; await fetch(`${API}/admin/demenagement/bookings`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: b.email, fullName: b.client, addressFrom: b.addressFrom, addressTo: b.addressTo, volume: b.volume, extras: b.extras || [], duration: b.duration, date: b.date || "", time: b.time || "", amount: b.amount || "", notes: b.notes || "", status: b.status }) }); } catch (e) { console.error(e); }
};

export default function AdminDemenagement() {
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const load = async () => {
      const token = getToken(); if (!token) return;
      const h = { Authorization: `Bearer ${token}` };
      try {
        const r = await fetch(`${API}/admin/demenagement/bookings`, { headers: h });
        if (r.ok) {
          const rows = await r.json();
          if (rows.length > 0) setBookings(rows.map((row: Record<string, unknown>, i: number) => ({
            id: (row.id as number) || i + 1, client: (row.full_name as string) || "",
            email: (row.email as string) || "", addressFrom: (row.address_from as string) || "",
            addressTo: (row.address_to as string) || "",
            volume: ((row.volume as string) || "studio") as "studio" | "appartement" | "bureau" | "maison",
            extras: (row.extras as string[]) || [],
            duration: (row.duration as number) || 4, date: (row.date as string) || "",
            time: (row.time as string) || "", status: ((row.status as string) || "pending") as Booking["status"],
            amount: (row.amount as string) || "", notes: (row.notes as string) || "",
          })));
        }
      } catch (e) { console.error(e); }
      try {
        const r = await fetch(`${API}/admin/demenagement/config`, { headers: h });
        if (r.ok) { const d = await r.json(); if (d.pricingConfig) setPricingConfig(d.pricingConfig); if (d.globalPromo) { const toFR = (s: string) => (!s || s.includes("/")) ? s : new Date(s).toLocaleDateString("fr-FR"); setGlobalPromo({ type: d.globalPromo.type, percent: d.globalPromo.percent, startsAt: toFR(d.globalPromo.startsAt), endsAt: toFR(d.globalPromo.endsAt) }); } }
      } catch (e) { console.error(e); }
      try {
        const r = await fetch(`${API}/admin/demenagement/discounts`, { headers: h });
        if (r.ok) { const ds = await r.json(); if (ds.length > 0) setBookings(prev => prev.map(b => { const d = ds.find((x: { email: string }) => x.email.toLowerCase() === b.email.toLowerCase()); return d ? { ...b, discount: { type: d.discount_type, percent: d.percent, startsAt: new Date(d.starts_at).toLocaleDateString("fr-FR"), endsAt: new Date(d.ends_at).toLocaleDateString("fr-FR") } } : b; })); }
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  useEffect(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const parseFR = (d: string) => { const [day, month, year] = d.split("/"); return new Date(`${year}-${month}-${day}`); };
    if (globalPromo?.endsAt && parseFR(globalPromo.endsAt) < now) { setGlobalPromo(null); return; }
    setBookings(prev => { let changed = false; const updated = prev.map(b => { let s = b; let dirty = false; if (s.discount?.endsAt && parseFR(s.discount.endsAt) < now) { s = { ...s, discount: undefined }; dirty = true; } if (s.globalDiscount?.endsAt && parseFR(s.globalDiscount.endsAt) < now) { s = { ...s, globalDiscount: undefined }; dirty = true; } if (dirty) changed = true; return s; }); return changed ? updated : prev; });
  }, [pricingConfig, globalPromo]);

  const prevIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (selected && selected.id !== prevIdRef.current) { setDragPos(null); setModalTab("details"); setDraft({ ...selected }); setDraftConfig({ ...pricingConfig }); setSaved(false); }
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

  const calcAmount = (v: "studio" | "appartement" | "bureau" | "maison", cfg?: PricingConfig) =>
    `${(cfg || pricingConfig)[v].price} ${currency}/prestation`;
  const calcFinalAmount = (b: Booking, cfg?: PricingConfig) => {
    const c = cfg || pricingConfig; let base = parseInt(c[b.volume].price) || 0;
    if (b.globalDiscount) base = Math.round(base * (1 - b.globalDiscount.percent / 100));
    if (b.discount) base = Math.round(base * (1 - b.discount.percent / 100));
    return `${base} ${currency}/prestation`;
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
    (async () => { try { const t = getToken(); if (!t) return; await fetch(`${API}/admin/demenagement/bookings/${encodeURIComponent(b.email)}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); } catch (e) { console.error(e); } })();
  };

  const filtered = bookings.filter(b => { if (filter !== "all" && b.status !== filter) return false; const q = search.toLowerCase(); if (q && !b.client.toLowerCase().includes(q) && !b.email.toLowerCase().includes(q) && !b.addressFrom.toLowerCase().includes(q)) return false; return true; });
  const counts = { all: bookings.length, pending: bookings.filter(b => b.status === "pending").length, confirmed: bookings.filter(b => b.status === "confirmed").length, completed: bookings.filter(b => b.status === "completed").length, cancelled: bookings.filter(b => b.status === "cancelled").length };

  if (!mounted) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
          <TruckIcon className="w-7 h-7 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Déménagement</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{bookings.length} réservation{bookings.length !== 1 ? "s" : ""} enregistrée{bookings.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.all, icon: TruckIcon, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/20" },
          { label: "En attente", value: counts.pending, icon: ClockIcon, color: "text-amber-500", bg: "bg-amber-500/10 dark:bg-amber-500/20" },
          { label: "Confirmés", value: counts.confirmed, icon: CheckCircleIcon, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
          { label: "Terminés", value: counts.completed, icon: CheckCircleIcon, color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className={`p-2 rounded-xl ${kpi.bg}`}><kpi.icon className={`w-6 h-6 ${kpi.color}`} /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client, email, adresse..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === f ? "bg-orange-500 text-white shadow" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
              {f === "all" ? `Tous (${counts.all})` : f === "pending" ? `En attente (${counts.pending})` : f === "confirmed" ? `Confirmés (${counts.confirmed})` : f === "in_progress" ? "En cours" : f === "completed" ? `Terminés (${counts.completed})` : `Annulés (${counts.cancelled})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {["Client", "Volume", "Trajet", "Date & Heure", "Montant", "Statut", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">Aucune réservation trouvée</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{b.client}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{b.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">{VOLUME_LABELS[b.volume]}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="text-xs text-gray-700 dark:text-gray-300 truncate"><span className="text-green-500">●</span> {b.addressFrom}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 truncate"><span className="text-red-500">●</span> {b.addressTo}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    <div>{b.date}</div><div>{b.time}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white">{calcFinalAmount(b)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_CONFIG[b.status].color}`}>{STATUS_CONFIG[b.status].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(b)} title="Voir détails" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-orange-500 transition-colors"><EyeIcon className="w-4 h-4" /></button>
                      {b.status === "pending" && <button onClick={() => updateStatus(b.id, "confirmed")} title="Confirmer" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-500 transition-colors"><CheckCircleIcon className="w-4 h-4" /></button>}
                      {b.status === "confirmed" && <button onClick={() => updateStatus(b.id, "in_progress")} title="Démarrer" className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-500 hover:text-violet-500 transition-colors"><ArrowPathIcon className="w-4 h-4" /></button>}
                      {(b.status === "in_progress" || b.status === "confirmed") && <button onClick={() => updateStatus(b.id, "completed")} title="Terminer" className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-500 hover:text-emerald-500 transition-colors"><CheckCircleIcon className="w-4 h-4" /></button>}
                      {b.status !== "cancelled" && b.status !== "completed" && <button onClick={() => updateStatus(b.id, "cancelled")} title="Annuler" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"><XCircleIcon className="w-4 h-4" /></button>}
                      <button onClick={() => setDeleteConfirm(b)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal */}
      {selected && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg mx-4 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden"
            style={dragPos ? { transform: `translate(${dragPos.x}px,${dragPos.y}px)` } : undefined}
          >
            {/* Drag handle */}
            <div onMouseDown={onDragStart} className="cursor-grab active:cursor-grabbing px-6 pt-5 pb-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20"><TruckIcon className="w-5 h-5 text-orange-500" /></div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{selected.client}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 gap-2 border-b border-gray-100 dark:border-gray-700">
              {(["details", "gerence"] as const).map(tab => (
                <button key={tab} onClick={() => setModalTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 ${modalTab === tab ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                  {tab === "details" ? "Détails" : "Gérence"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {modalTab === "details" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volume</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{VOLUME_LABELS[selected.volume]}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Statut</p>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_CONFIG[selected.status].color}`}>{STATUS_CONFIG[selected.status].label}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{selected.date}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Heure</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{selected.time}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Trajet</p>
                    <div className="flex items-start gap-2 text-sm"><span className="text-green-500 mt-0.5">●</span><div><p className="text-xs text-gray-400">Départ</p><p className="font-medium text-gray-900 dark:text-white">{selected.addressFrom}</p></div></div>
                    <div className="flex items-start gap-2 text-sm"><span className="text-red-500 mt-0.5">●</span><div><p className="text-xs text-gray-400">Arrivée</p><p className="font-medium text-gray-900 dark:text-white">{selected.addressTo}</p></div></div>
                  </div>
                  {selected.extras && selected.extras.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Extras</p>
                      <div className="flex flex-wrap gap-1">{selected.extras.map(x => <span key={x} className="px-2 py-0.5 rounded-lg text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">{x}</span>)}</div>
                    </div>
                  )}
                  {selected.notes && (
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selected.notes}</p>
                    </div>
                  )}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Montant final</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{calcFinalAmount(selected)}</p>
                  </div>
                </>
              ) : (
                draft && (
                  <div className="space-y-5">
                    {/* Volume tiers */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Changer le volume</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: "studio", label: "Studio / F1", gradient: "from-gray-400 to-gray-600" },
                          { key: "appartement", label: "Appart F2-F3", gradient: "from-orange-400 to-orange-600" },
                          { key: "bureau", label: "Bureau", gradient: "from-amber-500 to-orange-600" },
                          { key: "maison", label: "Grande maison", gradient: "from-red-500 to-orange-700" },
                        ] as const).map(t => (
                          <button key={t.key} onClick={() => setDraft(d => d ? { ...d, volume: t.key, amount: calcAmount(t.key, draftConfig) } : d)}
                            className={`relative p-3 rounded-2xl text-left transition-all border-2 ${draft.volume === t.key ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-transparent"}`}>
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradient} opacity-10`} />
                            <p className="text-xs font-bold text-gray-900 dark:text-white relative">{t.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 relative">{draftConfig[t.key].price} {currency}</p>
                            {draft.volume === t.key && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center"><CheckCircleIcon className="w-3 h-3 text-white" /></div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Promotions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Promotion individuelle</p>
                      {draft.discount ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">-{draft.discount.percent}% ({draft.discount.type})</p>
                            <p className="text-xs text-gray-500">{draft.discount.startsAt} → {draft.discount.endsAt}</p>
                          </div>
                          <button onClick={() => { setDraft(d => d ? { ...d, discount: undefined } : d); removeDiscountFromAPI(draft.email); }} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            {[{ label: "-10%", v: 10 }, { label: "-20%", v: 20 }, { label: "-30%", v: 30 }].map(p => (
                              <button key={p.v} onClick={() => { const s = promoStart.split("-").reverse().join("/"); const e = promoEnd.split("-").reverse().join("/"); const d = { type: "Promo", percent: p.v, startsAt: s, endsAt: e }; setDraft(dr => dr ? { ...dr, discount: d } : dr); saveDiscountToAPI(draft.email, "Promo", p.v, s, e); }}
                                className="py-2 rounded-xl text-sm font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">{p.label}</button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><p className="text-xs text-gray-400 mb-1">Début</p><input type="date" value={promoStart} onChange={e => setPromoStart(e.target.value)} className="w-full px-2 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50" /></div>
                            <div><p className="text-xs text-gray-400 mb-1">Fin</p><input type="date" value={promoEnd} onChange={e => setPromoEnd(e.target.value)} className="w-full px-2 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50" /></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Global promo */}
                    {globalPromo && (
                      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-3">
                        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-1">Promotion globale active</p>
                        <p className="text-sm font-bold text-violet-700 dark:text-violet-300">-{globalPromo.percent}% ({globalPromo.type})</p>
                        <p className="text-xs text-gray-500">{globalPromo.startsAt} → {globalPromo.endsAt}</p>
                      </div>
                    )}

                    {/* Billing summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Récapitulatif</p>
                      <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Tarif de base</span><span className="font-medium text-gray-900 dark:text-white">{draftConfig[draft.volume].price} {currency}</span></div>
                      {draft.globalDiscount && <div className="flex justify-between text-sm"><span className="text-violet-600 dark:text-violet-400">Promo globale (-{draft.globalDiscount.percent}%)</span><span className="font-medium text-violet-600 dark:text-violet-400">-{Math.round(parseInt(draftConfig[draft.volume].price) * draft.globalDiscount.percent / 100)} {currency}</span></div>}
                      {draft.discount && <div className="flex justify-between text-sm"><span className="text-amber-600 dark:text-amber-400">Promo individuelle (-{draft.discount.percent}%)</span><span className="font-medium text-amber-600 dark:text-amber-400">-{Math.round(parseInt(draftConfig[draft.volume].price) * draft.discount.percent / 100)} {currency}</span></div>}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between"><span className="font-bold text-gray-900 dark:text-white">Total</span><span className="font-bold text-orange-600 dark:text-orange-400">{calcFinalAmount(draft, draftConfig)}</span></div>
                    </div>

                    {/* Save */}
                    <button onClick={() => {
                      if (!draft) return;
                      const updated = { ...draft, amount: calcFinalAmount(draft, draftConfig) };
                      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
                      setSelected(updated); setPricingConfig(draftConfig); saveBookingToAPI(updated); saveConfigToAPI(draftConfig); setSaved(true);
                      setTimeout(() => setSaved(false), 2000);
                    }} className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${saved ? "bg-emerald-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"}`}>
                      {saved ? "✓ Enregistré !" : "Enregistrer les modifications"}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Delete confirmation */}
      {deleteConfirm && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30"><ExclamationTriangleIcon className="w-6 h-6 text-red-500" /></div>
              <h3 className="font-bold text-gray-900 dark:text-white">Supprimer la réservation</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Êtes-vous sûr de vouloir supprimer la réservation de <strong>{deleteConfirm.client}</strong> ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Annuler</button>
              <button onClick={() => deleteBooking(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-500/30 transition-all">Supprimer</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}