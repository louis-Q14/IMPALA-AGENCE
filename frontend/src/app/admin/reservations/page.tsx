"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CalendarDaysIcon,
  HomeModernIcon,
  StarIcon,
  EyeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function getToken() {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u).token : null;
  } catch { return null; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  total_properties: number;
  pending_properties: number;
  total_bookings: number;
  pending_bookings: number;
  total_revenue: number;
}

interface Property {
  id: string;
  title: string;
  city: string;
  property_type: string;
  listing_type: string;
  status: "active" | "pending" | "rejected" | "inactive";
  is_featured: boolean;
  price_per_night?: number;
  price_per_week?: number;
  price_per_month?: number;
  currency: string;
  bedrooms: number;
  max_guests: number;
  rating_avg: number;
  review_count: number;
  view_count: number;
  created_at: string;
  owner_name: string;
  owner_email: string;
  cover_image?: string;
  booking_count: number;
}

interface Booking {
  id: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  check_in: string;
  check_out: string;
  nights_count: number;
  guests_count: number;
  total_price: number;
  currency: string;
  payment_method: string;
  guest_message?: string;
  created_at: string;
  property_title: string;
  property_city: string;
  property_type: string;
  cover_image?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  owner_name: string;
  owner_email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_PROP: Record<string, { label: string; cls: string }> = {
  active:   { label: "Actif",    cls: "bg-emerald-100 text-emerald-700" },
  pending:  { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejeté",   cls: "bg-red-100 text-red-700" },
  inactive: { label: "Inactif",  cls: "bg-gray-100 text-gray-600" },
};

const STATUS_BOOK: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente",  cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmée",   cls: "bg-emerald-100 text-emerald-700" },
  rejected:  { label: "Rejetée",     cls: "bg-red-100 text-red-700" },
  cancelled: { label: "Annulée",     cls: "bg-gray-100 text-gray-600" },
  completed: { label: "Terminée",    cls: "bg-blue-100 text-blue-700" },
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminReservations() {
  const [tab, setTab] = useState<"properties" | "bookings">("properties");

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Properties
  const [properties, setProperties] = useState<Property[]>([]);
  const [propFilter, setPropFilter] = useState("all");
  const [propSearch, setPropSearch] = useState("");
  const [propPage, setPropPage] = useState(1);
  const [propTotal, setPropTotal] = useState(0);
  const [propLoading, setPropLoading] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookFilter, setBookFilter] = useState("all");
  const [bookSearch, setBookSearch] = useState("");
  const [bookPage, setBookPage] = useState(1);
  const [bookTotal, setBookTotal] = useState(0);
  const [bookLoading, setBookLoading] = useState(false);

