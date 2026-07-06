"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HomeModernIcon, PlusIcon, CalendarDaysIcon, StarIcon,
  BanknotesIcon, ChartBarIcon, EyeIcon, PencilIcon, TrashIcon,
  ClockIcon, CheckCircleIcon, XCircleIcon, MapPinIcon,
  ArrowRightIcon, UserGroupIcon, ChatBubbleLeftRightIcon,
  PaperAirplaneIcon, ChevronLeftIcon,
} from "@heroicons/react/24/outline";

type SubStatus = "none" | "pending" | "active";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:   { label: "Actif",    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pending:  { label: "En attente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  inactive: { label: "Inactif",  color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  rejected: { label: "Refusé",   color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const BOOKING_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "En attente",  color: "bg-yellow-100 text-yellow-700", icon: <ClockIcon className="w-4 h-4" /> },
  confirmed: { label: "Confirmée",   color: "bg-green-100 text-green-700",   icon: <CheckCircleIcon className="w-4 h-4" /> },
  cancelled: { label: "Annulée",     color: "bg-gray-100 text-gray-600",      icon: <XCircleIcon className="w-4 h-4" /> },
  completed: { label: "Terminée",    color: "bg-blue-100 text-blue-700",      icon: <CheckCircleIcon className="w-4 h-4" /> },
  rejected:  { label: "Refusée",     color: "bg-red-100 text-red-700",        icon: <XCircleIcon className="w-4 h-4" /> },
};

type TabType = "overview" | "properties" | "bookings" | "mes-voyages" | "messages";

export default function ReservationDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("overview");
  const [stats, setStats] = useState({ properties: 0, active_bookings: 0, total_revenue: 0 });
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [guestBookings, setGuestBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Messages
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus>("none");

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/connexion"); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Check subscription status
    fetch(`${API}/auth/me`, { headers })
      .then(r => r.json())
      .then(data => {
        const svc = Array.isArray(data.services)
          ? data.services.find((s: any) => s.service === "reservation")
          : null;
        if (svc && (svc.status === "active" || svc.status === "approved")) setSubStatus("active");
        else if (svc && svc.status === "pending") setSubStatus("pending");
        else setSubStatus("none");
      })
      .catch(() => {});

    setLoading(true);

    Promise.all([
      fetch(`${API}/reservation/stats`, { headers }).then(r => r.json()),
      fetch(`${API}/reservation/my-properties`, { headers }).then(r => r.json()),
      fetch(`${API}/reservation/bookings/owner`, { headers }).then(r => r.json()),
      fetch(`${API}/reservation/bookings/guest`, { headers }).then(r => r.json()),
    ])
      .then(([s, p, b, gb]) => {
        if (s.properties !== undefined) setStats(s);
        if (Array.isArray(p)) setProperties(p);
        if (Array.isArray(b)) setBookings(b);
        if (Array.isArray(gb)) setGuestBookings(gb);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBookingStatus = async (bookingId: string, status: string) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API}/reservation/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!confirm("Supprimer ce bien ?")) return;
    const token = getToken();
    await fetch(`${API}/reservation/properties/${propId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setProperties(prev => prev.filter(p => p.id !== propId));
    setStats(prev => ({ ...prev, properties: prev.properties - 1 }));
  };

  // ─── Messages ──────────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setConvLoading(true);
    try {
      const res = await fetch(`${API}/messages/reservation-conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
    setConvLoading(false);
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    const token = getToken();
    if (!token) return;
    setMsgsLoading(true);
    try {
      const res = await fetch(`${API}/messages/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConvMessages(await res.json());
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* ignore */ }
    setMsgsLoading(false);
  }, []);

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeConvId || msgSending) return;
    const token = getToken();
    if (!token) return;
    setMsgSending(true);
    try {
      const res = await fetch(`${API}/messages/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: msgInput.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setConvMessages(prev => [...prev, msg]);
        setMsgInput("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        fetchConversations();
      }
    } catch { /* ignore */ }
    setMsgSending(false);
  };

  const openConversation = (convId: string) => {
    setActiveConvId(convId);
    fetchMessages(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
  };

  useEffect(() => {
    if (tab === "messages") fetchConversations();
  }, [tab, fetchConversations]);

  // Get my user id from localStorage
  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setMyId(JSON.parse(u).id);
    } catch { /* ignore */ }
  }, []);


    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HomeModernIcon className="w-7 h-7 text-rose-500" />
              IMPALA Réservation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez vos biens et réservations</p>
          </div>
          {subStatus === "active" ? (
            <Link href="/tableau-de-bord/reservation/nouveau"
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors text-sm">
              <PlusIcon className="w-4 h-4" /> Ajouter un bien
            </Link>
          ) : subStatus === "pending" ? (
            <span className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 px-4 py-2 rounded-xl font-semibold text-sm cursor-not-allowed">
              <ClockIcon className="w-4 h-4" /> Paiement en attente
            </span>
          ) : (
            <Link href="/abonnement?service=reservation"
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors text-sm">
              <PlusIcon className="w-4 h-4" /> Ajouter un bien
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8">
          {([
            { key: "overview",    label: "Vue d'ensemble",  icon: <ChartBarIcon className="w-4 h-4" /> },
            { key: "properties",  label: "Mes biens",        icon: <HomeModernIcon className="w-4 h-4" /> },
            { key: "bookings",    label: "Demandes reçues",  icon: <CalendarDaysIcon className="w-4 h-4" /> },
            { key: "mes-voyages", label: "Mes voyages",       icon: <UserGroupIcon className="w-4 h-4" /> },
            { key: "messages",    label: "Messages",          icon: <ChatBubbleLeftRightIcon className="w-4 h-4" /> },
          ] as { key: TabType; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                tab === t.key
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border-gray-200 dark:border-gray-700"
                  : "bg-gray-100 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}>
              {t.icon} {t.label}
              {t.key === "bookings" && bookings.filter(b => b.status === "pending").length > 0 && (
                <span className="bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {bookings.filter(b => b.status === "pending").length}
                </span>
              )}
              {t.key === "messages" && conversations.reduce((s, c) => s + (c.unread_count || 0), 0) > 0 && (
                <span className="bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {conversations.reduce((s, c) => s + (c.unread_count || 0), 0)}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Mes biens", value: stats.properties, icon: <HomeModernIcon className="w-6 h-6" />, color: "from-rose-400 to-pink-500" },
                    { label: "Réservations actives", value: stats.active_bookings, icon: <CalendarDaysIcon className="w-6 h-6" />, color: "from-violet-400 to-purple-500" },
                    { label: "Revenus totaux", value: `$${stats.total_revenue.toLocaleString()}`, icon: <BanknotesIcon className="w-6 h-6" />, color: "from-emerald-400 to-green-500" },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mb-4 shadow-md`}>
                        {s.icon}
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent bookings */}
                {bookings.filter(b => b.status === "pending").length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                      <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-yellow-500" />
                        Demandes en attente ({bookings.filter(b => b.status === "pending").length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {bookings.filter(b => b.status === "pending").slice(0, 3).map(b => (
                        <div key={b.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{b.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {b.guest_name} · {new Date(b.check_in).toLocaleDateString("fr-FR")} → {new Date(b.check_out).toLocaleDateString("fr-FR")}
                              · {b.total_price} {b.currency}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleBookingStatus(b.id, "confirmed")}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                              Confirmer
                            </button>
                            <button onClick={() => handleBookingStatus(b.id, "rejected")}
                              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {bookings.filter(b => b.status === "pending").length > 3 && (
                      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
                        <button onClick={() => setTab("bookings")} className="text-sm text-rose-500 hover:underline flex items-center gap-1">
                          Voir toutes les demandes <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* My properties preview */}
                {properties.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900 dark:text-white">Mes biens récents</h2>
                      <button onClick={() => setTab("properties")} className="text-sm text-rose-500 hover:underline flex items-center gap-1">
                        Voir tout <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {properties.slice(0, 3).map(p => {
                        const cover = p.images?.find((i: any) => i.is_cover)?.url || p.images?.[0]?.url;
                        return (
                          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
              {cover ? <img src={cover} alt={p.title} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }} /> :
                        <div className="w-full h-full flex items-center justify-center"><HomeModernIcon className="w-10 h-10 text-gray-400" /></div>}
                              <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_LABELS[p.status]?.color}`}>
                                {STATUS_LABELS[p.status]?.label}
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{p.title}</h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPinIcon className="w-3 h-3" />{p.city}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {p.active_bookings > 0 ? `${p.active_bookings} réservation(s) active(s)` : "Aucune réservation active"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {properties.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <HomeModernIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun bien publié</h3>
                    <p className="text-gray-500 dark:text-gray-500 mb-6">Commencez à louer votre bien dès aujourd'hui !</p>
                    {subStatus === "active" ? (
                      <Link href="/tableau-de-bord/reservation/nouveau" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Publier mon premier bien
                      </Link>
                    ) : subStatus === "pending" ? (
                      <span className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 px-6 py-3 rounded-xl font-semibold cursor-not-allowed">
                        <ClockIcon className="w-4 h-4" /> Paiement en attente d&apos;approbation admin
                      </span>
                    ) : (
                      <Link href="/abonnement?service=reservation" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Souscrire pour publier
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PROPERTIES */}
            {tab === "properties" && (
              <div className="space-y-4">
                {properties.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <HomeModernIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun bien publié</h3>
                    {subStatus === "active" ? (
                      <Link href="/tableau-de-bord/reservation/nouveau" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Ajouter un bien
                      </Link>
                    ) : subStatus === "pending" ? (
                      <span className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 px-6 py-3 rounded-xl font-semibold cursor-not-allowed">
                        <ClockIcon className="w-4 h-4" /> Paiement en attente d&apos;approbation admin
                      </span>
                    ) : (
                      <Link href="/abonnement?service=reservation" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Souscrire pour publier
                      </Link>
                    )}
                  </div>
                ) : properties.map(p => {
                  const cover = p.images?.find((i: any) => i.is_cover)?.url || p.images?.[0]?.url;
                  return (
                    <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex gap-4 p-4">
                      <div className="w-32 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden">
                      {cover ? <img src={cover} alt={p.title} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display='none'; }} /> :
                          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-amber-50 dark:bg-amber-900/20">
                            <HomeModernIcon className="w-7 h-7 text-amber-400" />
                            <span className="text-[9px] text-amber-500 font-medium">Aucune photo</span>
                          </div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{p.title}</h3>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_LABELS[p.status]?.color}`}>
                            {STATUS_LABELS[p.status]?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPinIcon className="w-3.5 h-3.5" />{p.city}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.bedrooms} ch. · {p.max_guests} pers. max ·{" "}
                          {p.price_per_night ? `${p.price_per_night} ${p.currency}/nuit` : p.price_per_month ? `${p.price_per_month} ${p.currency}/mois` : ""}
                        </p>
                        {p.rating_avg > 0 && (
                          <p className="text-xs flex items-center gap-0.5 mt-1">
                            <StarSolid className="w-3 h-3 text-amber-400" /> {Number(p.rating_avg).toFixed(1)} ({p.review_count} avis)
                          </p>
                        )}
                        {(!p.images || p.images.length === 0) && (
                          <Link href={`/tableau-de-bord/reservation/editer/${p.id}`}
                            className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400 hover:underline">
                            ⚠ Aucune photo — Cliquez pour en ajouter
                          </Link>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Link href={`/reservation/${p.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-500 transition-colors">
                          <EyeIcon className="w-4 h-4" /> Voir
                        </Link>
                <Link href={`/tableau-de-bord/reservation/editer/${p.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                          <PencilIcon className="w-4 h-4" /> Modifier
                        </Link>
                        <button onClick={() => handleDeleteProperty(p.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                          <TrashIcon className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* BOOKINGS */}
            {tab === "bookings" && (
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <CalendarDaysIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Aucune réservation</h3>
                    <p className="text-gray-500 mt-2">Les réservations de vos biens apparaîtront ici.</p>
                  </div>
                ) : bookings.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                          {b.cover_image ? <img src={b.cover_image} alt="" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center"><HomeModernIcon className="w-6 h-6 text-gray-400" /></div>}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{b.title}</h3>
                          <p className="text-sm text-gray-500">{b.city}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="font-semibold">{b.guest_name}</span> · {b.guest_email} · {b.guest_phone}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(b.check_in).toLocaleDateString("fr-FR")} → {new Date(b.check_out).toLocaleDateString("fr-FR")}
                            · {b.nights_count} nuit{b.nights_count > 1 ? "s" : ""}
                            · {b.guests_count} pers.
                          </p>
                          {b.guest_message && <p className="text-sm italic text-gray-500 mt-1">"{b.guest_message}"</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${BOOKING_STATUS[b.status]?.color}`}>
                          {BOOKING_STATUS[b.status]?.icon} {BOOKING_STATUS[b.status]?.label}
                        </span>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{b.total_price} {b.currency}</p>
                        <p className="text-xs text-gray-500">{b.payment_method?.replace("_", " ")}</p>
                      </div>
                    </div>
                    {b.status === "pending" && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button onClick={() => handleBookingStatus(b.id, "confirmed")}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
                          ✓ Confirmer
                        </button>
                        <button onClick={() => handleBookingStatus(b.id, "rejected")}
                          className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 py-2 rounded-xl text-sm font-semibold transition-colors">
                          ✗ Refuser
                        </button>
                        <button onClick={() => handleBookingStatus(b.id, "completed")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
                          Marquer terminé
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* MES VOYAGES */}
            {tab === "mes-voyages" && (
              <div className="space-y-4">
                {guestBookings.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <CalendarDaysIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Aucun voyage réservé</h3>
                    <p className="text-gray-500 mt-2 mb-6">Explorez les biens disponibles et faites votre première réservation !</p>
                    <Link href="/reservation" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
                      Explorer les biens
                    </Link>
                  </div>
                ) : guestBookings.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="w-20 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                        {b.cover_image
                          ? <img src={b.cover_image} alt="" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          : <div className="w-full h-full flex items-center justify-center"><HomeModernIcon className="w-6 h-6 text-gray-400" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{b.title}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" />{b.city}</p>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${BOOKING_STATUS[b.status]?.color}`}>
                            {BOOKING_STATUS[b.status]?.icon} {BOOKING_STATUS[b.status]?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {new Date(b.check_in).toLocaleDateString("fr-FR")} → {new Date(b.check_out).toLocaleDateString("fr-FR")}
                          {b.nights_count ? ` · ${b.nights_count} nuit${b.nights_count > 1 ? 's' : ''}` : ""}
                          {b.guests_count ? ` · ${b.guests_count} pers.` : ""}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{b.total_price} {b.currency}</p>
                        {b.owner_message && <p className="text-xs italic text-gray-500 mt-1">“{b.owner_message}”</p>}
                      </div>
                    </div>
                    {b.status === "confirmed" && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                        <Link href={`/reservation/${b.property_id}`} className="text-sm text-rose-500 hover:underline flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" /> Voir le bien
                        </Link>
                        <button
                          onClick={async () => {
                            const token = getToken();
                            if (!token) return;
                            const res = await fetch(`${API}/messages/contact-host`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ propertyId: b.property_id, content: "Bonjour, j'ai une question concernant ma réservation." }),
                            });
                            if (res.ok) { setTab("messages"); fetchConversations(); }
                          }}
                          className="text-sm text-indigo-500 hover:underline flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" /> Contacter le propriétaire
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* MESSAGES */}
            {tab === "messages" && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden" style={{ height: "70vh", minHeight: 480 }}>
                <div className="flex h-full">

                  {/* Conversations list */}
                  <div className={`flex flex-col border-r border-gray-100 dark:border-gray-800 ${activeConvId ? "hidden md:flex w-72" : "flex w-full md:w-72"}`}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <h2 className="font-bold text-sm text-gray-900 dark:text-white">Conversations</h2>
                      <button onClick={fetchConversations} className="text-gray-400 hover:text-gray-600 text-xs">↻ Actualiser</button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {convLoading ? (
                        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Chargement…</div>
                      ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400">
                          <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2 opacity-30" />
                          <p className="text-sm font-medium">Aucun message</p>
                          <p className="text-xs mt-1">Les conversations avec les propriétaires ou voyageurs apparaîtront ici.</p>
                        </div>
                      ) : conversations.map(c => (
                        <button key={c.id} onClick={() => openConversation(c.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-50 dark:border-gray-800 ${activeConvId === c.id ? "bg-rose-50 dark:bg-rose-900/10" : ""}`}>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                            {c.other_avatar
                              ? <img src={c.other_avatar} alt="" className="w-full h-full object-cover" />
                              : (c.other_name?.[0] || "?")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.other_name}</p>
                              {c.unread_count > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shrink-0">{c.unread_count}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.property_title || "Réservation"}</p>
                            {c.last_message && <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat panel */}
                  <div className={`flex flex-col flex-1 ${!activeConvId ? "hidden md:flex" : "flex"}`}>
                    {!activeConvId ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <ChatBubbleLeftRightIcon className="w-14 h-14 mb-3 opacity-20" />
                        <p className="text-sm">Sélectionnez une conversation</p>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-1 h-full">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                          <button onClick={() => setActiveConvId(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                            <ChevronLeftIcon className="w-5 h-5" />
                          </button>
                          {conversations.filter(c => c.id === activeConvId).map(conv => (
                            <div key={conv.id} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                                {conv.other_avatar ? <img src={conv.other_avatar} alt="" className="w-full h-full object-cover" /> : conv.other_name?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{conv.other_name}</p>
                                <p className="text-xs text-gray-500">{conv.property_title}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {msgsLoading ? (
                            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Chargement…</div>
                          ) : convMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <p className="text-sm">Aucun message pour l'instant</p>
                              <p className="text-xs mt-1">Envoyez le premier message !</p>
                            </div>
                          ) : convMessages.map(m => {
                            const isMine = m.sender_id === myId;
                            return (
                              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-rose-500 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"}`}>
                                  {!isMine && <p className="text-[10px] font-semibold mb-0.5 text-gray-500 dark:text-gray-400">{m.sender_name}</p>}
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                  <p className={`text-[10px] mt-1 ${isMine ? "text-rose-200" : "text-gray-400"}`}>
                                    {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                    {" · "}
                                    {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2">
                            <textarea
                              value={msgInput}
                              onChange={e => setMsgInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                              placeholder="Tapez votre message… (Entrée pour envoyer)"
                              rows={1}
                              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none resize-none max-h-32 overflow-y-auto placeholder-gray-400"
                            />
                            <button onClick={sendMessage} disabled={!msgInput.trim() || msgSending}
                              className="shrink-0 w-8 h-8 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors">
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
