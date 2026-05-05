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

  /* Scroll progress + parallax */
  const { scrollY, scrollYProgress } = useScroll();
  const blob1Y = useTransform(scrollY, [0, 600], [0, -120]);
  const blob2Y = useTransform(scrollY, [0, 600], [0, -70]);
  const heroImg1Y = useTransform(scrollY, [0, 600], [0, -45]);
  const heroImg2Y = useTransform(scrollY, [0, 600], [0, 28]);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

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
                  TOUS VOS SERVICES
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-base sm:text-lg text-teal-100/80 max-w-md leading-relaxed"
                style={{ fontFamily: "var(--font-century-gothic)" }}
              >
                Immobilier, automobile, nettoyage &amp; collecte — réunis sur une seule plateforme moderne.
              </motion.p>

              {/* Search bar */}
              <motion.div variants={fadeUp} className="mt-8 max-w-lg">
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

            {/* ── Right: Animated image collage ── */}
            <div className="relative h-[520px] sm:h-[640px] lg:h-[740px] order-1 lg:order-2">

              {/* ① Main image — pleine largeur en haut, visible entièrement */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.95, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 left-0 w-full h-[70%] rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
                style={{ y: heroImg1Y }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full relative bg-teal-900/40"
                >
                  <Image
                    src="/villa.jpg"
                    alt="Villa moderne à Kinshasa"
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 90vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-900/65 via-teal-900/10 to-transparent" />
                  {/* Floating price badge */}
                  <motion.div
                    className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Villa moderne · Kinshasa</p>
                    <p className="text-sm font-bold text-teal-700">850 000 FC</p>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* ② Second image — bottom-right, bungalow */}
              <motion.div
                initial={{ opacity: 0, x: -35, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.95, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 right-0 w-[46%] h-[34%] rounded-2xl overflow-hidden shadow-xl shadow-black/40 ring-[3px] ring-teal-900/50"
                style={{ y: heroImg2Y }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  className="w-full h-full relative"
                >
                  <Image
                    src="/bungalow-ELEPHANT ROYAL_Page_4.jpg"
                    alt="Bungalow moderne"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 30vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-900/50 to-transparent" />
                </motion.div>
              </motion.div>

              {/* ③ Voiture — bottom-left, pleine largeur, visible entièrement */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.95, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 left-0 w-[58%] h-[34%] rounded-2xl overflow-hidden shadow-xl shadow-black/40 ring-[3px] ring-teal-900/50 z-10"
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="w-full h-full relative bg-white/8"
                >
                  <Image
                    src="/car 1.png"
                    alt="SUV automobile"
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 1024px) 55vw, 32vw"
                  />
                </motion.div>
              </motion.div>

              {/* Floating badge — nb services */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 280, damping: 18 }}
                className="absolute top-[72%] left-2 z-20"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-teal-500 text-white rounded-2xl px-4 py-3 shadow-lg shadow-teal-500/40"
                >
                  <p
                    className="text-2xl font-black leading-none"
                    style={{ fontFamily: "var(--font-century-gothic)" }}
                  >
                    3+
                  </p>
                  <p className="text-[11px] font-medium text-teal-100 mt-0.5 uppercase tracking-wide">Services</p>
                </motion.div>
              </motion.div>

              {/* Floating badge — verified */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, type: "spring", stiffness: 280, damping: 18 }}
                className="absolute top-[62%] right-2 z-20"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  className="bg-white text-teal-700 rounded-xl px-3 py-2 shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-bold">Vérifié</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Decorative teal pulse dots */}
              <motion.div
                className="absolute w-2.5 h-2.5 bg-teal-400 rounded-full pointer-events-none z-20"
                style={{ top: "7%", left: "28%" }}
                animate={{ scale: [1, 2, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-2 h-2 bg-teal-400 rounded-full pointer-events-none z-20"
                style={{ top: "52%", right: "1%" }}
                animate={{ scale: [1, 2, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3.5, delay: 0.7, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-3 h-3 bg-teal-300 rounded-full pointer-events-none z-20"
                style={{ bottom: "6%", left: "52%" }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 4, delay: 1.4, repeat: Infinity }}
              />
            </div>

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

      {/* ===== LATEST ADS ===== */}
      <section className="py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-end justify-between gap-4 mb-10"
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

          {latestAds.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              variants={stagger} initial="hidden" whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {latestAds.map((ad) => (
                <motion.div
                  key={ad.id} variants={fadeUp}
                  whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                >
                  <Link
                    href={`/immobilier/${ad.id}`}
                    className="group rounded-2xl overflow-hidden border border-[var(--border-color)]
                      bg-[var(--bg-card)] hover:shadow-2xl transition-shadow block"
                  >
                    <div className="h-56 bg-[var(--bg-tertiary)] overflow-hidden">
                      {ad.photos?.[0] ? (
                        <img src={ad.photos[0]} alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-slate-700/40 flex items-center justify-center">
                          <HomeIcon className="w-16 h-16 text-white/70" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">{ad.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white ${ad.ad_type === "sale" ? "bg-blue-600" : "bg-emerald-600"}`}>
                          {ad.ad_type === "sale" ? "Vente" : "Location"}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-primary mb-2">
                        {Number(ad.price ?? ad.rent_price ?? 0).toLocaleString("fr-FR")} FC{ad.ad_type === "rent" ? " /mois" : ""}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-3">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{[ad.address, ad.city].filter(Boolean).join(", ")}</span>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {ad.surface ?? 0} m² • {ad.rooms ?? 0} pièces
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center text-[var(--text-secondary)]"
            >
              Aucune annonce immobilière active pour le moment.
            </motion.div>
          )}
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
