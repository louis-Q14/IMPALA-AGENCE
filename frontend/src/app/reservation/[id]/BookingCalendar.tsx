"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";
const DAYS = ["Lu","Ma","Me","Je","Ve","Sa","Di"];
const MONTHS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
function p2(n: number) { return String(n).padStart(2,"0"); }
function isoD(y: number, m: number, d: number) { return `${y}-${p2(m+1)}-${p2(d)}`; }
function firstWd(y: number, m: number) { return (new Date(y,m,1).getDay()+6)%7; }
interface CGProps { y:number; m:number; blocked:Set<string>; today:string; ci:string; co:string; phase:"in"|"out"; hov:string; onDay:(d:string)=>void; onEnt:(d:string)=>void; onLv:()=>void; }
function CG({ y,m,blocked,today,ci,co,phase,hov,onDay,onEnt,onLv }:CGProps) {
  const total = new Date(y,m+1,0).getDate();
  const first = firstWd(y,m);
  const cells:(number|null)[] = [...Array(first).fill(null)];
  for(let i=1;i<=total;i++) cells.push(i);
  while(cells.length%7) cells.push(null);
  function cls(d:string) {
    if(blocked.has(d)) return "text-gray-300 line-through cursor-not-allowed pointer-events-none";
    if(d<today) return "text-gray-300 cursor-not-allowed pointer-events-none";
    if(d===ci||d===co) return "bg-rose-500 text-white font-bold";
    const end = phase==="out"&&hov>ci ? hov : co;
    if(ci&&end&&d>ci&&d<end) return "bg-rose-100 text-rose-800";
    return "text-gray-800 hover:bg-gray-100";
  }
  return (
    <div className="min-w-[17rem]">
      <p className="text-sm font-bold text-center text-gray-900 mb-3">{MONTHS[m]} {y}</p>
      <div className="grid grid-cols-7 text-xs text-center mb-1">
        {DAYS.map(d=><span key={d} className="py-1 font-semibold text-gray-500">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 text-sm text-center gap-y-0.5">
        {cells.map((day,i)=>{
          if(!day) return <span key={i}/>;
          const ds=isoD(y,m,day);
          return (
            <button key={i} type="button" disabled={blocked.has(ds)||ds<today}
              onClick={()=>onDay(ds)} onMouseEnter={()=>onEnt(ds)} onMouseLeave={onLv}
              title={blocked.has(ds)?"Non disponible":undefined}
              className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center transition-colors text-sm ${cls(ds)}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
interface Props { blockedDates:string[]; checkIn:string; checkOut:string; onCheckInChange:(d:string)=>void; onCheckOutChange:(d:string)=>void; minDate?:string; }
export default function BookingCalendar({ blockedDates,checkIn,checkOut,onCheckInChange,onCheckOutChange,minDate }:Props) {
  const now = new Date();
  const todayStr = minDate||`${now.getFullYear()}-${p2(now.getMonth()+1)}-${p2(now.getDate())}`;
  const iY = now.getFullYear(), iM = now.getMonth();
  const [open,setOpen] = useState(false);
  const [year,setYear] = useState(iY);
  const [month,setMonth] = useState(iM);
  const [phase,setPhase] = useState<"in"|"out">("in");
  const [hover,setHover] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const blocked = new Set(blockedDates);
  useEffect(()=>{
    function out(e:MouseEvent){ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); }
    if(open) document.addEventListener("mousedown",out);
    return ()=>document.removeEventListener("mousedown",out);
  },[open]);
  function hasBlocked(from:string,to:string){
    const c=new Date(from);
    while(c<new Date(to)){
      if(blocked.has(`${c.getFullYear()}-${p2(c.getMonth()+1)}-${p2(c.getDate())}`)) return true;
      c.setDate(c.getDate()+1);
    }
    return false;
  }
  function click(d:string){
    if(blocked.has(d)||d<todayStr) return;
    if(phase==="in"){ onCheckInChange(d); onCheckOutChange(""); setPhase("out"); }
    else {
      if(d<=checkIn){ onCheckInChange(d); onCheckOutChange(""); }
      else if(hasBlocked(checkIn,d)){ onCheckInChange(d); onCheckOutChange(""); }
      else { onCheckOutChange(d); setPhase("in"); setOpen(false); }
    }
  }
  const canPrev = !(year===iY&&month===iM);
  const m2 = month===11?0:month+1, y2 = month===11?year+1:year;
  const fmt = (d:string)=>new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
  const cgProps = { blocked, today:todayStr, ci:checkIn, co:checkOut, phase, hov:hover, onDay:click, onEnt:(d:string)=>{ if(phase==="out"&&checkIn&&!blocked.has(d)&&d>=todayStr) setHover(d); }, onLv:()=>setHover("") };
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={()=>{ setOpen(o=>!o); setPhase(checkIn?"out":"in"); }}
        className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-colors ${open?"border-rose-400 bg-rose-50":"border-gray-200 bg-gray-50 hover:border-gray-300"}`}>
        <CalendarDaysIcon className="w-5 h-5 text-rose-500 shrink-0"/>
        <div className="flex-1 min-w-0">
          {checkIn&&checkOut ? <p className="text-sm text-gray-900 font-medium">{fmt(checkIn)} <span className="text-gray-400 mx-1">to</span> {fmt(checkOut)}</p>
          : checkIn ? <p className="text-sm text-gray-700">{fmt(checkIn)} <span className="text-gray-400">to Choisir le depart</span></p>
          : <p className="text-sm text-gray-400">Choisir les dates</p>}
        </div>
        {(checkIn||checkOut)&&(
          <button type="button" onClick={e=>{ e.stopPropagation(); onCheckInChange(""); onCheckOutChange(""); setPhase("in"); }}
            className="p-1 hover:bg-gray-200 rounded-full">
            <XMarkIcon className="w-4 h-4 text-gray-400"/>
          </button>
        )}
      </button>
      {open&&(
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 w-max">
          <p className="text-xs text-center text-gray-500 mb-4">{phase==="in"?"Selectionnez la date d arrivee":"Selectionnez la date de depart"}</p>
          <div className="flex items-start gap-6">
            <button type="button" onClick={()=>{ if(!canPrev) return; if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
              disabled={!canPrev}
              className="mt-1 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-20 disabled:cursor-not-allowed shrink-0">
              <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-700"/>
            </button>
            <CG y={year} m={month} {...cgProps}/>
            <CG y={y2} m={m2} {...cgProps}/>
            <button type="button" onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
              className="mt-1 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
              <ChevronRightIcon className="w-3.5 h-3.5 text-gray-700"/>
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"/> Selection</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 inline-block"/> Periode</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block text-gray-300 text-[9px] line-through text-center">8</span> Indispo</span>
          </div>
        </div>
      )}
    </div>
  );
}