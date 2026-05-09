"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { LogoMark, LogoFull } from "./Logo";
import {
  HomeIcon,
  TruckIcon,
  TrashIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Accueil", href: "/", icon: HomeIcon },
  { name: "Immobilier", href: "/immobilier", icon: HomeIcon },
  { name: "Automobile", href: "/automobile", icon: TruckIcon },
  { name: "Multi-Impala", href: "/multi-impala", icon: BuildingStorefrontIcon },
  { name: "Tarifs", href: "/tarifs", icon: null },
];

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [boutiqueOpen, setBoutiqueOpen] = useState(false);
  const [mesAchatsOpen, setMesAchatsOpen] = useState(false);
  const [mobileBoutiqueOpen, setMobileBoutiqueOpen] = useState(false);
  const [mobileMesAchatsOpen, setMobileMesAchatsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const boutiqueRef = useRef<HTMLDivElement>(null);

  const refreshCartCount = () => {
    try {
      const raw = localStorage.getItem("impala_boutique_cart");
      if (raw) {
        const items: { quantite: number }[] = JSON.parse(raw);
        setCartCount(items.reduce((sum, i) => sum + i.quantite, 0));
      } else {
        setCartCount(0);
      }
    } catch { setCartCount(0); }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }

    const handleAuthChange = () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("cart-change", refreshCartCount);
    return () => {
      window.removeEventListener("storage", refreshCartCount);
      window.removeEventListener("cart-change", refreshCartCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (boutiqueRef.current && !boutiqueRef.current.contains(e.target as Node)) {
        setBoutiqueOpen(false);
        setMesAchatsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  };

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  if (['/connexion', '/inscription'].includes(pathname ?? '')) return null;
  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 glass border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <LogoMark className="h-9 w-auto sm:hidden" />
            <LogoFull className="hidden sm:block h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.filter((item) => !(user?.role === "finance_agent" && item.href === "/tarifs")).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                {item.name}
              </Link>
            ))}

            {/* Boutique Dropdown */}
            <div className="relative" ref={boutiqueRef}>
              <button
                onClick={() => { setBoutiqueOpen(!boutiqueOpen); setMesAchatsOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Boutique
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${boutiqueOpen ? "rotate-180" : ""}`} />
              </button>
              {boutiqueOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-xl py-1 z-50">
                  <Link href="/boutique" onClick={() => setBoutiqueOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <BuildingStorefrontIcon className="w-4 h-4" /> Accueil boutique
                  </Link>
                  <Link href="/boutique/panier" onClick={() => setBoutiqueOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <ShoppingCartIcon className="w-4 h-4" />
                    <span>Panier</span>
                    {cartCount > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold px-1.5">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                  <div className="border-t border-[var(--border-color)] mt-1">
                    <button
                      onClick={() => setMesAchatsOpen(!mesAchatsOpen)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                    >
                      <span className="flex items-center gap-2.5"><ShoppingBagIcon className="w-4 h-4" /> Mes achats</span>
                      <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${mesAchatsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {mesAchatsOpen && (
                      <div>
                        <Link href="/boutique/mes-achats" onClick={() => setBoutiqueOpen(false)}
                          className="flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                          Tous mes achats
                        </Link>
                        <Link href="/boutique/mes-achats" onClick={() => setBoutiqueOpen(false)}
                          className="flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                          En cours de livraison
                        </Link>
                        <Link href="/boutique/mes-achats" onClick={() => setBoutiqueOpen(false)}
                          className="flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                          Livrés &amp; Annulés
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center
                bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]
                border border-[var(--border-color)] transition-all"
              aria-label="Rechercher"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <ThemeToggle />

            {/* Auth / User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
                    hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white/15 dark:bg-gray-900/25 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/20 dark:ring-white/5 py-2 z-50">
                    <div className="px-4 py-3 border-b border-[var(--border-color)]">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{user.full_name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                      {user.role === "admin" && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          <ShieldCheckIcon className="w-3 h-3" /> Admin
                        </span>
                      )}
                                          {user.role === "admin" && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                              <ShieldCheckIcon className="w-3 h-3" /> Admin
                                            </span>
                                          )}
                                          {user.role === "super_admin" && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-500 text-xs font-medium">
                                              <ShieldCheckIcon className="w-3 h-3" /> Super Admin
                                            </span>
                                          )}
                    </div>
                    {user.role === "super_admin" && (
                      <Link href="/superadmin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-violet-500
                          hover:text-violet-600 hover:bg-violet-500/10 transition-all">
                        <BuildingStorefrontIcon className="w-4 h-4" /> Administration
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)]
                          hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                        <ShieldCheckIcon className="w-4 h-4" /> Dashboard Admin
                      </Link>
                    )}
                    {user.role !== "admin" && user.role !== "super_admin" && (
                      <Link href="/tableau-de-bord" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)]
                          hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                        <ChartBarIcon className="w-4 h-4" /> Tableau de bord
                      </Link>
                    )}
                    <Link href="/messagerie" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)]
                        hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" /> Messagerie
                    </Link>
                    <Link href="/profil" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)]
                        hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                      <UserCircleIcon className="w-4 h-4" /> Mon profil
                    </Link>
                    <Link href="/parametres" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)]
                        hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                      <Cog6ToothIcon className="w-4 h-4" /> Paramètres
                    </Link>
                    <div className="border-t border-[var(--border-color)] mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                          hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-xl
                    text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                    hover:bg-[var(--bg-hover)] transition-all"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-xl
                    bg-primary text-white hover:bg-primary-hover
                    shadow-md hover:shadow-lg transition-all"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center
                bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
            >
              {mobileOpen ? (
                <XMarkIcon className="w-5 h-5 text-[var(--text-primary)]" />
              ) : (
                <Bars3Icon className="w-5 h-5 text-[var(--text-primary)]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="px-4 py-3 space-y-1">
            {navigation.filter((item) => !(user?.role === "finance_agent" && item.href === "/tarifs")).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                {item.icon && <item.icon className="w-5 h-5" />}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}

            {/* Boutique mobile accordion */}
            <div>
              <button
                onClick={() => { setMobileBoutiqueOpen(!mobileBoutiqueOpen); setMobileMesAchatsOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                <span className="flex items-center gap-3"><BuildingStorefrontIcon className="w-5 h-5" /><span className="font-medium">Boutique</span></span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${mobileBoutiqueOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileBoutiqueOpen && (
                <div className="ml-4 border-l-2 border-[var(--border-color)] pl-3 space-y-0.5">
                  <Link href="/boutique" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <BuildingStorefrontIcon className="w-4 h-4" /> Accueil boutique
                  </Link>
                  <Link href="/boutique/panier" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                    <ShoppingCartIcon className="w-4 h-4" />
                    <span>Panier</span>
                    {cartCount > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold px-1.5">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                  <div>
                    <button
                      onClick={() => setMobileMesAchatsOpen(!mobileMesAchatsOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                    >
                      <span className="flex items-center gap-3"><ShoppingBagIcon className="w-4 h-4" /> Mes achats</span>
                      <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileMesAchatsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {mobileMesAchatsOpen && (
                      <div className="ml-4 border-l-2 border-[var(--border-color)] pl-3 space-y-0.5">
                        <Link href="/boutique/mes-achats" onClick={() => setMobileOpen(false)}
                          className="flex items-center px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                          Tous mes achats
                        </Link>
                        <Link href="/boutique/mes-achats" onClick={() => setMobileOpen(false)}
                          className="flex items-center px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                          En cours de livraison
                        </Link>
                        <Link href="/boutique/mes-achats" onClick={() => setMobileOpen(false)}
                          className="flex items-center px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                          Livrés &amp; Annulés
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)]">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{user.full_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                    </div>
                  </div>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-secondary)]
                        hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                      <ShieldCheckIcon className="w-5 h-5" /> Dashboard Admin
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500
                      hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" /> Déconnexion
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/connexion"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-xl font-medium border
                      border-[var(--border-color)] text-[var(--text-primary)]
                      hover:bg-[var(--bg-hover)] transition-all"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-xl font-medium
                      bg-primary text-white hover:bg-primary-hover transition-all"
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
