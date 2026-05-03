"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TYPES = [
  { value: "frais_fixe", label: "Frais fixe", color: "text-blue-600", bg: "bg-blue-500/10" },
  { value: "commission", label: "Commission", color: "text-violet-600", bg: "bg-violet-500/10" },
  { value: "abonnement", label: "Abonnement", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { value: "penalite", label: "Pénalité", color: "text-red-600", bg: "bg-red-500/10" },
  { value: "autre", label: "Autre", color: "text-gray-600", bg: "bg-gray-500/10" },
];

const SERVICES = [
  { value: "general", label: "Général" },
  { value: "immobilier", label: "Immobilier" },
  { value: "automobile", label: "Automobile" },
  { value: "poubelles", label: "Ramassage de poubelles" },
  { value: "nettoyage", label: "Nettoyage de bureau" },
  { value: "repassage", label: "Repassage à domicile" },
  { value: "demenagement", label: "Déménagement" },
  { value: "finance", label: "Finance" },
];

const UNITES = [
  { value: "CDF", label: "CDF (Franc Congolais)" },
  { value: "USD", label: "USD (Dollar)" },
  { value: "%", label: "% (Pourcentage)" },
];

interface Tarif {
  id: number;
  nom: string;
  type: "frais_fixe" | "commission" | "abonnement" | "penalite" | "autre";
  service: "general" | "immobilier" | "automobile" | "poubelles" | "nettoyage" | "repassage" | "demenagement" | "finance";
  montant: number;
  unite: "CDF" | "USD" | "%";
  description: string | null;
  actif: boolean;
  created_by_name: string | null;
}

const emptyForm = (): Partial<Tarif> => ({
  nom: "", type: "frais_fixe",
  montant: 0, unite: "CDF", description: "", actif: true,
});

