"use client";

import { useEffect, useState } from "react";
import { StarIcon, CheckIcon, XMarkIcon, TrashIcon, FunnelIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Avis = {
  id: number;
  auteur_nom: string;
  auteur_email: string;
  note: number;
  titre: string | null;
  contenu: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_name: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "En attente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  approved: { label: "Approuvé",   color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "Rejeté",     color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export default function AvisPage() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | "pending" | "approved" | "rejected">("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [total, setTotal] = useState(0);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (status = filter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${API}/blog/avis/admin${status ? `?status=${status}&limit=50` : "?limit=50"}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvis(data.avis || []);
      setTotal(data.total || 0);
    } catch {
      showToast("Erreur lors du chargement", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleStatus = async (id: number, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/blog/avis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setAvis((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      showToast(status === "approved" ? "Avis approuvé" : "Avis rejeté");
    } catch {
      showToast("Erreur lors de la mise à jour", false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/blog/avis/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setAvis((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => t - 1);
      showToast("Avis supprimé");
    } catch {
      showToast("Erreur lors de la suppression", false);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = avis.filter((a) => a.status === "pending").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
          ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestion des avis</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {total} avis au total
            {pending > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-semibold">
                {pending} en attente
              </span>
            )}
          </p>
        </div>

        {/* Filtre */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
          <select
            value={filter}
            onChange={(e) => {
              const v = e.target.value as typeof filter;
              setFilter(v);
              load(v);
            }}
            className="text-sm border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Tous les avis</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["pending", "approved", "rejected"] as const).map((s) => {
          const count = avis.filter((a) => a.status === s).length;
          const { label, color } = STATUS_LABELS[s];
          return (
            <div key={s} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-[var(--text-primary)]">{count}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : avis.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">Aucun avis trouvé</div>
      ) : (
        <div className="space-y-4">
          {avis.map((a) => {
            const { label, color } = STATUS_LABELS[a.status];
            const isLoading = actionLoading === a.id;
            return (
              <div
                key={a.id}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col sm:flex-row gap-4"
              >
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={`w-4 h-4 ${i < a.note ? "text-yellow-400 fill-yellow-400" : "text-[var(--text-muted)]"}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  {a.titre && (
                    <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">{a.titre}</p>
                  )}
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">{a.contenu}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--text-primary)]">{a.auteur_nom}</span>
                    {a.auteur_email && <span>· {a.auteur_email}</span>}
                    {a.user_name && a.user_name !== a.auteur_nom && (
                      <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded font-medium">
                        Compte vérifié : {a.user_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex sm:flex-col gap-2 items-start sm:items-end justify-end flex-shrink-0">
                  {a.status !== "approved" && (
                    <button
                      onClick={() => handleStatus(a.id, "approved")}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      Approuver
                    </button>
                  )}
                  {a.status !== "rejected" && (
                    <button
                      onClick={() => handleStatus(a.id, "rejected")}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                      Rejeter
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
