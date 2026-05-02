"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

interface RealEstateAd {
  id: number;
  title: string;
  type: "sale" | "rent";
  city: string;
  price: string;
  surface: string;
  rooms: number;
  user: string;
  status: "active" | "pending" | "rejected";
  views: number;
  date: string;
  rawDescription?: string | null;
  address?: string;
  charges?: number | null;
}

type DossierData = {
  sellerFullName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  habitableSurface?: string;
  yearBuilt?: string;
  generalState?: string;
  bathroomsCount?: string;
  waterRoomsCount?: string;
  separateWcCount?: string;
  heatingType?: string;
  dpeClass?: string;
  gasInstallState?: string;
  electricInstallState?: string;
  asbestos?: string;
  termites?: string;
  leadRisk?: string;
  ernmtRisk?: string;
  annualCharges?: string;
  guaranteeDeposit?: string;
  compromiseDate?: string;
  authenticActDate?: string;
  specialObservations?: string;
};

function parseDossier(desc: string | null | undefined): DossierData | null {
  if (!desc) return null;
  try { return JSON.parse(desc) as DossierData; } catch { return null; }
}

interface Subscriber {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  adresse: string;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  user_created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminImmobilier() {
  const [ads, setAds] = useState<RealEstateAd[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAd, setSelectedAd] = useState<RealEstateAd | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RealEstateAd | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [tab, setTab] = useState<'subscribers' | 'ads'>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [newAd, setNewAd] = useState({
    title: "",
    type: "sale" as "sale" | "rent",
    city: "",
    price: "",
    surface: "",
    rooms: 1,
    description: "",
  });

