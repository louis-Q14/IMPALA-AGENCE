"use client";

import { useEffect, useState, useCallback } from "react";
import { DocumentCheckIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Ad {
  id: string;
  title: string;
  city: string;
  status: string;
  price: number;
  type: "real_estate" | "auto";
  author: string;
  author_email: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  rejected: "bg-red-500/10 text-red-600",
};

export default function SuperAdminAnnoncesPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAds = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/ads`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAds(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleStatusChange = async (type: string, id: string, status: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/superadmin/ads/${type}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchAds();
  };

  const handleDelete = async (type: string, id: string, title: string) => {
    if (!confirm(`Supprimer l'annonce "${title}" ?`)) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/superadmin/ads/${type}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAds();
  };

  const filtered = ads.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Toutes les annonces</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Gestion complète des annonces immobilier et automobile</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500">
          <option value="all">Tous les types</option>
          <option value="real_estate">Immobilier</option>
          <option value="auto">Automobile</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="active">Actives</option>
          <option value="rejected">Refusées</option>
        </select>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentCheckIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">Aucune annonce trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Titre</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Auteur</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ad) => (
                  <tr key={ad.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)] text-sm max-w-xs truncate">{ad.title}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">{ad.author}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ad.type === "real_estate" ? "bg-teal-500/10 text-teal-600" : "bg-orange-500/10 text-orange-600"}`}>
                        {ad.type === "real_estate" ? "Immobilier" : "Auto"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select value={ad.status} onChange={(e) => handleStatusChange(ad.type, ad.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusColors[ad.status] || ""}`}>
                        <option value="pending">En attente</option>
                        <option value="active">Active</option>
                        <option value="rejected">Refusée</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-muted)] whitespace-nowrap">{new Date(ad.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(ad.type, ad.id, ad.title)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">{filtered.length} annonce(s) affichée(s)</p>
    </div>
  );
}
