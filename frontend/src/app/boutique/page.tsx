"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { PRODUITS, formatCDF, formatUSD } from "./data";
import { useCart } from "@/context/BoutiqueCartContext";
import type { Product } from "@/context/BoutiqueCartContext";

/* ── Hero slides ── */
const slides = [
  {
    bg: "from-[#1a0a00] to-[#3d1a00]",
    badge: "🔥 Promotion du moment",
    title: "Électroménager\npour toute la famille",
    sub: "Réfrigérateurs, cuisinières, machines à laver — livraison à Kinshasa & partout en RDC",
    cta: "/boutique/menager",
    ctaLabel: "Voir l'électroménager",
    accent: "#e63900",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  },
  {
    bg: "from-[#000d1a] to-[#001a33]",
    badge: "🚗 Pièces & Accessoires",
    title: "Tout pour votre\nvéhicule",
    sub: "Pneus Bridgestone, batteries Bosch, huiles Total, autoradios Pioneer — prix en CDF & USD",
    cta: "/boutique/automobile",
    ctaLabel: "Voir les pièces auto",
    accent: "#0ea5e9",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
  },
  {
    bg: "from-[#0a1a00] to-[#1a3300]",
    badge: "💚 Paiement Mobile Money",
    title: "Payez avec\nM-Pesa, Orange Money\nou Airtel Money",
    sub: "Aucune carte bancaire requise — achetez en toute confiance depuis votre téléphone",
    cta: "/boutique/menager",
    ctaLabel: "Commencer mes achats",
    accent: "#22c55e",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  },
];

/* ── Trust badges ── */
const trust = [
  { icon: TruckIcon, title: "Livraison RDC", sub: "Kinshasa, Lubumbashi, Goma…" },
  { icon: ShieldCheckIcon, title: "Paiement sécurisé", sub: "M-Pesa · Orange · Airtel" },
  { icon: ChatBubbleLeftRightIcon, title: "Support WhatsApp", sub: "Réponse rapide 24h/7j" },
  { icon: StarIcon, title: "Produits certifiés", sub: "Marques internationales" },
];

