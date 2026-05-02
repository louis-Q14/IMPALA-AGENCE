"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  BanknotesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";

const sidebarItems = [
  { name: "Tableau de bord", href: "/finance/tableau-de-bord", icon: Squares2X2Icon },
  { name: "Revenus", href: "/finance/revenus", icon: CurrencyDollarIcon },
  { name: "Dépenses", href: "/finance/depenses", icon: BanknotesIcon },
  { name: "Tarification & Frais", href: "/finance/tarifs-frais", icon: TagIcon },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/connexion"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "finance_agent") { router.replace("/connexion"); return; }
    setUser(parsed);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/connexion");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"} bg-[var(--bg-card)] border-r border-[var(--border-color)]
          flex flex-col transition-all duration-300 fixed inset-y-0 left-0 z-40`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between border-b border-[var(--border-color)] px-4">
          {!collapsed && (
            <Link href="/finance/revenus" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
                <CurrencyDollarIcon className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">FINANCE</p>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Agent financier</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] ml-auto"
          >
            {collapsed ? <Bars3Icon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl mb-1 transition-all text-sm font-medium
                  ${active
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-600 border border-amber-500/20"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-amber-600" : ""}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-[var(--border-color)] p-3">
          {!collapsed && (
            <div className="mb-2 px-2">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.full_name}</p>
              <p className="text-xs text-amber-500 font-medium">FINANCE · Agent financier</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 ${collapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-widest">Panneau Finance</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <CurrencyDollarIcon className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-600">AGENT FINANCE</span>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
