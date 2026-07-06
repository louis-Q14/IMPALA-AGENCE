"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface Props {
  blockedDates: string[];
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  minDate?: string;
}

export default function BookingCalendar({ blockedDates, checkIn, checkOut, onCheckInChange, onCheckOutChange, minDate }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"in" | "out">("in");
  const [hoverDate, setHoverDate] = useState("");

  const blocked = new Set(blockedDates);
  const todayStr = minDate || today.toISOString().split("T")[0];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Check if any date in a range is blocked
  function rangeHasBlocked(from: string, to: string) {
    const s = new Date(from), e = new Date(to);
    const c = new Date(s);
    while (c < e) {
      if (blocked.has(c.toISOString().split("T")[0])) return true;
      c.setDate(c.getDate() + 1);
    }
    return false;
  }

  function handleDayClick(dateStr: string) {
    if (blocked.has(dateStr)) return;
    if (dateStr < todayStr) return;

    if (selecting === "in") {
      onCheckInChange(dateStr);
      onCheckOutChange("");
      setSelecting("out");
    } else {
      if (dateStr <= checkIn) {
        onCheckInChange(dateStr);
        onCheckOutChange("");
        setSelecting("out");
      } else if (rangeHasBlocked(checkIn, dateStr)) {
        // Range crosses blocked dates — reset and start over
        onCheckInChange(dateStr);
        onCheckOutChange("");
      } else {
        onCheckOutChange(dateStr);
        setSelecting("in");
      }
    }
  }

  function getDayClass(dateStr: string): string {
    const isBlocked = blocked.has(dateStr);
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const isCheckIn = dateStr === checkIn;
    const isCheckOut = dateStr === checkOut;
    const previewEnd = selecting === "out" && hoverDate && checkIn ? hoverDate : checkOut;
    const inRange = checkIn && previewEnd && dateStr > checkIn && dateStr < previewEnd;
    const crossesBlocked = inRange && rangeHasBlocked(checkIn, dateStr);

    if (isBlocked || isPast) {
      return "text-gray-300 dark:text-gray-600 line-through cursor-not-allowed bg-gray-50 dark:bg-gray-800/50";
    }
    if (isCheckIn || isCheckOut) {
      return "bg-rose-500 text-white font-bold rounded-full cursor-pointer";
    }
    if (inRange && !crossesBlocked) {
      return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 cursor-pointer";
    }
    if (isToday) {
      return "border-2 border-rose-400 text-rose-600 font-semibold rounded-full cursor-pointer hover:bg-rose-50";
    }
    return "text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full";
  }

  function renderMonth(y: number, m: number) {
    const totalDays = new Date(y, m + 1, 0).getDate();
    const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
    const cells: (number | null)[] = [...Array(firstDay).fill(null)];
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="flex-1">
        <p className="text-center text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
          {MONTHS_FR[m]} {y}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DAYS_FR.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase pb-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = isoDate(y, m, day);
            const isBlocked = blocked.has(dateStr);
            const isPast = dateStr < todayStr;
            return (
              <div
                key={i}
                className="flex items-center justify-center h-8"
                title={isBlocked ? "Date non disponible" : ""}
              >
                <button
                  type="button"
                  disabled={isBlocked || isPast}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => selecting === "out" && checkIn && !isBlocked && !isPast && setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate("")}
                  className={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${getDayClass(dateStr)}`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Compute second month
  const month2 = month === 11 ? 0 : month + 1;
  const year2 = month === 11 ? year + 1 : year;

  const label = selecting === "in"
    ? "Sélectionnez la date d'arrivée"
    : "Sélectionnez la date de départ";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
      {/* Instruction */}
      <p className="text-xs text-center text-gray-500 mb-3 font-medium">{label}</p>

      {/* Selected range display */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex-1 p-2 rounded-xl border text-center text-sm ${checkIn ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 font-semibold" : "border-gray-200 dark:border-gray-700 text-gray-400"}`}>
          {checkIn ? new Date(checkIn + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Arrivée"}
        </div>
        <span className="text-gray-400 text-sm">→</span>
        <div className={`flex-1 p-2 rounded-xl border text-center text-sm ${checkOut ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 font-semibold" : "border-gray-200 dark:border-gray-700 text-gray-400"}`}>
          {checkOut ? new Date(checkOut + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Départ"}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex gap-6 flex-1 px-2">
          {renderMonth(year, month)}
          <div className="hidden sm:block w-px bg-gray-100 dark:bg-gray-800 mx-1" />
          <div className="hidden sm:flex flex-1">
            {renderMonth(year2, month2)}
          </div>
        </div>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-rose-500 inline-block" /> Sélection
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-rose-100 dark:bg-rose-900/30 inline-block" /> Période
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700 text-gray-300 inline-flex items-center justify-center text-[8px] line-through">8</span> Indispo
        </span>
      </div>
    </div>
  );
}