  // Modals
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [selectedBook, setSelectedBook] = useState<Booking | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Property | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/reservation/admin/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchProperties = useCallback(async () => {
    setPropLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(propPage),
        limit: "20",
        ...(propFilter !== "all" && { status: propFilter }),
        ...(propSearch && { search: propSearch }),
      });
      const res = await fetch(`${API}/reservation/admin/properties?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties);
        setPropTotal(data.total);
      }
    } catch { /* ignore */ }
    setPropLoading(false);
  }, [propPage, propFilter, propSearch]);

  const fetchBookings = useCallback(async () => {
    setBookLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(bookPage),
        limit: "20",
        ...(bookFilter !== "all" && { status: bookFilter }),
        ...(bookSearch && { search: bookSearch }),
      });
      const res = await fetch(`${API}/reservation/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
        setBookTotal(data.total);
      }
    } catch { /* ignore */ }
    setBookLoading(false);
  }, [bookPage, bookFilter, bookSearch]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const updatePropertyStatus = async (id: string, status: string, is_featured?: boolean) => {
    setActionLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (status) body.status = status;
      if (is_featured !== undefined) body.is_featured = is_featured;
      const res = await fetch(`${API}/reservation/admin/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await Promise.all([fetchProperties(), fetchStats()]);
      if (selectedProp?.id === id) setSelectedProp(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
    setActionLoading(false);
  };

  const deleteProperty = async (id: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/reservation/properties/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDeleteConfirm(null);
      await Promise.all([fetchProperties(), fetchStats()]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
    setActionLoading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/reservation/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await Promise.all([fetchBookings(), fetchStats()]);
      if (selectedBook?.id === id) setSelectedBook(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
    setActionLoading(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Réservations</h1>
            <p className="text-sm text-gray-500">Gestion des biens et réservations</p>
          </div>
        </div>
        <button
          onClick={() => { fetchProperties(); fetchBookings(); fetchStats(); }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ArrowPathIcon className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Biens total", value: stats.total_properties, color: "text-indigo-600" },
            { label: "En attente", value: stats.pending_properties, color: "text-amber-600" },
            { label: "Réservations", value: stats.total_bookings, color: "text-blue-600" },
            { label: "Rés. en attente", value: stats.pending_bookings, color: "text-orange-600" },
            { label: "Revenus totaux", value: fmtPrice(stats.total_revenue), color: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {(["properties", "bookings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t === "properties" ? `Biens (${propTotal})` : `Réservations (${bookTotal})`}
          </button>
        ))}
      </div>

      {/* ═══ PROPERTIES TAB ═══ */}
      {tab === "properties" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Titre, ville, propriétaire…"
                value={propSearch}
                onChange={(e) => { setPropSearch(e.target.value); setPropPage(1); }}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              value={propFilter}
              onChange={(e) => { setPropFilter(e.target.value); setPropPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="rejected">Rejeté</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {propLoading ? (
              <div className="p-12 text-center text-gray-400">
                <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                Chargement…
              </div>
            ) : properties.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <HomeModernIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Aucun bien trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Bien</th>
                      <th className="px-4 py-3 text-left">Propriétaire</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-right">Prix</th>
                      <th className="px-4 py-3 text-center">Rés.</th>
                      <th className="px-4 py-3 text-center">Vues</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {properties.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                              {p.cover_image ? (
                                <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <HomeModernIcon className="w-5 h-5 m-2.5 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{p.title}</p>
                              <p className="text-xs text-gray-500 truncate">{p.city} · {p.property_type} · {p.bedrooms} ch.</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 dark:text-gray-200 text-xs font-medium">{p.owner_name}</p>
                          <p className="text-gray-400 text-xs truncate max-w-[140px]">{p.owner_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${STATUS_PROP[p.status]?.cls}`}>
                              {STATUS_PROP[p.status]?.label}
                            </span>
                            {p.is_featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-600 w-fit">
                                <SparklesIcon className="w-3 h-3" /> Coup de cœur
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-300">
                          {p.price_per_night
                            ? `${fmtPrice(p.price_per_night, p.currency)}/nuit`
                            : p.price_per_week
                            ? `${fmtPrice(p.price_per_week, p.currency)}/sem.`
                            : p.price_per_month
                            ? `${fmtPrice(p.price_per_month, p.currency)}/mois`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{p.booking_count}</td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{p.view_count ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedProp(p)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                              title="Détails"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {p.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updatePropertyStatus(p.id, "active")}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                  title="Approuver"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updatePropertyStatus(p.id, "rejected")}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                  title="Rejeter"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {p.status === "active" && (
                              <button
                                onClick={() => updatePropertyStatus(p.id, "inactive")}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"
                                title="Désactiver"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            {p.status === "rejected" && (
                              <button
                                onClick={() => updatePropertyStatus(p.id, "active")}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                title="Réactiver"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                              title="Supprimer"
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
            )}
          </div>

          {/* Pagination */}
          {propTotal > 20 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{propTotal} bien(s) au total</span>
              <div className="flex gap-2">
                <button
                  disabled={propPage <= 1}
                  onClick={() => setPropPage(p => p - 1)}
                  className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-40"
                >Préc.</button>
                <span className="px-3 py-1">Page {propPage}</span>
                <button
                  disabled={propPage * 20 >= propTotal}
                  onClick={() => setPropPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-40"
                >Suiv.</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BOOKINGS TAB ═══ */}
      {tab === "bookings" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Bien, voyageur, email…"
                value={bookSearch}
                onChange={(e) => { setBookSearch(e.target.value); setBookPage(1); }}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              value={bookFilter}
              onChange={(e) => { setBookFilter(e.target.value); setBookPage(1); }}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="rejected">Rejetée</option>
              <option value="cancelled">Annulée</option>
              <option value="completed">Terminée</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {bookLoading ? (
              <div className="p-12 text-center text-gray-400">
                <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                Chargement…
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <CalendarDaysIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Aucune réservation trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Bien</th>
                      <th className="px-4 py-3 text-left">Voyageur</th>
                      <th className="px-4 py-3 text-left">Dates</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                              {b.cover_image ? (
                                <img src={b.cover_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <HomeModernIcon className="w-5 h-5 m-2.5 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{b.property_title}</p>
                              <p className="text-xs text-gray-500">{b.property_city} · {b.nights_count} nuit(s)</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 dark:text-gray-200 text-xs font-medium">{b.guest_name}</p>
                          <p className="text-gray-400 text-xs truncate max-w-[140px]">{b.guest_email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          <p>{fmt(b.check_in)}</p>
                          <p className="text-gray-400">→ {fmt(b.check_out)}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white">
                          {fmtPrice(b.total_price, b.currency)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BOOK[b.status]?.cls}`}>
                            {STATUS_BOOK[b.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedBook(b)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                              title="Détails"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {b.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                  title="Confirmer"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(b.id, "rejected")}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                  title="Rejeter"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => updateBookingStatus(b.id, "completed")}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 text-xs font-medium px-2"
                                title="Marquer terminée"
                              >
                                ✓ Terminée
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {bookTotal > 20 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{bookTotal} réservation(s) au total</span>
              <div className="flex gap-2">
                <button
                  disabled={bookPage <= 1}
                  onClick={() => setBookPage(p => p - 1)}
                  className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-40"
                >Préc.</button>
                <span className="px-3 py-1">Page {bookPage}</span>
                <button
                  disabled={bookPage * 20 >= bookTotal}
                  onClick={() => setBookPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-40"
                >Suiv.</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PROPERTY DETAIL MODAL ═══ */}
      {selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedProp(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedProp.title}</h2>
              <button onClick={() => setSelectedProp(null)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            {selectedProp.cover_image && (
              <img src={selectedProp.cover_image} alt="" className="w-full h-48 object-cover rounded-xl" />
            )}
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-gray-500">Ville</dt><dd className="font-medium">{selectedProp.city}</dd></div>
              <div><dt className="text-gray-500">Type</dt><dd className="font-medium">{selectedProp.property_type}</dd></div>
              <div><dt className="text-gray-500">Chambres</dt><dd className="font-medium">{selectedProp.bedrooms}</dd></div>
              <div><dt className="text-gray-500">Capacité</dt><dd className="font-medium">{selectedProp.max_guests} pers.</dd></div>
              <div><dt className="text-gray-500">Note</dt><dd className="font-medium flex items-center gap-1"><StarSolid className="w-3 h-3 text-amber-400" />{selectedProp.rating_avg ?? "—"} ({selectedProp.review_count})</dd></div>
              <div><dt className="text-gray-500">Réservations</dt><dd className="font-medium">{selectedProp.booking_count}</dd></div>
              <div><dt className="text-gray-500">Propriétaire</dt><dd className="font-medium">{selectedProp.owner_name}</dd></div>
              <div><dt className="text-gray-500">Depuis</dt><dd className="font-medium">{fmt(selectedProp.created_at)}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedProp.status === "pending" && (
                <>
                  <button onClick={() => updatePropertyStatus(selectedProp.id, "active")} disabled={actionLoading}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    ✓ Approuver
                  </button>
                  <button onClick={() => updatePropertyStatus(selectedProp.id, "rejected")} disabled={actionLoading}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    ✕ Rejeter
                  </button>
                </>
              )}
              {selectedProp.status === "active" && (
                <>
                  <button
                    onClick={() => updatePropertyStatus(selectedProp.id, "active", !selectedProp.is_featured)}
                    disabled={actionLoading}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${selectedProp.is_featured ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-rose-600 text-white hover:bg-rose-700"} disabled:opacity-50`}
                  >
                    {selectedProp.is_featured ? "Retirer coup de cœur" : "⭐ Coup de cœur"}
                  </button>
                  <button onClick={() => updatePropertyStatus(selectedProp.id, "inactive")} disabled={actionLoading}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                    Désactiver
                  </button>
                </>
              )}
              <button onClick={() => setDeleteConfirm(selectedProp)} disabled={actionLoading}
                className="py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOOKING DETAIL MODAL ═══ */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedBook(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Réservation #{selectedBook.id.slice(0, 8)}…</h2>
              <button onClick={() => setSelectedBook(null)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-gray-500">Bien</dt><dd className="font-medium">{selectedBook.property_title}</dd></div>
              <div><dt className="text-gray-500">Ville</dt><dd className="font-medium">{selectedBook.property_city}</dd></div>
              <div><dt className="text-gray-500">Arrivée</dt><dd className="font-medium">{fmt(selectedBook.check_in)}</dd></div>
              <div><dt className="text-gray-500">Départ</dt><dd className="font-medium">{fmt(selectedBook.check_out)}</dd></div>
              <div><dt className="text-gray-500">Nuits</dt><dd className="font-medium">{selectedBook.nights_count}</dd></div>
              <div><dt className="text-gray-500">Voyageurs</dt><dd className="font-medium">{selectedBook.guests_count}</dd></div>
              <div><dt className="text-gray-500">Montant</dt><dd className="font-medium text-emerald-600">{fmtPrice(selectedBook.total_price, selectedBook.currency)}</dd></div>
              <div><dt className="text-gray-500">Paiement</dt><dd className="font-medium">{selectedBook.payment_method}</dd></div>
              <div><dt className="text-gray-500">Voyageur</dt><dd className="font-medium">{selectedBook.guest_name}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="font-medium truncate text-xs">{selectedBook.guest_email}</dd></div>
              <div><dt className="text-gray-500">Propriétaire</dt><dd className="font-medium">{selectedBook.owner_name}</dd></div>
              <div><dt className="text-gray-500">Statut</dt>
                <dd><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BOOK[selectedBook.status]?.cls}`}>{STATUS_BOOK[selectedBook.status]?.label}</span></dd>
              </div>
            </dl>
            {selectedBook.guest_message && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                <p className="text-xs text-gray-400 mb-1">Message du voyageur</p>
                {selectedBook.guest_message}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedBook.status === "pending" && (
                <>
                  <button onClick={() => updateBookingStatus(selectedBook.id, "confirmed")} disabled={actionLoading}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    ✓ Confirmer
                  </button>
                  <button onClick={() => updateBookingStatus(selectedBook.id, "rejected")} disabled={actionLoading}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    ✕ Rejeter
                  </button>
                </>
              )}
              {selectedBook.status === "confirmed" && (
                <button onClick={() => updateBookingStatus(selectedBook.id, "completed")} disabled={actionLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  Marquer terminée
                </button>
              )}
              {["pending", "confirmed"].includes(selectedBook.status) && (
                <button onClick={() => updateBookingStatus(selectedBook.id, "cancelled")} disabled={actionLoading}
                  className="py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ExclamationTriangleIcon className="w-6 h-6" />
              <h2 className="text-lg font-bold">Supprimer ce bien ?</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>«{deleteConfirm.title}»</strong> sera définitivement supprimé, ainsi que toutes ses réservations et images associées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Annuler
              </button>
              <button onClick={() => deleteProperty(deleteConfirm.id)} disabled={actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
