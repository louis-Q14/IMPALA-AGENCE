"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  HeartIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  MapIcon,
  ChevronDownIcon,
  HomeIcon,
  ArrowRightIcon,
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
  postal_code?: string | null;
  ad_type: "sale" | "rent";
  status: string;
  photos: string[];
  views: number;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("fr-FR")} FC/mois`;
}

export default function ImmobilierLocationPage() {
  const router = useRouter();
  const [canPublish, setCanPublish] = useState(false);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [ads, setAds] = useState<RealEstateAd[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadAds = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads?limit=50&type=rent`,
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
    try {
      const stored = JSON.parse(localStorage.getItem("userServices") || "[]");
      const legacy = JSON.parse(localStorage.getItem("user") || "{}");
      const fromNew = Array.isArray(stored) && stored.some((s: {service:string;status:string}) => s.service==="real_estate" && s.status==="active");
      const fromLegacy = Array.isArray(legacy.services) && legacy.services.includes("real_estate");
      setCanPublish(fromNew || fromLegacy);
    } catch {}
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const filteredAds = ads.filter((ad) => {
    if (ad.ad_type !== "rent") return false;
    const needle = search.trim().toLowerCase();
    return (
      needle.length === 0 ||
      [ad.title, ad.address, ad.city || "", ad.postal_code || ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <span>/</span>
            <Link href="/immobilier" className="hover:text-primary">Immobilier</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Location</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-white" />
                </div>
                Location immobilière
              </h1>
              <p className="mt-2 text-[var(--text-secondary)]">
                {filteredAds.length} bien{filteredAds.length !== 1 ? "s" : ""} à louer disponible{filteredAds.length !== 1 ? "s" : ""}
              </p>
            </div>
            {canPublish && (
            <Link
              href="/immobilier/publier"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white
                font-medium hover:bg-primary-hover shadow-md transition-all"
            >
              Publier une annonce
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher par ville, code postal, mot-clé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          {/* More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-color)]
              text-[var(--text-secondary)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] transition-all"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Filtres
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center border border-[var(--border-color)] rounded-xl overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-3 transition-all ${
                view === "grid"
                  ? "bg-primary text-white"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("map")}
              className={`p-3 transition-all ${
                view === "map"
                  ? "bg-primary text-white"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
              }`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Extended Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Loyer min (FC/mois)</label>
                <input
                  type="number"
                  placeholder="0 FC"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]
                    text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Loyer max (FC/mois)</label>
                <input
                  type="number"
                  placeholder="10 000 FC"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]
                    text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Surface min (m²)</label>
                <input
                  type="number"
                  placeholder="20 m²"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]
                    text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Pièces</label>
                <select className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]
                  text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Toutes</option>
                  <option value="1">1 pièce</option>
                  <option value="2">2 pièces</option>
                  <option value="3">3 pièces</option>
                  <option value="4">4 pièces</option>
                  <option value="5">5+ pièces</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Réinitialiser
              </button>
              <button className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-all">
                Appliquer
              </button>
            </div>
          </div>
        )}

        {/* Ads Grid */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.length === 0 ? (
              <div className="col-span-3 py-20 text-center">
                <HomeIcon className="w-14 h-14 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] text-lg font-medium">Aucun bien à louer pour le moment</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Revenez bientôt ou publiez votre annonce.</p>
              </div>
            ) : (
              filteredAds.map((ad) => (
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
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-slate-700/40 flex items-center justify-center">
                        <HomeIcon className="w-14 h-14 text-white/70" />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-emerald-600">
                        Location
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
                    <div className="text-xl font-bold text-primary mb-1">
                      {formatPrice(Number(ad.rent_price ?? ad.price ?? 0))}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-1">
                      {ad.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-3">
                      <MapPinIcon className="w-4 h-4" />
                      {ad.address}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                      <span>{ad.surface ?? 0} m²</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                      <span>{ad.rooms ?? 0} pièces</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                      <span>{ad.bedrooms ?? 0} ch.</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden h-[600px] flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] text-lg font-medium">Vue carte</p>
              <p className="text-sm text-[var(--text-muted)]">Intégration Mapbox à venir</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
