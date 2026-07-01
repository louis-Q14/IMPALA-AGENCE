"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MagnifyingGlassIcon, MapPinIcon, HomeModernIcon, BuildingOfficeIcon, CalendarDaysIcon, UserGroupIcon, ShieldCheckIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
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

// ─── Calendar helpers ────────────────────────────────────────────────────
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; }
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function fmtDate(iso: string) {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type Panel = "where" | "dates" | "guests" | null;
interface GuestCounts { adults: number; children: number; infants: number; }

// ─── SearchBar ────────────────────────────────────────────────────────────
function SearchBar({ onSearch }: { onSearch: (city: string, checkIn: string, checkOut: string, guests: number) => void }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestCounts>({ adults: 0, children: 0, infants: 0 });
  const [calOffset, setCalOffset] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const today = new Date();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setPanel(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const totalGuests = guests.adults + guests.children;
  const guestLabel = totalGuests > 0 || guests.infants > 0
    ? [totalGuests > 0 && `${totalGuests} voy.`, guests.infants > 0 && `${guests.infants} bébé${guests.infants > 1 ? "s" : ""}`].filter(Boolean).join(", ")
    : null;

  const datesLabel = checkIn && checkOut
    ? `${fmtDate(checkIn)} → ${fmtDate(checkOut)}`
    : checkIn ? `${fmtDate(checkIn)} → ?` : null;

  const monthA = new Date(today.getFullYear(), today.getMonth() + calOffset, 1);
  const monthB = new Date(today.getFullYear(), today.getMonth() + calOffset + 1, 1);
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDay = (iso: string) => {
    if (!checkIn || (checkIn && checkOut)) { setCheckIn(iso); setCheckOut(""); }
    else if (iso <= checkIn) { setCheckIn(iso); setCheckOut(""); }
    else { setCheckOut(iso); setPanel("guests"); }
  };

  const getDayStyle = (iso: string): string => {
    const isPast = iso < todayIso;
    if (isPast) return "text-gray-300 cursor-not-allowed pointer-events-none";
    if (iso === checkIn || iso === checkOut)
      return "bg-rose-500 text-white font-bold cursor-pointer";
    if (checkIn && checkOut && iso > checkIn && iso < checkOut)
      return "bg-rose-100 text-rose-800 cursor-pointer";
    return "text-gray-800 hover:bg-gray-100 cursor-pointer";
  };

  function MonthGrid({ year, month }: { year: number; month: number }) {
    const first = firstDayOfMonth(year, month);
    const total = daysInMonth(year, month);
    const cells: (number | null)[] = [...Array(first).fill(null)];
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return (
      <div className="min-w-[17rem]">
        <p className="text-sm font-bold text-center text-gray-900 mb-3">{MONTHS_FR[month]} {year}</p>
        <div className="grid grid-cols-7 text-xs text-center mb-1">
          {DAYS_FR.map(d => <span key={d} className="py-1 font-semibold text-gray-500">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 text-sm text-center gap-y-0.5">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const iso = isoDate(year, month, d);
            return (
              <button key={i} type="button" onClick={() => handleDay(iso)}
                className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center transition-colors text-sm ${getDayStyle(iso)}`}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const activeSection = (p: Panel) =>
    `transition-colors rounded-full ${panel === p ? "bg-white shadow-sm" : "hover:bg-white/70"}`;

  return (
    <div ref={barRef} className="relative w-full max-w-3xl mx-auto">
      {/* Compact pill bar */}
      <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-white/60 px-1 py-1 gap-0">

        {/* Où ? */}
        <div className={`flex items-center gap-2 px-4 py-2 flex-1 min-w-0 cursor-pointer ${activeSection("where")}`}
          onClick={() => { setPanel("where"); setTimeout(() => cityRef.current?.focus(), 30); }}>
          <MapPinIcon className="w-4 h-4 text-rose-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">Où ?</p>
            <input ref={cityRef} value={city} onChange={e => setCity(e.target.value)}
              onFocus={() => setPanel("where")}
              onKeyDown={e => e.key === "Enter" && setPanel("dates")}
              placeholder="Ville ou quartier"
              className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none leading-none" />
          </div>
          {city && <button type="button" onClick={e => { e.stopPropagation(); setCity(""); }}
            className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <XMarkIcon className="w-2.5 h-2.5 text-gray-600" />
          </button>}
        </div>

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        {/* Arrivée & Départ */}
        <div className={`flex items-center gap-2 px-4 py-2 cursor-pointer shrink-0 ${activeSection("dates")}`}
          onClick={() => setPanel(panel === "dates" ? null : "dates")}>
          <CalendarDaysIcon className="w-4 h-4 text-rose-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">Arrivée &amp; Départ</p>
            <p className={`text-sm font-medium leading-none ${datesLabel ? "text-gray-900" : "text-gray-400"}`}>
              {datesLabel || "Ajouter des dates"}
            </p>
          </div>
          {(checkIn || checkOut) && <button type="button" onClick={e => { e.stopPropagation(); setCheckIn(""); setCheckOut(""); }}
            className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <XMarkIcon className="w-2.5 h-2.5 text-gray-600" />
          </button>}
        </div>

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        {/* Voyageurs */}
        <div className={`flex items-center gap-2 px-4 py-2 cursor-pointer shrink-0 ${activeSection("guests")}`}
          onClick={() => setPanel(panel === "guests" ? null : "guests")}>
          <UserGroupIcon className="w-4 h-4 text-rose-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">Voyageurs</p>
            <p className={`text-sm font-medium leading-none ${guestLabel ? "text-gray-900" : "text-gray-400"}`}>
              {guestLabel || "Ajouter"}
            </p>
          </div>
        </div>

        {/* Search button */}
        <button type="button"
          onClick={() => { setPanel(null); onSearch(city, checkIn, checkOut, Math.max(1, totalGuests)); }}
          className="ml-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-11 h-11 flex items-center justify-center shadow-md transition-colors shrink-0">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar popup */}
      {panel === "dates" && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 z-50 w-max">
          <p className="text-xs text-center text-gray-500 mb-4">
            {!checkIn ? "Sélectionnez la date d'arrivée" : !checkOut ? "Sélectionnez la date de départ" : `${fmtDate(checkIn)} → ${fmtDate(checkOut)}`}
          </p>
          <div className="flex items-start gap-6">
            <button type="button" onClick={() => setCalOffset(o => Math.max(0, o - 1))}
              className="mt-1 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
              <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-700" />
            </button>
            <MonthGrid year={monthA.getFullYear()} month={monthA.getMonth()} />
            <MonthGrid year={monthB.getFullYear()} month={monthB.getMonth()} />
            <button type="button" onClick={() => setCalOffset(o => o + 1)}
              className="mt-1 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
              <ChevronRightIcon className="w-3.5 h-3.5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* Guests popup */}
      {panel === "guests" && (
        <div className="absolute right-0 top-full mt-3 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 z-50 w-72">
          {([
            { key: "adults",   label: "Adultes",  sub: "13 ans et plus" },
            { key: "children", label: "Enfants",  sub: "2 à 12 ans" },
            { key: "infants",  label: "Bébés",    sub: "Moins de 2 ans" },
          ] as { key: keyof GuestCounts; label: string; sub: string }[]).map((g, i, arr) => (
            <div key={g.key} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div>
                <p className="text-sm font-semibold text-gray-900">{g.label}</p>
                <p className="text-xs text-gray-400">{g.sub}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" disabled={guests[g.key] === 0}
                  onClick={e => { e.stopPropagation(); setGuests(p => ({ ...p, [g.key]: Math.max(0, p[g.key] - 1) })); }}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-500 transition-colors">
                  <MinusIcon className="w-3 h-3 text-gray-700" />
                </button>
                <span className="w-4 text-center text-sm font-semibold text-gray-900">{guests[g.key]}</span>
                <button type="button"
                  onClick={e => { e.stopPropagation(); setGuests(p => ({ ...p, [g.key]: p[g.key] + 1 })); }}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 transition-colors">
                  <PlusIcon className="w-3 h-3 text-gray-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
      <div className={`flex items-center bg-white dark:bg-gray-900 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-visible transition-all ${panel ? "ring-2 ring-gray-900 dark:ring-white/20" : ""}`}>

        {/* Où ? */}
        <div className={`flex-1 min-w-0 ${sectionBase(panel === "where")}`} onClick={() => { setPanel("where"); setTimeout(() => cityRef.current?.focus(), 50); }}>
          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Où ?</p>
          <input ref={cityRef} value={city} onChange={e => setCity(e.target.value)}
            onFocus={() => setPanel("where")}
            onKeyDown={e => e.key === "Enter" && setPanel("checkin")}
            placeholder="Ville ou quartier"
            className={`${inputBase} font-medium`} />
          {panel === "where" && city && (
            <button onClick={e => { e.stopPropagation(); setCity(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <XMarkIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />

        {/* Arrivée */}
        <div className={`shrink-0 ${sectionBase(panel === "checkin")}`} onClick={() => setPanel("checkin")}>
          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Arrivée</p>
          <p className={`text-sm font-medium ${checkIn ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            {dateLabel(checkIn) || "Ajouter une date"}
          </p>
        </div>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />

        {/* Départ */}
        <div className={`shrink-0 ${sectionBase(panel === "checkout")}`} onClick={() => setPanel("checkout")}>
          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Départ</p>
          <p className={`text-sm font-medium ${checkOut ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            {dateLabel(checkOut) || "Ajouter une date"}
          </p>
        </div>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />

        {/* Voyageurs + Search button */}
        <div className={`flex items-center gap-3 pr-2 flex-1 min-w-0 ${sectionBase(panel === "guests")}`} onClick={() => setPanel("guests")}>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Voyageurs</p>
            <p className={`text-sm font-medium truncate ${totalGuests > 0 ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
              {guestLabel()}
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setPanel(null); onSearch(city, checkIn, checkOut, Math.max(1, totalGuests)); }}
            className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar dropdown */}
      {(panel === "checkin" || panel === "checkout") && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-6 z-50 w-max max-w-[95vw]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalOffset(o => Math.max(0, o - 1))} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeftIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex gap-12">
              <MonthGrid year={monthA.getFullYear()} month={monthA.getMonth()} />
              <MonthGrid year={monthB.getFullYear()} month={monthB.getMonth()} />
            </div>
            <button onClick={() => setCalOffset(o => o + 1)} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronRightIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          {(checkIn || checkOut) && (
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { setCheckIn(""); setCheckOut(""); }} className="text-sm underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Effacer les dates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guests dropdown */}
      {panel === "guests" && (
        <div className="absolute right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-6 z-50 w-80">
          {([
            { key: "adults",   label: "Adultes",  sub: "13 ans et plus" },
            { key: "children", label: "Enfants",  sub: "De 2 à 12 ans" },
            { key: "infants",  label: "Bébés",    sub: "Moins de 2 ans" },
          ] as { key: keyof GuestCounts; label: string; sub: string }[]).map((g, i, arr) => (
            <div key={g.key} className={`flex items-center justify-between py-4 ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{g.label}</p>
                <p className="text-sm text-gray-400">{g.sub}</p>
              </div>
              <div className="flex items-center gap-3">
                <button disabled={guests[g.key] === 0} onClick={e => { e.stopPropagation(); setGuests(prev => ({ ...prev, [g.key]: Math.max(0, prev[g.key] - 1) })); }}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center disabled:opacity-30 hover:border-gray-500 transition-colors">
                  <MinusIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="w-5 text-center font-semibold text-gray-900 dark:text-white">{guests[g.key]}</span>
                <button onClick={e => { e.stopPropagation(); setGuests(prev => ({ ...prev, [g.key]: prev[g.key] + 1 })); }}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-500 transition-colors">
                  <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ReservationLanding() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("");

  useEffect(() => {
    fetch(`${API}/reservation/featured`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFeatured(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((city: string, checkIn: string, checkOut: string, guests: number) => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (guests > 1) params.set("guests", String(guests));
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (activeType) params.set("property_type", activeType);
    router.push(`/reservation/recherche?${params.toString()}`);
  }, [activeType, router]);

  const filteredFeatured = activeType
    ? featured.filter(p => p.property_type === activeType)
    : featured;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 text-white overflow-visible">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
            Trouvez votre prochain <br />
            <span className="text-yellow-300">séjour idéal</span>
          </h1>
          <p className="text-lg md:text-xl text-rose-100 max-w-2xl mx-auto mb-10">
            Appartements, maisons, hôtels — réservez en toute confiance partout en RDC et en Afrique.
          </p>

          {/* Airbnb-style search bar */}
          <div className="relative z-20">
            <SearchBar onSearch={handleSearch} />
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
