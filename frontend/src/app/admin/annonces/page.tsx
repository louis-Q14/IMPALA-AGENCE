"use client";

import { useState } from "react";
import {
  HomeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Ad {
  id: number;
  title: string;
  type: "real_estate" | "auto";
  user: string;
  status: "pending" | "active" | "rejected";
  date: string;
  price: string;
  views: number;
  description?: string;
  location?: string;
}

const initialAds: Ad[] = [];

export default function AdminAnnonces() {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Ad | null>(null);

  const updateAdStatus = (adId: number, newStatus: "active" | "rejected" | "pending") => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, status: newStatus } : a)));
    if (selectedAd?.id === adId) {
      setSelectedAd((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const deleteAd = (ad: Ad) => {
    setAds((prev) => prev.filter((a) => a.id !== ad.id));
    if (selectedAd?.id === ad.id) setSelectedAd(null);
    setDeleteConfirm(null);
  };

  const filtered = ads.filter((ad) => {
    if (filter !== "all" && ad.status !== filter) return false;
    if (search && !ad.title.toLowerCase().includes(search.toLowerCase()) && !ad.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: ads.length,
    pending: ads.filter((a) => a.status === "pending").length,
    active: ads.filter((a) => a.status === "active").length,
    rejected: ads.filter((a) => a.status === "rejected").length,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Annonces</h1>
          <p className="text-sm text-[var(--text-muted)]">Gérer toutes les annonces de la plateforme</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une annonce..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Toutes" },
            { key: "pending", label: "En attente" },
            { key: "active", label: "Actives" },
            { key: "rejected", label: "Refusées" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-primary text-white" : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
              {f.label} ({counts[f.key as keyof typeof counts]})
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucune annonce trouvée</h3>
          <p className="text-sm text-[var(--text-muted)]">Modifiez vos filtres ou votre recherche.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {["Annonce", "Type", "Auteur", "Prix", "Vues", "Date", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((ad) => (
                  <tr key={ad.id} className={`transition-all ${ad.status === "pending" ? "bg-amber-50/50 dark:bg-amber-900/5" : "hover:bg-[var(--bg-hover)]"}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{ad.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ad.type === "real_estate" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                        {ad.type === "real_estate" ? <HomeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <TruckIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{ad.user}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{ad.price}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{ad.views}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{ad.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        ad.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                        ad.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}>
                        {ad.status === "active" ? "Active" : ad.status === "pending" ? "En attente" : "Refusée"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {ad.status === "pending" && (
                          <>
                            <button onClick={() => updateAdStatus(ad.id, "active")} title="Approuver"
                              className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all">
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateAdStatus(ad.id, "rejected")} title="Refuser"
                              className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {ad.status === "active" && (
                          <button onClick={() => updateAdStatus(ad.id, "rejected")} title="Désactiver"
                            className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {ad.status === "rejected" && (
                          <button onClick={() => updateAdStatus(ad.id, "active")} title="Réactiver"
                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all">
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setSelectedAd(ad)} title="Détails"
                          className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(ad)} title="Supprimer"
                          className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedAd(null)}>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedAd.type === "real_estate" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                  {selectedAd.type === "real_estate" ? <HomeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> : <TruckIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedAd.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">par {selectedAd.user}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAd(null)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-center transition-all">
                <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Prix", value: selectedAd.price },
                { label: "Type", value: selectedAd.type === "real_estate" ? "Immobilier" : "Automobile" },
                { label: "Localisation", value: selectedAd.location || "Non renseigné" },
                { label: "Vues", value: String(selectedAd.views) },
                { label: "Date", value: selectedAd.date },
                { label: "Description", value: selectedAd.description || "Aucune description" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start py-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-[var(--text-muted)]">Statut :</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedAd.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                selectedAd.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}>
                {selectedAd.status === "active" ? "Active" : selectedAd.status === "pending" ? "En attente" : "Refusée"}
              </span>
            </div>

            <div className="flex gap-3 flex-wrap">
              {selectedAd.status === "pending" && (
                <>
                  <button onClick={() => { updateAdStatus(selectedAd.id, "active"); setSelectedAd(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-sm">
                    <CheckCircleIcon className="w-4 h-4" /> Approuver
                  </button>
                  <button onClick={() => { updateAdStatus(selectedAd.id, "rejected"); setSelectedAd(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm">
                    <XCircleIcon className="w-4 h-4" /> Refuser
                  </button>
                </>
              )}
              {selectedAd.status === "active" && (
                <button onClick={() => { updateAdStatus(selectedAd.id, "rejected"); setSelectedAd(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm">
                  <XCircleIcon className="w-4 h-4" /> Désactiver
                </button>
              )}
              {selectedAd.status === "rejected" && (
                <button onClick={() => { updateAdStatus(selectedAd.id, "active"); setSelectedAd(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-sm">
                  <ArrowPathIcon className="w-4 h-4" /> Réactiver
                </button>
              )}
              <button onClick={() => setDeleteConfirm(selectedAd)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm">
                <TrashIcon className="w-4 h-4" /> Supprimer
              </button>
              <button onClick={() => setSelectedAd(null)}
                className="px-6 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer cette annonce ?</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Vous êtes sur le point de supprimer définitivement l&apos;annonce{" "}
                <span className="font-semibold text-[var(--text-primary)]">&quot;{deleteConfirm.title}&quot;</span> de {deleteConfirm.user}.
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-2 font-medium">
                Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                Annuler
              </button>
              <button onClick={() => deleteAd(deleteConfirm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm">
                <TrashIcon className="w-4 h-4" /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
