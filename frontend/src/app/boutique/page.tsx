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
    img: "/M-pesa.png",
    bg: "radial-gradient(circle at 38% 30%, #4ade80 0%, #16a34a 45%, #052e16 100%)",
    glow: "rgba(34,197,94,0.55)",
    border: "rgba(134,239,172,0.5)",
    content: null,
  },
  {
    id: "airtel",
    img: "/Airtel-money.png",
    bg: "radial-gradient(circle at 38% 30%, #f87171 0%, #dc2626 45%, #450a0a 100%)",
    glow: "rgba(239,68,68,0.6)",
    border: "rgba(252,165,165,0.55)",
    content: null,
  },
  {
    id: "orange",
    img: "/Orange-money.png",
    bg: "radial-gradient(circle at 38% 30%, #fb923c 0%, #ea580c 45%, #431407 100%)",
    glow: "rgba(249,115,22,0.55)",
    border: "rgba(253,186,116,0.5)",
    content: null,
  },
];

function MobileMoneyCarousel() {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % MM_CARDS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const D = 200;
  const GAP = 230;

  return (
    <>
      <style>{`
        @keyframes mmSpinCenter {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes mmSpinSide {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes mmHaloBreath {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.06); }
        }
      `}</style>
      <div style={{ position: "relative", width: 560, height: 280 }}>
        {/* 3D stage */}
        <div style={{ position: "relative", width: "100%", height: "100%", perspective: "1400px", perspectiveOrigin: "50% 50%" }}>
          {MM_CARDS.map((card, i) => {
            const total = MM_CARDS.length;
            const half  = Math.floor(total / 2);
            const offset = ((i - active + total + half) % total) - half;
            if (Math.abs(offset) > 1) return null;

            const isCenter = offset === 0;
            const rotY = isCenter ? 0 : offset < 0 ? 52 : -52;
            const tx   = offset * GAP;
            const tz   = isCenter ? 0 : -160;
            const sc   = isCenter ? 1 : 0.78;
            const op   = isCenter ? 1 : 0.72;
            const zIdx = isCenter ? 10 : 5;

            return (
              <div
                key={card.id}
                onClick={() => !isCenter && setActive(i)}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: D,
                  height: D,
                  marginLeft: -D / 2,
                  marginTop: -D / 2,
                  zIndex: zIdx,
                  cursor: isCenter ? "default" : "pointer",
                  /* Transition très fluide — easing spring-like */
                  transition: "transform 1.1s cubic-bezier(0.22,1,0.36,1), opacity 1.1s cubic-bezier(0.22,1,0.36,1)",
                  transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${rotY}deg) scale(${sc})`,
                  opacity: op,
                }}
              >
                {/* Halo glassmorphism centre — respiration douce */}
                {isCenter && (
                  <div style={{
                    position: "absolute",
                    inset: -30,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    boxShadow: `0 0 60px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    zIndex: 0,
                    pointerEvents: "none",
                    animation: "mmHaloBreath 3s ease-in-out infinite",
                  }} />
                )}

                {/* Spinner wrapper — tourne sur lui-même */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  width: D,
                  height: D,
                  animation: isCenter
                    ? "mmSpinCenter 9s linear infinite"
                    : "mmSpinSide 16s linear infinite",
                }}>
                  {/* Cercle épaisseur de vitre */}
                  <div style={{
                    width: D,
                    height: D,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: card.bg,
                    border: `3px solid ${card.border}`,
                    boxShadow: isCenter
                      ? `inset 0 3px 6px rgba(255,255,255,0.6), inset 0 -3px 8px rgba(0,0,0,0.35), 0 0 0 4px rgba(255,255,255,0.22), 0 0 0 8px rgba(255,255,255,0.07), 0 0 0 11px rgba(0,0,0,0.25), 0 24px 60px ${card.glow}`
                      : `inset 0 2px 5px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.22), 0 0 0 3px rgba(255,255,255,0.14), 0 0 0 6px rgba(255,255,255,0.05), 0 0 0 8px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.4)`,
                    position: "relative",
                  }}>
                    {card.img && (
                      <img src={card.img} alt={card.id} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}
                    {!card.img && card.content}
                    {/* Réfraction vitre */}
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 28%, transparent 52%, rgba(255,255,255,0.04) 76%, rgba(255,255,255,0.16) 100%)",
                    }} />
                    {/* Liseré lumineux haut */}
                    <div style={{
                      position: "absolute", top: 0, left: "10%", right: "10%", height: "28%",
                      borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                      pointerEvents: "none",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Main page ── */
export default function BoutiqueHomePage() {
  const [slide, setSlide] = useState(0);

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
