"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  TruckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

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

interface Ad {
  id: number; brand: string; model: string; year: number | null;
  mileage: number | null; fuel: string; transmission: string;
  price: number | null; rent_price_day: number | null;
  description: string; location_text: string;
  ad_type: "vente" | "location"; status: "active" | "pending" | "rejected";
  views: number; created_at: string; author_name: string; author_email: string;
  photos: string[]; plate_number: string; country: string; serie: string;
  color: string; doors: number | null; circulation_date: string;
  power: string; torque: string; aspiration: string; displacement: string;
  cylinders: number | null; engine_transmission: string; gears: number | null;
  top_speed_mph: number | null; top_speed_kmh: number | null;
  accel_0_60: string; accel_0_100: string; engine_position: string;
  fuel_urban: string; fuel_extra: string; fuel_mixed: string;
  co2_emissions: string; carbon_label: string; ct_expiry_date: string;
  ct_success_rate: number | null; ct_passed: number | null;
  ct_failed: number | null; ct_to_fix: number | null;
  ct_not_fixed: number | null; ct_dangerous: number | null;
  tax_due_date: string; tax_days_remaining: number | null;
  ct_validity_date: string; ct_days_remaining: number | null;
  owner_name: string; owner_phone: string; owner_email: string;
  owner_address: string; owner_type: string; insurance_status: string;
  insurance_expiry_date: string; ct_status: string; vehicle_status: string; notes: string;
}

type FormData = Omit<Ad, "id" | "views" | "created_at" | "author_name" | "author_email" | "photos">;

