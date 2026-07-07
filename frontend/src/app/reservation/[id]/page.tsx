"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPinIcon, StarIcon, UserGroupIcon, HomeModernIcon, CalendarDaysIcon,
  ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon,
  WifiIcon, TvIcon, FireIcon, TruckIcon, ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import BookingCalendar from "./BookingCalendar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement", maison: "Maison", villa: "Villa",
  hotel: "Hôtel", chambre: "Chambre", bureau: "Bureau", salle: "Salle", autre: "Bien",
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi": <WifiIcon className="w-5 h-5" />,
  "TV": <TvIcon className="w-5 h-5" />,
  "Cuisine": <FireIcon className="w-5 h-5" />,
  "Parking": <TruckIcon className="w-5 h-5" />,
};

interface PropertyDetail {
  id: string; user_id: string; title: string; description: string;
  property_type: string; listing_type: string;
  price_per_night?: number; price_per_week?: number; price_per_month?: number;
  currency: string; city: string; address: string; country: string;
  bedrooms: number; bathrooms: number; max_guests: number; surface?: number;
  cancellation_policy: string; check_in_time: string; check_out_time: string;
  min_stay: number; max_stay?: number; instant_booking: boolean;
  rating_avg: number; review_count: number;
  owner_name: string; owner_phone?: string; owner_avatar?: string;
  images: { id: string; url: string; is_cover: boolean; sort_order: number }[];
  amenities: string[];
  blocked_dates: string[];
}

interface Review {
  id: string; reviewer_name: string; reviewer_avatar?: string;
  rating: number; comment: string; created_at: string;
  cleanliness_rating?: number; location_rating?: number;
  value_rating?: number; communication_rating?: number;
  accuracy_rating?: number; checkin_rating?: number;
}

