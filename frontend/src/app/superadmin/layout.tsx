"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  TagIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const sidebarItems = [
  { name: "Dashboard", href: "/superadmin", icon: ChartBarIcon },
  { name: "Administrateurs", href: "/superadmin/admins", icon: ShieldCheckIcon },
  { name: "Agents", href: "/superadmin/agents", icon: UserGroupIcon },
  { name: "Utilisateurs", href: "/superadmin/utilisateurs", icon: UsersIcon },
  { name: "Annonces", href: "/superadmin/annonces", icon: DocumentCheckIcon },
  { name: "Revenus", href: "/superadmin/revenus", icon: CurrencyDollarIcon },
  { name: "Dépenses", href: "/superadmin/depenses", icon: BanknotesIcon },
  { name: "Tarification & Frais", href: "/superadmin/tarifs-frais", icon: TagIcon },
  { name: "Suivis des actions executer", href: "/superadmin/suivis-des-actions-executer", icon: ClipboardDocumentListIcon },
  { name: "Avis utilisateurs", href: "/superadmin/avis", icon: StarIcon },
  { name: "Paramètres", href: "/superadmin/parametres", icon: Cog6ToothIcon },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/connexion"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "super_admin") { router.replace("/"); return; }
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
            <Link href="/superadmin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">ROOT</p>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Super Admin</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
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
            const active = pathname === item.href || (item.href !== "/superadmin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl mb-1 transition-all text-sm font-medium
                  ${active
                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/10 text-violet-600 border border-violet-500/20"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-violet-600" : ""}`} />
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
              <p className="text-xs text-violet-500 font-medium">ROOT · Super Admin</p>
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
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm font-semibold text-violet-600 uppercase tracking-widest">Panneau Root</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-600/10 border border-violet-500/20">
              <ShieldCheckIcon className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-violet-600">SUPER ADMIN</span>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
