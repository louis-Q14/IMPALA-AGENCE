"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  TruckIcon,
  HomeModernIcon,
  TrashIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BellIcon,
  ClockIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PlusIcon,
  ChartBarIcon,
  EyeIcon,
  StarIcon,
  CalendarIcon,
  MapPinIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";

interface ServiceEntry {
  service: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  services?: (string | ServiceEntry)[];
}

const SERVICE_META: Record<string, { label: string; gradient: string; emoji: string }> = {
  real_estate:  { label: "Immobilier",    gradient: "from-blue-500 to-indigo-600",   emoji: "🏠" },
  auto:         { label: "Automobile",    gradient: "from-amber-500 to-orange-600",  emoji: "🚗" },
  reservation:  { label: "Reservation",   gradient: "from-rose-500 to-pink-600",     emoji: "🛏️" },
  trash:        { label: "Poubelles",     gradient: "from-emerald-500 to-green-600", emoji: "🗑️" },
  nettoyage:    { label: "Nettoyage",     gradient: "from-blue-400 to-cyan-500",     emoji: "🧹" },
  repassage:    { label: "Repassage",     gradient: "from-purple-400 to-violet-500", emoji: "👔" },
  demenagement: { label: "Demenagement",  gradient: "from-orange-400 to-amber-500",  emoji: "🚛" },
};