function StarRating({ value, label }: { value?: number; label: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
        </div>
        <span className="font-semibold text-gray-700 dark:text-gray-300 w-5 text-right">{value}</span>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API}/reservation/properties/${id}`).then(r => r.json()),
      fetch(`${API}/reservation/properties/${id}/reviews`).then(r => r.json()),
    ])
      .then(([p, r]) => {
        if (p.id) setProperty(p);
        if (Array.isArray(r)) setReviews(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const isBlocked = (date: string) => property?.blocked_dates?.includes(date);

  // Check if selected range overlaps any blocked date
  const hasConflict = (() => {
    if (!checkIn || !checkOut || !property?.blocked_dates?.length) return false;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const cursor = new Date(start);
    while (cursor < end) {
      const d = cursor.toISOString().split("T")[0];
      if (property.blocked_dates.includes(d)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  })();

  const calcPrice = () => {
    if (!property || !checkIn || !checkOut) return null;
    const d1 = new Date(checkIn), d2 = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
    let total = 0;
    if (property.listing_type === "nuit" && property.price_per_night) total = nights * property.price_per_night;
    else if (property.listing_type === "semaine" && property.price_per_week) total = Math.ceil(nights / 7) * property.price_per_week;
    else if (property.listing_type === "mois" && property.price_per_month) total = Math.ceil(nights / 30) * property.price_per_month;
    return { nights, total };
  };

  const handleBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/connexion"); return; }
    if (!checkIn || !checkOut) { setBookingResult({ success: false, message: "Veuillez sélectionner les dates" }); return; }
    if (hasConflict) { setBookingResult({ success: false, message: "Ces dates ne sont pas disponibles. Veuillez choisir d'autres dates." }); return; }

    setBooking(true);
    try {
      const r = await fetch(`${API}/reservation/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: id, check_in: checkIn, check_out: checkOut, guests_count: guestsCount, payment_method: paymentMethod, guest_message: message }),
      });
      const d = await r.json();
      if (r.ok) {
        setBookingResult({ success: true, message: d.message });
        // Sync message to conversation channel if there was a message
        if (message.trim() && property) {
          fetch(`${API}/messages/contact-host`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              propertyId: id,
              content: `[Demande de r\u00e9servation ${checkIn} \u2192 ${checkOut}]\n${message.trim()}`,
            }),
          }).catch(() => {});
        }
      } else {
        setBookingResult({ success: false, message: d.error || "Erreur" });
      }
    } finally {
      setBooking(false);
    }
  };

  const handleSendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/connexion"); return; }
    if (!property) return;
    setMsgSending(true);
    try {
      const r = await fetch(`${API}/messages/contact-host`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertyId: id, content: `Bonjour, je suis int\u00e9ress\u00e9(e) par votre bien \u00ab\u00a0${property.title}\u00a0\u00bb. Pourriez-vous me donner plus d'informations ?` }),
      });
      if (r.ok) {
        const data = await r.json();
        setMsgSent(true);
        // Store conversation ID so MessagesPanel can auto-open it
        try { sessionStorage.setItem("open_conv_id", data.conversation_id); } catch { /* ignore */ }
        router.push("/tableau-de-bord/reservation?tab=messages");
      }
    } finally {
      setMsgSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-4 gap-2 mb-8">
          <div className="col-span-2 aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-xl" />
          {[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HomeModernIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Bien non trouvé</h2>
          <Link href="/reservation" className="mt-4 inline-block text-rose-500 hover:underline">← Retour</Link>
        </div>
      </div>
    );
  }

  const price = calcPrice();
  const sortedImages = [...property.images].sort((a, b) => a.sort_order - b.sort_order);
  const mainImages = sortedImages.slice(0, 5);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Gallery fullscreen */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <XMarkIcon className="w-8 h-8" />
          </button>
          <button onClick={() => setActiveImg(i => (i - 1 + sortedImages.length) % sortedImages.length)} className="absolute left-4 text-white hover:text-gray-300">
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
          <img src={sortedImages[activeImg]?.url} alt="" className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg" />
          <button onClick={() => setActiveImg(i => (i + 1) % sortedImages.length)} className="absolute right-4 text-white hover:text-gray-300">
            <ChevronRightIcon className="w-10 h-10" />
          </button>
          <p className="absolute bottom-4 text-white text-sm">{activeImg + 1} / {sortedImages.length}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link href="/reservation" className="text-sm text-gray-500 hover:text-rose-500 flex items-center gap-1 mb-4">
          <ChevronLeftIcon className="w-4 h-4" /> Retour aux résultats
        </Link>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
          {property.rating_avg > 0 && (
            <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
              <StarSolid className="w-4 h-4 text-amber-400" /> {Number(property.rating_avg).toFixed(1)}
              <span className="font-normal text-gray-500">({property.review_count} avis)</span>
            </span>
          )}
          <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4 text-rose-500" /> {property.city}{property.address ? `, ${property.address}` : ""}</span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">{TYPE_LABELS[property.property_type] || property.property_type}</span>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden mb-8 h-72 md:h-96 cursor-pointer" onClick={() => { setGalleryOpen(true); setActiveImg(0); }}>
          {mainImages.length === 0 ? (
            <div className="col-span-4 row-span-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <HomeModernIcon className="w-20 h-20 text-gray-400" />
            </div>
          ) : (
            <>
              <div className="col-span-2 row-span-2 relative">
                <img src={mainImages[0].url} alt="" className="w-full h-full object-cover hover:brightness-90 transition"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = ''; }} />
              </div>
              {mainImages.slice(1, 5).map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img.url} alt="" className="w-full h-full object-cover hover:brightness-90 transition" />
                  {idx === 3 && sortedImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold">
                      +{sortedImages.length - 5} photos
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Owner */}
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {property.owner_avatar ? <img src={property.owner_avatar} className="w-full h-full object-cover" /> : property.owner_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Proposé par {property.owner_name}</h3>
                  <p className="text-sm text-gray-500">
                    {property.bedrooms} chambre{property.bedrooms > 1 ? "s" : ""} · {property.bathrooms} sdb · {property.max_guests} voyageurs max
                    {property.surface ? ` · ${property.surface} m²` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={msgSending || msgSent}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                {msgSent ? "Message envoyé ✓" : msgSending ? "Envoi..." : "Envoyer un message"}
              </button>
            </div>

            {/* Info badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: <CalendarDaysIcon className="w-6 h-6" />, title: `Arrivée à ${property.check_in_time}`, desc: `Départ avant ${property.check_out_time}` },
                { icon: <UserGroupIcon className="w-6 h-6" />, title: `${property.max_guests} voyageurs max`, desc: `Séjour min : ${property.min_stay} nuit${property.min_stay > 1 ? "s" : ""}` },
                { icon: <ShieldCheckIcon className="w-6 h-6" />, title: "Annulation", desc: property.cancellation_policy === "flexible" ? "Flexible" : property.cancellation_policy === "moderate" ? "Modérée" : "Stricte" },
              ].map((b, i) => (
                <div key={i} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div className="text-rose-500 shrink-0">{b.icon}</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{b.title}</p>
                    <p className="text-xs text-gray-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">À propos de ce logement</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ce que propose ce logement</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-rose-500">{AMENITY_ICONS[a] || <span className="w-5 h-5 block">✓</span>}</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Ratings summary bar (after amenities, Airbnb-style) ── */}
            {(reviews.length > 0 || property.rating_avg > 0) && (() => {
              const cats = [
                { label: "Propreté",       key: "cleanliness_rating"  as const, icon: "/Propreté.png" },
                { label: "Précision",      key: "accuracy_rating"     as const, icon: "/Précision.png" },
                { label: "Arrivée",        key: "checkin_rating"      as const, icon: "/Arrivée.png" },
                { label: "Communication",  key: "communication_rating" as const, icon: "/Communication.png" },
                { label: "Emplacement",    key: "location_rating"     as const, icon: "/Emplacement.png" },
                { label: "Valeur",         key: "value_rating"        as const, icon: "/Valeur.png" },
              ];
              const catAvg = (key: keyof Review) => {
                const vals = reviews.filter(r => r[key] != null).map(r => r[key] as number);
                return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
              };
              return (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                    {/* Left — overall distribution */}
                    <div className="p-4 flex flex-col justify-center" style={{ minWidth: 160 }}>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Note globale</p>
                      <div className="space-y-1">
                        {[5,4,3,2,1].map(star => {
                          const count = reviews.filter(r => Math.round(r.rating) === star).length;
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-1.5 text-xs text-gray-400">
                              <span className="w-2 text-right shrink-0">{star}</span>
                              <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-800 dark:bg-gray-200 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right — 6 category columns */}
                    <div className="flex-1 grid grid-cols-3 md:grid-cols-6 divide-x divide-gray-200 dark:divide-gray-700">
                      {cats.map(cat => {
                        const avg = catAvg(cat.key);
                        const score = avg != null ? avg : (property.rating_avg > 0 ? Number(property.rating_avg) : null);
                        return (
                          <div key={cat.key} className="flex flex-col items-center justify-center gap-1 py-3 px-1">
                            <img src={cat.icon} alt={cat.label} className="w-8 h-8 object-contain" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                              {score != null ? score.toFixed(1) : "—"}
                            </span>
                            <div className="w-10 h-px bg-gray-800 dark:bg-white rounded-full" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight break-words w-full text-center">{cat.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Reviews — Airbnb style */}
            {(reviews.length > 0 || property.rating_avg > 0) && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-8">

                {/* Hero rating */}
                <div className="flex flex-col items-center text-center mb-8 py-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                  {property.rating_avg >= 4.5 && (
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">🏆</span>
                      <span className="text-4xl font-black text-gray-900 dark:text-white">{Number(property.rating_avg).toFixed(2)}</span>
                      <span className="text-3xl">🏆</span>
                    </div>
                  )}
                  {property.rating_avg > 0 && property.rating_avg < 4.5 && (
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => <StarSolid key={s} className={`w-6 h-6 ${s <= Math.round(property.rating_avg) ? "text-amber-400" : "text-gray-300"}`} />)}
                      <span className="ml-2 text-2xl font-black text-gray-900 dark:text-white">{Number(property.rating_avg).toFixed(1)}</span>
                    </div>
                  )}
                  {property.rating_avg >= 4.5 && (
                    <>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Favori des voyageurs</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs">Ce logement figure parmi les 5 % des annonces les mieux notées</p>
                    </>
                  )}
                  <p className="text-sm text-gray-500 mt-2">{property.review_count || reviews.length} avis</p>
                </div>

                {/* Ratings breakdown */}
                {reviews.length > 0 && (
                  <div className="mb-8">
                    {/* Star distribution bar */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Note globale</p>
                      <div className="space-y-1.5">
                        {[5,4,3,2,1].map(star => {
                          const count = reviews.filter(r => Math.round(r.rating) === star).length;
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 w-3 text-right">{star}</span>
                              <StarSolid className="w-3 h-3 text-amber-400 shrink-0" />
                              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category ratings grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: "Propreté", key: "cleanliness_rating" as const, icon: "🧹" },
                        { label: "Emplacement", key: "location_rating" as const, icon: "📍" },
                        { label: "Valeur", key: "value_rating" as const, icon: "💰" },
                        { label: "Communication", key: "communication_rating" as const, icon: "💬" },
                      ].map(cat => {
                        const vals = reviews.filter(r => r[cat.key]).map(r => r[cat.key] as number);
                        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                        if (!avg) return null;
                        return (
                          <div key={cat.key} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{cat.label}</span>
                              <span className="text-lg">{cat.icon}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-900 dark:bg-white rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-right">{avg.toFixed(1)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews grid */}
                {reviews.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <StarSolid className="w-5 h-5 text-amber-400" />
                      {reviews.length} avis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reviews.slice(0, 6).map(r => (
                        <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                              {r.reviewer_avatar ? <img src={r.reviewer_avatar} className="w-full h-full object-cover" /> : r.reviewer_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{r.reviewer_name}</p>
                              <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {[1,2,3,4,5].map(s => <StarSolid key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`} />)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — Booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl">
              <div className="mb-4">
                {property.listing_type === "nuit" && property.price_per_night && (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.price_per_night.toLocaleString()} <span className="text-base font-normal text-gray-500">{property.currency} / nuit</span>
                  </p>
                )}
                {property.listing_type === "semaine" && property.price_per_week && (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.price_per_week.toLocaleString()} <span className="text-base font-normal text-gray-500">{property.currency} / semaine</span>
                  </p>
                )}
                {property.listing_type === "mois" && property.price_per_month && (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.price_per_month.toLocaleString()} <span className="text-base font-normal text-gray-500">{property.currency} / mois</span>
                  </p>
                )}
              </div>

              {bookingResult ? (
                <div className={`p-4 rounded-xl text-sm mb-4 ${bookingResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {bookingResult.message}
                  {bookingResult.success && (
                    <Link href="/tableau-de-bord/reservation" className="block mt-2 underline font-semibold">Voir mes réservations →</Link>
                  )}
                </div>
              ) : null}

              <div className="space-y-3 mb-4">
                {/* Interactive calendar with blocked dates greyed out */}
                <BookingCalendar
                  blockedDates={property.blocked_dates || []}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onCheckInChange={d => { setCheckIn(d); setBookingResult(null); }}
                  onCheckOutChange={d => { setCheckOut(d); setBookingResult(null); }}
                  minDate={new Date().toISOString().split("T")[0]}
                />

                {/* Conflict alert */}
                {hasConflict && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                    <span className="text-lg leading-none">⚠</span>
                    <p><strong>Dates non disponibles.</strong> Votre sélection inclut des jours déjà réservés.</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Voyageurs</label>
                  <input type="number" min="1" max={property.max_guests} value={guestsCount} onChange={e => setGuestsCount(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Paiement</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none">
                    <option value="cash">Espèces sur place</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="airtel_money">Airtel Money</option>
                    <option value="visa">Carte Visa</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Message (optionnel)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Présentez-vous au propriétaire..."
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none resize-none" />
                </div>
              </div>

              {price && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mb-4 space-y-1">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Durée</span><span>{price.nights} nuit{price.nights > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                    <span>Total</span><span>{price.total.toLocaleString()} {property.currency}</span>
                  </div>
                </div>
              )}

              <button onClick={handleBook} disabled={booking || !!bookingResult?.success || hasConflict}
                className={`w-full rounded-xl py-3 font-bold transition-colors ${hasConflict ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white"}`}>
                {booking ? "Envoi en cours..." : hasConflict ? "Dates non disponibles" : property.instant_booking ? "Réserver maintenant" : "Demander une réservation"}
              </button>

              {property.instant_booking && (
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ✓ Confirmation instantanée
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
