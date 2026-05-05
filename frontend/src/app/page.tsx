"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  type Variants,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useScroll,
  animate as fmAnimate,
} from "framer-motion";
import {
  HomeIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

/* ── Variants ── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ── Animated counter ── */
function AnimatedCounter({
  target,
  format,
  inView,
}: {
  target: number;
  format: (v: number) => string;
  inView: boolean;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => format(Math.round(v)));
  useEffect(() => {
    if (!inView) return;
    const controls = fmAnimate(count, target, { duration: 1.8, ease: "easeOut" });
    return controls.stop;
  }, [inView, target, count]);
  return <motion.span>{display}</motion.span>;
}

/* ── Data ── */
const services = [
  {
    title: "Immobilier",
    description: "Trouvez la maison de vos rêves. Vente et location avec carte interactive.",
    icon: "/immobilier-icon.png",
    href: "/immobilier",
    color: "from-blue-500 to-blue-700",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
    features: ["Carte interactive", "Filtres avancés", "Photos HD", "Contact direct"],
  },
  {
    title: "Automobile",
    description: "Vendez ou louez votre véhicule. Réservation avec calendrier intégré.",
    icon: "/automobile-icon.png",
    href: "/automobile",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
    features: ["Vente & location", "Calendrier", "Avis vérifiés", "Réservation en ligne"],
  },
  {
    title: "Multi-Impala",
    description: "L'offre tout-en-un : immobilier, automobile, nettoyage & collecte réunis sur une seule plateforme.",
    icon: "/multi-impala-icon.png",
    href: "/multi-impala",
    color: "from-violet-500 to-purple-700",
    bgLight: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    iconColor: "text-violet-500",
    features: ["Immobilier & Auto", "Nettoyage bureaux", "Collecte déchets", "Tableau de bord unifié"],
  },
];

const stats = [
  { target: 10000, label: "Annonces actives",  format: (v: number) => `${Math.round(v / 1000)}K+` },
  { target: 5000,  label: "Utilisateurs",       format: (v: number) => `${Math.round(v / 1000)}K+` },
  { target: 98,    label: "Satisfaction",        format: (v: number) => `${v}%` },
  { target: 24,    label: "Support",             format: (v: number) => `${v}/7` },
];

const testimonials = [
  {
    name: "Marie Dupont",
    role: "Propriétaire",
    content: "J’ai trouvé mon appartement en moins d’une semaine grâce à IMPALA-AGENCE. Service impeccable !",
    rating: 5,
  },
  {
    name: "Jean Martin",
    role: "Entreprise auto",
    content: "La gestion de ma flotte de location n’a jamais été aussi simple. Le calendrier est top.",
    rating: 5,
  },
  {
    name: "Sophie Laurent",
    role: "Particulier",
    content: "Le service poubelles est fantastique. On est prévenu la veille, c’est très pratique.",
    rating: 4,
  },
];

/* ── (heroDots removed — new teal Hero uses inline decorative elements) ── */

export default function HomePage() {
  const [latestAds, setLatestAds] = useState<Array<{
    id: string; title: string; address: string; city?: string | null;
    ad_type: "sale" | "rent"; price: number | null; rent_price?: number | null;
    surface?: number | null; rooms?: number | null; photos?: string[];
  }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads?limit=6`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setLatestAds(Array.isArray(data.data) ? data.data.slice(0, 6) : []);
      } catch { setLatestAds([]); }
    };
    load();
  }, []);

  const statsRef = useRef<HTMLElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  /* Cover Flow state */
  const [coverIdx, setCoverIdx] = useState(0);
  const [coverPaused, setCoverPaused] = useState(false);

  useEffect(() => {
    if (coverPaused) return;
    const t = setInterval(() => setCoverIdx((i) => (i + 1) % Math.max(1, latestAds.length || 4)), 6000);
    return () => clearInterval(t);
  }, [coverPaused, latestAds.length]);

  /* Scroll progress + parallax */
  const { scrollY, scrollYProgress } = useScroll();
  const blob1Y = useTransform(scrollY, [0, 600], [0, -120]);
  const blob2Y = useTransform(scrollY, [0, 600], [0, -70]);
  const heroImg1Y = useTransform(scrollY, [0, 600], [0, -45]); // kept for potential reuse
  const heroImg2Y = useTransform(scrollY, [0, 600], [0, 28]);  // kept for potential reuse

  return (
    <div>
      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ===== HERO — UI/UX Pro Max: Exaggerated Minimalism · Teal Real-Estate palette ===== */}
      <section className="relative overflow-hidden hero-teal min-h-screen flex items-center">
        {/* Dot grid */}
        <div className="absolute inset-0 hero-grid opacity-10 pointer-events-none" />

        {/* Parallax background blobs */}
        <motion.div style={{ y: blob1Y }} className="absolute -top-32 -left-32 pointer-events-none">
          <div className="w-[560px] h-[560px] bg-teal-300/8 rounded-full blur-3xl" />
        </motion.div>
        <motion.div style={{ y: blob2Y }} className="absolute -bottom-16 right-0 pointer-events-none">
          <div className="w-96 h-96 bg-teal-400/8 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:gap-12 items-center">

            {/* ── Left: Text content ── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="order-2 lg:order-1"
            >
              {/* Eyebrow badge */}
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-400/20 border border-teal-400/30 mb-8"
              >
                <motion.span
                  className="w-2 h-2 rounded-full bg-teal-400 block"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span
                  className="text-sm font-medium text-teal-200 tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-century-gothic)" }}
                >
                  Plateforme multiservices
                </span>
              </motion.div>

              {/* Giant heading — Exaggerated Minimalism */}
              <motion.h1 variants={fadeUp} className="leading-none">
                <span
                  className="block font-black text-white"
                  style={{
                    fontFamily: "var(--font-century-gothic)",
                    fontSize: "clamp(3.8rem, 9vw, 8.5rem)",
                    letterSpacing: "-0.04em",
                    lineHeight: 0.92,
                  }}
                >
                  IMPALA
                </span>
                <span
                  className="block text-teal-300 font-semibold mt-3"
                  style={{
                    fontFamily: "var(--font-century-gothic)",
                    fontSize: "clamp(1rem, 2.4vw, 1.75rem)",
                    letterSpacing: "0.18em",
                  }}
                >
                </span>
              </motion.h1>

              {/* Search bar */}
              <motion.div variants={fadeUp} className="mt-28 max-w-lg">
                <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-teal-400/30 p-2">
                  <MagnifyingGlassIcon className="w-5 h-5 text-teal-300 ml-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Rechercher un bien, un véhicule..."
                    className="flex-1 bg-transparent px-4 py-2.5 text-white placeholder:text-teal-300/50 focus:outline-none text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-medium rounded-xl transition-colors text-sm whitespace-nowrap"
                  >
                    Rechercher
                  </motion.button>
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/inscription"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400
                      text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-400/40 transition-all text-base"
                  >
                    Commencer gratuitement
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRightIcon className="w-5 h-5" />
                    </motion.span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/tarifs"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      text-white font-medium border border-teal-400/40 hover:bg-white/10 transition-colors text-base"
                  >
                    Voir les tarifs
                  </Link>
                </motion.div>
              </motion.div>

              {/* Mini stats row */}
              <motion.div variants={fadeUp} className="mt-10 flex items-center gap-0">
                {[
                  { value: "10K+", label: "Annonces" },
                  { value: "5K+",  label: "Utilisateurs" },
                  { value: "98%",  label: "Satisfaction" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`pr-8 ${i > 0 ? "pl-8 border-l border-teal-400/25" : ""}`}
                  >
                    <p
                      className="text-2xl font-black text-white leading-none"
                      style={{ fontFamily: "var(--font-century-gothic)" }}
                    >
                      {s.value}
                    </p>
                    <p className="text-[11px] text-teal-300/70 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Right: CoverFlow 3D Hero ── */}
            <motion.div
              className="order-1 lg:order-2 flex flex-col items-center justify-center lg:-mr-6"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {(() => {
                const heroDemoCards = [
                  { id: "d1", title: "Villa Toronto, Villa Modern", address: "345 Patu, Bandaiungwa Makelele, Kinsh", city: "Kinshasa", ad_type: "sale" as const, price: 100000000, rent_price: null, surface: 240, rooms: 5, photos: ["/villa.jpg"] },
                  { id: "d2", title: "villa nouvellement construit", address: "345 Seed, Bandaiungwea Limete", city: "Kinshasa", ad_type: "sale" as const, price: 1500000000, rent_price: null, surface: 320, rooms: 6, photos: ["/bungalow-ELEPHANT ROYAL_Page_4.jpg"] },
                  { id: "d3", title: "villa préfabriquée de lux.", address: "345 Design, Bandaiungwa Limete, Kns", city: "Kinshasa", ad_type: "sale" as const, price: 400000000, rent_price: null, surface: 180, rooms: 4, photos: ["/car 1.png"] },
                  { id: "d4", title: "Appartement standing", address: "Kinshasa, Bandal", city: "Kinshasa", ad_type: "rent" as const, price: null, rent_price: 95000, surface: 85, rooms: 2, photos: [] },
                ];
                const heroCards = latestAds.length > 0 ? latestAds : heroDemoCards;
                const total = heroCards.length;
                const heroPrev = () => { setCoverIdx((i) => (i - 1 + total) % total); setCoverPaused(true); };
                const heroNext = () => { setCoverIdx((i) => (i + 1) % total); setCoverPaused(true); };
                const CARD_W = 390;
                const PHOTO_H = 420;

                return (
                  <div
                    onMouseEnter={() => setCoverPaused(true)}
                    onMouseLeave={() => setCoverPaused(false)}
                    className="w-full"
                  >
                    {/* 3D stage */}
                    <div
                      style={{
                        position: "relative",
                        height: "720px",
                        perspective: "1400px",
                        perspectiveOrigin: "50% 50%",
                      }}
                    >
                      {heroCards.map((ad, i) => {
                        const offset = i - coverIdx;
                        const half = Math.floor(total / 2);
                        const wo = ((offset + total + half) % total) - half;
                        const abs = Math.abs(wo);
                        if (abs > 2) return null;
                        const rotY = wo === 0 ? 0 : wo < 0 ? 55 : -55;
                        const tx   = wo * 270;
                        const tz   = abs === 0 ? 0 : -160;
                        const sc   = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.63;
                        const op   = abs === 0 ? 1 : abs === 1 ? 0.88 : 0.48;
                        const zIdx = 30 - abs * 8;

                        return (
                          <div
                            key={ad.id}
                            onClick={() => abs > 0 && setCoverIdx(i)}
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              width: `${CARD_W}px`,
                              marginLeft: `${-CARD_W / 2}px`,
                              marginTop: "-290px",
                              zIndex: zIdx,
                              opacity: op,
                              cursor: abs === 0 ? "default" : "pointer",
                              transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${rotY}deg) scale(${sc})`,
                              transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.7s ease",
                            }}
                          >
                            {/* ── Glassmorphism halo ── */}
                            <div
                              style={{
                                position: "absolute",
                                inset: "-50px",
                                borderRadius: "20px",
                                background: abs === 0
                                  ? "rgba(255,255,255,0.10)"
                                  : "rgba(255,255,255,0.055)",
                                backdropFilter: "blur(28px)",
                                WebkitBackdropFilter: "blur(28px)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                boxShadow: abs === 0
                                  ? "0 0 60px rgba(45,212,191,0.18), inset 0 1px 0 rgba(255,255,255,0.2)"
                                  : "0 0 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
                                zIndex: 0,
                                pointerEvents: "none",
                              }}
                            />
                            <Link
                              href={`/immobilier/${ad.id}`}
                              onClick={(e) => abs > 0 && e.preventDefault()}
                              style={{
                                display: "block",
                                position: "relative",
                                zIndex: 1,
                                borderRadius: "10px",
                                overflow: "hidden",
                                boxShadow: abs === 0
                                  ? "0 32px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.15)"
                                  : "0 12px 28px rgba(0,0,0,0.45)",
                              }}
                            >
                              {/* Photo */}
                              <div style={{ height: `${PHOTO_H}px`, background: "#0f4c3f", overflow: "hidden" }}>
                                {ad.photos?.[0] ? (
                                  <img
                                    src={ad.photos[0]}
                                    alt={ad.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                  />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f766e,#1e293b)" }}>
                                    <HomeIcon style={{ width: 64, height: 64, color: "rgba(94,234,212,0.5)" }} />
                                  </div>
                                )}
                              </div>
                              {/* Info */}
                              <div style={{ padding: "18px 22px", background: "rgba(15,25,40,0.92)", backdropFilter: "blur(12px)" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}>{ad.title}</span>
                                  <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, background: ad.ad_type === "sale" ? "#2563eb" : "#059669" }}>
                                    {ad.ad_type === "sale" ? "Vente" : "Location"}
                                  </span>
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: "#2dd4bf", marginBottom: 6 }}>
                                  {Number(ad.price ?? ad.rent_price ?? 0).toLocaleString("fr-FR")} FC{ad.ad_type === "rent" ? "/mois" : ""}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "rgba(148,220,210,0.8)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                  <MapPinIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                                  {[ad.address, ad.city].filter(Boolean).join(", ")}
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <motion.button
                        onClick={heroPrev}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        className="w-11 h-11 rounded-full bg-white/10 hover:bg-teal-500/50 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </motion.button>
                      <div className="flex items-center gap-2">
                        {heroCards.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setCoverIdx(i); setCoverPaused(true); }}
                            style={{
                              width: i === coverIdx ? 28 : 8,
                              height: 8,
                              borderRadius: 999,
                              border: "none",
                              cursor: "pointer",
                              background: i === coverIdx ? "#2dd4bf" : "rgba(255,255,255,0.35)",
                              transition: "width 0.3s ease, background 0.3s ease",
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                      <motion.button
                        onClick={heroNext}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        className="w-11 h-11 rounded-full bg-white/10 hover:bg-teal-500/50 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </motion.button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Nos Services</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Choisissez les services qui vous correspondent et gérez tout depuis votre espace personnel.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {services.map((service) => (
              <motion.div
                key={service.title}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                className="group"
              >
                <Link
                  href={service.href}
                  className={`relative p-8 rounded-2xl border ${service.borderColor} ${service.bgLight}
                    hover:shadow-2xl transition-shadow duration-300 block h-full`}
                >
                  <motion.div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color}
                      flex items-center justify-center mb-6 shadow-lg`}
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Image src={service.icon} alt={service.title} width={28} height={28} className="w-7 h-7 object-contain" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{service.title}</h3>
                  <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">{service.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {service.features.map((f) => (
                      <span key={f} className="px-3 py-1 text-xs font-medium rounded-full
                        bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                    Découvrir
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}>
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section
        ref={statsRef as React.RefObject<HTMLElement>}
        className="py-16 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-primary">
                  <AnimatedCounter target={s.target} format={s.format} inView={statsInView} />
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== LATEST ADS — Cover Flow 3D ===== */}
      <section className="py-20 bg-[var(--bg-secondary)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-end justify-between gap-4 mb-12"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Dernières annonces immobilières
              </h2>
              <p className="mt-3 text-[var(--text-secondary)]">
                Les annonces publiées apparaissent automatiquement ici.
              </p>
            </div>
            <Link href="/immobilier" className="text-primary font-medium hover:underline whitespace-nowrap">
              Voir tout
            </Link>
          </motion.div>

          {/* ── Cover Flow stage ── pure CSS 3D transforms ── */}
          {(() => {
            const demoCards = [
              { id: "d1", title: "Villa moderne", address: "Kinshasa, Gombe", city: "Kinshasa", ad_type: "sale" as const, price: 850000, rent_price: null, surface: 240, rooms: 5, photos: ["/villa.jpg"] },
              { id: "d2", title: "Bungalow tropical", address: "Kinshasa, Ngaliema", city: "Kinshasa", ad_type: "rent" as const, price: null, rent_price: 120000, surface: 140, rooms: 3, photos: ["/bungalow-ELEPHANT ROYAL_Page_4.jpg"] },
              { id: "d3", title: "SUV Premium", address: "Kinshasa, Limete", city: "Kinshasa", ad_type: "sale" as const, price: 450000, rent_price: null, surface: null, rooms: null, photos: ["/car 1.png"] },
              { id: "d4", title: "Appartement standing", address: "Kinshasa, Bandal", city: "Kinshasa", ad_type: "rent" as const, price: null, rent_price: 95000, surface: 85, rooms: 2, photos: [] },
            ];
            const cards = latestAds.length > 0 ? latestAds : demoCards;
            const total = cards.length;
            const prev = () => { setCoverIdx((i) => (i - 1 + total) % total); setCoverPaused(true); };
            const next = () => { setCoverIdx((i) => (i + 1) % total); setCoverPaused(true); };

            return (
              <div
                onMouseEnter={() => setCoverPaused(true)}
                onMouseLeave={() => setCoverPaused(false)}
              >
                {/* 3D stage — perspective on wrapper, cards centred with CSS */}
                <div
                  style={{
                    position: "relative",
                    height: "460px",
                    perspective: "1000px",
                    perspectiveOrigin: "50% 50%",
                  }}
                >
                  {cards.map((ad, i) => {
                    const offset = i - coverIdx;
                    const half = Math.floor(total / 2);
                    const wo = ((offset + total + half) % total) - half; // wrapped offset
                    const abs = Math.abs(wo);
                    if (abs > 2) return null;

                    /* CoverFlow geometry */
                    const CARD_W = 260;
                    const rotY  = wo === 0 ? 0 : wo < 0 ?  60 : -60;
                    const tx    = wo * 200;                 // px from centre
                    const tz    = abs === 0 ? 0 : -120;    // push side cards back
                    const sc    = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.65;
                    const op    = abs === 0 ? 1 : abs === 1 ? 0.88 : 0.50;
                    const zIdx  = 30 - abs * 8;

                    return (
                      <div
                        key={ad.id}
                        onClick={() => abs > 0 && setCoverIdx(i)}
                        style={{
                          position:  "absolute",
                          left:      "50%",
                          top:       "50%",
                          width:     `${CARD_W}px`,
                          marginLeft: `${-CARD_W / 2}px`,
                          marginTop:  "-195px",
                          zIndex:     zIdx,
                          opacity:    op,
                          cursor:     abs === 0 ? "default" : "pointer",
                          transform:  `translateX(${tx}px) translateZ(${tz}px) rotateY(${rotY}deg) scale(${sc})`,
                          transition: "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.45s ease",
                        }}
                      >
                        {/* Card body */}
                        <Link
                          href={`/immobilier/${ad.id}`}
                          onClick={(e) => abs > 0 && e.preventDefault()}
                          style={{
                            display: "block",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: abs === 0
                              ? "0 28px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)"
                              : "0 10px 24px rgba(0,0,0,0.38)",
                          }}
                        >
                          {/* Photo */}
                          <div style={{ height: "285px", background: "#0f4c3f", overflow: "hidden" }}>
                            {ad.photos?.[0] ? (
                              <img
                                src={ad.photos[0]}
                                alt={ad.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f766e,#1e293b)" }}>
                                <HomeIcon style={{ width: 56, height: 56, color: "rgba(94,234,212,0.5)" }} />
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div style={{ padding: "14px 16px", background: "var(--bg-card)" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}>{ad.title}</span>
                              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0, background: ad.ad_type === "sale" ? "#2563eb" : "#059669" }}>
                                {ad.ad_type === "sale" ? "Vente" : "Location"}
                              </span>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: "#0d9488", marginBottom: 4 }}>
                              {Number(ad.price ?? ad.rent_price ?? 0).toLocaleString("fr-FR")} FC{ad.ad_type === "rent" ? "/mois" : ""}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                              <MapPinIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                              {[ad.address, ad.city].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mt-6">
                  <motion.button
                    onClick={prev}
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-teal-500/20 hover:bg-teal-500/40 border border-teal-500/30 flex items-center justify-center text-teal-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </motion.button>
                  <div className="flex items-center gap-2">
                    {cards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setCoverIdx(i); setCoverPaused(true); }}
                        style={{
                          width:  i === coverIdx ? 24 : 8,
                          height: 8,
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          background: i === coverIdx ? "#14b8a6" : "#94a3b8",
                          transition: "width 0.3s ease, background 0.3s ease",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                  <motion.button
                    onClick={next}
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-teal-500/20 hover:bg-teal-500/40 border border-teal-500/30 flex items-center justify-center text-teal-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </motion.button>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Pourquoi IMPALA-AGENCE ?
            </h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {[
              { icon: ShieldCheckIcon, title: "Sécurisé", desc: "Vos données sont protégées. Paiements via Stripe, conforme RGPD." },
              { icon: CreditCardIcon, title: "Abonnements flexibles", desc: "Choisissez votre pack : immobilier, auto, poubelles ou complet." },
              { icon: ChatBubbleLeftRightIcon, title: "Chat intégré", desc: "Contactez les vendeurs directement sans révéler votre email." },
              { icon: StarIcon, title: "Avis vérifiés", desc: "Consultez les avis et notations des autres utilisateurs." },
            ].map((feat) => (
              <motion.div
                key={feat.title} variants={fadeUp}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-xl transition-shadow duration-300"
              >
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                  transition={{ duration: 0.4 }}
                >
                  <feat.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{feat.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Ce que disent nos utilisateurs
            </h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name} variants={fadeUp}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i, type: "spring", stiffness: 500 }}
                      viewport={{ once: true }}
                    >
                      <StarIcon className={`w-5 h-5 ${i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-[var(--text-muted)]"}`} />
                    </motion.div>
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{t.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden gradient-primary p-12 sm:p-16 text-center">
            <motion.div
              initial="hidden" whileInView="visible"
              viewport={{ once: true, amount: 0.4 }} variants={stagger}
            >
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à commencer ?
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
                Inscrivez-vous gratuitement et accédez à tous nos services dès maintenant.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/inscription"
                    className="px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 shadow-lg transition-colors inline-block">
                    Créer un compte gratuit
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/tarifs"
                    className="px-8 py-3.5 text-white font-medium rounded-xl border border-white/30 hover:bg-white/10 transition-colors inline-block">
                    Voir les tarifs
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