const SERVICE_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  bg: string;
  href: string;
  publishHref: string;
  stats: { label: string; value: string }[];
  recentItems: { title: string; subtitle: string; price: string; originalPrice?: string; discountPct?: number; badge: string; badgeColor: string }[];
}> = {
  real_estate: {
    label: "Immobilier",
    description: "Gerez vos annonces de vente et location",
    icon: HomeIcon,
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-900/10",
    href: "/abonnement?service=immobilier",
    publishHref: "/immobilier",
    stats: [
      { label: "Annonces actives", value: "0" },
      { label: "Vues totales", value: "0" },
      { label: "Favoris", value: "0" },
    ],
    recentItems: [],
  },
  auto: {
    label: "Automobile",
    description: "Gerez vos annonces de vente et location de vehicules",
    icon: TruckIcon,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-900/10",
    href: "/abonnement?service=automobile",
    publishHref: "/automobile",
    stats: [
      { label: "Vehicules listes", value: "0" },
      { label: "Vues totales", value: "0" },
      { label: "Reservations", value: "0" },
    ],
    recentItems: [],
  },
  reservation: {
    label: "Reservation",
    description: "Gerez vos biens et vos reservations",
    icon: HomeModernIcon,
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50 dark:bg-rose-900/10",
    href: "/abonnement?service=reservation",
    publishHref: "/tableau-de-bord/reservation",
    stats: [
      { label: "Biens publies", value: "0" },
      { label: "Reservations actives", value: "0" },
      { label: "Revenus totaux", value: "0" },
    ],
    recentItems: [],
  },
  nettoyage: {
    label: "Nettoyage",
    description: "Nettoyage de bureaux et espaces commerciaux",
    icon: SparklesIcon,
    gradient: "from-sky-500 to-indigo-600",
    bg: "bg-sky-50 dark:bg-sky-900/10",
    href: "/multi-impala/nettoyage",
    publishHref: "/multi-impala/nettoyage",
    stats: [
      { label: "Reservations", value: "0" },
      { label: "Prochaine visite", value: "—" },
      { label: "Statut", value: "Actif" },
    ],
    recentItems: [],
  },
  repassage: {
    label: "Repassage",
    description: "Service de repassage professionnel a domicile",
    icon: StarIcon,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-900/10",
    href: "/multi-impala/repassage",
    publishHref: "/multi-impala/repassage",
    stats: [
      { label: "Reservations", value: "0" },
      { label: "Prochaine session", value: "—" },
      { label: "Statut", value: "Actif" },
    ],
    recentItems: [],
  },
  demenagement: {
    label: "Demenagement",
    description: "Service de demenagement professionnel",
    icon: MapPinIcon,
    gradient: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-900/10",
    href: "/multi-impala/demenagement",
    publishHref: "/multi-impala/demenagement",
    stats: [
      { label: "Reservations", value: "0" },
      { label: "Prochain trajet", value: "—" },
      { label: "Statut", value: "Actif" },
    ],
    recentItems: [],
  },
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ServiceStats {
  real_estate: { active_ads: number; total_views: number };
  auto: { active_ads: number; total_views: number; rentals: number };
  nettoyage: { date: string | null; status: string | null };
  repassage: { date: string | null; status: string | null };
  demenagement: { date: string | null; status: string | null };
  totals: { ads: number; views: number; messages: number; favorites: number };
}

interface ReservationStats {
  properties: number;
  active_bookings: number;
  total_revenue: number;
}

interface TrashSub {
  plan: string;
  frequency: string;
  bins: number;
  amount: string;
  status: string;
  collectDays?: string[];
  nextPickup?: string;
  startDate?: string;
}

function getSubEndDate(startDate: string, plan: string): Date {
  const start = new Date(startDate);
  const end = new Date(start);
  if (plan.includes("trimestr")) end.setMonth(end.getMonth() + 3);
  else if (plan.includes("semestr")) end.setMonth(end.getMonth() + 6);
  else if (plan.includes("annuel") || plan.includes("annual")) end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  return end;
}

function SubscriptionCalendar({ startDate, endDate, label = "Abonnement", gradient = "from-emerald-500 to-green-600", emoji = "📅", bookedDates }: {
  startDate: Date; endDate: Date; label?: string; gradient?: string; emoji?: string; bookedDates?: string[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  let startWeekday = firstDayOfMonth.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const MONTH_FR = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const getDayClass = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (bookedDates && bookedDates.length > 0) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (!bookedDates.includes(iso)) return "text-[var(--text-secondary)]";
      if (d.getTime() === today.getTime()) return "bg-violet-600 text-white font-bold";
      if (d < today) return "bg-blue-600 text-white";
      return "bg-emerald-700 text-white";
    }
    const s = new Date(startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(endDate); e.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "bg-violet-600 text-white font-bold";
    if (d >= s && d < today && d <= e) return "bg-blue-600 text-white";
    if (d > today && d <= e) return "bg-emerald-700 text-white";
    return "text-[var(--text-secondary)]";
  };

  const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  let s0: Date, e0: Date, totalDays: number, consumed: number, remaining: number, pct: number;
  if (bookedDates && bookedDates.length > 0) {
    s0 = new Date(startDate); s0.setHours(0,0,0,0);
    e0 = new Date(endDate); e0.setHours(0,0,0,0);
    consumed = bookedDates.filter(d => new Date(d) < today).length;
    totalDays = bookedDates.length;
    remaining = totalDays - consumed;
    pct = totalDays > 0 ? Math.round((consumed / totalDays) * 100) : 0;
  } else {
    s0 = new Date(startDate); s0.setHours(0,0,0,0);
    e0 = new Date(endDate); e0.setHours(0,0,0,0);
    totalDays = Math.round((e0.getTime() - s0.getTime()) / 86400000) + 1;
    consumed = Math.max(0, Math.min(totalDays, Math.round((today.getTime() - s0.getTime()) / 86400000)));
    remaining = Math.max(0, totalDays - consumed);
    pct = Math.round((consumed / totalDays) * 100);
  }

  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-white text-sm leading-none">{emoji}</span>
        </div>
        <span className="font-semibold text-[var(--text-primary)]">Progression · {label}</span>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-muted)]">{consumed} {bookedDates ? "seance(s) passee(s)" : "j. consommes"}</span>
            <span className="font-bold text-violet-500">{pct}%</span>
            <span className="text-[var(--text-muted)]">{remaining} {bookedDates ? "a venir" : "j. restants"}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700" style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1.5">
            <span>{fmtDate(s0)}</span><span>{fmtDate(e0)}</span>
          </div>
        </div>
        <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] transition-all">&#8249;</button>
            <span className="font-semibold text-[var(--text-primary)]">{MONTH_FR[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] transition-all">&#8250;</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: startWeekday }).map((_, i) => (<div key={`empty-${i}`} />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <div key={day} className="flex items-center justify-center">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all ${getDayClass(day)}`}>{day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Consomme</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> Aujourd&apos;hui</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-700 inline-block" /> Restant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TableauDeBord() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trashSub, setTrashSub] = useState<TrashSub | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [calendarTab, setCalendarTab] = useState<string>("");
  const [bookings, setBookings] = useState<Record<string, string[]>>({});

  const loadUser = async () => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/connexion"); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role === "finance_agent") { router.replace("/finance/tableau-de-bord"); return; }
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (Array.isArray(meData.services) && meData.services.length >= 0) u.services = meData.services;
            localStorage.setItem("user", JSON.stringify({ ...u }));
          }
        } catch {}
      }
      try {
        if (token) {
          const res = await fetch(`${API}/trash/my-subscription`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) { const data = await res.json(); if (data.subscription) setTrashSub(data.subscription); }
        }
      } catch {}
      if (token) {
        try {
          const sRes = await fetch(`${API}/auth/stats`, { headers: { Authorization: `Bearer ${token}` } });
          if (sRes.ok) setStats(await sRes.json());
        } catch {}
      }
      if (token) {
        try {
          const rRes = await fetch(`${API}/reservation/stats`, { headers: { Authorization: `Bearer ${token}` } });
          if (rRes.ok) setReservationStats(await rRes.json());
        } catch {}
      }
      for (const svc of ["nettoyage", "repassage", "demenagement"]) {
        if (token) {
          fetch(`${API}/services/${svc}/my-booking`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null).then(d => {
              if (d?.booking?.date) {
                const dates = (d.booking.date as string).split(",").filter(Boolean);
                if (dates.length > 0) setBookings(prev => ({ ...prev, [svc]: dates }));
              }
            }).catch(() => {});
        }
      }
      setUser(u);
    } catch { router.push("/connexion"); }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    const onVisibility = () => { if (document.visibilityState === "visible") loadUser(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { document.removeEventListener("visibilitychange", onVisibility); };
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const normalizeService = (s: string | { service: string; status: string }): string =>
    typeof s === "string" ? s : s.service;

  const userServices = (user.services || []).map(normalizeService).filter(s => s !== "trash");
  const hasTrashService = (user.services || []).map(normalizeService).includes("trash");
  const allServices = (trashSub || hasTrashService) ? [...userServices, "trash"] : userServices;
  const initials = user.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const greeting = new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon apres-midi" : "Bonsoir";

  const trashConfig = trashSub ? {
    label: "Poubelles",
    description: "Service de ramassage de dechets a domicile",
    icon: TrashIcon,
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    href: "/poubelles",
    publishHref: "/poubelles",
    stats: [
      { label: "Formule", value: trashSub.plan.charAt(0).toUpperCase() + trashSub.plan.slice(1) },
      { label: "Frequence", value: trashSub.frequency },
      { label: "Bacs", value: String(trashSub.bins) },
    ],
    recentItems: [
      {
        title: `Abonnement ${trashSub.plan.charAt(0).toUpperCase() + trashSub.plan.slice(1)}`,
        subtitle: `${trashSub.frequency} · ${trashSub.bins} bac${trashSub.bins > 1 ? "s" : ""}`,
        price: trashSub.amount,
        badge: trashSub.status === "active" ? "Actif" : trashSub.status === "pending" ? "En attente" : trashSub.status === "paused" ? "En pause" : "Resilie",
        badgeColor: trashSub.status === "active" ? "bg-emerald-600" : trashSub.status === "pending" ? "bg-blue-500" : trashSub.status === "paused" ? "bg-amber-500" : "bg-red-500",
      },
    ],
  } : null;

  const allConfig: Record<string, typeof SERVICE_CONFIG[string]> = {
    ...SERVICE_CONFIG,
    trash: trashConfig ?? {
      label: "Poubelles",
      description: "Service de ramassage de dechets a domicile",
      icon: TrashIcon,
      gradient: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/10",
      href: "/poubelles/paiement",
      publishHref: "/poubelles/paiement",
      stats: [
        { label: "Formule", value: "—" },
        { label: "Frequence", value: "—" },
        { label: "Bacs", value: "—" },
      ],
      recentItems: [
        { title: "Aucun abonnement actif", subtitle: "Cliquez sur Explorer pour souscrire", price: "—", badge: "Non active", badgeColor: "bg-gray-500" },
      ],
    },
  };

  const getNextDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "-";
    const dates = dateStr.split(",").filter(Boolean).map(d => d.trim()).sort();
    const today = new Date(); today.setHours(0,0,0,0);
    const next = dates.find(d => new Date(d) >= today);
    return next
      ? new Date(next).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      : (dates[dates.length-1]
          ? new Date(dates[dates.length-1]).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
          : "-");
  };

  const getSvcLabel = (status: string | null | undefined): string => {
    if (!status) return "-";
    if (status === "active" || status === "approved") return "Actif";
    if (status === "pending") return "En attente";
    if (status === "paused" || status === "suspended") return "En pause";
    if (status === "cancelled" || status === "expired") return "Resilie";
    return status;
  };

  const getDynamicStats = (serviceId: string): { label: string; value: string }[] => {
    if (serviceId === "real_estate") return [
      { label: "Annonces actives", value: String(stats?.real_estate.active_ads ?? 0) },
      { label: "Vues totales", value: String(stats?.real_estate.total_views ?? 0) },
      { label: "Favoris", value: String(stats?.totals.favorites ?? 0) },
    ];
    if (serviceId === "auto") return [
      { label: "Vehicules listes", value: String(stats?.auto.active_ads ?? 0) },
      { label: "Vues totales", value: String(stats?.auto.total_views ?? 0) },
      { label: "Reservations", value: String(stats?.auto.rentals ?? 0) },
    ];
    if (serviceId === "reservation") return [
      { label: "Biens publies", value: String(reservationStats?.properties ?? 0) },
      { label: "Reservations actives", value: String(reservationStats?.active_bookings ?? 0) },
      { label: "Revenus totaux", value: `$${(reservationStats?.total_revenue ?? 0).toLocaleString()}` },
    ];
    if (serviceId === "nettoyage") return [
      { label: "Reservations", value: stats?.nettoyage.status ? "1" : "0" },
      { label: "Prochaine visite", value: getNextDate(stats?.nettoyage.date) },
      { label: "Statut", value: getSvcLabel(stats?.nettoyage.status) },
    ];
    if (serviceId === "repassage") return [
      { label: "Reservations", value: stats?.repassage.status ? "1" : "0" },
      { label: "Prochaine session", value: getNextDate(stats?.repassage.date) },
      { label: "Statut", value: getSvcLabel(stats?.repassage.status) },
    ];
    if (serviceId === "demenagement") return [
      { label: "Reservations", value: stats?.demenagement.status ? "1" : "0" },
      { label: "Prochain trajet", value: getNextDate(stats?.demenagement.date) },
      { label: "Statut", value: getSvcLabel(stats?.demenagement.status) },
    ];
    return [];
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <div className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">{initials}</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{greeting}, {user.full_name?.split(" ")[0]} !</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Bienvenue sur votre tableau de bord · {allServices.length} service{allServices.length > 1 ? "s" : ""} actif{allServices.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                <UserCircleIcon className="w-4 h-4" /> Mon profil
              </Link>
              <Link href="/profil" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                <Cog6ToothIcon className="w-4 h-4" /> Parametres
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: ChartBarIcon, label: "Annonces", value: String(stats?.totals.ads ?? 0), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
            { icon: EyeIcon, label: "Vues totales", value: String(stats?.totals.views ?? 0), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10" },
            { icon: ChatBubbleLeftRightIcon, label: "Messages", value: String(stats?.totals.messages ?? 0), color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
            { icon: HeartIcon, label: "Favoris", value: String(stats?.totals.favorites ?? 0), color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Mes services</h2>
          {allServices.length === 0 && (
            <div className="text-center py-16 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucun service selectionne</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                Vous n&apos;avez selectionne aucun service lors de votre inscription. Contactez le support pour en ajouter.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {allServices.map((serviceId) => {
              const config = allConfig[serviceId];
              if (!config) return null;
              const svcEntry = (user.services || []).find(s => (typeof s === "string" ? s : s.service) === serviceId);
              const svcStatus = serviceId === "trash"
                ? (trashSub?.status ?? "pending")
                : (typeof svcEntry === "string" ? "pending" : (svcEntry as ServiceEntry)?.status ?? "pending");
              const displayStats = serviceId === "trash" ? config.stats : getDynamicStats(serviceId);
              return (
                <div key={serviceId} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className={`bg-gradient-to-r ${config.gradient} p-5`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <config.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{config.label}</h3>
                          <p className="text-xs text-white/70">{config.description}</p>
                        </div>
                      </div>
                      <span className={"px-2.5 py-1 rounded-full text-xs font-semibold " + (
                        svcStatus === "active" || svcStatus === "approved" ? "bg-emerald-500/30 text-emerald-100" :
                        svcStatus === "paused" || svcStatus === "suspended" ? "bg-amber-500/30 text-amber-100" :
                        svcStatus === "rejected" ? "bg-red-500/30 text-red-100" :
                        "bg-white/20 text-white/80"
                      )}>
                        {svcStatus === "active" || svcStatus === "approved" ? "Actif" :
                         svcStatus === "paused" || svcStatus === "suspended" ? "En pause" :
                         svcStatus === "rejected" ? "Refuse" : "En attente"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-[var(--border-color)] border-b border-[var(--border-color)]">
                    {displayStats.map((stat) => (
                      <div key={stat.label} className="p-3 text-center">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{stat.value}</p>
                        <p className="text-[10px] text-[var(--text-muted)] leading-tight">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Apercu</p>
                    {config.recentItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)]">
                        <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <config.icon className={`w-4 h-4 ${serviceId === "real_estate" ? "text-blue-500" : serviceId === "auto" ? "text-amber-500" : "text-emerald-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.subtitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {item.originalPrice && (<p className="text-[11px] text-[var(--text-muted)] line-through">{item.originalPrice}</p>)}
                          <div className="flex items-center gap-1.5 justify-end">
                            <p className={`text-sm font-bold ${item.originalPrice ? "text-emerald-500" : "text-[var(--text-primary)]"}`}>{item.price}</p>
                            {item.discountPct && (<span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">-{item.discountPct}%</span>)}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${item.badgeColor}`}>{item.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 pt-0 flex gap-2">
                    <Link href={config.href} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all">
                      <ArrowRightIcon className="w-4 h-4" /> Explorer
                    </Link>
                    {serviceId !== "trash" && (
                      <Link href={config.publishHref} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                        <PlusIcon className="w-4 h-4" /> {serviceId === "reservation" ? "Gérer" : "Publier"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(() => {
          type CalSvc = { id: string; label: string; emoji: string; gradient: string; startDate: Date; endDate: Date };
          const calSvcs: CalSvc[] = [];
          const isActiveStatus = (st: string | undefined) => ["active", "approved"].includes(st ?? "");
          ;(user.services || []).forEach(s => {
            const svcId = typeof s === "string" ? s : s.service;
            const svcData = typeof s === "string" ? null : s;
            if (svcId === "trash") return;
            const meta = SERVICE_META[svcId];
            if (!meta) return;
            const status = svcData?.status ?? "";
            if (!isActiveStatus(status)) return;
            const isSession = ["nettoyage", "repassage", "demenagement"].includes(svcId);
            const hasBooking = isSession && (bookings[svcId]?.length ?? 0) > 0;
            if (!svcData?.startDate && !hasBooking) return;
            const startD = svcData?.startDate
              ? new Date(svcData.startDate)
              : hasBooking ? new Date([...bookings[svcId]].sort()[0]) : new Date();
            const endD = svcData?.endDate
              ? new Date(svcData.endDate)
              : hasBooking ? new Date([...bookings[svcId]].sort().pop()!)
              : getSubEndDate(startD.toISOString(), "mensuel");
            calSvcs.push({ id: svcId, label: meta.label, emoji: meta.emoji, gradient: meta.gradient, startDate: startD, endDate: endD });
          });
          if (trashSub?.startDate && trashSub.status === "active") {
            const meta = SERVICE_META.trash;
            calSvcs.push({ id: "trash", label: meta.label, emoji: meta.emoji, gradient: meta.gradient,
              startDate: new Date(trashSub.startDate), endDate: getSubEndDate(trashSub.startDate, trashSub.plan) });
          }
          if (calSvcs.length === 0) return null;
          const activeTab = calendarTab || calSvcs[0].id;
          return (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Duree de l&apos;abonnement</h2>
              {calSvcs.length > 1 && (
                <div className="flex gap-2 mb-5 flex-wrap">
                  {calSvcs.map(svc => (
                    <button key={svc.id} onClick={() => setCalendarTab(svc.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        activeTab === svc.id
                          ? `bg-gradient-to-r ${svc.gradient} text-white shadow-md`
                          : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <span>{svc.emoji}</span><span>{svc.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {calSvcs.filter(svc => svc.id === activeTab).map(svc => (
                  <SubscriptionCalendar key={svc.id} startDate={svc.startDate} endDate={svc.endDate}
                    label={svc.label} gradient={svc.gradient} emoji={svc.emoji}
                    bookedDates={["nettoyage", "repassage", "demenagement"].includes(svc.id) ? bookings[svc.id] : undefined} />
                ))}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-[var(--text-muted)]" /> Activite recente
            </h3>
            <div className="space-y-4">
              {[
                { icon: ShieldCheckIcon, text: "Compte approuve par l'administrateur", time: "Recemment", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" },
                { icon: UserCircleIcon, text: "Creation de votre compte", time: formatDate(new Date().toISOString()), color: "text-blue-500 bg-blue-50 dark:bg-blue-900/10" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)]">{activity.text}</p>
                    <p className="text-xs text-[var(--text-muted)]">{activity.time}</p>
                  </div>
                </div>
              ))}
              {allServices.length > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-500 bg-purple-50 dark:bg-purple-900/10">
                    <StarIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)]">
                      Services actives : {allServices.map((s) => allConfig[s]?.label).filter(Boolean).join(", ")}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">A l&apos;inscription</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Actions rapides</h3>
            <div className="space-y-2">
              {[
                { label: "Mon profil", href: "/profil", icon: UserCircleIcon },
                { label: "Mes favoris", href: "/profil", icon: HeartIcon },
                { label: "Mes messages", href: "/messagerie", icon: ChatBubbleLeftRightIcon },
                { label: "Notifications", href: "/profil", icon: BellIcon },
                { label: "Parametres", href: "/profil", icon: Cog6ToothIcon },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] group-hover:bg-primary/10 flex items-center justify-center transition-all">
                    <action.icon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-primary transition-all" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-all flex-1">{action.label}</span>
                  <ArrowRightIcon className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {Object.keys(SERVICE_CONFIG).filter(id => !allServices.includes(id)).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Decouvrir d&apos;autres services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(SERVICE_CONFIG)
                .filter(([id]) => !allServices.includes(id))
                .map(([id, config]) => (
                  <Link key={id} href={config.href} className="p-5 rounded-2xl border-2 border-dashed border-[var(--border-color)] hover:border-primary/50 bg-[var(--bg-card)] hover:bg-primary/5 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all`}>
                        <config.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-[var(--text-primary)]">{config.label}</h4>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{config.description}</p>
                    <p className="text-xs text-primary font-medium mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      Decouvrir <ArrowRightIcon className="w-3 h-3" />
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}