const EMPTY: FormData = {
  brand: "", model: "", year: null, mileage: null, fuel: "Essence",
  transmission: "Manuelle", price: null, rent_price_day: null,
  description: "", location_text: "", ad_type: "vente", status: "pending",
  plate_number: "", country: "Congo (RDC)", serie: "", color: "", doors: null,
  circulation_date: "", power: "", torque: "", aspiration: "Atmospherique",
  displacement: "", cylinders: null, engine_transmission: "", gears: null,
  top_speed_mph: null, top_speed_kmh: null, accel_0_60: "", accel_0_100: "",
  engine_position: "Avant", fuel_urban: "", fuel_extra: "", fuel_mixed: "",
  co2_emissions: "", carbon_label: "", ct_expiry_date: "",
  ct_success_rate: null, ct_passed: null, ct_failed: null,
  ct_to_fix: null, ct_not_fixed: null, ct_dangerous: null,
  tax_due_date: "", tax_days_remaining: null, ct_validity_date: "",
  ct_days_remaining: null, owner_name: "", owner_phone: "", owner_email: "",
  owner_address: "", owner_type: "Particulier", insurance_status: "Inconnu",
  insurance_expiry_date: "", ct_status: "Inconnu", vehicle_status: "Normal", notes: "",
};
function Section({ title, isOpen, onToggle, children }: {
  title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-3">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        {title}
        {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
      </button>
      {isOpen && <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectCls = inputCls;

export default function AdminAutomobile() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Ad | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'subscribers' | 'ads'>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true, engine: false, consumption: false,
    ctHistory: false, fiscal: false, owner: false, docs: false,
  });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const res = await fetch(`${API}/auto/ads/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAds(Array.isArray(data.data) ? data.data : []);
    } catch { setAds([]); } finally { setLoading(false); }
  }, [filter, search, token]);

  const fetchSubscribers = async () => {
    setSubsLoading(true);
    try {
      const res = await fetch(`${API}/admin/service-subscribers?service=auto`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch { setSubscribers([]); } finally { setSubsLoading(false); }
  };
  useEffect(() => { fetchAds(); fetchSubscribers(); }, [fetchAds]);

  function toggleSection(k: string) {
    setOpenSections((prev) => ({ ...prev, [k]: !prev[k] }));
  }
  function set(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function openNew() {
    setForm({ ...EMPTY }); setEditingId(null); setSaveError("");
    setOpenSections({ general: true, engine: false, consumption: false, ctHistory: false, fiscal: false, owner: false, docs: false });
    setShowForm(true);
  }
  function openEdit(ad: Ad) {
    setForm({
      brand: ad.brand ?? "", model: ad.model ?? "", year: ad.year,
      mileage: ad.mileage, fuel: ad.fuel ?? "Essence",
      transmission: ad.transmission ?? "Manuelle",
      price: ad.price, rent_price_day: ad.rent_price_day,
      description: ad.description ?? "", location_text: ad.location_text ?? "",
      ad_type: ad.ad_type ?? "vente", status: ad.status ?? "pending",
      plate_number: ad.plate_number ?? "", country: ad.country ?? "Congo (RDC)",
      serie: ad.serie ?? "", color: ad.color ?? "", doors: ad.doors,
      circulation_date: ad.circulation_date ? ad.circulation_date.slice(0, 10) : "",
      power: ad.power ?? "", torque: ad.torque ?? "",
      aspiration: ad.aspiration ?? "Atmospherique", displacement: ad.displacement ?? "",
      cylinders: ad.cylinders, engine_transmission: ad.engine_transmission ?? "",
      gears: ad.gears, top_speed_mph: ad.top_speed_mph, top_speed_kmh: ad.top_speed_kmh,
      accel_0_60: ad.accel_0_60 ?? "", accel_0_100: ad.accel_0_100 ?? "",
      engine_position: ad.engine_position ?? "Avant",
      fuel_urban: ad.fuel_urban ?? "", fuel_extra: ad.fuel_extra ?? "",
      fuel_mixed: ad.fuel_mixed ?? "", co2_emissions: ad.co2_emissions ?? "",
      carbon_label: ad.carbon_label ?? "",
      ct_expiry_date: ad.ct_expiry_date ? ad.ct_expiry_date.slice(0, 10) : "",
      ct_success_rate: ad.ct_success_rate, ct_passed: ad.ct_passed,
      ct_failed: ad.ct_failed, ct_to_fix: ad.ct_to_fix,
      ct_not_fixed: ad.ct_not_fixed, ct_dangerous: ad.ct_dangerous,
      tax_due_date: ad.tax_due_date ? ad.tax_due_date.slice(0, 10) : "",
      tax_days_remaining: ad.tax_days_remaining,
      ct_validity_date: ad.ct_validity_date ? ad.ct_validity_date.slice(0, 10) : "",
      ct_days_remaining: ad.ct_days_remaining,
      owner_name: ad.owner_name ?? "", owner_phone: ad.owner_phone ?? "",
      owner_email: ad.owner_email ?? "", owner_address: ad.owner_address ?? "",
      owner_type: ad.owner_type ?? "Particulier",
      insurance_status: ad.insurance_status ?? "Inconnu",
      insurance_expiry_date: ad.insurance_expiry_date ? ad.insurance_expiry_date.slice(0, 10) : "",
      ct_status: ad.ct_status ?? "Inconnu", vehicle_status: ad.vehicle_status ?? "Normal",
      notes: ad.notes ?? "",
    });
    setEditingId(ad.id); setSaveError("");
    setOpenSections({ general: true, engine: true, consumption: true, ctHistory: true, fiscal: true, owner: true, docs: true });
    setShowForm(true);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError("");
    try {
      const url = editingId ? `${API}/auto/ads/${editingId}` : `${API}/auto/ads`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); setSaveError(err.error ?? "Erreur"); return; }
      setShowForm(false); fetchAds();
    } catch { setSaveError("Erreur reseau"); } finally { setSaving(false); }
  }

  async function handleStatusChange(ad: Ad, status: "active" | "pending" | "rejected") {
    await fetch(`${API}/auto/ads/${ad.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchAds();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await fetch(`${API}/auto/ads/${deleteConfirm.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteConfirm(null); setSelectedAd(null); fetchAds();
  }

  const totalAds = ads.length;
  const venteAds = ads.filter((a) => a.ad_type === "vente").length;
  const locationAds = ads.filter((a) => a.ad_type === "location").length;
  const activeAds = ads.filter((a) => a.status === "active").length;

  function statusBadge(s: string) {
    if (s === "active") return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Actif</span>;
    if (s === "rejected") return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejete</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">En attente</span>;
  }
  function typeBadge(t: string) {
    return t === "vente"
      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Vente</span>
      : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Location</span>;
  }
  function fuelBadge(f: string) {
    const colors: Record<string, string> = {
      Essence: "bg-orange-100 text-orange-700", Diesel: "bg-gray-100 text-gray-700",
      Hybride: "bg-teal-100 text-teal-700", GPL: "bg-yellow-100 text-yellow-700",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[f] ?? "bg-gray-100 text-gray-600"}`}>{f}</span>;
  }
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TruckIcon className="w-7 h-7 text-blue-600" /> Automobile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des annonces vente et location</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <PlusIcon className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
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

      {/* Subscriber list */}
      {tab === 'subscribers' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
          {subsLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" /> Chargement...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <TruckIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Aucun abonne a ce service</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Abonne</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Debut</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {subscribers.map((s) => {
                  const isActive = s.subscription_status === 'active' || s.subscription_status === 'approved';
                  const isPending = s.subscription_status === 'pending';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{s.full_name || '—'}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 dark:text-gray-300">{s.phone || '—'}</div>
                        <div className="text-xs text-gray-400">{s.adresse || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : isPending ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {isActive ? 'Actif' : isPending ? 'En attente' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.subscription_start ? new Date(s.subscription_start).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.subscription_end ? new Date(s.subscription_end).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'ads' && <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: totalAds, color: "text-blue-600" },
          { label: "Vente", value: venteAds, color: "text-indigo-600" },
          { label: "Location", value: locationAds, color: "text-purple-600" },
          { label: "Actifs", value: activeAds, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher marque, modele, plaque..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="rejected">Rejete</option>
        </select>
        <button onClick={fetchAds}
          className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ArrowPathIcon className="w-4 h-4" /> Actualiser
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <ArrowPathIcon className="w-5 h-5 animate-spin" /> Chargement...
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <TruckIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Aucune annonce</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Vehicule</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Carburant</th>
                <th className="px-4 py-3 text-left">Annee / Km</th>
                <th className="px-4 py-3 text-left">Prix</th>
                <th className="px-4 py-3 text-left">Vues</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{ad.brand} {ad.model}</div>
                    {ad.plate_number && <div className="text-xs text-gray-400">{ad.plate_number}</div>}
                    <div className="text-xs text-gray-400">{ad.author_name}</div>
                  </td>
                  <td className="px-4 py-3">{typeBadge(ad.ad_type)}</td>
                  <td className="px-4 py-3">{fuelBadge(ad.fuel)}</td>
                  <td className="px-4 py-3">
                    <div>{ad.year ?? "—"}</div>
                    <div className="text-xs text-gray-400">{ad.mileage != null ? `${ad.mileage.toLocaleString()} km` : "—"}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                    {ad.ad_type === "vente"
                      ? (ad.price != null ? `${ad.price.toLocaleString()} FC` : "—")
                      : (ad.rent_price_day != null ? `${ad.rent_price_day.toLocaleString()} FC/j` : "—")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ad.views ?? 0}</td>
                  <td className="px-4 py-3">{statusBadge(ad.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedAd(ad)} title="Voir"
                        className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(ad)} title="Modifier"
                        className="p-1.5 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-yellow-500">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {ad.status !== "active" && (
                        <button onClick={() => handleStatusChange(ad, "active")} title="Activer"
                          className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/30 text-green-500">
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      {ad.status !== "rejected" && (
                        <button onClick={() => handleStatusChange(ad, "rejected")} title="Rejeter"
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500">
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm(ad)} title="Supprimer"
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedAd.brand} {selectedAd.model} ({selectedAd.year})
              </h2>
              <button onClick={() => setSelectedAd(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2 flex-wrap">
                {typeBadge(selectedAd.ad_type)}{fuelBadge(selectedAd.fuel)}{statusBadge(selectedAd.status)}
              </div>
              {selectedAd.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedAd.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="h-32 w-auto rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {([
                  ["Plaque", selectedAd.plate_number], ["Couleur", selectedAd.color],
                  ["Portes", selectedAd.doors],
                  ["Kilometrage", selectedAd.mileage != null ? `${selectedAd.mileage.toLocaleString()} km` : null],
                  ["Prix vente", selectedAd.price != null ? `${selectedAd.price.toLocaleString()} FC` : null],
                  ["Location/j", selectedAd.rent_price_day != null ? `${selectedAd.rent_price_day.toLocaleString()} FC` : null],
                  ["Carburant", selectedAd.fuel], ["Transmission", selectedAd.transmission],
                  ["Puissance", selectedAd.power], ["Cylindree", selectedAd.displacement],
                  ["Vitesse max", selectedAd.top_speed_kmh != null ? `${selectedAd.top_speed_kmh} km/h` : null],
                  ["0-100 km/h", selectedAd.accel_0_100],
                  ["Conso. mixte", selectedAd.fuel_mixed], ["CO2", selectedAd.co2_emissions],
                  ["Proprietaire", selectedAd.owner_name], ["Tel.", selectedAd.owner_phone],
                  ["Assurance", selectedAd.insurance_status], ["Statut CT", selectedAd.ct_status],
                  ["Taux CT", selectedAd.ct_success_rate != null ? `${selectedAd.ct_success_rate}%` : null],
                  ["Lieu", selectedAd.location_text], ["Vues", selectedAd.views],
                  ["Vendeur", selectedAd.author_name],
                ] as [string, unknown][]).map(([k, v]) =>
                  v != null && v !== "" ? (
                    <div key={String(k)}>
                      <span className="text-gray-400 text-xs">{k}</span>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{String(v)}</p>
                    </div>
                  ) : null
                )}
              </div>
              {selectedAd.description && (
                <div>
                  <span className="text-gray-400 text-xs">Description</span>
                  <p className="mt-1 whitespace-pre-wrap">{selectedAd.description}</p>
                </div>
              )}
              {selectedAd.notes && (
                <div>
                  <span className="text-gray-400 text-xs">Notes internes</span>
                  <p className="mt-1 text-orange-600 dark:text-orange-400 whitespace-pre-wrap">{selectedAd.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setSelectedAd(null); openEdit(selectedAd); }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  Modifier
                </button>
                <button onClick={() => { setDeleteConfirm(selectedAd); setSelectedAd(null); }}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Supprimer cette annonce ?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {deleteConfirm.brand} {deleteConfirm.model} sera supprime definitivement.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? "Modifier l annonce" : "Nouvelle annonce"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-2">
              {saveError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4" /> {saveError}
                </div>
              )}

              <Section title="1 · Informations Generales" isOpen={openSections.general} onToggle={() => toggleSection("general")}>
                <Field label="Marque *">
                  <input required value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} placeholder="Toyota, BMW..." />
                </Field>
                <Field label="Modele *">
                  <input required value={form.model} onChange={(e) => set("model", e.target.value)} className={inputCls} placeholder="Corolla, X5..." />
                </Field>
                <Field label="Serie / Generation">
                  <input value={form.serie} onChange={(e) => set("serie", e.target.value)} className={inputCls} placeholder="E46, Mk7..." />
                </Field>
                <Field label="Type d annonce *">
                  <select required value={form.ad_type} onChange={(e) => set("ad_type", e.target.value)} className={selectCls}>
                    <option value="vente">Vente</option>
                    <option value="location">Location</option>
                  </select>
                </Field>
                <Field label="Annee *">
                  <input required type="number" min={1900} max={2030}
                    value={form.year ?? ""} onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : null)}
                    className={inputCls} placeholder="2020" />
                </Field>
                <Field label="Kilometrage (km)">
                  <input type="number" min={0}
                    value={form.mileage ?? ""} onChange={(e) => set("mileage", e.target.value ? parseInt(e.target.value) : null)}
                    className={inputCls} placeholder="50000" />
                </Field>
                <Field label="Plaque immatriculation">
                  <input value={form.plate_number} onChange={(e) => set("plate_number", e.target.value)} className={inputCls} placeholder="AB 1234 CD" />
                </Field>
                <Field label="Pays">
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Couleur">
                  <input value={form.color} onChange={(e) => set("color", e.target.value)} className={inputCls} placeholder="Blanc, Noir..." />
                </Field>
                <Field label="Nombre de portes">
                  <input type="number" min={2} max={7}
                    value={form.doors ?? ""} onChange={(e) => set("doors", e.target.value ? parseInt(e.target.value) : null)}
                    className={inputCls} placeholder="4" />
                </Field>
                <Field label="Mise en circulation">
                  <input type="date" value={form.circulation_date} onChange={(e) => set("circulation_date", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Lieu / Ville">
                  <input value={form.location_text} onChange={(e) => set("location_text", e.target.value)} className={inputCls} placeholder="Kinshasa..." />
                </Field>
                {form.ad_type === "vente" ? (
                  <Field label="Prix de vente ($)">
                    <input type="number" min={0}
                      value={form.price ?? ""} onChange={(e) => set("price", e.target.value ? parseFloat(e.target.value) : null)}
                      className={inputCls} placeholder="15000" />
                  </Field>
                ) : (
                  <Field label="Prix location / jour ($)">
                    <input type="number" min={0}
                      value={form.rent_price_day ?? ""} onChange={(e) => set("rent_price_day", e.target.value ? parseFloat(e.target.value) : null)}
                      className={inputCls} placeholder="80" />
                  </Field>
                )}
                <Field label="Description" full>
                  <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls} placeholder="Description du vehicule..." />
                </Field>
              </Section>

              <Section title="2 · Moteur" isOpen={openSections.engine} onToggle={() => toggleSection("engine")}>
                <Field label="Carburant">
                  <select value={form.fuel} onChange={(e) => set("fuel", e.target.value)} className={selectCls}>
                    {["Essence","Diesel","Hybride","Electrique","GPL","Autre"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Boite de vitesses">
                  <select value={form.transmission} onChange={(e) => set("transmission", e.target.value)} className={selectCls}>
                    {["Manuelle","Automatique","Semi-automatique","CVT"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Cylindree (ex: 2.0L)">
                  <input value={form.displacement} onChange={(e) => set("displacement", e.target.value)} className={inputCls} placeholder="2.0L" />
                </Field>
                <Field label="Cylindres">
                  <input type="number" min={1} max={16}
                    value={form.cylinders ?? ""} onChange={(e) => set("cylinders", e.target.value ? parseInt(e.target.value) : null)}
                    className={inputCls} placeholder="4" />
                </Field>
                <Field label="Puissance">
                  <input value={form.power} onChange={(e) => set("power", e.target.value)} className={inputCls} placeholder="150 ch" />
                </Field>
                <Field label="Couple">
                  <input value={form.torque} onChange={(e) => set("torque", e.target.value)} className={inputCls} placeholder="250 Nm" />
                </Field>
                <Field label="Alimentation">
                  <select value={form.aspiration} onChange={(e) => set("aspiration", e.target.value)} className={selectCls}>
                    {["Atmospherique","Turbo","Compresseur","Bi-turbo"].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </Field>
                <Field label="Position moteur">
                  <select value={form.engine_position} onChange={(e) => set("engine_position", e.target.value)} className={selectCls}>
                    {["Avant","Arriere","Central"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Traction">
                  <input value={form.engine_transmission} onChange={(e) => set("engine_transmission", e.target.value)} className={inputCls} placeholder="Traction avant" />
                </Field>
                <Field label="Rapports">
                  <input type="number" min={1} max={12}
                    value={form.gears ?? ""} onChange={(e) => set("gears", e.target.value ? parseInt(e.target.value) : null)}
                    className={inputCls} placeholder="6" />
                </Field>
                <Field label="Vitesse max (mph)">
                  <input type="number" value={form.top_speed_mph ?? ""} onChange={(e) => set("top_speed_mph", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="130" />
                </Field>
                <Field label="Vitesse max (km/h)">
                  <input type="number" value={form.top_speed_kmh ?? ""} onChange={(e) => set("top_speed_kmh", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="210" />
                </Field>
                <Field label="0 a 60 mph">
                  <input value={form.accel_0_60} onChange={(e) => set("accel_0_60", e.target.value)} className={inputCls} placeholder="7.2 s" />
                </Field>
                <Field label="0 a 100 km/h">
                  <input value={form.accel_0_100} onChange={(e) => set("accel_0_100", e.target.value)} className={inputCls} placeholder="8.1 s" />
                </Field>
              </Section>
              <Section title="3 · Consommation de Carburant" isOpen={openSections.consumption} onToggle={() => toggleSection("consumption")}>
                <Field label="Urbaine (L/100km)">
                  <input value={form.fuel_urban} onChange={(e) => set("fuel_urban", e.target.value)} className={inputCls} placeholder="9.5" />
                </Field>
                <Field label="Extra-urbaine (L/100km)">
                  <input value={form.fuel_extra} onChange={(e) => set("fuel_extra", e.target.value)} className={inputCls} placeholder="6.2" />
                </Field>
                <Field label="Mixte (L/100km)">
                  <input value={form.fuel_mixed} onChange={(e) => set("fuel_mixed", e.target.value)} className={inputCls} placeholder="7.5" />
                </Field>
                <Field label="Emissions CO2 (g/km)">
                  <input value={form.co2_emissions} onChange={(e) => set("co2_emissions", e.target.value)} className={inputCls} placeholder="175" />
                </Field>
                <Field label="Etiquette carbone (A-G)">
                  <select value={form.carbon_label} onChange={(e) => set("carbon_label", e.target.value)} className={selectCls}>
                    <option value="">—</option>
                    {["A","B","C","D","E","F","G"].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </Section>

              <Section title="4 · Historique du Controle Technique" isOpen={openSections.ctHistory} onToggle={() => toggleSection("ctHistory")}>
                <Field label="Taux de succes CT (%)">
                  <input type="number" min={0} max={100} value={form.ct_success_rate ?? ""} onChange={(e) => set("ct_success_rate", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="85" />
                </Field>
                <Field label="CT reussis">
                  <input type="number" min={0} value={form.ct_passed ?? ""} onChange={(e) => set("ct_passed", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="3" />
                </Field>
                <Field label="CT echoues">
                  <input type="number" min={0} value={form.ct_failed ?? ""} onChange={(e) => set("ct_failed", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="1" />
                </Field>
                <Field label="Points a corriger">
                  <input type="number" min={0} value={form.ct_to_fix ?? ""} onChange={(e) => set("ct_to_fix", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="2" />
                </Field>
                <Field label="Non corriges">
                  <input type="number" min={0} value={form.ct_not_fixed ?? ""} onChange={(e) => set("ct_not_fixed", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="0" />
                </Field>
                <Field label="Dangereux">
                  <input type="number" min={0} value={form.ct_dangerous ?? ""} onChange={(e) => set("ct_dangerous", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="0" />
                </Field>
                <Field label="Date expiration CT">
                  <input type="date" value={form.ct_expiry_date} onChange={(e) => set("ct_expiry_date", e.target.value)} className={inputCls} />
                </Field>
              </Section>

              <Section title="5 · Controle Fiscal et CT" isOpen={openSections.fiscal} onToggle={() => toggleSection("fiscal")}>
                <Field label="Date echeance fiscale">
                  <input type="date" value={form.tax_due_date} onChange={(e) => set("tax_due_date", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Jours restants fiscal">
                  <input type="number" value={form.tax_days_remaining ?? ""} onChange={(e) => set("tax_days_remaining", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="120" />
                </Field>
                <Field label="Date validite CT">
                  <input type="date" value={form.ct_validity_date} onChange={(e) => set("ct_validity_date", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Jours restants CT">
                  <input type="number" value={form.ct_days_remaining ?? ""} onChange={(e) => set("ct_days_remaining", e.target.value ? parseInt(e.target.value) : null)} className={inputCls} placeholder="90" />
                </Field>
                <Field label="Statut CT">
                  <select value={form.ct_status} onChange={(e) => set("ct_status", e.target.value)} className={selectCls}>
                    {["Inconnu","Valide","Expire","En cours","Non effectue"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Statut assurance">
                  <select value={form.insurance_status} onChange={(e) => set("insurance_status", e.target.value)} className={selectCls}>
                    {["Inconnu","Assuree","Non assuree","Expiree"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Expiration assurance">
                  <input type="date" value={form.insurance_expiry_date} onChange={(e) => set("insurance_expiry_date", e.target.value)} className={inputCls} />
                </Field>
              </Section>
              <Section title="6 · Proprietaire" isOpen={openSections.owner} onToggle={() => toggleSection("owner")}>
                <Field label="Nom du proprietaire">
                  <input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} className={inputCls} placeholder="Jean Dupont" />
                </Field>
                <Field label="Telephone">
                  <input value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} className={inputCls} placeholder="+243..." />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} className={inputCls} placeholder="owner@email.com" />
                </Field>
                <Field label="Type de proprietaire">
                  <select value={form.owner_type} onChange={(e) => set("owner_type", e.target.value)} className={selectCls}>
                    {["Particulier","Professionnel","Concessionnaire"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Adresse" full>
                  <textarea rows={2} value={form.owner_address} onChange={(e) => set("owner_address", e.target.value)} className={inputCls} placeholder="Adresse du proprietaire..." />
                </Field>
              </Section>

              <Section title="7 · Documents et Statut" isOpen={openSections.docs} onToggle={() => toggleSection("docs")}>
                <Field label="Statut de publication">
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
                    <option value="pending">En attente</option>
                    <option value="active">Actif</option>
                    <option value="rejected">Rejete</option>
                  </select>
                </Field>
                <Field label="Etat general du vehicule">
                  <select value={form.vehicle_status} onChange={(e) => set("vehicle_status", e.target.value)} className={selectCls}>
                    {["Normal","Excellent","Bon","A reviser","Accidente","Pour pieces"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Notes internes" full>
                  <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} placeholder="Remarques visibles uniquement par l admin..." />
                </Field>
              </Section>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {saving
                    ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Sauvegarde...</>
                    : <><ClockIcon className="w-4 h-4" /> {editingId ? "Mettre a jour" : "Creer l annonce"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
    }
    </div>
  );
}