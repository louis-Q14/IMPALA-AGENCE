"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  HomeIcon,
  TruckIcon,
  TrashIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface PlatformStats {
  total_users: number;
  total_real_estate_ads: number;
  total_auto_ads: number;
  active_trash_subscriptions: number;
  total_revenue: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  services: string[];
  status: string;
  created_at: string;
}

interface SubRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  formula: string;
  payment_method: string;
  amount: number;
  annual: boolean;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
  real_estate: "Immobilier",
  auto: "Automobile",
  trash: "Poubelles",
};

const SERVICE_COLORS: Record<string, string> = {
  immobilier: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  automobile: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "immo-auto": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

const METHOD_LABELS: Record<string, string> = {
  mobile: "Mobile Money",
  card: "Carte bancaire",
  cash: "Especes",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [subRequests, setSubRequests] = useState<SubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/subscription-requests?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSubRequests(await res.json());
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/admin/users?limit=5`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/admin/subscription-requests?status=pending`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([s, users, reqs]) => {
        setStats(s);
        setRecentUsers(Array.isArray(users) ? users.slice(0, 5) : []);
        setSubRequests(Array.isArray(reqs) ? reqs : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    setActionLoading(id + "-approve");
    try {
      const res = await fetch(`${API}/admin/subscription-requests/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await loadRequests();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectModal) return;
    setActionLoading(rejectModal.id + "-reject");
    try {
      const res = await fetch(`${API}/admin/subscription-requests/${rejectModal.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModal(null);
        setRejectReason("");
        await loadRequests();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const kpis = [
    { label: "Utilisateurs", value: loading ? "..." : (stats?.total_users ?? 0), icon: UsersIcon, color: "bg-blue-500", href: "/admin/utilisateurs" },
    { label: "Annonces actives", value: loading ? "..." : ((stats?.total_real_estate_ads ?? 0) + (stats?.total_auto_ads ?? 0)), icon: DocumentCheckIcon, color: "bg-emerald-500", href: "/admin/annonces" },
    { label: "Abonnements Poubelles", value: loading ? "..." : (stats?.active_trash_subscriptions ?? 0), icon: TrashIcon, color: "bg-purple-500", href: "/admin/poubelles" },
    { label: "Revenus totaux", value: loading ? "..." : `${(stats?.total_revenue ?? 0).toFixed(2)} FC`, icon: CurrencyDollarIcon, color: "bg-amber-500", href: "/admin/revenus" },
  ];

  const abonnements = [
    { name: "Immobilier", desc: "Vente & location de biens", Icon: HomeIcon, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", href: "/admin/immobilier", count: loading ? "..." : (stats?.total_real_estate_ads ?? 0), countLabel: "annonces" },
    { name: "Automobile", desc: "Achat & vente de vehicules", Icon: TruckIcon, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", href: "/admin/automobile", count: loading ? "..." : (stats?.total_auto_ads ?? 0), countLabel: "annonces" },
    { name: "Poubelles (abo.)", desc: "Collecte hebdomadaire", Icon: TrashIcon, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", href: "/admin/poubelles", count: loading ? "..." : (stats?.active_trash_subscriptions ?? 0), countLabel: "actifs" },
  ];

  const multiImpala = [
    { name: "Nettoyage de bureau", emoji: "🧹", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", href: "/multi-impala/nettoyage" },
    { name: "Repassage a domicile", emoji: "👔", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", href: "/multi-impala/repassage" },
    { name: "Demenagement", emoji: "🚛", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", href: "/multi-impala/demenagement" },
    { name: "Ramassage Poubelles", emoji: "🗑️", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", href: "/multi-impala/poubelles" },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${k.color} flex items-center justify-center`}>
                  <k.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{k.value}</p>
              <p className="text-sm text-[var(--text-muted)]">{k.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== DEMANDES D'ABONNEMENT ===== */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Demandes d&apos;abonnement</h2>
          {subRequests.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
              <BellAlertIcon className="w-3.5 h-3.5" />
              {subRequests.length} en attente
            </span>
          )}
        </div>

        {subRequests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
            <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* User info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    {(req.full_name || req.email).split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{req.full_name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{req.email}</p>
                  </div>
                </div>

                {/* Request details */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${SERVICE_COLORS[req.service_type] ?? "bg-gray-100 text-gray-600"}`}>
                    {req.service_type === "immo-auto" ? "Immo & Auto" : req.service_type.charAt(0).toUpperCase() + req.service_type.slice(1)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    {req.formula?.charAt(0).toUpperCase() + (req.formula?.slice(1) ?? "")}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    {req.annual ? "Annuel" : "Mensuel"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {Number(req.amount).toLocaleString("fr-FR")} FC
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    {METHOD_LABELS[req.payment_method] ?? req.payment_method}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] flex-shrink-0">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {formatDate(req.created_at)}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id + "-approve"}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {actionLoading === req.id + "-approve" ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    )}
                    Approuver
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: req.id, name: req.full_name })}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <XCircleIcon className="w-3.5 h-3.5" />
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Abonnements</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Services a souscription mensuelle</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {abonnements.map((s) => (
            <Link key={s.name} href={s.href}>
              <div className={`p-4 rounded-2xl bg-[var(--bg-card)] border ${s.border} hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                    {s.count} {s.countLabel}
                  </span>
                </div>
                <p className={`font-semibold text-sm ${s.color}`}>{s.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Services Multi-Impala</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Services a la demande — facturation a l&apos;usage</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {multiImpala.map((s) => (
            <Link key={s.name} href={s.href} target="_blank">
              <div className={`p-4 rounded-2xl bg-[var(--bg-card)] border ${s.border} hover:shadow-md transition-all`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 text-xl`}>
                  {s.emoji}
                </div>
                <p className={`font-semibold text-sm ${s.color}`}>{s.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Multi-Impala</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Derniers inscrits</h3>
          <Link href="/admin/utilisateurs" className="text-sm text-primary hover:underline">Voir tous →</Link>
        </div>
        {recentUsers.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">Aucun utilisateur pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  {["Utilisateur", "Services", "Statut", "Date", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider pb-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-hover)] transition-all">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(user.full_name || user.email).split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{user.full_name || "—"}</p>
                          <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {(user.services || []).map((s) => (
                          <span key={s} className="w-7 h-7 rounded-md bg-[var(--bg-tertiary)] flex items-center justify-center" title={SERVICE_LABELS[s] ?? s}>
                            {s === "real_estate" && <HomeIcon className="w-4 h-4 text-blue-500" />}
                            {s === "auto" && <TruckIcon className="w-4 h-4 text-amber-500" />}
                            {s === "trash" && <TrashIcon className="w-4 h-4 text-emerald-500" />}
                          </span>
                        ))}
                        {(user.services || []).length === 0 && <span className="text-xs text-[var(--text-muted)]">—</span>}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === "approved" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
                        user.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                        user.status === "rejected" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        {user.status === "approved" ? "Approuve" : user.status === "pending" ? "En attente" : user.status === "rejected" ? "Rejete" : user.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-[var(--text-muted)]">{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="py-3">
                      <Link href="/admin/utilisateurs" className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-all">
                        <EyeIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal rejet */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Rejeter la demande</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Demande de <span className="font-medium text-[var(--text-primary)]">{rejectModal.name}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du rejet (optionnel)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading?.includes("reject")}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                {actionLoading?.includes("reject") ? "..." : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}