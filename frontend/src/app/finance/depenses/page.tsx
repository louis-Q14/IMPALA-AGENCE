"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  "Salaires", "Loyer", "Fournitures", "Marketing", "Infrastructure",
  "Maintenance", "Impôts & Taxes", "Assurances", "Transport", "Autres",
];

const STATUTS = [
  { value: "paye", label: "Payé", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckCircleIcon },
  { value: "en_attente", label: "En attente", color: "text-amber-600", bg: "bg-amber-500/10", icon: ClockIcon },
  { value: "annule", label: "Annulé", color: "text-red-500", bg: "bg-red-500/10", icon: ExclamationCircleIcon },
];

interface Depense {
  id: number;
  libelle: string;
  montant: number;
  categorie: string | null;
  date: string;
  description: string | null;
  statut: "paye" | "en_attente" | "annule";
  created_by_name: string | null;
}

interface Personnel {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
}

interface PrestationRow {
  personnel_id: string;
  nb_prestations: number;
  montant_unitaire: number | "";
  note: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  support_agent: "Agent Support",
  finance_agent: "Agent Finance",
  trash_agent: "Agent Poubelles",
};

const empty = (): Partial<Depense> => ({
  libelle: "", montant: 0, categorie: "", date: new Date().toISOString().split("T")[0],
  description: "", statut: "en_attente",
});

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Depense | null>(null);
  const [form, setForm] = useState<Partial<Depense>>(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Répartition salaires
  const [showPrestations, setShowPrestations] = useState(false);
  const [prestationsDepense, setPrestationsDepense] = useState<Depense | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [prestationRows, setPrestationRows] = useState<PrestationRow[]>([]);
  const [savingPrestations, setSavingPrestations] = useState(false);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/depenses`, { headers });
      const data = await res.json();
      setDepenses(Array.isArray(data) ? data : []);
    } catch { setDepenses([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty()); setError(""); setShowForm(true); };
  const openEdit = (d: Depense) => { setEditing(d); setForm({ ...d }); setError(""); setShowForm(true); };

  const loadPersonnel = useCallback(async () => {
    setLoadingPersonnel(true);
    try {
      const res = await fetch(`${API}/depenses/personnel`, { headers });
      const data = await res.json();
      const list: Personnel[] = Array.isArray(data) ? data : [];
      setPersonnel(list);
      return list;
    } catch { setPersonnel([]); return []; }
    finally { setLoadingPersonnel(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openPrestations = useCallback(async (dep: Depense) => {
    setPrestationsDepense(dep);
    setShowPrestations(true);
    const pList = await loadPersonnel();
    // Load existing prestations
    try {
      const res = await fetch(`${API}/depenses/${dep.id}/prestations`, { headers });
      const existing = await res.json();
      const rows: PrestationRow[] = pList.map(p => {
        const found = Array.isArray(existing) ? existing.find((e: { personnel_id: string }) => e.personnel_id === p.id) : null;
        return {
          personnel_id: p.id,
          nb_prestations: found ? found.nb_prestations : 0,
          montant_unitaire: found ? found.montant_unitaire : "",
          note: found ? (found.note || "") : "",
        };
      });
      setPrestationRows(rows);
    } catch {
      setPrestationRows(pList.map(p => ({ personnel_id: p.id, nb_prestations: 0, montant_unitaire: "", note: "" })));
    }
  }, [loadPersonnel]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePrestations = async () => {
    if (!prestationsDepense) return;
    setSavingPrestations(true);
    try {
      const filtered = prestationRows.filter(r => r.nb_prestations > 0);
      await fetch(`${API}/depenses/${prestationsDepense.id}/prestations`, {
        method: "POST", headers,
        body: JSON.stringify({ prestations: filtered }),
      });
      setShowPrestations(false);
    } catch { /* ignore */ }
    finally { setSavingPrestations(false); }
  };

  const handleSave = async () => {
    if (!form.libelle || !form.date || form.montant === undefined) {
      setError("Libellé, montant et date sont requis."); return;
    }
    setSaving(true); setError("");
    try {
      const url = editing ? `${API}/depenses/${editing.id}` : `${API}/depenses`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); return; }
      const saved: Depense = await res.json();
      setShowForm(false);
      load();
      // Si catégorie Salaires et nouvelle dépense, ouvrir le modal de répartition
      if (!editing && form.categorie === "Salaires") {
        openPrestations({ ...saved, created_by_name: null });
      }
    } catch { setError("Erreur réseau."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    await fetch(`${API}/depenses/${id}`, { method: "DELETE", headers });
    load();
  };

  const filtered = depenses.filter(d => {
    const matchSearch = d.libelle.toLowerCase().includes(search.toLowerCase()) ||
      (d.categorie || "").toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalPaye = depenses.filter(d => d.statut === "paye").reduce((s, d) => s + Number(d.montant), 0);
  const totalEnAttente = depenses.filter(d => d.statut === "en_attente").reduce((s, d) => s + Number(d.montant), 0);
  const totalAll = depenses.reduce((s, d) => s + Number(d.montant), 0);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " FC";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestion des dépenses</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{depenses.length} dépense(s) enregistrée(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-all"
        >
          <PlusIcon className="w-4 h-4" /> Nouvelle dépense
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] mb-1">Total général</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{fmt(totalAll)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-600 mb-1">Payé</p>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalPaye)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 mb-1">En attente</p>
          <p className="text-2xl font-bold text-amber-600">{fmt(totalEnAttente)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par libellé ou catégorie…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-rose-400"
          />
        </div>
        <select
          value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Aucune dépense trouvée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Créé par</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map(d => {
                const s = STATUTS.find(x => x.value === d.statut) || STATUTS[1];
                const Icon = s.icon;
                return (
                  <tr key={d.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {d.libelle}
                      {d.description && <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5 truncate max-w-xs">{d.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{d.categorie || "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(d.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{fmt(Number(d.montant))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${s.bg} ${s.color}`}>
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{d.created_by_name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {d.categorie === "Salaires" && (
                          <button onClick={() => openPrestations(d)} className="p-1.5 rounded-lg hover:bg-violet-500/10 text-violet-500 transition-colors" title="Répartition du personnel">
                            <UserGroupIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fermer"
            onClick={() => setShowForm(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 bg-[var(--bg-card)]/40 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/15 bg-white/5 backdrop-blur-xl px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-rose-400">💸</span>
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  {editing ? "Modifier la dépense" : "Nouvelle dépense"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {error && <p className="text-[13px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

              {/* Section principale */}
              <section className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                <div className="bg-white/10 px-4 py-2.5 border-b border-white/15">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informations générales</h3>
                </div>
                <div className="divide-y divide-white/10">
                  <div className="px-4 py-3">
                    <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Libellé *</label>
                    <input
                      value={form.libelle || ""}
                      onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-400"
                    />
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Montant ($) *</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.montant ?? ""}
                        onChange={e => setForm(f => ({ ...f, montant: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Date *</label>
                      <input
                        type="date"
                        value={form.date || ""}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section classification */}
              <section className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                <div className="bg-white/10 px-4 py-2.5 border-b border-white/15">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Classification</h3>
                </div>
                <div className="divide-y divide-white/10">
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Catégorie</label>
                      <select
                        value={form.categorie || ""}
                        onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                        className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-400"
                      >
                        <option value="">— Aucune —</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Statut</label>
                      <select
                        value={form.statut || "en_attente"}
                        onChange={e => setForm(f => ({ ...f, statut: e.target.value as Depense["statut"] }))}
                        className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-400"
                      >
                        {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Description</label>
                    <textarea
                      rows={2}
                      value={form.description || ""}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-400 resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-white/15 bg-white/5 backdrop-blur-xl px-5 py-3 shrink-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-[var(--text-primary)] px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 text-white px-4 py-2 text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal répartition des salaires */}
      {showPrestations && prestationsDepense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fermer"
            onClick={() => setShowPrestations(false)}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 bg-[var(--bg-card)]/40 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/10 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/15 bg-white/5 backdrop-blur-xl px-5 py-3.5 shrink-0">
              <span className="text-violet-400">👥</span>
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-[var(--text-primary)] truncate">
                  Répartition des salaires — {prestationsDepense.libelle}
                </h2>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {Number(prestationsDepense.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                  · {new Date(prestationsDepense.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {loadingPersonnel ? (
                <p className="text-center text-[13px] text-[var(--text-secondary)] py-10">Chargement du personnel…</p>
              ) : personnel.length === 0 ? (
                <p className="text-center text-[13px] text-[var(--text-secondary)] py-10">Aucun membre du personnel trouvé.</p>
              ) : (
                <>
                  {/* Section info dépense */}
                  <section className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                    <div className="bg-white/10 px-4 py-2.5 border-b border-white/15">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Dépense de référence</h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <div className="text-[13px] text-[var(--text-secondary)] flex-shrink-0">Libellé</div>
                        <div className="text-[13px] text-[var(--text-primary)] text-right">{prestationsDepense.libelle}</div>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <div className="text-[13px] text-[var(--text-secondary)] flex-shrink-0">Montant total</div>
                        <div className="text-[13px] text-[var(--text-primary)] font-semibold text-right">
                          {Number(prestationsDepense.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <div className="text-[13px] text-[var(--text-secondary)] flex-shrink-0">Statut</div>
                        <div className="text-[13px] text-[var(--text-primary)] text-right capitalize">{prestationsDepense.statut.replace("_", " ")}</div>
                      </div>
                    </div>
                  </section>

                  {/* Section liste du personnel */}
                  <section className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                    <div className="bg-white/10 px-4 py-2.5 border-b border-white/15">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Liste du personnel</h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      {personnel.map((p, idx) => {
                        const row = prestationRows[idx] || { personnel_id: p.id, nb_prestations: 0, montant_unitaire: "", note: "" };
                        const updateRow = (patch: Partial<PrestationRow>) => {
                          setPrestationRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
                        };
                        const total = row.nb_prestations > 0 && row.montant_unitaire !== ""
                          ? (row.nb_prestations * Number(row.montant_unitaire)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })
                          : null;
                        return (
                          <div key={p.id} className={`px-4 py-3 ${row.nb_prestations > 0 ? "bg-violet-500/5" : ""}`}>
                            {/* Identité */}
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{p.full_name}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium shrink-0">
                                {ROLE_LABELS[p.role] || p.role}
                              </span>
                            </div>
                            {/* Inputs en ligne label/valeur comme capture 1 */}
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Nb Prestations</label>
                                <input
                                  type="number" min="0" step="1"
                                  value={row.nb_prestations || ""}
                                  onChange={e => updateRow({ nb_prestations: parseInt(e.target.value) || 0 })}
                                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-violet-400 text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">
                                  Montant / Prestation ($)
                                </label>
                                <input
                                  type="number" min="0" step="0.01"
                                  value={row.montant_unitaire}
                                  onChange={e => updateRow({ montant_unitaire: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                  placeholder="0.00"
                                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-violet-400"
                                />
                                {total && <p className="text-[11px] text-violet-400 mt-0.5">= {total} FC</p>}
                              </div>
                              <div>
                                <label className="text-[11px] text-[var(--text-secondary)] mb-1 block">Note</label>
                                <input
                                  value={row.note}
                                  onChange={e => updateRow({ note: e.target.value })}
                                  placeholder="Optionnel…"
                                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-violet-400"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Section résumé si des prestations saisies */}
                  {prestationRows.some(r => r.nb_prestations > 0) && (
                    <section className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                      <div className="bg-white/10 px-4 py-2.5 border-b border-white/15">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Résumé de la répartition</h3>
                      </div>
                      <div className="divide-y divide-white/10">
                        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                          <div className="text-[13px] text-[var(--text-secondary)]">Membres concernés</div>
                          <div className="text-[13px] text-[var(--text-primary)] font-semibold text-right">
                            {prestationRows.filter(r => r.nb_prestations > 0).length}
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                          <div className="text-[13px] text-[var(--text-secondary)]">Total prestations</div>
                          <div className="text-[13px] text-[var(--text-primary)] font-semibold text-right">
                            {prestationRows.reduce((s, r) => s + r.nb_prestations, 0)}
                          </div>
                        </div>
                        {prestationRows.some(r => r.nb_prestations > 0 && r.montant_unitaire !== "") && (
                          <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                            <div className="text-[13px] text-[var(--text-secondary)]">Montant total réparti</div>
                            <div className="text-[13px] text-violet-400 font-semibold text-right">
                              {prestationRows.reduce((s, r) => s + (r.nb_prestations > 0 && r.montant_unitaire !== "" ? r.nb_prestations * Number(r.montant_unitaire) : 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/15 bg-white/5 backdrop-blur-xl px-5 py-3 shrink-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPrestations(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-[var(--text-primary)] px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSavePrestations}
                disabled={savingPrestations || loadingPersonnel}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {savingPrestations ? "Enregistrement…" : "Enregistrer la répartition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
