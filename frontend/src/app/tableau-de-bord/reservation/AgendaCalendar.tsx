"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  try { return localStorage.getItem("token") || sessionStorage.getItem("token") || null; } catch { return null; }
}

interface Booking {
  id: string;
  title: string;
  city: string;
  check_in: string;
  check_out: string;
  nights_count: number;
  guests_count: number;
  total_price: number;
  currency: string;
  guest_name: string;
  cover_image?: string;
  property_id: string;
  updated_at: string;
}

interface Props {
  bookings: Booking[];
  onOpenMessages?: (convId: string) => void;
}

const COLORS = [
  "bg-rose-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

const LIGHT_COLORS = [
  "bg-rose-100 text-rose-700 border-rose-300",
  "bg-blue-100 text-blue-700 border-blue-300",
  "bg-emerald-100 text-emerald-700 border-emerald-300",
  "bg-purple-100 text-purple-700 border-purple-300",
  "bg-amber-100 text-amber-700 border-amber-300",
  "bg-teal-100 text-teal-700 border-teal-300",
  "bg-indigo-100 text-indigo-700 border-indigo-300",
  "bg-pink-100 text-pink-700 border-pink-300",
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7; // Mon=0
}

function dateInRange(date: string, checkIn: string, checkOut: string) {
  return date >= checkIn && date < checkOut;
}

interface Props {
  bookings: Booking[];
  onOpenMessages?: (convId: string) => void;
}

export default function AgendaCalendar({ bookings, onOpenMessages }: Props) {
  const [sending, setSending] = useState<string | null>(null);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Build a color map per property
  const propertyIds = [...new Set(bookings.map(b => b.property_id))];
  const colorMap: Record<string, number> = {};
  propertyIds.forEach((id, i) => { colorMap[id] = i % COLORS.length; });

  // Build day → booking mapping for current month
  const dayBookings: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    const start = new Date(b.check_in);
    const end = new Date(b.check_out);
    const cursor = new Date(start);
    while (cursor < end) {
      const key = cursor.toISOString().split("T")[0];
      if (!dayBookings[key]) dayBookings[key] = [];
      dayBookings[key].push(b);
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const cells: (number | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {MONTHS_FR[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {DAYS_FR.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-800">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-20 bg-gray-50 dark:bg-gray-900/50" />;
            const dateStr = isoDate(year, month, day);
            const cellBookings = dayBookings[dateStr] || [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={i}
                className={`h-20 p-1 flex flex-col gap-0.5 overflow-hidden ${isToday ? "bg-rose-50 dark:bg-rose-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
              >
                <span className={`text-xs font-semibold self-end px-1 rounded-full ${isToday ? "bg-rose-500 text-white w-5 h-5 flex items-center justify-center" : "text-gray-500 dark:text-gray-400"}`}>
                  {day}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {cellBookings.slice(0, 2).map((b, bi) => {
                    const ci = colorMap[b.property_id];
                    const isStart = dateStr === b.check_in.split("T")[0];
                    return (
                      <button
                        key={bi}
                        onClick={() => setSelectedBooking(b)}
                        className={`w-full text-left text-[10px] font-medium px-1 py-0.5 rounded truncate ${COLORS[ci]} text-white opacity-90 hover:opacity-100 transition-opacity`}
                        title={`${b.title} — ${b.guest_name}`}
                      >
                        {isStart ? b.title.slice(0, 12) : "·"}
                      </button>
                    );
                  })}
                  {cellBookings.length > 2 && (
                    <span className="text-[9px] text-gray-400 px-1">+{cellBookings.length - 2}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Légende des biens</h3>
        <div className="flex flex-wrap gap-2">
          {propertyIds.map((pid, i) => {
            const b = bookings.find(b => b.property_id === pid);
            return (
              <div key={pid} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className={`w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`} />
                {b?.title?.slice(0, 25) || pid.slice(0, 8)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Toutes les réservations confirmées ({bookings.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {bookings.map(b => {
            const ci = colorMap[b.property_id];
            const checkIn = new Date(b.check_in);
            const checkOut = new Date(b.check_out);
            const today2 = new Date();
            const isOngoing = checkIn <= today2 && today2 < checkOut;
            const isUpcoming = checkIn > today2;
            return (
              <div key={b.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedBooking?.id === b.id ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}>
                {/* Color bar */}
                <div className={`w-1 h-full self-stretch rounded-full ${COLORS[ci]} shrink-0 min-h-[40px]`} />
                {/* Cover */}
                <div className="w-14 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                  {b.cover_image
                    ? <img src={b.cover_image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">🏠</div>}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${LIGHT_COLORS[ci]}`}>
                      {isOngoing ? "En cours" : isUpcoming ? "À venir" : "Terminé"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPinIcon className="w-3 h-3" />{b.city}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>📅 {checkIn.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} → {checkOut.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span>🌙 {b.nights_count} nuit{b.nights_count > 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1"><UserGroupIcon className="w-3 h-3" />{b.guest_name}</span>
                    <span className="text-emerald-600 font-semibold">{b.total_price} {b.currency}</span>
                  </div>                  <div className="mt-2">
                    <button
                      onClick={async () => {
                        const token = getToken();
                        if (!token) return;
                        setSending(b.id);
                        try {
                          const res = await fetch(`${API}/messages/contact-guest`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                              bookingId: b.id,
                              content: `Bonjour ${b.guest_name}, je vous contacte concernant votre r\u00e9servation du ${checkIn.toLocaleDateString("fr-FR")} au ${checkOut.toLocaleDateString("fr-FR")} pour ${b.title}.`,
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            try { sessionStorage.setItem("open_conv_id", data.conversation_id); } catch { /* ignore */ }
                            if (onOpenMessages) onOpenMessages(data.conversation_id);
                          }
                        } catch { /* ignore */ }
                        setSending(null);
                      }}
                      disabled={sending === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                      {sending === b.id ? "Envoi..." : "Envoyer un message"}
                    </button>
                  </div>                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
