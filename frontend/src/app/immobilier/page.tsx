"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  ArrowRightIcon,
  TagIcon,
  KeyIcon,
  MapPinIcon,
  HeartIcon,
  TruckIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  DocumentTextIcon,
  CalculatorIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  StarIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  CameraIcon,
  PencilSquareIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

type RealEstateAd = {
  id: string;
  title: string;
  price: number | null;
  rent_price?: number | null;
  surface: number | null;
  rooms: number | null;
  bedrooms: number | null;
  address: string;
  city?: string | null;
  ad_type: "sale" | "rent";
  status: string;
  photos: string[];
  views: number;
};

function formatPrice(price: number, type: "sale" | "rent") {
  return type === "rent"
    ? `${price.toLocaleString("fr-FR")} FC/mois`
    : `${price.toLocaleString("fr-FR")} FC`;
}

const services = [
  {
    id: 1,
    title: "Services après vente ou location",
    color: "violet",
    icon: WrenchScrewdriverIcon,
    items: [
      { label: "Déménageur", icon: TruckIcon },
      { label: "Nettoyeur / ménage fin de chantier", icon: SparklesIcon },
      { label: "Gardien / concierge", icon: ShieldCheckIcon },
      { label: "Domoticien (systèmes connectés)", icon: CpuChipIcon },
    ],
  },
  {
    id: 2,
    title: "Diagnostics techniques",
    color: "orange",
    icon: ClipboardDocumentCheckIcon,
    items: [
      { label: "Diagnostiqueur immobilier (DPE, amiante, plomb, termites, gaz, électricité…)", icon: ClipboardDocumentCheckIcon },
    ],
  },
  {
    id: 3,
    title: "Juridique et fiscal",
    color: "red",
    icon: ScaleIcon,
    items: [
      { label: "Notaire", icon: DocumentTextIcon },
      { label: "Avocat spécialisé en droit immobilier", icon: ScaleIcon },
      { label: "Expert en fiscalité immobilière (IFI, plus-value, déficit foncier)", icon: CalculatorIcon },
      { label: "Huissier de justice (constats, expulsions)", icon: DocumentTextIcon },
    ],
  },
  {
    id: 4,
    title: "Gestion locative et syndic",
    color: "blue",
    icon: BuildingOffice2Icon,
    items: [
      { label: "Administrateur de biens", icon: UserGroupIcon },
      { label: "Syndic de copropriété", icon: BuildingOffice2Icon },
      { label: "Gestionnaire de locaux commerciaux", icon: BuildingStorefrontIcon },
    ],
  },
  {
    id: 5,
    title: "Évaluation et expertise",
    color: "amber",
    icon: StarIcon,
    items: [
      { label: "Expert immobilier (évaluation, dommages)", icon: MagnifyingGlassIcon },
      { label: "Commissaire-priseur (ventes aux enchères)", icon: StarIcon },
      { label: "Géomètre-expert (bornage, division parcellaire)", icon: GlobeAltIcon },
    ],
  },
  {
    id: 6,
    title: "Transaction et conseil",
    color: "emerald",
    icon: BriefcaseIcon,
    items: [
      { label: "Agent immobilier (vente, location)", icon: BriefcaseIcon },
      { label: "Mandataire immobilier (sans agence physique)", icon: UserGroupIcon },
      { label: "Conseiller en gestion de patrimoine", icon: CalculatorIcon },
      { label: "Marchand de biens (achat-revente après travaux)", icon: TagIcon },
      { label: "Promoteur immobilier", icon: BuildingOffice2Icon },
    ],
  },
  {
    id: 7,
    title: "Services numériques et accompagnement",
    color: "cyan",
    icon: ComputerDesktopIcon,
    items: [
      { label: "Plateformes d'annonces (SeLoger, Leboncoin…)", icon: GlobeAltIcon },
      { label: "Logiciels de gestion locative / syndic", icon: ComputerDesktopIcon },
      { label: "Home-stager (préparation du bien à la vente)", icon: SparklesIcon },
      { label: "Photographe / vidéaste immobilier (visites virtuelles, drone)", icon: CameraIcon },
      { label: "Rédacteur SEO / copywriter immobilier", icon: PencilSquareIcon },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  violet: { bg: "bg-violet-500/10 hover:bg-violet-500/15", border: "border-violet-500/30 hover:border-violet-500", icon: "from-violet-500 to-violet-700", tag: "text-violet-600" },
  orange: { bg: "bg-orange-500/10 hover:bg-orange-500/15", border: "border-orange-500/30 hover:border-orange-500", icon: "from-orange-500 to-orange-700", tag: "text-orange-600" },
  red:    { bg: "bg-red-500/10 hover:bg-red-500/15",       border: "border-red-500/30 hover:border-red-500",       icon: "from-red-500 to-red-700",       tag: "text-red-600" },
  blue:   { bg: "bg-blue-500/10 hover:bg-blue-500/15",     border: "border-blue-500/30 hover:border-blue-500",     icon: "from-blue-500 to-blue-700",     tag: "text-blue-600" },
  amber:  { bg: "bg-amber-500/10 hover:bg-amber-500/15",   border: "border-amber-500/30 hover:border-amber-500",   icon: "from-amber-500 to-amber-700",   tag: "text-amber-600" },
  emerald:{ bg: "bg-emerald-500/10 hover:bg-emerald-500/15",border: "border-emerald-500/30 hover:border-emerald-500",icon: "from-emerald-500 to-emerald-700",tag: "text-emerald-600" },
  cyan:   { bg: "bg-cyan-500/10 hover:bg-cyan-500/15",     border: "border-cyan-500/30 hover:border-cyan-500",     icon: "from-cyan-500 to-cyan-700",     tag: "text-cyan-600" },
};

export default function ImmobilierPage() {
  const router = useRouter();
  const [ads, setAds] = useState<RealEstateAd[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadAds = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads?limit=6`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setAds(Array.isArray(data.data) ? data.data : []);
      } catch {
        setAds([]);
      }
    };
    loadAds();
  }, []);

  function toggleFavorite(id: string) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function handlePublier() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/connexion?redirect=/immobilier/publier"); return; }
    router.push("/immobilier/publier");
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Immobilier</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            Immobilier
          </h1>
          <p className="mt-2 text-[var(--text-secondary)] text-lg">
            Explorez nos annonces immobilières — achetez ou louez votre bien idéal.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Vente */}
          <Link
            href="/immobilier/vente"
            className="group flex items-center gap-3 px-5 py-4 rounded-2xl border border-[var(--border-color)]
              bg-[var(--bg-card)] hover:border-blue-500 hover:bg-blue-500/5
              transition-all duration-200 flex-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
              <TagIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-semibold text-[var(--text-primary)]">Vente immobilière</span>
              <span className="text-sm text-[var(--text-muted)]">Biens à acheter</span>
            </div>
            <ArrowRightIcon className="w-4 h-4 text-blue-500 shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Location */}
          <Link
            href="/immobilier/location"
            className="group flex items-center gap-3 px-5 py-4 rounded-2xl border border-[var(--border-color)]
              bg-[var(--bg-card)] hover:border-emerald-500 hover:bg-emerald-500/5
              transition-all duration-200 flex-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
              <KeyIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-semibold text-[var(--text-primary)]">Location immobilière</span>
              <span className="text-sm text-[var(--text-muted)]">Biens à louer</span>
            </div>
            <ArrowRightIcon className="w-4 h-4 text-emerald-500 shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>



        {/* Dernières annonces publiées */}
        {ads.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dernières annonces publiées</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-1">{ads.length} bien{ads.length !== 1 ? "s" : ""} disponible{ads.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-3">
                <Link href="/immobilier/vente" className="text-sm text-blue-500 hover:underline">Voir les ventes →</Link>
                <Link href="/immobilier/location" className="text-sm text-emerald-500 hover:underline">Voir les locations →</Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <Link
                  href={`/immobilier/${ad.id}`}
                  key={ad.id}
                  className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]
                    overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-tertiary)]">
                    {ad.photos?.[0] ? (
                      <img
                        src={ad.photos[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-slate-700/40 flex items-center justify-center">
                        <HomeIcon className="w-14 h-14 text-white/70" />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        ad.ad_type === "sale" ? "bg-blue-600" : "bg-emerald-600"
                      }`}>
                        {ad.ad_type === "sale" ? "Vente" : "Location"}
                      </span>
                    </div>
                    {/* Favorite */}
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(ad.id); }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 dark:bg-black/50
                        flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      {favorites.includes(ad.id) ? (
                        <HeartSolidIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <div className={`text-xl font-bold mb-1 ${
                      ad.ad_type === "sale" ? "text-primary" : "text-emerald-500"
                    }`}>
                      {formatPrice(Number(ad.ad_type === "sale" ? ad.price : ad.rent_price ?? ad.price ?? 0), ad.ad_type)}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-1">{ad.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-3">
                      <MapPinIcon className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{[ad.address, ad.city].filter(Boolean).join(", ")}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-[var(--text-secondary)] pt-3 border-t border-[var(--border-color)]">
                      {ad.surface && <span>{ad.surface} m²</span>}
                      {ad.rooms && <span>{ad.rooms} pièce{ad.rooms > 1 ? "s" : ""}</span>}
                      {ad.bedrooms && <span>{ad.bedrooms} ch.</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Services liés à l'immobilier */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Nos Services liés à l&apos;immobilier</h2>
            <Link href="/immobilier/services" className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
              Voir tous <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-[var(--text-secondary)] mb-8">Tous les professionnels et outils dont vous avez besoin autour de votre projet immobilier.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((cat) => {
              const c = colorMap[cat.color];
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl border p-5 transition-all duration-200 ${c.bg} ${c.border}`}
                >
                  {/* Header — cliquable vers la catégorie */}
                  <Link
                    href="/immobilier/services"
                    className="flex items-center gap-3 mb-4 group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center shrink-0`}>
                      <CatIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-semibold text-sm leading-tight ${c.tag} group-hover:underline`}>{cat.title}</span>
                    <ArrowRightIcon className={`w-3.5 h-3.5 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-all ${c.tag}`} />
                  </Link>
                  {/* Sub-items — cliquables vers la catégorie */}
                  <ul className="space-y-2">
                    {cat.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <li key={item.label}>
                          <Link
                            href="/immobilier/services"
                            className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg
                              bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10
                              text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all`}
                          >
                            <ItemIcon className={`w-4 h-4 shrink-0 ${c.tag}`} />
                            <span className="line-clamp-2">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}