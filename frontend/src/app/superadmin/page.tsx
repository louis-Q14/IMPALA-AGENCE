"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UsersIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  HomeIcon,
  TruckIcon,
  BanknotesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Stats {
  total_users: number;
  total_admins: number;
  total_support_agents: number;
  total_finance_agents: number;
  total_real_estate_ads: number;
  total_auto_ads: number;
  total_revenue: number;
}

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: string | number; icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <div className={`p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color.replace("text-", "bg-").replace("-600", "-600/10").replace("-500", "-500/10")}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/superadmin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tableau de bord Root</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Contrôle total · Accès illimité à toute la plateforme IMPALA-AGENCE
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Utilisateurs"
          value={loading ? "..." : (stats?.total_users ?? 0)}
          icon={UsersIcon}
          color="text-blue-600"
          href="/superadmin/utilisateurs"
        />
        <StatCard
          label="Administrateurs"
          value={loading ? "..." : (stats?.total_admins ?? 0)}
          icon={ShieldCheckIcon}
          color="text-violet-600"
          href="/superadmin/admins"
        />
        <StatCard
          label="Agents support"
          value={loading ? "..." : (stats?.total_support_agents ?? 0)}
          icon={UserGroupIcon}
          color="text-emerald-600"
          href="/superadmin/agents"
        />
        <StatCard
          label="Agents finance"
          value={loading ? "..." : (stats?.total_finance_agents ?? 0)}
          icon={CurrencyDollarIcon}
          color="text-amber-600"
          href="/superadmin/agents"
        />
        <StatCard
          label="Annonces immobilier"
          value={loading ? "..." : (stats?.total_real_estate_ads ?? 0)}
          icon={HomeIcon}
          color="text-teal-600"
          href="/superadmin/annonces"
        />
        <StatCard
          label="Annonces automobile"
          value={loading ? "..." : (stats?.total_auto_ads ?? 0)}
          icon={TruckIcon}
          color="text-orange-600"
          href="/superadmin/annonces"
        />
        <StatCard
          label="Revenus totaux"
          value={loading ? "..." : `${(stats?.total_revenue ?? 0).toFixed(2)} FC`}
          icon={CurrencyDollarIcon}
          color="text-green-600"
          href="/superadmin/revenus"
        />
        <StatCard
          label="Dépenses"
          value="Gérer"
          icon={BanknotesIcon}
          color="text-rose-600"
          href="/superadmin/depenses"
        />
        <StatCard
          label="Tarifs & Frais"
          value="Gérer"
          icon={TagIcon}
          color="text-violet-600"
          href="/superadmin/tarifs-frais"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/superadmin/admins?action=create"
            className="flex items-center gap-3 p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 transition-all group">
            <ShieldCheckIcon className="w-8 h-8 text-violet-600" />
            <div>
              <p className="font-semibold text-violet-700 dark:text-violet-400 text-sm">Créer un administrateur</p>
              <p className="text-xs text-[var(--text-muted)]">Compte admin système</p>
            </div>
          </Link>
          <Link href="/superadmin/agents?action=create&role=support_agent"
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all group">
            <UserGroupIcon className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Créer un agent support</p>
              <p className="text-xs text-[var(--text-muted)]">Service clientèle</p>
            </div>
          </Link>
          <Link href="/superadmin/agents?action=create&role=finance_agent"
            className="flex items-center gap-3 p-4 rounded-2xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 transition-all group">
            <CurrencyDollarIcon className="w-8 h-8 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Créer un agent finance</p>
              <p className="text-xs text-[var(--text-muted)]">Gestion financière</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Admin panel link */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-sm">Accéder au panneau administrateur standard</p>
          <p className="text-xs text-[var(--text-muted)]">Gestion des annonces, utilisateurs et poubelles</p>
        </div>
        <Link href="/admin"
          className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
          Panneau admin →
        </Link>
      </div>
    </div>
  );
}
