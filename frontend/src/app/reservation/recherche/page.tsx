"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MagnifyingGlassIcon, MapPinIcon, AdjustmentsHorizontalIcon, StarIcon, HomeModernIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TYPES = [
  { key: "", label: "Tous types" },
  { key: "appartement", label: "Appartement" },
  { key: "maison", label: "Maison" },
  { key: "villa", label: "Villa" },
  { key: "hotel", label: "Hôtel" },
  { key: "chambre", label: "Chambre" },
  { key: "bureau", label: "Bureau" },
  { key: "salle", label: "Salle" },
];

interface Property {
  id: string; title: string; city: string; property_type: string;
  listing_type: string; price_per_night?: number; price_per_week?: number;
  price_per_month?: number; currency: string; bedrooms: number;
  bathrooms: number; max_guests: number; rating_avg: number;
  review_count: number; images: { url: string; is_cover: boolean }[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "1");
  const [propType, setPropType] = useState(searchParams.get("property_type") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [page, setPage] = useState(1);

  const fetchProperties = (pg = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (parseInt(guests) > 1) params.set("guests", guests);
    if (propType) params.set("property_type", propType);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    params.set("page", String(pg));
    params.set("limit", "20");

    fetch(`${API}/reservation/properties?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setProperties(d.properties || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProperties(1); setPage(1); }, []);

  const handleSearch = () => { fetchProperties(1); setPage(1); };

  const getPrice = (p: Property) => {
    const price = p.price_per_night ?? p.price_per_week ?? p.price_per_month;
    const label = p.listing_type === "nuit" ? "/nuit" : p.listing_type === "semaine" ? "/sem." : "/mois";
    return { price, label };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 flex-1 min-w-[140px]">
            <MapPinIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <input type="text" placeholder="Ville..." value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none w-full" />
          </div>
          <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none" />
          <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none" />
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <AdjustmentsHorizontalIcon className="w-4 h-4" /> Filtres
          </button>
          <button onClick={handleSearch}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-4 py-2 flex items-center gap-1 text-sm font-semibold transition-colors">
            <MagnifyingGlassIcon className="w-4 h-4" /> Rechercher
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Type</label>
                <select value={propType} onChange={e => setPropType(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none">
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Prix min</label>
                <input type="number" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none w-24" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Prix max</label>
                <input type="number" placeholder="∞" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none w-24" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Chambres min</label>
                <input type="number" min="0" placeholder="0" value={bedrooms} onChange={e => setBedrooms(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none w-20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Voyageurs</label>
                <input type="number" min="1" value={guests} onChange={e => setGuests(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none w-20" />
              </div>
              <div className="flex items-end">
                <button onClick={() => { setPropType(""); setMinPrice(""); setMaxPrice(""); setBedrooms(""); setGuests("1"); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                  <XMarkIcon className="w-4 h-4" /> Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {loading ? "Recherche en cours..." : `${total} bien${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
        </p>

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
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <HomeModernIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun résultat</h3>
            <p className="text-gray-500">Essayez une autre ville ou modifiez vos filtres.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {properties.map(p => {
                const { price, label } = getPrice(p);
                const cover = p.images?.find(i => i.is_cover)?.url || p.images?.[0]?.url;
                return (
                  <Link key={p.id} href={`/reservation/${p.id}`} className="group block">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
                      {cover ? (
                        <img src={cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HomeModernIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 flex-1 mr-2">{p.title}</h3>
                        {p.rating_avg > 0 && (
                          <span className="flex items-center gap-0.5 text-sm font-semibold text-gray-800 dark:text-gray-200 shrink-0">
                            <StarSolid className="w-3.5 h-3.5 text-amber-400" />
                            {Number(p.rating_avg).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{p.city} · {p.bedrooms} ch. · {p.max_guests} pers.</p>
                      <p className="mt-1 text-sm">
                        <span className="font-bold text-gray-900 dark:text-white">{price?.toLocaleString()} {p.currency}</span>
                        <span className="text-gray-500"> {label}</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => { setPage(pg); fetchProperties(pg); }}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${pg === page ? "bg-rose-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"}`}>
                    {pg}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RechercheReservation() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
