"use client";

import Link from "next/link";
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
  TruckIcon,
  SparklesIcon,
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
    icon: HomeIcon,
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
    icon: TruckIcon,
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
    icon: SparklesIcon,
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

/* ── Floating hero dots ── */
const heroDots = [
  { top: "18%", left: "14%", size: "w-2 h-2", color: "bg-blue-400/50", duration: 4, delay: 0 },
  { top: "72%", left: "10%", size: "w-3 h-3", color: "bg-violet-400/40", duration: 5.5, delay: 0.8, diamond: true },
  { top: "28%", right: "16%", size: "w-2.5 h-2.5", color: "bg-purple-400/50", duration: 6, delay: 0.4 },
  { top: "58%", right: "20%", size: "w-2 h-2", color: "bg-blue-300/40", duration: 4.5, delay: 1.6, diamond: true },
  { top: "45%", left: "7%", size: "w-1.5 h-1.5", color: "bg-indigo-400/40", duration: 7, delay: 1.2 },
  { top: "35%", right: "8%", size: "w-1.5 h-1.5", color: "bg-pink-400/30", duration: 5, delay: 2 },
];

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
  const blob3Y = useTransform(scrollY, [0, 600], [0, -160]);

  return (
    <div>
      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero">
          {/* Dot grid overlay */}
          <div className="absolute inset-0 hero-grid opacity-25 pointer-events-none" />

          {/* Parallax blobs */}
          <motion.div style={{ y: blob1Y }} className="absolute top-20 left-10 pointer-events-none">
            <motion.div
              className="w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
              animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.95, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <motion.div style={{ y: blob2Y }} className="absolute bottom-10 right-10 pointer-events-none">
            <motion.div
              className="w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              animate={{ x: [0, -50, 30, 0], y: [0, 30, -40, 0], scale: [1, 1.05, 0.92, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <motion.div style={{ y: blob3Y }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              className="w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl"
              animate={{ x: [0, 25, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          {/* 4th subtle blob bottom-left */}
          <motion.div className="absolute bottom-0 left-1/4 pointer-events-none">
            <motion.div
              className="w-56 h-56 bg-pink-500/8 rounded-full blur-3xl"
              animate={{ x: [0, 30, -10, 0], scale: [1, 1.12, 0.9, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Floating mini elements */}
          {heroDots.map((dot, i) => (
            <motion.div
              key={i}
              className={`absolute ${dot.size} ${dot.color} ${dot.diamond ? "rounded-sm rotate-45" : "rounded-full"} pointer-events-none`}
              style={{ top: dot.top, left: (dot as { left?: string }).left, right: (dot as { right?: string }).right }}
              animate={{
                y: [0, -18, 0],
                opacity: [0.3, 0.8, 0.3],
                rotate: dot.diamond ? [45, 90, 45] : 0,
              }}
              transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          {/* Hero content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <motion.span
                  className="w-2 h-2 rounded-full bg-primary block"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-primary">Plateforme multiservices</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight"
              >
                Bienvenue sur{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-text">
                  IMPALA
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-4 text-xl sm:text-2xl font-semibold text-slate-200">
                Tous vos services, une seule plateforme.
              </motion.p>

              <motion.p variants={fadeUp} className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Que vous achetiez un bien, vendiez votre voiture ou organisiez le ramassage de vos
                déchets… nous avons réuni l&apos;indispensable là où vous en avez besoin.
              </motion.p>

              <motion.p variants={fadeUp} className="mt-3 text-base sm:text-lg font-medium text-primary">
                Gagnez du temps. Simplifiez-vous la vie. Centralisez tout.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 max-w-2xl mx-auto">
                <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2">
                  <MagnifyingGlassIcon className="w-6 h-6 text-slate-400 ml-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Rechercher une annonce immobilière, automobile..."
                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none text-base"
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors"
                  >
                    Rechercher
                  </motion.button>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/inscription"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary
                      text-white font-semibold hover:bg-primary-hover shadow-lg hover:shadow-xl transition-colors text-base"
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
                      text-white font-medium border border-white/20 hover:bg-white/10 transition-colors text-base"
                  >
                    Voir les tarifs
                  </Link>
                </motion.div>
              </motion.div>
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
                    <service.icon className="w-7 h-7 text-white" />
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