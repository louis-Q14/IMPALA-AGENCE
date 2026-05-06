"use client";

import Link from "next/link";
import { BoutiqueCartProvider } from "@/context/BoutiqueCartContext";

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
        <main className="flex-1">{children}</main>
        <BoutiqueFooter />
      </div>
    </BoutiqueCartProvider>
  );
}
