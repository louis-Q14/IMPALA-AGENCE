"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  QrCodeIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  MapPinIcon,
  TruckIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const HOURLY_RATE = 35; // $ par heure
const TVA = 0.16;

const volumeOptions = [
  { id: "studio", label: "Studio / F1", desc: "Peu de meubles, 1–2 pièces", multiplier: 1 },
  { id: "appartement", label: "Appartement F2–F3", desc: "Mobilier standard, 2–4 pièces", multiplier: 1.5 },
  { id: "bureau", label: "Bureau / Open space", desc: "Mobilier professionnel, équipements", multiplier: 1.8 },
  { id: "maison", label: "Grande maison / villa", desc: "Mobilier complet, 5+ pièces", multiplier: 2.2 },
];

const extraServices = [
  { id: "demontage", label: "Démontage / remontage meubles", icon: "🔧" },
  { id: "emballage", label: "Emballage des objets fragiles", icon: "📦" },
  { id: "stockage", label: "Stockage temporaire (1 semaine)", icon: "🏪" },
  { id: "nettoyage", label: "Nettoyage après déménagement", icon: "🧹" },
];

const durationOptions = [2, 3, 4, 5, 6, 8, 10, 12];

const howItWorks = [
  {
    step: "01",
    icon: CalendarDaysIcon,
    title: "Réservez un créneau",
    desc: "Indiquez vos adresses de départ et d'arrivée, le volume estimé et la date souhaitée.",
    color: "from-orange-400 to-amber-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    step: "02",
    icon: QrCodeIcon,
    title: "Recevez votre QR code",
    desc: "Un QR code unique est généré. L'équipe le scanne au départ et à l'arrivée pour valider l'intervention.",
    color: "from-violet-400 to-purple-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    step: "03",
    icon: TruckIcon,
    title: "Intervention & facture",
    desc: "La facture finale est calculée sur la durée réelle de l'intervention. Elle vous est envoyée automatiquement.",
    color: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];


const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "En attente de confirmation", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  confirmed:  { label: "Confirme",                  color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  in_progress:{ label: "En cours",                  color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" },
  completed:  { label: "Termine",                   color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  cancelled:  { label: "Annule",                    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
};
export default function DemenagementPage() {
  const router = useRouter();
  const [existingBooking, setExistingBooking] = useState<Record<string,string> | null>(null);

  const [volume, setVolume] = useState("appartement");
  const [extras, setExtras] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState(4);
  const [addressFrom, setAddressFrom] = useState("");
  const [addressTo, setAddressTo] = useState("");
  const [notes, setNotes] = useState("");

  const [hourlyRate, setHourlyRate] = useState(HOURLY_RATE);
  const [hourlyRateUnit, setHourlyRateUnit] = useState<string>("$");
  const [fraisActifs, setFraisActifs] = useState<{id: number; nom: string; type: string; montant: number; unite: string}[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/tarifs-frais/public?service=demenagement`)
      .then(r => r.ok ? r.json() : [])
      .then((data: {id: number; nom: string; type: string; montant: number; unite: string}[]) => {
        if (!Array.isArray(data)) return;
        const usdRate = data.find(t => t.type === "frais_fixe" && t.unite === "USD");
        const cdfRate = data.find(t => t.type === "frais_fixe" && t.unite === "CDF");
        if (usdRate) {
          setHourlyRate(Number(usdRate.montant));
          setHourlyRateUnit("$");
          setFraisActifs(data.filter(t => t !== usdRate));
        } else if (cdfRate) {
          setHourlyRate(Number(cdfRate.montant));
          setHourlyRateUnit("CDF");
          setFraisActifs(data.filter(t => t !== cdfRate));
        } else {
          setFraisActifs(data);
        }
      })
      .catch(() => {});
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/services/demenagement/my-booking", {
        headers: { Authorization: "Bearer " + token },
      }).then(r => r.ok ? r.json() : null).then(d => { if (d?.booking) setExistingBooking(d.booking); }).catch(() => {});
    }
  }, []);

  const selectedVolume = volumeOptions.find((v) => v.id === volume)!
  const baseAmount = hourlyRate * duration * selectedVolume.multiplier;
  const extrasCost = extras.length * 15;
  const subtotal = baseAmount + extrasCost;
  const tarifsUsdFees = fraisActifs.filter(t => t.type === "frais_fixe" && t.unite === "USD").reduce((sum, t) => sum + Number(t.montant), 0);
  const tarifsCommPct = fraisActifs.filter(t => t.type === "commission" && t.unite === "%").reduce((sum, t) => sum + Number(t.montant), 0);
  const commissionAmount = (subtotal + tarifsUsdFees) * (tarifsCommPct / 100);
  const tvaAmount = (subtotal + tarifsUsdFees + commissionAmount) * TVA;
  const totalAmount = subtotal + tarifsUsdFees + commissionAmount + tvaAmount;
  const fmtAmount = (amount: number) =>
    hourlyRateUnit === "CDF"
      ? `${Math.round(amount).toLocaleString("fr-FR")} CDF`
      : `${amount.toFixed(2)} FC`;

  const toggleExtra = (id: string) => {
    setExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  };

  const addDate = () => {
    if (newDate && !dates.includes(newDate)) {
      setDates(prev => [...prev, newDate].sort());
      setNewDate("");
    }
  };
  const removeDate = (d: string) => setDates(prev => prev.filter(x => x !== d));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressFrom || !addressTo || dates.length === 0) return;

    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    if (!user) {
      router.push("/inscription?service=demenagement");
      return;
    }

    const volumeOption = volumeOptions.find((v) => v.id === volume)!;
    const selectedExtras = extraServices.filter((e) => extras.includes(e.id)).map((e) => e.label);

    localStorage.setItem(
      "demenagement_booking",
      JSON.stringify({
        addressFrom,
        addressTo,
        date: dates.join(","),
        dates,
        time,
        duration,
        volume,
        volumeLabel: volumeOption.label,
        extras: selectedExtras,
        baseAmount: baseAmount.toFixed(2),
        extrasCost: extrasCost.toFixed(2),
        tvaAmount: (tvaAmount * Math.max(1, dates.length)).toFixed(2),
        totalAmount: (totalAmount * Math.max(1, dates.length)).toFixed(2),
        notes,
        status: "pending",
        currency: hourlyRateUnit,
      })
    );

    router.push("/multi-impala/demenagement/paiement");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/multi-impala"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Tous les services
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-3xl shadow-lg">
              🚛
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Déménagement</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Transport et installation de vos biens par nos équipes qualifiées
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm">
            <div className="text-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-lg font-bold text-orange-500">{hourlyRateUnit === "CDF" ? hourlyRate.toLocaleString("fr-FR") : hourlyRate} {hourlyRateUnit}</p>
              <p className="text-xs text-[var(--text-muted)]">/ heure</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-lg font-bold text-blue-500">2–12h</p>
              <p className="text-xs text-[var(--text-muted)]">Durée</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-lg font-bold text-emerald-500">QR</p>
              <p className="text-xs text-[var(--text-muted)]">Suivi temps réel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

            {/* Adresses */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-orange-500" />
                Adresses
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Adresse de départ <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-sm">A</span>
                    <input
                      type="text"
                      value={addressFrom}
                      onChange={(e) => setAddressFrom(e.target.value)}
                      placeholder="Rue, numéro, ville"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <div className="w-0.5 h-6 bg-orange-500/30 mx-3" />
                  <span className="text-xs text-[var(--text-muted)]">Transport jusqu&apos;à</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Adresse d&apos;arrivée <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">B</span>
                    <input
                      type="text"
                      value={addressTo}
                      onChange={(e) => setAddressTo(e.target.value)}
                      placeholder="Rue, numéro, ville"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Volume */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-orange-500" />
                Volume du déménagement
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {volumeOptions.map((opt) => {
                  const isActive = volume === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVolume(opt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10"
                          : "border-[var(--border-color)] hover:border-orange-500/50"
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        {opt.id === "studio" ? "🏠" : opt.id === "appartement" ? "🏢" : opt.id === "bureau" ? "🏗️" : "🏡"}
                      </div>
                      <p className={`font-semibold text-sm ${isActive ? "text-orange-500" : "text-[var(--text-primary)]"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{opt.desc}</p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mt-2">
                        ×{opt.multiplier} tarif de base
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services supplémentaires */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Services supplémentaires</h2>
              <p className="text-xs text-[var(--text-muted)] mb-4">+15$ par service sélectionné</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extraServices.map((svc) => {
                  const isActive = extras.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => toggleExtra(svc.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-amber-500 bg-amber-500/5"
                          : "border-[var(--border-color)] hover:border-amber-500/50"
                      }`}
                    >
                      <span className="text-xl">{svc.icon}</span>
                      <span className={`text-sm font-medium ${isActive ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-primary)]"}`}>
                        {svc.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto text-xs font-bold text-amber-500">+15$</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date / heure / durée */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-orange-500" />
                Planification
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Dates <span className="text-red-400">*</span>
                  </label>
                  {dates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dates.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">
                          {d}
                          <button type="button" onClick={() => removeDate(d)} className="ml-1 text-orange-400 hover:text-red-500 transition-colors">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDate}
                      min={today}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={addDate}
                      className="px-4 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap"
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">Heure de début</label>
                  <div className="relative">
                    <ClockIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">
                  Durée estimée : <span className="text-orange-500 font-bold">{duration}h</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDuration(h)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        duration === h
                          ? "bg-orange-500 text-white border-orange-500 shadow-md"
                          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-orange-500/50 hover:text-orange-500"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Instructions particulières</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : objets fragiles, accès au bâtiment, étage sans ascenseur, animaux..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none"
              />
            </div>

            {/* QR info box */}
            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-start gap-3">
              <QrCodeIcon className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Facturation au temps réel par QR code</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  L&apos;équipe scanne le QR code à l&apos;arrivée (début) et au départ (fin). La facture finale est basée sur la durée réelle – vous ne payez que le temps effectivement travaillé.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold text-lg shadow-lg hover:opacity-90 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Continuer vers le paiement
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </form>

          {/* Right panel */}
          <div className="space-y-6">
            {/* Calculateur */}
            <div className="sticky top-6 space-y-4">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Estimation du coût</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Tarif de base</span>
                    <span>{hourlyRateUnit === "CDF" ? hourlyRate.toLocaleString("fr-FR") : hourlyRate} {hourlyRateUnit}/h</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Volume ({selectedVolume.label})</span>
                    <span>×{selectedVolume.multiplier}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Durée estimée</span>
                    <span>{duration}h</span>
                  </div>
                  <div className="flex justify-between font-medium text-[var(--text-primary)] border-t border-[var(--border-color)] pt-3">
                    <span>Sous-total transport</span>
                    <span>{fmtAmount(baseAmount)}</span>
                  </div>
                  {extras.length > 0 && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Services supplémentaires ({extras.length})</span>
                      <span>+{fmtAmount(extrasCost)}</span>
                    </div>
                  )}
                  {fraisActifs.filter(t => t.type === "frais_fixe" && t.unite === "USD").map(t => (
                    <div key={t.id} className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>{t.nom}</span>
                      <span>+{Number(t.montant).toFixed(2)} FC</span>
                    </div>
                  ))}
                  {fraisActifs.filter(t => t.type === "commission" && t.unite === "%").map(t => (
                    <div key={t.id} className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>{t.nom} ({t.montant}%)</span>
                      <span>+{commissionAmount.toFixed(2)} FC</span>
                    </div>
                  ))}
                  {fraisActifs.filter(t => t.unite === "CDF").map(t => (
                    <div key={t.id} className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>{t.nom}</span>
                      <span>+{Number(t.montant).toLocaleString("fr-FR")} CDF</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>TVA (16%)</span>
                    <span>{fmtAmount(tvaAmount)}</span>
                  </div>
                  {dates.length > 1 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Nombre de jours</span>
                      <span>×{dates.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-[var(--text-primary)] pt-3 border-t border-[var(--border-color)]">
                    <span>Total estimé TTC</span>
                    <span className="text-orange-500">{fmtAmount(totalAmount * Math.max(1, dates.length))}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
                  * Montant estimé. La facture finale est calculée sur la durée réelle (scan QR de début – fin).
                </p>
              </div>

              {/* Comment ça marche */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-orange-500" />
                  Comment ça marche
                </h3>
                <div className="space-y-4">
                  {howItWorks.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.step} className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${step.bg} border ${step.border} shrink-0`}>
                          <Icon className={`w-4 h-4 bg-gradient-to-br ${step.color} bg-clip-text`} style={{ color: "inherit" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{step.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Garanties */}
              <div className={`p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center gap-3`}>
                <ShieldCheckIcon className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Équipes vérifiées · Assurance transport incluse · Annulation gratuite 48h avant
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


