"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  TruckIcon,
  TrashIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ScissorsIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "annonce" | "utilisateur" | "immobilier" | "automobile" | "poubelle" | "revenu" | "info";
  link: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  annonce: { icon: "📋", color: "bg-amber-500" },
  utilisateur: { icon: "👤", color: "bg-blue-500" },
  immobilier: { icon: "🏠", color: "bg-emerald-500" },
  automobile: { icon: "🚗", color: "bg-purple-500" },
  poubelle: { icon: "🗑️", color: "bg-red-500" },
  revenu: { icon: "💰", color: "bg-green-500" },
  info: { icon: "ℹ️", color: "bg-gray-500" },
};

const defaultNotifications: Notification[] = [];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: ChartBarIcon },
  { name: "Annonces", href: "/admin/annonces", icon: DocumentCheckIcon },
  { name: "Utilisateurs", href: "/admin/utilisateurs", icon: UsersIcon },
  { name: "Immobilier", href: "/admin/immobilier", icon: HomeIcon },
  { name: "Automobile", href: "/admin/automobile", icon: TruckIcon },
  { name: "Réservations", href: "/admin/reservations", icon: CalendarDaysIcon },
];

const multiImpalaItems = [
  { name: "Nettoyage", href: "/admin/nettoyage", icon: SparklesIcon },
  { name: "Repassage", href: "/admin/repassage", icon: ScissorsIcon },
  { name: "Déménagement", href: "/admin/demenagement", icon: ArchiveBoxIcon },
  { name: "Ramassage Poubelles", href: "/admin/poubelles", icon: TrashIcon },
];

const settingsItem = { name: "Paramètres", href: "/admin/parametres", icon: Cog6ToothIcon };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [initials, setInitials] = useState("AD");
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/connexion"); return; }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role === "finance_agent") { router.replace("/finance/tableau-de-bord"); return; }
      if (parsed.role !== "admin" && parsed.role !== "super_admin") { router.replace("/connexion"); return; }
    } catch { router.replace("/connexion"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = (): Notification[] => {
    const stored = localStorage.getItem("admin_notifications");
    if (!stored) return [];
    try { return JSON.parse(stored); } catch { return []; }
  };

  const loadCounts = () => {
    const notifs = loadNotifications();
    setNotifications(notifs);
    setUnreadNotifs(notifs.filter((n) => !n.read).length);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem("admin_notifications", JSON.stringify(updated));
    setUnreadNotifs(updated.filter((n) => !n.read).length);
  };

  const markAllAsRead = () => {
    setNotifications([]);
    localStorage.setItem("admin_notifications", JSON.stringify([]));
    setUnreadNotifs(0);
  };

  const handleNotifClick = (notif: Notification) => {
    const updated = notifications.filter((n) => n.id !== notif.id);
    setNotifications(updated);
    localStorage.setItem("admin_notifications", JSON.stringify(updated));
    setUnreadNotifs(updated.filter((n) => !n.read).length);
    setNotifOpen(false);
    router.push(notif.link);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setInitials(u.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "AD");
      } catch { /* ignore */ }
    }
    loadCounts();
    const handler = () => loadCounts();
    window.addEventListener("admin-notification", handler);
    window.addEventListener("storage", handler);
    const interval = setInterval(loadCounts, 5000);
    return () => {
      window.removeEventListener("admin-notification", handler);
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-20" : "w-64"} bg-[var(--bg-card)] border-r border-[var(--border-color)]
        flex flex-col transition-all duration-300 fixed inset-y-0 left-0 z-40`}>
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-color)] px-4">
          {collapsed ? (
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold">I</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-[var(--text-primary)]">
              IMPALA <span className="text-primary">Admin</span>
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
              </Link>
            );
          })}

          {/* Multi-Impala section */}
          <div className={`pt-3 mt-2 border-t border-[var(--border-color)]`}>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Multi-Impala
              </p>
            )}
            {multiImpalaItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <div className="pt-2">
            {(() => {
              const isActive = pathname.startsWith(settingsItem.href);
              return (
                <Link href={settingsItem.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}>
                  <settingsItem.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{settingsItem.name}</span>}
                </Link>
              );
            })()}
          </div>
        </nav>

        <div className="p-3 border-t border-[var(--border-color)]">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
              text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-hover)] transition-all">
            {collapsed ? "→" : "← Réduire"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 ${collapsed ? "ml-20" : "ml-64"}`} style={{ transition: 'margin-left 300ms' }}>
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:ring-2 focus:ring-primary/50 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
              >
                <BellIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse">{unreadNotifs}</span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-96 max-h-[70vh] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
                      {unreadNotifs > 0 && (
                        <p className="text-xs text-[var(--text-muted)]">{unreadNotifs} non lue{unreadNotifs > 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifs > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                          Tout marquer lu
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto max-h-[calc(70vh-60px)] divide-y divide-[var(--border-color)]">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <BellIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                        <p className="text-sm text-[var(--text-muted)]">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const cfg = typeConfig[notif.type] || typeConfig.info;
                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-[var(--bg-hover)] transition-colors ${
                              !notif.read ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg ${cfg.color} flex items-center justify-center text-white text-base flex-shrink-0 mt-0.5`}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm truncate ${
                                  !notif.read ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-secondary)]"
                                }`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1">{timeAgo(notif.createdAt)}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
