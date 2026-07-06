"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function iso(y: number, m: number, d: number) { return `${y}-${pad(m+1)}-${pad(d)}`; }
function daysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; }

interface Props {
  blockedDates: string[];
  checkIn: string;
  checkOut: string;
  onCheckInChange: (d: string) => void;
  onCheckOutChange: (d: string) => void;
  minDate?: string;
}

export default function BookingCalendar({ blockedDates, checkIn, checkOut, onCheckInChange, onCheckOutChange, minDate }: Props) {
  const now = new Date();
  const todayStr = minDate || `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const initYear = now.getFullYear();
  const initMonth = now.getMonth();

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [phase, setPhase] = useState<"in"|"out">("in");
  const [hover, setHover] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const blocked = new Set(blockedDates);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function rangeHasBlocked(from: string, to: string) {
    const c = new Date(from);
    while (c < new Date(to)) {
      if (blocked.has(`${c.getFullYear()}-${pad(c.getMonth()+1)}-${pad(c.getDate())}`)) return true;
      c.setDate(c.getDate()+1);
    }
    return false;
  }

  function clickDay(d: string) {
    if (blocked.has(d) || d < todayStr) return;
    if (phase === "in") {
      onCheckInChange(d); onCheckOutChange(""); setPhase("out");
    } else {
      if (d <= checkIn) { onCheckInChange(d); onCheckOutChange(""); }
      else if (rangeHasBlocked(checkIn, d)) { onCheckInChange(d); onCheckOutChange(""); }
      else { onCheckOutChange(d); setPhase("in"); setOpen(false); }
    }
  }

  function dayClass(d: string) {
    const isBlocked = blocked.has(d);
    const isPast = d < todayStr;
    if (isBlocked) return "text-gray-300 dark:text-gray-600 line-through cursor-not-allowed pointer-events-none bg-gray-50 dark:bg-gray-800/50";
    if (isPast) return "text-gray-300 dark:text-gray-600 cursor-not-allowed pointer-events-none";
    if (d === checkIn || d === checkOut) return "bg-rose-500 text-white font-bold cursor-pointer";
    const previewEnd = phase === "out" && hover > checkIn ? hover : checkOut;
    if (checkIn && previewEnd && d > checkIn && d < previewEnd) return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 cursor-pointer";
    return "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";
  }

  function MonthGrid({ y, m }: { y: number; m: number }) {
    const first = firstWeekday(y, m);
    const total = daysInMonth(y, m);
    const cells: (number|null)[] = [...Array(first).fill(null)];
    for (let i = 1; i <= total; i++) cells.push(i);
    while (cells.length % 7) cells.push(null);
    return (
      <div className="min-w-[17rem]">
        <p className="text-sm font-bold text-center text-gray-900 dark:text-white mb-3">{MONTHS_FR[m]} {y}</p>
        <div className="grid grid-cols-7 text-xs text-center mb-1">
          {DAYS_FR.map(d => <span key={d} className="py-1 font-semibold text-gray-500">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 text-sm text-center gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <span key={i} />;
            const ds = iso(y, m, day);
            const isBlocked = blocked.has(ds);
            return (
              <button key={i} type="button"
                disabled={isBlocked || ds < todayStr}
                onClick={() => clickDay(ds)}
                onMouseEnter={() => phase === "out" && checkIn && !isBlocked && ds >= todayStr && setHover(ds)}
                onMouseLeave={() => setHover("")}
                title={isBlocked ? "Non disponible" : undefined}
                className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center transition-colors text-sm ${dayClass(ds)}`}>
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const canPrev = !(year === initYear && month === initMonth);
  const m2 = month === 11 ? 0 : month + 1;
  const y2 = month === 11 ? year + 1 : year;
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setPhase(checkIn ? "out" : "in"); }}
        className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors text-left ${open ? "border-rose-400 bg-rose-50 dark:bg-rose-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300"}`}
      >
        <CalendarDaysIcon className="w-5 h-5 text-rose-500 shrink-0" />
        <div className="flex-1 min-w-0">
          {checkIn && checkOut ? (
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {fmtDate(checkIn)} <span className="text-gray-400 mx-1">→</span> {fmtDate(checkOut)}
            </p>
          ) : checkIn ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {fmtDate(checkIn)} <span className="text-gray-400">→ Choisir le départ</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">Choisir les dates</p>
          )}
        </div>
        {(checkIn || checkOut) && (
          <button type="button" onClick={e => { e.stopPropagation(); onCheckInChange(""); onCheckOutChange(""); setPhase("in"); }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </button>

      {/* Calendar popup */}
      {open && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 w-max">
          <p className="text-xs text-center text-gray-500 mb-4">
            {phase === "in" ? "Sélectionnez la date d'arrivée" : "Sélectionnez la date de départ"}
          </p>
          <div className="flex items-start gap-6">
            <button type="button" onClick={() => { if (!canPrev) return; if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}
              disabled={!canPrev}
              className="mt-1 w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed shrink-0">
              <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
            </button>
            <MonthGrid y={year} m={month} />
            <MonthGrid y={y2} m={m2} />
            <button type="button" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}
              className="mt-1 w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">
              <ChevronRightIcon className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Sélection</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 inline-block" /> Période</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 inline-block line-through text-gray-300 text-[9px] text-center">8</span> Indispo</span>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const initYear = today.getFullYear();
  const initMonth = today.getMonth();
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [selecting, setSelecting] = useState<"in" | "out">("in");
  const [hoverDate, setHoverDate] = useState("");

  const blocked = new Set(blockedDates);
  // Use local date (not UTC) to avoid timezone issues
  const todayStr = minDate || `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const canGoPrev = !(year === initYear && month === initMonth);

  const prevMonth = () => {
    if (!canGoPrev) return;
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
      <div className="flex items-start justify-between mb-3">
        <button type="button" onClick={prevMonth} disabled={!canGoPrev} className="mt-6 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed shrink-0">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex gap-4 flex-1 px-1">
          {renderMonth(year, month)}
          <div className="hidden sm:block w-px bg-gray-100 dark:bg-gray-800" />
          <div className="hidden sm:flex flex-1">
            {renderMonth(year2, month2)}
          </div>
        </div>
        <button type="button" onClick={nextMonth} className="mt-6 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 shrink-0">
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
