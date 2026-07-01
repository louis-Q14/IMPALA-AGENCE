"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MagnifyingGlassIcon, MapPinIcon, StarIcon, HomeModernIcon, BuildingOfficeIcon, CalendarDaysIcon, UserGroupIcon, ShieldCheckIcon, HeartIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PROPERTY_TYPES = [
  { key: "", label: "Tous", emoji: "🏘️" },
  { key: "appartement", label: "Appartements", emoji: "🏢" },
  { key: "maison", label: "Maisons", emoji: "🏠" },
  { key: "villa", label: "Villas", emoji: "🏡" },
  { key: "hotel", label: "Hôtels", emoji: "🏨" },
  { key: "chambre", label: "Chambres", emoji: "🛏️" },
  { key: "bureau", label: "Bureaux", emoji: "💼" },
  { key: "salle", label: "Salles", emoji: "🎉" },
];

interface Property {
  id: string;
  title: string;
  city: string;
  property_type: string;
  listing_type: string;
  price_per_night?: number;
  price_per_week?: number;
  price_per_month?: number;
  currency: string;
  bedrooms: number;
  max_guests: number;
  rating_avg: number;
  review_count: number;
  images: { url: string; is_cover: boolean }[];
  is_featured: boolean;
}

function PropertyCard({ p }: { p: Property }) {
  const [liked, setLiked] = useState(false);
  const cover = p.images?.find(i => i.is_cover)?.url || p.images?.[0]?.url;
  const price = p.price_per_night ?? p.price_per_week ?? p.price_per_month;
  const priceLabel = p.listing_type === "nuit" ? "/nuit" : p.listing_type === "semaine" ? "/semaine" : "/mois";

  return (
    <Link href={`/reservation/${p.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3">
        {cover ? (
          <img src={cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <HomeModernIcon className="w-12 h-12 text-blue-400" />
          </div>
        )}
        {p.is_featured && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            ⭐ Coup de cœur
          </span>
        )}
        <button
          onClick={e => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center"
        >
          <HeartIcon className={`w-6 h-6 ${liked ? "fill-rose-500 text-rose-500" : "text-white drop-shadow"}`} />
        </button>
      </div>
      <div>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 flex-1 mr-2">
            {p.title}
          </h3>
          {p.rating_avg > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-gray-200 shrink-0">
              <StarSolid className="w-3.5 h-3.5 text-amber-400" />
              {Number(p.rating_avg).toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 flex items-center gap-1">
          <MapPinIcon className="w-3.5 h-3.5" /> {p.city}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {p.bedrooms} ch. · {p.max_guests} pers.
        </p>
        <p className="mt-1 text-sm">
          <span className="font-bold text-gray-900 dark:text-white">{price?.toLocaleString()} {p.currency}</span>
          <span className="text-gray-500 dark:text-gray-400"> {priceLabel}</span>
        </p>
      </div>
    </Link>
  );
}

export default function ReservationLanding() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [searchGuests, setSearchGuests] = useState(1);
  const [searchCheckIn, setSearchCheckIn] = useState("");
  const [searchCheckOut, setSearchCheckOut] = useState("");
  const [activeType, setActiveType] = useState("");

  useEffect(() => {
    fetch(`${API}/reservation/featured`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFeatured(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchCity) params.set("city", searchCity);
    if (searchGuests > 1) params.set("guests", String(searchGuests));
    if (searchCheckIn) params.set("check_in", searchCheckIn);
    if (searchCheckOut) params.set("check_out", searchCheckOut);
    if (activeType) params.set("property_type", activeType);
    router.push(`/reservation/recherche?${params.toString()}`);
  };

  const filteredFeatured = activeType
    ? featured.filter(p => p.property_type === activeType)
    : featured;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
            Trouvez votre prochain <br />
            <span className="text-yellow-300">séjour idéal</span>
          </h1>
          <p className="text-lg md:text-xl text-rose-100 max-w-2xl mx-auto mb-10">
            Appartements, maisons, hôtels — réservez en toute confiance partout en RDC et en Afrique.
          </p>

          {/* Search bar */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Où ?</label>
                <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800">
                  <MapPinIcon className="w-4 h-4 text-rose-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Ville ou quartier"
                    value={searchCity}
                    onChange={e => setSearchCity(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Arrivée</label>
                <input
                  type="date"
                  value={searchCheckIn}
                  onChange={e => setSearchCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Départ</label>
                <input
                  type="date"
                  value={searchCheckOut}
                  onChange={e => setSearchCheckOut(e.target.value)}
                  min={searchCheckIn || new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Voyageurs</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 flex-1">
                    <UserGroupIcon className="w-4 h-4 text-rose-500 shrink-0" />
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={searchGuests}
                      onChange={e => setSearchGuests(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none w-8"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-4 py-2 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Rechercher</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeType === t.key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400"
              }`}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-2xl mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredFeatured.length === 0 ? (
          <div className="text-center py-20">
            <HomeModernIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun bien disponible</h3>
            <p className="text-gray-500 dark:text-gray-500">Soyez le premier à publier un bien sur IMPALA Réservation !</p>
            <Link href="/tableau-de-bord/reservation/nouveau" className="mt-6 inline-block bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              Publier mon bien
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {activeType ? PROPERTY_TYPES.find(t => t.key === activeType)?.label : "Tous les biens"}
              <span className="text-gray-400 dark:text-gray-500 font-normal text-base ml-2">({filteredFeatured.length} disponibles)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFeatured.map(p => <PropertyCard key={p.id} p={p} />)}
            </div>
            <div className="text-center mt-10">
              <button onClick={() => router.push("/reservation/recherche")} className="border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 px-8 py-3 rounded-xl font-semibold transition-all">
                Voir tous les biens
              </button>
            </div>
          </>
        )}
      </div>

      {/* How it works */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Comment ça fonctionne ?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12">Simple, rapide et sécurisé</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <MagnifyingGlassIcon className="w-8 h-8" />, step: "1", title: "Recherchez", desc: "Trouvez le bien idéal par ville, dates et type de logement." },
              { icon: <CalendarDaysIcon className="w-8 h-8" />, step: "2", title: "Réservez", desc: "Choisissez vos dates et confirmez en quelques clics." },
              { icon: <ShieldCheckIcon className="w-8 h-8" />, step: "3", title: "Séjournez", desc: "Profitez de votre séjour avec notre garantie de confiance." },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Propriétaire */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-3">Vous avez un bien à louer ?</h2>
          <p className="text-rose-100 text-lg mb-8">Publiez votre bien sur IMPALA Réservation et commencez à recevoir des voyageurs.</p>
          <Link href="/tableau-de-bord/reservation/nouveau" className="bg-white text-rose-600 hover:bg-rose-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors inline-block shadow-lg">
            Publier mon bien gratuitement
          </Link>
        </div>
      </div>
    </div>
  );
}
