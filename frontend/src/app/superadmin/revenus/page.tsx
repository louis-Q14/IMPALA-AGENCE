"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  HomeIcon,
  TruckIcon,
  TrashIcon,
  BoltIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface Transaction {
  id: string;
  user: string;
  email: string;
  service: "real_estate" | "auto" | "trash" | "nettoyage" | "repassage" | "demenagement";
  desc: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "refunded";
  method: string;
}

interface MonthlyRow {
  month: string;
  year: string;
  quarter_label: string;
  quarter_num: number;
  immobilier: number;
  auto: number;
  poubelles: number;
  nettoyage: number;
  repassage: number;
  demenagement: number;
}

interface ApiTotals {
  total: number;
  immobilier: number;
  auto: number;
  poubelles: number;
  multiservices: number;
  pending: number;
  refunded: number;
}

const serviceLabels: Record<string, string> = {
  real_estate: "Immobilier",
  auto: "Automobile",
  trash: "Poubelles",
  nettoyage: "Nettoyage",
  repassage: "Repassage",
  demenagement: "Déménagement",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ChartRow = { month: string; immobilier: number; auto: number; poubelles: number; multiservices: number };

function deriveChartData(
  monthly: MonthlyRow[],
  period: string
): ChartRow[] {
  const toRow = (r: MonthlyRow, key: string): ChartRow => ({
    month: key,
    immobilier: Number(r.immobilier),
    auto: Number(r.auto),
    poubelles: Number(r.poubelles),
    multiservices: Number(r.nettoyage || 0) + Number(r.repassage || 0) + Number(r.demenagement || 0),
  });
  if (period === "month") {
    return monthly.slice(-6).map((r) => toRow(r, r.month));
  }
  if (period === "quarter") {
    const map = new Map<string, ChartRow>();
    for (const r of monthly) {
      const key = `${r.quarter_label} ${r.year}`;
      const existing = map.get(key) ?? { month: key, immobilier: 0, auto: 0, poubelles: 0, multiservices: 0 };
      existing.immobilier += Number(r.immobilier);
      existing.auto += Number(r.auto);
      existing.poubelles += Number(r.poubelles);
      existing.multiservices += Number(r.nettoyage || 0) + Number(r.repassage || 0) + Number(r.demenagement || 0);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }
  const map = new Map<string, ChartRow>();
  for (const r of monthly) {
    const key = r.year;
    const existing = map.get(key) ?? { month: key, immobilier: 0, auto: 0, poubelles: 0, multiservices: 0 };
    existing.immobilier += Number(r.immobilier);
    existing.auto += Number(r.auto);
    existing.poubelles += Number(r.poubelles);
    existing.multiservices += Number(r.nettoyage || 0) + Number(r.repassage || 0) + Number(r.demenagement || 0);
    map.set(key, existing);
  }
  return Array.from(map.values());
}

export default function SuperAdminRevenus() {
  const [period, setPeriod] = useState("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [apiTotals, setApiTotals] = useState<ApiTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchRevenue = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/superadmin/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      setTransactions(
        (data.transactions || []).map((t: Transaction) => ({
          ...t,
          amount: Number(t.amount),
        }))
      );
      setMonthlyData(data.monthlyChart || []);
      setApiTotals(data.totals ?? null);
    } catch {
      // keep empty state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const chartData = deriveChartData(monthlyData, period);
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((m) => m.immobilier + m.auto + m.poubelles + m.multiservices)) : 1;

  const totalPaid = apiTotals ? apiTotals.total : transactions.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const immobilierPaid = apiTotals ? apiTotals.immobilier : transactions.filter((t) => t.status === "paid" && t.service === "real_estate").reduce((s, t) => s + t.amount, 0);
  const autoPaid = apiTotals ? apiTotals.auto : transactions.filter((t) => t.status === "paid" && t.service === "auto").reduce((s, t) => s + t.amount, 0);
  const poubellesPaid = apiTotals ? apiTotals.poubelles : transactions.filter((t) => t.status === "paid" && t.service === "trash").reduce((s, t) => s + t.amount, 0);
  const multiservicesPaid = apiTotals ? (apiTotals.multiservices || 0) : transactions.filter((t) => t.status === "paid" && ["nettoyage","repassage","demenagement"].includes(t.service)).reduce((s, t) => s + t.amount, 0);
  const pendingTotal = apiTotals ? apiTotals.pending : transactions.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);
  const refundedTotal = apiTotals ? apiTotals.refunded : transactions.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0);

  const chartTotal = chartData.reduce((s, m) => s + m.immobilier + m.auto + m.poubelles + m.multiservices, 0);
  const chartImmo = chartData.reduce((s, m) => s + m.immobilier, 0);
  const chartAuto = chartData.reduce((s, m) => s + m.auto, 0);
  const chartPoubelles = chartData.reduce((s, m) => s + m.poubelles, 0);
  const chartMultiservices = chartData.reduce((s, m) => s + m.multiservices, 0);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (serviceFilter !== "all" && tx.service !== serviceFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          tx.id.toLowerCase().includes(q) ||
          tx.user.toLowerCase().includes(q) ||
          tx.desc.toLowerCase().includes(q) ||
          tx.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, search, serviceFilter, statusFilter]);

  const updateTxStatus = async (txId: string, status: "paid" | "pending" | "refunded") => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await fetch(`${API_BASE}/superadmin/revenue/transactions/${txId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
    } catch {
      // best-effort
    }
  };

  const markAsPaid = (txId: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, status: "paid" as const } : t)));
    if (selectedTx?.id === txId) setSelectedTx((prev) => (prev ? { ...prev, status: "paid" as const } : null));
    updateTxStatus(txId, "paid");
  };

  const refundTransaction = (tx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, status: "refunded" as const } : t)));
    if (selectedTx?.id === tx.id) setSelectedTx((prev) => (prev ? { ...prev, status: "refunded" as const } : null));
    setRefundConfirm(null);
    updateTxStatus(tx.id, "refunded");
  };

  const exportCSV = () => {
    const headers = ["Facture", "Client", "Email", "Service", "Description", "Montant", "Date", "Statut", "Méthode"];
    const rows = filtered.map((tx) => [
      tx.id,
      tx.user,
      tx.email,
      serviceLabels[tx.service],
      tx.desc,
      Math.round(tx.amount).toLocaleString("fr-FR") + " CDF",
      tx.date,
      tx.status === "paid" ? "Payé" : tx.status === "pending" ? "En attente" : "Remboursé",
      tx.method,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenus_superadmin_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // suppress unused variable warnings
  void immobilierPaid; void autoPaid; void poubellesPaid; void multiservicesPaid; void chartMultiservices;

  const formatAmount = (n: number) => Math.round(n).toLocaleString("fr-FR") + " CDF";

  return (
    <>
      {loading && (
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      {!loading && (
      <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Revenus</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Vue financière complète de la plateforme · {transactions.length} transactions
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
        >
          <ArrowDownTrayIcon className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Revenu total", value: chartTotal, icon: CurrencyDollarIcon, color: "bg-primary", change: "+18%" },
          { label: "Immobilier", value: chartImmo, icon: HomeIcon, color: "bg-blue-500", change: "+22%" },
          { label: "Automobile", value: chartAuto, icon: TruckIcon, color: "bg-amber-500", change: "+15%" },
          { label: "Poubelles", value: chartPoubelles, icon: TrashIcon, color: "bg-emerald-500", change: "+25%" },
          { label: "Multi-services", value: chartData.reduce((s, m) => s + m.multiservices, 0), icon: BoltIcon, color: "bg-violet-500", change: "+0%" },
        ].map((card) => (
          <div key={card.label} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <ArrowTrendingUpIcon className="w-4 h-4" /> {card.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {Math.round(card.value).toLocaleString("fr-FR")} CDF
            </p>
            <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Payé (transactions)</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatAmount(totalPaid)}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">En attente</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatAmount(pendingTotal)}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Remboursé</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatAmount(refundedTotal)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Évolution des revenus</h3>
          <div className="flex gap-2">
            {[
              { key: "month", label: "Mois" },
              { key: "quarter", label: "Trimestre" },
              { key: "year", label: "Année" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.key
                    ? "bg-primary text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {chartData.map((d) => {
            const total = d.immobilier + d.auto + d.poubelles + d.multiservices;
            return (
              <div key={d.month} className="flex items-center gap-4">
                <span className="w-10 text-sm font-medium text-[var(--text-muted)]">{d.month}</span>
                <div className="flex-1 flex gap-0.5 h-10 rounded-lg overflow-hidden">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${(d.immobilier / maxVal) * 100}%` }}
                    title={`Immobilier: ${Math.round(d.immobilier).toLocaleString("fr-FR")} CDF`}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${(d.auto / maxVal) * 100}%` }}
                    title={`Automobile: ${Math.round(d.auto).toLocaleString("fr-FR")} CDF`}
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(d.poubelles / maxVal) * 100}%` }}
                    title={`Poubelles: ${Math.round(d.poubelles).toLocaleString("fr-FR")} CDF`}
                  />
                  <div
                    className="bg-violet-500 transition-all duration-500"
                    style={{ width: `${(d.multiservices / maxVal) * 100}%` }}
                    title={`Multi-services: ${Math.round(d.multiservices).toLocaleString("fr-FR")} CDF`}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] w-24 text-right">
                  {Math.round(total).toLocaleString("fr-FR")} CDF
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-3 h-3 rounded-sm bg-blue-500" /> Immobilier
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-3 h-3 rounded-sm bg-amber-500" /> Automobile
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Poubelles
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-3 h-3 rounded-sm bg-violet-500" /> Multi-services
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Dernières transactions
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                ({filtered.length})
              </span>
            </h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full sm:w-56 pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || serviceFilter !== "all" || statusFilter !== "all"
                    ? "bg-primary text-white border-primary"
                    : "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <FunnelIcon className="w-4 h-4" /> Filtres
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Service</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">Tous les services</option>
                  <option value="real_estate">Immobilier</option>
                  <option value="auto">Automobile</option>
                  <option value="trash">Poubelles</option>
                  <option value="nettoyage">Nettoyage</option>
                  <option value="repassage">Repassage</option>
                  <option value="demenagement">Déménagement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Payé</option>
                  <option value="pending">En attente</option>
                  <option value="refunded">Remboursé</option>
                </select>
              </div>
              {(serviceFilter !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => { setServiceFilter("all"); setStatusFilter("all"); }}
                  className="self-end px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {["Facture", "Client", "Service", "Description", "Montant", "Date", "Statut", "Actions"].map((h) => (
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
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-hover)] transition-all">
                    <td className="px-4 py-3 text-sm font-mono text-primary">{tx.id}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{tx.user}</td>
                    <td className="px-4 py-3">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center ${
                          tx.service === "real_estate"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : tx.service === "auto"
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : tx.service === "trash"
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-violet-100 dark:bg-violet-900/30"
                        }`}
                      >
                        {tx.service === "real_estate" && <HomeIcon className="w-4 h-4 text-blue-500" />}
                        {tx.service === "auto" && <TruckIcon className="w-4 h-4 text-amber-500" />}
                        {tx.service === "trash" && <TrashIcon className="w-4 h-4 text-emerald-500" />}
                        {["nettoyage","repassage","demenagement"].includes(tx.service) && <BoltIcon className="w-4 h-4 text-violet-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{tx.desc}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{tx.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          tx.status === "paid"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : tx.status === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {tx.status === "paid" ? "Payé" : tx.status === "pending" ? "En attente" : "Remboursé"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          title="Détails"
                          className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {tx.status === "pending" && (
                          <button
                            onClick={() => markAsPaid(tx.id)}
                            title="Marquer payé"
                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {tx.status === "paid" && (
                          <button
                            onClick={() => setRefundConfirm(tx)}
                            title="Rembourser"
                            className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
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

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">{filtered.length} transaction(s)</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Total : {formatAmount(filtered.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0))}
            </span>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-lg p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedTx.service === "real_estate"
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : selectedTx.service === "auto"
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : selectedTx.service === "trash"
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-violet-100 dark:bg-violet-900/30"
                  }`}
                >
                  {selectedTx.service === "real_estate" && <HomeIcon className="w-6 h-6 text-blue-500" />}
                  {selectedTx.service === "auto" && <TruckIcon className="w-6 h-6 text-amber-500" />}
                  {selectedTx.service === "trash" && <TrashIcon className="w-6 h-6 text-emerald-500" />}
                  {["nettoyage","repassage","demenagement"].includes(selectedTx.service) && <BoltIcon className="w-6 h-6 text-violet-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedTx.id}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{selectedTx.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--bg-hover)] flex items-center justify-center transition-all"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Client", value: selectedTx.user },
                { label: "Email", value: selectedTx.email },
                { label: "Service", value: serviceLabels[selectedTx.service] },
                { label: "Description", value: selectedTx.desc },
                { label: "Montant", value: formatAmount(selectedTx.amount) },
                { label: "Méthode", value: selectedTx.method },
                { label: "Date", value: selectedTx.date },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b border-[var(--border-color)]"
                >
                  <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-[var(--text-muted)]">Statut :</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedTx.status === "paid"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : selectedTx.status === "pending"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {selectedTx.status === "paid" ? "Payé" : selectedTx.status === "pending" ? "En attente" : "Remboursé"}
              </span>
            </div>

            <div className="flex gap-3">
              {selectedTx.status === "pending" && (
                <button
                  onClick={() => markAsPaid(selectedTx.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-sm"
                >
                  <CheckCircleIcon className="w-4 h-4" /> Marquer comme payé
                </button>
              )}
              {selectedTx.status === "paid" && (
                <button
                  onClick={() => setRefundConfirm(selectedTx)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm"
                >
                  <ArrowPathIcon className="w-4 h-4" /> Rembourser
                </button>
              )}
              <button
                onClick={() => setSelectedTx(null)}
                className="px-6 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund confirmation modal */}
      {refundConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setRefundConfirm(null)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Confirmer le remboursement ?</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Vous êtes sur le point de rembourser{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatAmount(refundConfirm.amount)}
                </span>{" "}
                à{" "}
                <span className="font-semibold text-[var(--text-primary)]">{refundConfirm.user}</span>.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Facture : {refundConfirm.id} · {refundConfirm.desc}
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-3 font-medium">
                Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRefundConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => refundTransaction(refundConfirm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm"
              >
                <ArrowPathIcon className="w-4 h-4" /> Rembourser
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </>
  );
}