/* ── Product card ── */
function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <Link
      href={`/boutique/produit/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <Image
          src={product.image}
          alt={product.nom}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {!product.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Rupture de stock</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-[#e63900] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {product.marque}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{product.sous_categorie}</div>
        <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.nom}</div>
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarSolid key={i} className="w-3 h-3 text-amber-400" />
          ))}
          <span className="text-xs text-gray-400 ml-1">(24)</span>
        </div>
        <div className="mt-auto pt-2">
          <div className="text-[#e63900] font-black text-base">{formatCDF(product.prix_cdf)}</div>
          {product.prix_usd && (
            <div className="text-gray-400 text-xs">≈ {formatUSD(product.prix_usd)}</div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!product.disponible}
          className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            added
              ? "bg-green-500 text-white"
              : product.disponible
              ? "bg-[#e63900] hover:bg-[#c43200] text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <ShoppingCartIcon className="w-4 h-4" />
          {added ? "Ajouté ✓" : product.disponible ? "Ajouter au panier" : "Indisponible"}
        </button>
      </div>
    </Link>
  );
}

/* ── Mobile Money 3D Carousel ── */
/* Coverflow 3D cards data */
const MM_CARDS = [
  {
    id: "mpesa",
    img: null,
    accent: "#22c55e",
    bg: "linear-gradient(160deg, #166534 0%, #14532d 60%, #052e16 100%)",
    border: "rgba(134,239,172,0.45)",
    shadow: "0 20px 60px rgba(34,197,94,0.4), 0 0 0 1px rgba(134,239,172,0.3)",
    content: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(134,239,172,0.4)" }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 36, lineHeight: 1, fontFamily: "Arial Black,sans-serif" }}>M</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: 4, fontFamily: "Arial Black,sans-serif" }}>PESA</div>
          <div style={{ color: "rgba(187,247,208,0.8)", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>Mobile Money</div>
        </div>
        <div style={{ marginTop: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(34,197,94,0.25)", border: "1px solid rgba(134,239,172,0.4)", color: "#86efac", fontSize: 11, fontWeight: 700 }}>Safaricom</div>
      </div>
    ),
  },
  {
    id: "airtel",
    img: "/Airtel-money.png",
    accent: "#ef4444",
    bg: "linear-gradient(160deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)",
    border: "rgba(252,165,165,0.5)",
    shadow: "0 20px 60px rgba(239,68,68,0.45), 0 0 0 1px rgba(252,165,165,0.3)",
    content: null,
  },
  {
    id: "orange",
    img: null,
    accent: "#f97316",
    bg: "linear-gradient(160deg, #7c2d12 0%, #9a3412 50%, #431407 100%)",
    border: "rgba(253,186,116,0.45)",
    shadow: "0 20px 60px rgba(249,115,22,0.4), 0 0 0 1px rgba(253,186,116,0.3)",
    content: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,165,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(253,186,116,0.5)" }}>
          <svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="none" stroke="#fb923c" strokeWidth="3"/><circle cx="20" cy="20" r="8" fill="#fb923c"/></svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, fontFamily: "Arial Black,sans-serif" }}>Orange</div>
          <div style={{ color: "#fed7aa", fontWeight: 700, fontSize: 16 }}>Money</div>
          <div style={{ color: "rgba(253,186,116,0.7)", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>Mobile Money</div>
        </div>
        <div style={{ marginTop: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(249,115,22,0.25)", border: "1px solid rgba(253,186,116,0.4)", color: "#fdba74", fontSize: 11, fontWeight: 700 }}>Orange RDC</div>
      </div>
    ),
  },
];

function MobileMoneyCarousel() {
  const [active, setActive] = useState(1); // airtel au centre par défaut

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % MM_CARDS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const W = 140; // card width
  const H = 200; // card height
  const GAP = 170; // horizontal spacing

  return (
    <>
      <style>{`
        @keyframes cf-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes cf-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .cf-wrap {
          position: relative;
          width: 420px;
          height: 260px;
          perspective: 800px;
          perspective-origin: 50% 40%;
        }
        .cf-card-outer {
          position: absolute;
          top: 50%; left: 50%;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.7s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.7s ease,
                      opacity 0.7s ease,
                      filter 0.7s ease;
          will-change: transform;
        }
        .cf-card-outer.active {
          animation: cf-float 3.5s ease-in-out infinite;
        }
        .cf-card-img {
          width: 100%; height: 100%;
          object-fit: contain;
          display: block;
          padding: 12px;
          box-sizing: border-box;
        }
        .cf-dots {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 7px;
        }
      `}</style>

      <div className="cf-wrap">
        {MM_CARDS.map((card, i) => {
          const total = MM_CARDS.length;
          let diff = i - active;
          if (diff > total / 2) diff -= total;
          if (diff < -total / 2) diff += total;

          const isCenter = diff === 0;
          const tx = diff * GAP - W / 2;
          const ty = isCenter ? -(H / 2) : -(H / 2) + 20;
          const tz = isCenter ? 60 : -60;
          const ry = isCenter ? 0 : diff * -42;
          const scale = isCenter ? 1 : 0.78;
          const zIndex = isCenter ? 10 : 5 - Math.abs(diff);
          const opacity = Math.abs(diff) > 1 ? 0 : isCenter ? 1 : 0.65;
          const blur = isCenter ? "none" : "blur(1.5px)";

          return (
            <div
              key={card.id}
              className={`cf-card-outer${isCenter ? " active" : ""}`}
              onClick={() => setActive(i)}
              style={{
                width: W,
                height: H,
                marginLeft: 0,
                marginTop: 0,
                transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
                zIndex,
                opacity,
                filter: blur,
                boxShadow: isCenter ? card.shadow : "0 8px 24px rgba(0,0,0,0.4)",
                border: `2px solid ${card.border}`,
                background: card.bg,
              }}
            >
              {card.img ? (
                <img src={card.img} alt={card.id} className="cf-card-img" />
              ) : (
                <div style={{ width: "100%", height: "100%" }}>{card.content}</div>
              )}
              {/* shine overlay */}
              {isCenter && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)",
                }} />
              )}
            </div>
          );
        })}

        <div className="cf-dots">
          {MM_CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 24 : 8, height: 8,
                borderRadius: 9999, border: "none", cursor: "pointer",
                background: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                transition: "all 0.35s",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Main page ── */
export default function BoutiqueHomePage() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const featured = PRODUITS.filter((p) => p.disponible).slice(0, 8);
  const menager = PRODUITS.filter((p) => p.categorie === "menager" && p.disponible).slice(0, 4);
  const auto = PRODUITS.filter((p) => p.categorie === "automobile" && p.disponible).slice(0, 4);

  const current = slides[slide];

  return (
    <div>
      {/* ── Hero Slider ── */}
      <section className={`relative bg-gradient-to-br ${current.bg} min-h-[480px] md:min-h-[540px] overflow-hidden`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 py-16 md:py-20 flex flex-col md:flex-row items-center gap-10"
          >
            <div className="flex-1 text-white">
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
                style={{ backgroundColor: current.accent + "33", color: current.accent }}
              >
                {current.badge}
              </span>
              <h1 className="text-3xl md:text-5xl font-black leading-tight whitespace-pre-line mb-4">
                {current.title}
              </h1>
              <p className="text-white/70 text-sm md:text-base max-w-md mb-8">{current.sub}</p>
              <Link
                href={current.cta}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-transform hover:scale-105"
                style={{ backgroundColor: current.accent }}
              >
                {current.ctaLabel}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              {slide === 2 ? (
                <MobileMoneyCarousel />
              ) : (
                <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={current.image}
                    alt="hero"
                    fill
                    className="object-cover"
                    sizes="400px"
                    priority
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === slide ? "bg-white w-6" : "bg-white/40"}`}
            />
          ))}
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="bg-[#0f0f0f] py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {trust.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="bg-[#e63900]/10 p-2.5 rounded-xl flex-shrink-0">
                <Icon className="w-5 h-5 text-[#e63900]" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{title}</div>
                <div className="text-white/40 text-xs">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Nos rayons</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Ménager */}
          <Link
            href="/boutique/menager"
            className="group relative rounded-3xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-orange-400 to-red-600 p-6 flex flex-col justify-end shadow-lg hover:shadow-2xl transition-shadow"
          >
            <Image
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
              alt="Ménager"
              fill
              className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
              sizes="50vw"
            />
            <div className="relative z-10">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-white font-black text-xl">Ménager</div>
              <div className="text-white/80 text-sm">Électroménager, Cuisine, Entretien</div>
              <div className="mt-3 inline-flex items-center gap-1 text-white text-xs font-bold">
                Découvrir <ArrowRightIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* Auto */}
          <Link
            href="/boutique/automobile"
            className="group relative rounded-3xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-blue-800 to-gray-900 p-6 flex flex-col justify-end shadow-lg hover:shadow-2xl transition-shadow"
          >
            <Image
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80"
              alt="Automobile"
              fill
              className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
              sizes="50vw"
            />
            <div className="relative z-10">
              <div className="text-4xl mb-2">🚗</div>
              <div className="text-white font-black text-xl">Auto & Pièces</div>
              <div className="text-white/80 text-sm">Pneus, Batteries, Électronique</div>
              <div className="mt-3 inline-flex items-center gap-1 text-white text-xs font-bold">
                Découvrir <ArrowRightIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Produits vedettes ── */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FireIcon className="w-6 h-6 text-[#e63900]" />
            <h2 className="text-2xl font-black text-gray-900">Produits populaires</h2>
          </div>
          <Link href="/boutique/menager" className="text-[#e63900] text-sm font-semibold hover:underline flex items-center gap-1">
            Voir tout <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── Section Ménager ── */}
      <section className="bg-orange-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900">🏠 Électroménager</h2>
            <Link href="/boutique/menager" className="text-[#e63900] text-sm font-semibold hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {menager.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section Auto ── */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">🚗 Auto & Pièces</h2>
            <Link href="/boutique/automobile" className="text-sky-400 text-sm font-semibold hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {auto.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile Money Banner ── */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 py-12 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl mb-3">📱</div>
          <h2 className="text-2xl md:text-3xl font-black mb-3">Payez en Mobile Money</h2>
          <p className="text-white/80 mb-6 text-sm md:text-base">
            M-Pesa (Vodacom) · Orange Money · Airtel Money<br />
            Aucune carte bancaire requise. Paiement simple, rapide et sécurisé depuis votre téléphone.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "M-PESA", color: "bg-green-500", text: "text-white" },
              { label: "ORANGE MONEY", color: "bg-orange-500", text: "text-white" },
              { label: "AIRTEL MONEY", color: "bg-red-500", text: "text-white" },
            ].map(({ label, color, text }) => (
              <span key={label} className={`${color} ${text} font-bold text-sm px-5 py-2 rounded-full shadow-lg`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp CTA ── */}
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="text-3xl mb-3">💬</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Besoin d&apos;aide ?</h2>
          <p className="text-gray-500 text-sm mb-6">
            Notre équipe répond en français et en lingala via WhatsApp Business
          </p>
          <a
            href="https://wa.me/243000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-full transition-colors text-sm"
          >
            💬 Contacter sur WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
