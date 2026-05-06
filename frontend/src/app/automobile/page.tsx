"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  HeartIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  TruckIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  price: number | null;
  rent_price_day: number | null;
  ad_type: "vente" | "location";
  status: string;
  photos: string[];
  location_text: string;
  color: string;
  power: string;
}

export default function AutomobilePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<"all" | "vente" | "location">("all");
  const [search, setSearch] = useState("");
  const [canPublish, setCanPublish] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fuelFilter, setFuelFilter] = useState("");
  const [transFilter, setTransFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("type", filterType);
    if (search) params.set("brand", search);
    if (fuelFilter) params.set("fuel", fuelFilter);
    if (transFilter) params.set("transmission", transFilter);
    setLoading(true);
    fetch(`${API}/auto/ads?${params}`)
      .then((r) => r.json())
      .then((d) => setCars(Array.isArray(d.data) ? d.data : []))
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [filterType, search, fuelFilter, transFilter]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("userServices") || "[]");
      const legacy = JSON.parse(localStorage.getItem("user") || "{}");
      const fromNew = Array.isArray(stored) && stored.some((s: {service:string;status:string}) => s.service==="auto" && s.status==="active");
      const fromLegacy = Array.isArray(legacy.services) && legacy.services.includes("auto");
      setCanPublish(fromNew || fromLegacy);
    } catch {}
  }, []);

  const router = useRouter();
  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };
  function handlePublier() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.push("/connexion?redirect=/automobile/publier"); return; }
    router.push("/automobile/publier");
  }
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Automobile</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Image src="/car 1.png" alt="Automobile" width={72} height={72} className="object-contain" />
                </div>
                Automobile
              </h1>
              <p className="mt-2 text-[var(--text-secondary)]">
                {loading ? "Chargement..." : `${cars.length} vehicule${cars.length !== 1 ? "s" : ""} disponible${cars.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {canPublish && (
            <button onClick={handlePublier}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover shadow-md transition-all">
              Publier une annonce
              <ArrowRightIcon className="w-4 h-4" />
            </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par marque, modele..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "Tout", value: "all" },
              { label: "Vente", value: "vente" },
              { label: "Location", value: "location" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setFilterType(opt.value as typeof filterType)}
                className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                  filterType === opt.value
                    ? "bg-primary text-white border-primary"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] transition-all">
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Filtres
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mb-8 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Carburant</label>
                <select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Tous</option>
                  <option>Essence</option>
                  <option>Diesel</option>
                  <option>Electrique</option>
                  <option>Hybride</option>
                  <option>GPL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Boite</label>
                <select value={transFilter} onChange={(e) => setTransFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Toutes</option>
                  <option>Manuelle</option>
                  <option>Automatique</option>
                  <option>Semi-automatique</option>
                  <option>CVT</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setFuelFilter(""); setTransFilter(""); setSearch(""); setFilterType("all"); }}
                className="px-4 py-2 text-sm text-[var(--text-secondary)]">
                Reinitialiser
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-[var(--text-muted)]">Chargement...</div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <TruckIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun vehicule disponible</p>
            <p className="text-sm mt-1">Revenez bientot ou publiez votre annonce.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Link href={`/automobile/${car.id}`} key={car.id}
                className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-tertiary)]">
                  {car.photos && car.photos[0] ? (
                    <img src={car.photos[0]} alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TruckIcon className="w-16 h-16 text-[var(--text-muted)] opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${car.ad_type === "vente" ? "bg-blue-600" : "bg-emerald-600"}`}>
                      {car.ad_type === "vente" ? "Vente" : "Location"}
                    </span>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); toggleFavorite(car.id); }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center hover:scale-110 transition-transform">
                    {favorites.includes(car.id)
                      ? <HeartSolidIcon className="w-5 h-5 text-red-500" />
                      : <HeartIcon className="w-5 h-5 text-[var(--text-secondary)]" />}
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl font-bold text-primary">
                      {car.ad_type === "vente"
                        ? (car.price != null ? `${car.price.toLocaleString("fr-FR")} FC` : "Prix sur demande")
                        : (car.rent_price_day != null ? `${car.rent_price_day} FC/jour` : "Sur demande")}
                    </span>
                    {car.color && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{car.color}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">{car.brand} {car.model} {car.year ? `(${car.year})` : ""}</h3>
                  {car.location_text && (
                    <div className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-3">
                      <MapPinIcon className="w-4 h-4" />
                      {car.location_text}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {car.year && <span className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{car.year}</span>}
                    {car.mileage != null && <span className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{car.mileage.toLocaleString("fr-FR")} km</span>}
                    {car.fuel && <span className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{car.fuel}</span>}
                    {car.transmission && <span className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{car.transmission}</span>}
                    {car.power && <span className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{car.power}</span>}
                  </div>
                  {car.ad_type === "location" && (
                    <button onClick={(e) => e.preventDefault()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all text-sm">
                      <CalendarIcon className="w-4 h-4" />
                      Reserver
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}