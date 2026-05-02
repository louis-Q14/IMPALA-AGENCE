"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface User {
  full_name: string;
  email: string;
  role: string;
}

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/connexion"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "finance_agent") { router.replace("/connexion"); return; }
    setUser(parsed);
  }, [router]);

  if (!user) return null;

  const pages = [
    {
      label: "Revenus",
      description: "Analyse financière de la plateforme, transactions et exports.",
      href: "/finance/revenus",
      icon: CurrencyDollarIcon,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-600",
    },
    {
      label: "Dépenses",
      description: "Saisie, suivi et gestion de toutes les dépenses de la plateforme.",
      href: "/finance/depenses",
      icon: BanknotesIcon,
      color: "from-rose-500 to-red-600",
      bg: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-600",
    },
    {
      label: "Tarification & Frais",
      description: "Gestion des tarifs, commissions, frais fixes et abonnements de la plateforme.",
      href: "/finance/tarifs-frais",
      icon: TagIcon,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10 border-violet-500/20",
      text: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tableau de bord</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Bienvenue, <span className="font-semibold text-amber-600">{user.full_name}</span>. Sélectionnez un module ci-dessous.
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`group flex flex-col gap-4 p-5 rounded-2xl border ${page.bg} hover:scale-[1.02] transition-transform`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${page.color} flex items-center justify-center shadow`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`font-bold text-base ${page.text}`}>{page.label}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-5">{page.description}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${page.text}`}>
                <ChartBarIcon className="w-4 h-4" />
                Accéder
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