  useEffect(() => {
    const fetchSubscribers = async () => {
      setSubsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/admin/service-subscribers?service=real_estate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSubscribers(Array.isArray(data) ? data : []);
      } catch { setSubscribers([]); } finally { setSubsLoading(false); }
    };
    fetchSubscribers();
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/admin/real-estate/ads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const rows = await res.json();
          const mapped: RealEstateAd[] = rows.map((r: {
            id: number; title: string; ad_type: string; city: string;
            price: string | null; rent_price: string | null; surface: string | null;
            rooms: number; status: string; views: number; created_at: string;
            description?: string; address?: string; charges?: number | null; author_name: string;
          }) => ({
            id: r.id,
            title: r.title,
            type: r.ad_type === "rent" ? "rent" : "sale",
            city: r.city,
            price: r.ad_type === "rent"
              ? `${r.rent_price || 0} FC/mois`
              : `${r.price || 0} FC`,
            surface: r.surface ? `${r.surface} m²` : "—",
            rooms: r.rooms || 0,
            user: r.author_name,
            status: (r.status as "active" | "pending" | "rejected") || "pending",
            views: r.views || 0,
            date: new Date(r.created_at).toLocaleDateString("fr-FR"),
            rawDescription: r.description,
            address: r.address,
            charges: r.charges,
          }));
          setAds(mapped);
        }
      } catch {}
    };
    fetchAds();
  }, []);

  const updateAdStatus = async (adId: number, newStatus: "active" | "rejected" | "pending") => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/admin/ads/real_estate/${adId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, status: newStatus } : a)));
    if (selectedAd?.id === adId) {
      setSelectedAd((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const deleteAd = async (ad: RealEstateAd) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/admin/real-estate/ads/${ad.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setAds((prev) => prev.filter((a) => a.id !== ad.id));
    if (selectedAd?.id === ad.id) setSelectedAd(null);
    setDeleteConfirm(null);
  };

  const addNewAd = () => {
    if (!newAd.title || !newAd.city || !newAd.price) return;
    const ad: RealEstateAd = {
      id: Date.now(),
      title: newAd.title,
      type: newAd.type,
      city: newAd.city,
      price: newAd.price,
      surface: newAd.surface,
      rooms: newAd.rooms,
      user: "Admin",
      status: "active",
      views: 0,
      date: new Date().toLocaleDateString("fr-FR"),
      rawDescription: newAd.description ? JSON.stringify({ specialObservations: newAd.description }) : null,
    };
    setAds((prev) => [ad, ...prev]);
    setNewAd({ title: "", type: "sale", city: "", price: "", surface: "", rooms: 1, description: "" });
    setShowNewForm(false);
  };

  const filtered = ads.filter((ad) => {
    if (filter !== "all" && ad.status !== filter) return false;
    if (
      search &&
      !ad.title.toLowerCase().includes(search.toLowerCase()) &&
      !ad.city.toLowerCase().includes(search.toLowerCase()) &&
      !ad.user.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const saleCount = ads.filter((a) => a.type === "sale").length;
  const rentCount = ads.filter((a) => a.type === "rent").length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Immobilier</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {ads.length} annonces · Vues totales : {totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit mb-6">
        {([['subscribers', 'Abonnes'], ['ads', 'Annonces']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {label}
            {key === 'subscribers' && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {subscribers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'subscribers' && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden mb-6">
          {subsLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" /> Chargement...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <HomeIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Aucun abonne au service Immobilier</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {['Abonne', 'Contact', 'Statut', 'Debut', 'Fin'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {subscribers.map(s => {
                  const isActive = s.subscription_status === 'active' || s.subscription_status === 'approved';
                  const isPending = s.subscription_status === 'pending';
                  return (
                    <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-all">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{s.full_name || '—'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{s.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[var(--text-secondary)]">{s.phone || '—'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{s.adresse || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : isPending ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {isActive ? 'Actif' : isPending ? 'En attente' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{s.subscription_start ? new Date(s.subscription_start).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{s.subscription_end ? new Date(s.subscription_end).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'ads' && <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total annonces", value: ads.length, color: "bg-blue-500" },
          { label: "En vente", value: saleCount, color: "bg-emerald-500" },
          { label: "En location", value: rentCount, color: "bg-amber-500" },
          { label: "Vues totales", value: totalViews.toLocaleString(), color: "bg-purple-500" },
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
            placeholder="Rechercher par titre, ville ou auteur..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Toutes" },
            { key: "active", label: "Actives" },
            { key: "pending", label: "En attente" },
            { key: "rejected", label: "Refusées" },
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
          <HomeIcon className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucune annonce trouvée</h3>
          <p className="text-sm text-[var(--text-muted)]">Modifiez vos filtres ou ajoutez une nouvelle annonce.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {["Bien", "Type", "Ville", "Prix", "Surface", "Pièces", "Vues", "Statut", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((ad) => (
                  <tr
                    key={ad.id}
                    className={`transition-all ${
                      ad.status === "pending" ? "bg-amber-50/50 dark:bg-amber-900/5" : "hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{ad.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {ad.user} · {ad.date}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          ad.type === "sale"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {ad.type === "sale" ? "Vente" : "Location"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{ad.city}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{ad.price}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{ad.surface}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{ad.rooms}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{ad.views}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          ad.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : ad.status === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {ad.status === "active" ? "Active" : ad.status === "pending" ? "En attente" : "Refusée"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {ad.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateAdStatus(ad.id, "active")}
                              title="Approuver"
                              className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateAdStatus(ad.id, "rejected")}
                              title="Refuser"
                              className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {ad.status === "active" && (
                          <button
                            onClick={() => updateAdStatus(ad.id, "rejected")}
                            title="Désactiver"
                            className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {ad.status === "rejected" && (
                          <button
                            onClick={() => updateAdStatus(ad.id, "active")}
                            title="Réactiver"
                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAd(ad)}
                          title="Détails"
                          className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(ad)}
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

      {/* Detail modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedAd(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden
              border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.4)]
              bg-white/10 dark:bg-white/5 backdrop-blur-2xl"
            style={{ backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass gradient overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-blue-500/5" />

            {/* Header */}
            <div className="relative flex items-start justify-between px-8 py-6 border-b border-white/15">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
                  <HomeIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedAd.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">par {selectedAd.user} · {selectedAd.date}</p>
                </div>
              </div>

            </div>

            {/* Structured dossier sections */}
            {(() => {
              const d = parseDossier(selectedAd.rawDescription);
              const sections = [
                {
                  title: "Présentation",
                  items: [
                    { label: "Type d'annonce", value: selectedAd.type === "sale" ? "Vente" : "Location" },
                    { label: "Ville", value: selectedAd.city },
                    { label: "Adresse", value: selectedAd.address || "Non renseignée" },
                    { label: "Prix", value: selectedAd.price },
                    { label: "Surface", value: selectedAd.surface },
                    { label: "Pièces", value: String(selectedAd.rooms) },
                    { label: "Vues", value: String(selectedAd.views) },
                    { label: "Date", value: selectedAd.date },
                    { label: "Description libre", value: d?.specialObservations || "Non renseigné" },
                  ],
                },
                {
                  title: "Caractéristiques",
                  items: [
                    { label: "Surface habitable", value: d?.habitableSurface || "Non renseigné" },
                    { label: "État général", value: d?.generalState || "Non renseigné" },
                    { label: "Année construction", value: d?.yearBuilt || "Non renseigné" },
                    { label: "Salles de bains", value: d?.bathroomsCount || "Non renseigné" },
                    { label: "Salles d'eau", value: d?.waterRoomsCount || "Non renseigné" },
                    { label: "WC séparés", value: d?.separateWcCount || "Non renseigné" },
                    { label: "Chauffage", value: d?.heatingType || "Non renseigné" },
                    { label: "DPE", value: d?.dpeClass || "Non renseigné" },
                  ],
                },
                {
                  title: "Diagnostics",
                  items: [
                    { label: "Gaz", value: d?.gasInstallState || "Non renseigné" },
                    { label: "Électricité", value: d?.electricInstallState || "Non renseigné" },
                    { label: "Amiante", value: d?.asbestos || "Non renseigné" },
                    { label: "Termites", value: d?.termites || "Non renseigné" },
                    { label: "Plomb", value: d?.leadRisk || "Non renseigné" },
                    { label: "ERNMT", value: d?.ernmtRisk || "Non renseigné" },
                  ],
                },
                {
                  title: "Dossier vendeur",
                  items: [
                    { label: "Vendeur", value: d?.sellerFullName || selectedAd.user },
                    { label: "Téléphone", value: d?.sellerPhone || "Non renseigné" },
                    { label: "Email", value: d?.sellerEmail || "Non renseigné" },
                    { label: "Charges annuelles", value: d?.annualCharges || (selectedAd.charges ? `${selectedAd.charges} FC` : "Non renseigné") },
                    { label: "Dépôt de garantie", value: d?.guaranteeDeposit || "Non renseigné" },
                    { label: "Compromis", value: d?.compromiseDate || "Non renseigné" },
                    { label: "Acte authentique", value: d?.authenticActDate || "Non renseigné" },
                  ],
                },
              ];
              return (
                <div className="relative overflow-y-auto flex-1 px-8 py-6">
                  {/* Status badge */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm text-[var(--text-muted)]">Statut :</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedAd.status === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : selectedAd.status === "pending"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {selectedAd.status === "active" ? "Active" : selectedAd.status === "pending" ? "En attente" : "Refusée"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((sec) => (
                      <div key={sec.title} className="rounded-2xl bg-white/10 dark:bg-white/5 border border-white/15 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/10 px-4 py-2.5 border-b border-white/10">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">{sec.title}</h4>
                        </div>
                        <div className="divide-y divide-white/10">
                          {sec.items.map((item) => (
                            <div key={item.label} className="flex justify-between items-start px-4 py-2.5">
                              <span className="text-xs text-[var(--text-muted)] shrink-0 mr-2">{item.label}</span>
                              <span className="text-xs font-medium text-[var(--text-primary)] text-right">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Footer actions */}
            <div className="relative flex gap-3 flex-wrap px-8 py-5 border-t border-white/15 bg-white/5">
              {selectedAd.status === "pending" && (
                <>
                  <button
                    onClick={() => { updateAdStatus(selectedAd.id, "active"); setSelectedAd(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/80 hover:bg-emerald-600 text-white font-medium transition-all text-sm backdrop-blur-sm"
                  >
                    <CheckCircleIcon className="w-4 h-4" /> Approuver
                  </button>
                  <button
                    onClick={() => { updateAdStatus(selectedAd.id, "rejected"); setSelectedAd(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-600 text-white font-medium transition-all text-sm backdrop-blur-sm"
                  >
                    <XCircleIcon className="w-4 h-4" /> Refuser
                  </button>
                </>
              )}
              {selectedAd.status === "active" && (
                <button
                  onClick={() => { updateAdStatus(selectedAd.id, "rejected"); setSelectedAd(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-600 text-white font-medium transition-all text-sm backdrop-blur-sm"
                >
                  <XCircleIcon className="w-4 h-4" /> Désactiver
                </button>
              )}
              {selectedAd.status === "rejected" && (
                <button
                  onClick={() => { updateAdStatus(selectedAd.id, "active"); setSelectedAd(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/80 hover:bg-emerald-600 text-white font-medium transition-all text-sm backdrop-blur-sm"
                >
                  <ArrowPathIcon className="w-4 h-4" /> Réactiver
                </button>
              )}
              <button
                onClick={() => setDeleteConfirm(selectedAd)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-600 text-white font-medium transition-all text-sm backdrop-blur-sm"
              >
                <TrashIcon className="w-4 h-4" /> Supprimer
              </button>
              <button
                onClick={() => setSelectedAd(null)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium text-[var(--text-primary)] transition-all backdrop-blur-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New ad form modal */}
      {showNewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowNewForm(false)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-lg p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Nouvelle annonce immobilière</h3>
              <button
                onClick={() => setShowNewForm(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-center transition-all"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="Ex: Appartement T3 - Paris 10e"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Type</label>
                  <select
                    value={newAd.type}
                    onChange={(e) => setNewAd({ ...newAd, type: e.target.value as "sale" | "rent" })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="sale">Vente</option>
                    <option value="rent">Location</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ville *</label>
                  <input
                    type="text"
                    value={newAd.city}
                    onChange={(e) => setNewAd({ ...newAd, city: e.target.value })}
                    placeholder="Paris"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Prix *</label>
                  <input
                    type="text"
                    value={newAd.price}
                    onChange={(e) => setNewAd({ ...newAd, price: e.target.value })}
                    placeholder="250 000 FC"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Surface</label>
                  <input
                    type="text"
                    value={newAd.surface}
                    onChange={(e) => setNewAd({ ...newAd, surface: e.target.value })}
                    placeholder="75 m²"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Pièces</label>
                  <input
                    type="number"
                    min={1}
                    value={newAd.rooms}
                    onChange={(e) => setNewAd({ ...newAd, rooms: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  placeholder="Décrivez le bien..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={addNewAd}
                disabled={!newAd.title || !newAd.city || !newAd.price}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4" /> Créer l&apos;annonce
              </button>
            </div>
          </div>
        </div>
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
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer cette annonce ?</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Vous êtes sur le point de supprimer définitivement l&apos;annonce{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  &quot;{deleteConfirm.title}&quot;
                </span>
                .
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-2 font-medium">
                Cette action est irréversible.
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
                onClick={() => deleteAd(deleteConfirm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm"
              >
                <TrashIcon className="w-4 h-4" /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>}
  </>
  );
}
