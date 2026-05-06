"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BoutiqueCartProvider, useCart } from "@/context/BoutiqueCartContext";
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { ShoppingCartIcon as CartSolid } from "@heroicons/react/24/solid";

const navLinks = [
  { href: "/boutique", label: "Accueil", icon: HomeIcon },
  { href: "/boutique/menager", label: "Ménager", icon: SparklesIcon },
  { href: "/boutique/automobile", label: "Auto & Pièces", icon: WrenchScrewdriverIcon },
  { href: "/boutique/contact", label: "Nous contacter", icon: PhoneIcon },
];

function BoutiqueNavbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f] shadow-lg">
      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link href="/boutique" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#e63900] flex items-center justify-center font-black text-white text-sm">
            IB
          </div>
          <div className="hidden sm:block">
            <div className="text-white font-black text-lg leading-tight tracking-tight">IMPALA</div>
            <div className="text-[#e63900] font-bold text-xs leading-tight tracking-widest">BOUTIQUE</div>
          </div>
        </Link>

        {/* Search */}
        <form
          className="flex-1 max-w-xl hidden md:flex items-center bg-white/10 rounded-full px-4 py-2 gap-2"
          onSubmit={(e) => { e.preventDefault(); if (search.trim()) window.location.href = `/boutique/recherche?q=${encodeURIComponent(search)}`; }}
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-white/50 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un produit, une marque…"
            className="bg-transparent text-white placeholder-white/40 text-sm outline-none w-full"
          />
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link href="/boutique/panier" className="relative">
            {totalItems > 0 ? (
              <CartSolid className="w-7 h-7 text-[#e63900]" />
            ) : (
              <ShoppingCartIcon className="w-7 h-7 text-white" />
            )}
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#e63900] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] px-0.5">
                {totalItems}
              </span>
            )}
          </Link>
          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop nav links */}
      <nav className="hidden md:flex max-w-7xl mx-auto px-4 gap-1 pb-2">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href || (href !== "/boutique" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-[#e63900] text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#181818] border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          <form
            className="flex items-center bg-white/10 rounded-full px-4 py-2 gap-2"
            onSubmit={(e) => { e.preventDefault(); if (search.trim()) { window.location.href = `/boutique/recherche?q=${encodeURIComponent(search)}`; setOpen(false); } }}
          >
            <MagnifyingGlassIcon className="w-4 h-4 text-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent text-white placeholder-white/40 text-sm outline-none w-full"
            />
          </form>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 text-white/80 hover:text-white py-2"
            >
              <Icon className="w-5 h-5 text-[#e63900]" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

function BoutiqueFooter() {
  return (
    <footer className="bg-[#0f0f0f] text-white/60 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="text-white font-black text-xl mb-1">IMPALA BOUTIQUE</div>
          <div className="text-[#e63900] font-semibold text-xs tracking-widest mb-3">KINSHASA · RDC</div>
          <p className="text-white/50 text-xs leading-relaxed">
            Bienvenue na yo ! Votre boutique en ligne pour l&apos;électroménager et les pièces automobiles en République Démocratique du Congo.
          </p>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Catégories</div>
          <ul className="space-y-2">
            <li><Link href="/boutique/menager" className="hover:text-white transition-colors">Électroménager</Link></li>
            <li><Link href="/boutique/menager?cat=cuisine" className="hover:text-white transition-colors">Cuisine & Arts de table</Link></li>
            <li><Link href="/boutique/automobile" className="hover:text-white transition-colors">Pneus & Jantes</Link></li>
            <li><Link href="/boutique/automobile?cat=electronique" className="hover:text-white transition-colors">Électronique auto</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Paiement accepté</div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2"><span className="text-green-400 font-bold">M-PESA</span> <span className="text-white/40 text-xs">Vodacom</span></li>
            <li className="flex items-center gap-2"><span className="text-orange-400 font-bold">ORANGE MONEY</span></li>
            <li className="flex items-center gap-2"><span className="text-red-400 font-bold">AIRTEL MONEY</span></li>
          </ul>
          <div className="mt-4 text-xs text-white/40">Paiement 100% sécurisé</div>
        </div>
        <div>
          <div className="text-white font-semibold mb-3">Villes couvertes</div>
          <div className="flex flex-wrap gap-1">
            {["Kinshasa", "Lubumbashi", "Goma", "Kisangani", "Mbuji-Mayi", "Kananga", "Bukavu"].map((v) => (
              <span key={v} className="bg-white/5 px-2 py-0.5 rounded text-xs">{v}</span>
            ))}
          </div>
          <div className="mt-4">
            <a
              href="https://wa.me/243000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
            >
              💬 WhatsApp Support
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} IMPALA BOUTIQUE — Tala biloko na biso 🛍️
      </div>
    </footer>
  );
}

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoutiqueCartProvider>
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
        <BoutiqueNavbar />
        <main className="flex-1">{children}</main>
        <BoutiqueFooter />
      </div>
    </BoutiqueCartProvider>
  );
}