export default function TarifsFraisPage() {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tarif | null>(null);
  const [form, setForm] = useState<Partial<Tarif>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tarifs-frais`, { headers });
      const data = await res.json();
      setTarifs(Array.isArray(data) ? data : []);
    } catch { setTarifs([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Poubelles plan config section
  const defaultPoubSection = {
    basic:    { label: "Basic",    price: "15", frequency: "1x/semaine", bins: 1, color: "from-gray-400 to-gray-500" },
    standard: { label: "Standard", price: "29", frequency: "2x/semaine", bins: 3, color: "from-blue-400 to-blue-600" },
    premium:  { label: "Premium",  price: "49", frequency: "3x/semaine", bins: 5, color: "from-purple-400 to-purple-600" },
    freqAdjust: { "2x/semaine": "25", "3x/semaine": "50", "Sp\u00e9ciale collecte": "75" },
    unite: "CDF",
  };
  const [poubSection, setPoubSection] = useState(defaultPoubSection);
  const [poubSectionSaved, setPoubSectionSaved] = useState(false);
  const [gpGlobal, setGpGlobal] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const [gpStart, setGpStart] = useState(new Date().toISOString().split("T")[0]);
  const [gpEnd, setGpEnd] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [gpSaved, setGpSaved] = useState(false);
  const [pendingPromo, setPendingPromo] = useState<{ type: string; percent: number; startsAt: string; endsAt: string } | null>(null);
  const [showPoubModal, setShowPoubModal] = useState(false);
  const [poubTab, setPoubTab] = useState<"formules" | "promotions">("formules");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch(`${API}/admin/trash/config`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.planConfig) {
          const pc = data.planConfig;
          setPoubSection({
            basic:    { label: "Basic",    price: pc.basic?.price    || "15", frequency: pc.basic?.frequency    || "1x/semaine", bins: pc.basic?.bins    ?? 1, color: "from-gray-400 to-gray-500" },
            standard: { label: "Standard", price: pc.standard?.price || "29", frequency: pc.standard?.frequency || "2x/semaine", bins: pc.standard?.bins ?? 3, color: "from-blue-400 to-blue-600" },
            premium:  { label: "Premium",  price: pc.premium?.price  || "49", frequency: pc.premium?.frequency  || "3x/semaine", bins: pc.premium?.bins  ?? 5, color: "from-purple-400 to-purple-600" },
            freqAdjust: pc.freqAdjust || { "2x/semaine": "25", "3x/semaine": "50", "Sp\u00e9ciale collecte": "75" },
            unite: pc.unite || "CDF",
          });
        }
        if (data?.globalPromo) {
          const toFR = (d: string) => { if (!d || d.includes("/")) return d; return new Date(d).toLocaleDateString("fr-FR"); };
          setGpGlobal({ ...data.globalPromo, startsAt: toFR(data.globalPromo.startsAt), endsAt: toFR(data.globalPromo.endsAt) });
        }
      }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setError(""); setShowForm(true); };
  const openEdit = (t: Tarif) => { setEditing(t); setForm({ ...t }); setError(""); setShowForm(true); };

  const handleSave = async () => {
    if (!form.nom || form.montant === undefined || !form.service) {
      setError("Le nom, le service et le montant sont requis."); return;
    }
    setSaving(true); setError("");
    try {
      const url = editing ? `${API}/tarifs-frais/${editing.id}` : `${API}/tarifs-frais`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); return; }
      setShowForm(false);
      load();
    } catch { setError("Erreur réseau."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce tarif ?")) return;
    await fetch(`${API}/tarifs-frais/${id}`, { method: "DELETE", headers });
    load();
  };

  const toggleActif = async (t: Tarif) => {
    await fetch(`${API}/tarifs-frais/${t.id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ ...t, actif: !t.actif }),
    });
    load();
  };

  const savePoubSection = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    let existing: Record<string, unknown> = {};
    try { const r = await fetch(`${API}/admin/trash/config`, { headers: h }); if (r.ok) { const d = await r.json(); existing = d.planConfig || {}; } } catch { /* */ }
    const planConfig = {
      basic:    { label: "Basic",    color: "from-gray-400 to-gray-500",     ...(existing as {basic?: object}).basic,    price: poubSection.basic.price,    frequency: poubSection.basic.frequency,    bins: poubSection.basic.bins },
      standard: { label: "Standard", color: "from-blue-400 to-blue-600",     ...(existing as {standard?: object}).standard, price: poubSection.standard.price, frequency: poubSection.standard.frequency, bins: poubSection.standard.bins },
      premium:  { label: "Premium",  color: "from-purple-400 to-purple-600", ...(existing as {premium?: object}).premium,  price: poubSection.premium.price,  frequency: poubSection.premium.frequency,  bins: poubSection.premium.bins },
      freqAdjust: poubSection.freqAdjust,
      unite: poubSection.unite,
    };
    await fetch(`${API}/admin/trash/config`, { method: "PUT", headers: h, body: JSON.stringify({ planConfig }) });
    setPoubSectionSaved(true);
    setTimeout(() => setPoubSectionSaved(false), 3000);
  };

  const saveGpGlobal = async (promo: typeof gpGlobal) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    let payload = null;
    if (promo) {
      const toISO = (d: string) => { if (d.includes("-")) return d; const [day, month, year] = d.split("/"); return `${year}-${month}-${day}`; };
      payload = { type: promo.type, percent: promo.percent, startsAt: toISO(promo.startsAt), endsAt: toISO(promo.endsAt) };
    }
    await fetch(`${API}/admin/trash/global-promo`, { method: "PUT", headers: h, body: JSON.stringify({ globalPromo: payload }) });
    setGpSaved(true);
    setTimeout(() => setGpSaved(false), 3000);
  };

  const filtered = tarifs.filter(t => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchService = filterService === "all" || t.service === filterService;
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchService && matchType;
  });

  const totalActifs = tarifs.filter(t => t.actif).length;
  const fmt = (t: Tarif) =>
    t.unite === "%" ? `${t.montant} %` :
    `${Number(t.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${t.unite}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tarification & Frais</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {tarifs.length} tarif(s) — <span className="text-emerald-600 font-medium">{totalActifs} actif(s)</span>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all"
        >
          <PlusIcon className="w-4 h-4" /> Nouveau tarif
        </button>
      </div>

      {/* KPI par service */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SERVICES.map(s => {
          const count = tarifs.filter(t => t.service === s.value && t.actif).length;
          return (
            <div key={s.value} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
              <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{count}</p>
              <p className="text-xs text-[var(--text-muted)]">actif(s)</p>
            </div>
          );
        })}
      </div>

            {/* Formules Poubelles Modal */}
      {showPoubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPoubModal(false)}>
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl
              bg-white/20 dark:bg-gray-900/20 backdrop-blur-2xl
              shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]
              border-[0.5px] border-gray-300/50 dark:border-gray-500/30"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-6 pt-5 pb-3 bg-white dark:bg-gray-900 rounded-t-3xl border-b border-gray-300/30 dark:border-gray-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white text-lg">🗑️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Formules d&apos;abonnement Poubelles</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Configuration par défaut appliquée à tous les utilisateurs</p>
                  </div>
                </div>
                <button onClick={() => setShowPoubModal(false)} className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-1 bg-gray-200/50 dark:bg-white/5 rounded-xl p-1">
                {([
                  { key: "formules" as const, label: "Formules", icon: "📋" },
                  { key: "promotions" as const, label: "Promotions globales", icon: "🏷️" },
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setPoubTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${poubTab === tab.key ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Content */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {poubTab === "formules" ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 flex-1 mr-4">
                      <span className="text-purple-500">📋</span>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Définition des formules</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Devise :</label>
                      <select value={poubSection.unite} onChange={e => { setPoubSection(prev => ({ ...prev, unite: e.target.value })); setPoubSectionSaved(false); }}
                        className="px-2 py-1 rounded-lg border border-gray-300/50 dark:border-white/10 bg-white/10 dark:bg-white/5 text-xs text-gray-900 dark:text-white focus:outline-none">
                        <option value="CDF">CDF</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(["basic", "standard", "premium"] as const).map(key => {
                      const f = poubSection[key];
                      return (
                        <div key={key} className="p-4 rounded-xl bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0`}>
                              <span className="text-white text-xs font-bold">{f.label[0]}</span>
                            </div>
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white">{f.label}</h5>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Prix ({poubSection.unite}/mois)</label>
                              <input type="text" value={f.price}
                                onChange={e => { setPoubSection(prev => ({ ...prev, [key]: { ...prev[key], price: e.target.value.replace(/[^0-9]/g, "") } })); setPoubSectionSaved(false); }}
                                className="w-full px-3 py-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fréquence</label>
                              <select value={f.frequency}
                                onChange={e => { setPoubSection(prev => ({ ...prev, [key]: { ...prev[key], frequency: e.target.value } })); setPoubSectionSaved(false); }}
                                className="w-full px-3 py-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
                                <option value="1x/semaine">1x/semaine</option>
                                <option value="2x/semaine">2x/semaine</option>
                                <option value="3x/semaine">3x/semaine</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Bacs</label>
                              <input type="number" min={1} max={10} value={f.bins}
                                onChange={e => { setPoubSection(prev => ({ ...prev, [key]: { ...prev[key], bins: parseInt(e.target.value) || 1 } })); setPoubSectionSaved(false); }}
                                className="w-full px-3 py-2 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8">
                    <span className="text-indigo-500">🔄</span>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Surcharge fréquence de collecte</h4>
                  </div>
                  <p className="px-4 text-[10px] text-gray-500 dark:text-gray-400">Pourcentage appliqué si le client change la fréquence incluse dans sa formule</p>
                  <div className="space-y-2 px-2">
                    {([
                      { key: "2x/semaine" as const, label: "2x/semaine", color: "from-blue-400 to-blue-500" },
                      { key: "3x/semaine" as const, label: "3x/semaine", color: "from-purple-400 to-purple-500" },
                      { key: "Spéciale collecte" as const, label: "Spéciale collecte", color: "from-amber-400 to-orange-500" },
                    ]).map(item => (
                      <div key={item.key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[10px] font-bold">%</span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.label}</span>
                        <div className="relative w-24">
                          <input type="text" value={poubSection.freqAdjust[item.key]}
                            onChange={e => { setPoubSection(prev => ({ ...prev, freqAdjust: { ...prev.freqAdjust, [item.key]: e.target.value.replace(/[^0-9]/g, "") } })); setPoubSectionSaved(false); }}
                            className="w-full pl-3 pr-7 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {gpGlobal ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8">
                        <span className="text-amber-500">🏷️</span>
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Promotion active</h4>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-700 dark:text-amber-300">{gpGlobal.type}</span>
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">-{gpGlobal.percent}%</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Du <span className="font-semibold">{gpGlobal.startsAt}</span> au <span className="font-semibold">{gpGlobal.endsAt}</span></p>
                      </div>
                      <button onClick={async () => { setGpGlobal(null); await saveGpGlobal(null); }}
                        className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-400/20 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all">
                        Retirer la promotion globale
                      </button>
                      {gpSaved && <p className="text-xs text-center text-emerald-600 font-medium">✓ Promotion retirée</p>}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8">
                        <span className="text-amber-500">🏷️</span>
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Appliquer une promotion globale</h4>
                      </div>
                      <p className="px-4 text-[10px] text-gray-500 dark:text-gray-400">
                        Sera appliquée automatiquement à tous les abonnés actifs. Retirée automatiquement à la date de fin.
                      </p>
                      <div className="grid grid-cols-2 gap-3 px-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Début</label>
                          <input type="date" value={gpStart} onChange={e => setGpStart(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fin</label>
                          <input type="date" value={gpEnd} onChange={e => setGpEnd(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-2">
                        {[
                          { label: "Remise 10%", percent: 10, type: "Promo globale -10%" },
                          { label: "Remise 20%", percent: 20, type: "Promo globale -20%" },
                          { label: "Remise 30%", percent: 30, type: "Promo globale -30%" },
                          { label: "Remise 50%", percent: 50, type: "Promo globale -50%" },
                        ].map(promo => (
                          <button key={promo.label}
                            onClick={() => {
                              const startsAt = new Date(gpStart).toLocaleDateString("fr-FR");
                              const endsAt = new Date(gpEnd).toLocaleDateString("fr-FR");
                              setPendingPromo({ type: promo.type, percent: promo.percent, startsAt, endsAt });
                            }}
                            className={`p-3 rounded-xl border transition-all text-left ${pendingPromo?.percent === promo.percent ? "bg-amber-500/20 border-amber-400/50" : "bg-white/10 dark:bg-white/5 border-white/15 dark:border-white/5 hover:bg-amber-500/10 hover:border-amber-400/30"}`}>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{promo.label}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{promo.type}</p>
                          </button>
                        ))}
                      </div>
                      <div className="mx-2 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300">⚠️ Sélectionnez les dates, choisissez une remise puis cliquez sur <strong>Enregistrer</strong> pour l&apos;appliquer à tous les abonnés actifs.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-300/30 dark:border-gray-500/20 bg-white/10 dark:bg-gray-900/10 backdrop-blur-2xl rounded-b-3xl flex gap-3">
              <button onClick={() => setShowPoubModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/30 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 transition-all">
                Fermer
              </button>
              {poubTab === "formules" && (
                <button onClick={savePoubSection}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all text-sm shadow-lg ${poubSectionSaved ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"}`}>
                  {poubSectionSaved ? "✓ Enregistré & appliqué" : "Enregistrer & appliquer"}
                </button>
              )}
              {poubTab === "promotions" && !gpGlobal && (
                <button
                  onClick={async () => {
                    if (!pendingPromo) return;
                    setGpGlobal(pendingPromo);
                    await saveGpGlobal(pendingPromo);
                    setPendingPromo(null);
                  }}
                  disabled={!pendingPromo}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                    gpSaved ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  }`}>
                  {gpSaved ? "✓ Enregistré" : "Enregistrer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un tarif…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400"
          />
        </div>
        <select value={filterService} onChange={e => setFilterService(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:outline-none">
          <option value="all">Tous les services</option>
          {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:outline-none">
          <option value="all">Tous les types</option>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Aucun tarif trouvé.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Créé par</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map(t => {
                const typeInfo = TYPES.find(x => x.value === t.type) || TYPES[4];
                const serviceInfo = SERVICES.find(x => x.value === t.service) || SERVICES[0];
                return (
                  <tr key={t.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-[var(--text-muted)]" />
                        <div>
                          {t.nom}
                          {t.description && <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5 truncate max-w-xs">{t.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{serviceInfo.label}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{fmt(t)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActif(t)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${t.actif ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}`}>
                        {t.actif ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                        {t.actif ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{t.created_by_name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
              <h2 className="font-bold text-[var(--text-primary)]">{editing ? "Modifier le tarif" : "Nouveau tarif / frais"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Nom *</label>
                <input value={form.nom || ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Frais d'inscription, Commission vente…"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Type</label>
                  <select value={form.type || "frais_fixe"} onChange={e => setForm(f => ({ ...f, type: e.target.value as Tarif["type"] }))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Service</label>
                  <select value={form.service || ""} onChange={e => setForm(f => ({ ...f, service: e.target.value as Tarif["service"] }))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400">
                    <option value="" disabled>— Sélectionner un service —</option>
                    {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Montant *</label>
                  <input type="number" min="0" step="0.01" value={form.montant ?? ""} onChange={e => setForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Unité</label>
                  <select value={form.unite || "CDF"} onChange={e => setForm(f => ({ ...f, unite: e.target.value as Tarif["unite"] }))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400">
                    {UNITES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea rows={2} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-400 resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.actif !== false} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
                  className="w-4 h-4 rounded accent-violet-600" />
                <span className="text-sm text-[var(--text-secondary)]">Tarif actif</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all disabled:opacity-50">
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
