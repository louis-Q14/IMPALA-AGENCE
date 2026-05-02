"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  SparklesIcon,
  BuildingOfficeIcon,
  QrCodeIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const HOURLY_RATE = 40; // $ par heure
const TVA = 0.16;

const surfaceOptions = [
  { id: "small", label: "Petite surface", desc: "< 50 m²", multiplier: 1 },
  { id: "medium", label: "Surface moyenne", desc: "50 – 150 m²", multiplier: 1.3 },
  { id: "large", label: "Grande surface", desc: "> 150 m²", multiplier: 1.6 },
];

const durationOptions = [1, 2, 3, 4, 5, 6, 8];

const howItWorks = [
  {
    step: "01",
    icon: CalendarDaysIcon,
    title: "Réservez un créneau",
    desc: "Choisissez votre date, heure souhaitée, durée estimée et la surface de votre bureau.",
    color: "from-blue-400 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    step: "02",
    icon: QrCodeIcon,
    title: "Recevez votre QR code",
    desc: "Un QR code unique est généré pour votre réservation. Présentez-le à l'agent à son arrivée.",
    color: "from-violet-400 to-purple-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    step: "03",
    icon: ClockIcon,
    title: "Facturation au temps réel",
    desc: "L'agent scanne à l'arrivée et au départ. Vous ne payez que le temps effectivement travaillé.",
    color: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

const features = [
  { icon: ShieldCheckIcon, label: "Agent vérifié & assuré", color: "text-emerald-500" },
  { icon: DocumentTextIcon, label: "Facture PDF automatique", color: "text-blue-500" },
  { icon: QrCodeIcon, label: "QR code sécurisé", color: "text-violet-500" },
  { icon: UserGroupIcon, label: "Équipe professionnelle", color: "text-amber-500" },
  { icon: ClockIcon, label: "Ponctualité garantie", color: "text-cyan-500" },
  { icon: BuildingOfficeIcon, label: "Bureaux & open spaces", color: "text-rose-500" },
];


const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "En attente de confirmation", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  confirmed:  { label: "Confirme",                  color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  in_progress:{ label: "En cours",                  color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" },
  completed:  { label: "Termine",                    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  cancelled:  { label: "Annule",                     color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
};
export default function NettoyageBureauPage() {
  const router = useRouter();
  const [existingBooking, setExistingBooking] = useState<Record<string,string> | null>(null);

  const [address, setAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState(2);
  const [surface, setSurface] = useState<"small" | "medium" | "large">("small");
  const [notes, setNotes] = useState("");
  const [attempted, setAttempted] = useState(false);

  const [hourlyRate, setHourlyRate] = useState(HOURLY_RATE);
  const [hourlyRateUnit, setHourlyRateUnit] = useState<string>("$");
  const [fraisActifs, setFraisActifs] = useState<{id: number; nom: string; type: string; montant: number; unite: string}[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/tarifs-frais/public?service=nettoyage`)
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
    // Fetch user's existing booking
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/services/nettoyage/my-booking", {
        headers: { Authorization: "Bearer " + token },
      }).then(r => r.ok ? r.json() : null).then(d => { if (d?.booking) setExistingBooking(d.booking); }).catch(() => {});
    }
  }, []);

  const selectedSurface = surfaceOptions.find((s) => s.id === surface)!;
  const baseAmount = hourlyRate * duration * selectedSurface.multiplier;
  const tarifsUsdFees = fraisActifs.filter(t => t.type === "frais_fixe" && t.unite === "USD").reduce((sum, t) => sum + Number(t.montant), 0);
  const tarifsCommPct = fraisActifs.filter(t => t.type === "commission" && t.unite === "%").reduce((sum, t) => sum + Number(t.montant), 0);
  const commissionAmount = (baseAmount + tarifsUsdFees) * (tarifsCommPct / 100);
  const tvaAmount = (baseAmount + tarifsUsdFees + commissionAmount) * TVA;
  const totalAmount = baseAmount + tarifsUsdFees + commissionAmount + tvaAmount;
  const fmtAmount = (amount: number) =>
    hourlyRateUnit === "CDF"
      ? `${Math.round(amount).toLocaleString("fr-FR")} CDF`
      : `${amount.toFixed(2)} FC`;

  const isValid = companyName.trim().length >= 2 && address.trim().length >= 5 && dates.length > 0 && time !== "";

  const today = new Date().toISOString().split("T")[0];

  const addDate = () => {
    if (newDate && !dates.includes(newDate)) {
      setDates(prev => [...prev, newDate].sort());
      setNewDate("");
    }
  };
  const removeDate = (d: string) => setDates(prev => prev.filter(x => x !== d));

  const handleSubmit = () => {
    setAttempted(true);
    if (!isValid) return;

    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    if (!user) {
      router.push("/inscription?service=nettoyage");
      return;
    }

    // Store booking data for paiement page
    const bookingData = {
      companyName,
      address,
      date: dates.join(","),
      dates,
      time,
      duration,
      surface,
      surfaceLabel: selectedSurface.label,
      baseAmount: baseAmount.toFixed(2),
      tvaAmount: (tvaAmount * Math.max(1, dates.length)).toFixed(2),
      totalAmount: (totalAmount * Math.max(1, dates.length)).toFixed(2),
      notes,
      status: "pending",
      currency: hourlyRateUnit,
    };
    localStorage.setItem("nettoyage_booking", JSON.stringify(bookingData));
    router.push("/multi-impala/nettoyage/paiement");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
          <Link
            href="/multi-impala"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-6"
          >
            ← Multi-Impala
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">MULTI-IMPALA</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Nettoyage de bureau</h1>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mt-2">
            Service professionnel de nettoyage pour vos espaces de travail. Réservez un créneau, un agent intervient et vous payez uniquement le temps réel travaillé.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                <f.icon className={`w-4 h-4 ${f.color}`} />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Existing booking banner */}
      {existingBooking && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="rounded-2xl border-2 border-sky-500/30 bg-sky-500/5 p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-0.5">Ma reservation</p>
                  <h3 className="font-bold text-[var(--text-primary)]">Nettoyage de bureau</h3>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_LABELS[existingBooking.status]?.color || "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[existingBooking.status]?.label || existingBooking.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {existingBooking.company && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Entreprise</p><p className="font-semibold text-sm text-[var(--text-primary)] truncate">{existingBooking.company}</p></div>
              )}
              {existingBooking.surface && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Surface</p><p className="font-semibold text-sm text-[var(--text-primary)]">{{ small: "Petite", medium: "Moyenne", large: "Grande" }[existingBooking.surface] || existingBooking.surface}</p></div>
              )}
              {existingBooking.date && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Date</p><p className="font-semibold text-sm text-[var(--text-primary)]">{existingBooking.date} {existingBooking.time}</p></div>
              )}
              {existingBooking.amount && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Montant</p><p className="font-semibold text-sm text-sky-500">{existingBooking.amount}</p></div>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">Vous pouvez modifier votre reservation en remplissant le formulaire ci-dessous.</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: How it works + form */}
          <div className="lg:col-span-2 space-y-8">

            {/* Comment ça marche */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Comment ça marche ?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {howItWorks.map((s) => (
                  <div key={s.step} className={`p-5 rounded-2xl border ${s.border} ${s.bg}`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                      <s.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-xs font-bold text-[var(--text-muted)] mb-1">ÉTAPE {s.step}</p>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{s.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking form */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Réserver une intervention</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Remplissez les informations ci-dessous</p>

              <div className="space-y-5">
                {/* Entreprise + Adresse */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Nom de l&apos;entreprise <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ACME Corp."
                        className={`w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${
                          attempted && companyName.trim().length < 2 ? "border-red-500" : "border-[var(--border-color)]"
                        }`}
                      />
                    </div>
                    {attempted && companyName.trim().length < 2 && (
                      <p className="text-xs text-red-500 mt-1">Champ requis</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Adresse du bureau <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Avenue Kasa-Vubu, Kinshasa"
                      className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${
                        attempted && address.trim().length < 5 ? "border-red-500" : "border-[var(--border-color)]"
                      }`}
                    />
                    {attempted && address.trim().length < 5 && (
                      <p className="text-xs text-red-500 mt-1">Adresse trop courte</p>
                    )}
                  </div>
                </div>

                {/* Surface */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Surface du bureau</label>
                  <div className="grid grid-cols-3 gap-3">
                    {surfaceOptions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSurface(s.id as "small" | "medium" | "large")}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          surface === s.id
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        <p className="font-medium text-sm text-[var(--text-primary)]">{s.label}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.desc}</p>
                        {s.multiplier > 1 && (
                          <p className="text-xs text-blue-500 font-semibold mt-1">×{s.multiplier}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates + Heure */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Dates d&apos;intervention <span className="text-red-500">*</span>
                  </label>
                  {dates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dates.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                          {d}
                          <button type="button" onClick={() => removeDate(d)} className="ml-1 text-blue-400 hover:text-red-500 transition-colors">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarDaysIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="date"
                        value={newDate}
                        min={today}
                        onChange={(e) => setNewDate(e.target.value)}
                        className={`w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm ${
                          attempted && dates.length === 0 ? "border-red-500" : "border-[var(--border-color)]"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addDate}
                      className="px-4 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      + Ajouter
                    </button>
                  </div>
                  {attempted && dates.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Au moins une date requise</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Heure souhaitée <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <ClockIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                  </div>
                </div>

                {/* Durée estimée */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Durée estimée
                    <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">(la facturation se fait sur le temps réel)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((h) => (
                      <button
                        key={h}
                        onClick={() => setDuration(h)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          duration === h
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-400"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Instructions particulières
                    <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">(optionnel)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex: 3ème étage, code d'entrée 1234, éviter la salle de réunion avant 10h..."
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Facturation au temps réel</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  La durée estimée sert uniquement de base de calcul indicatif. Le montant final sera calculé automatiquement à partir du scan QR de début et de fin de prestation. Vous ne payez que le temps effectivement travaillé.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Pricing recap + CTA */}
          <div className="space-y-6">
            <div className="sticky top-6">
              {/* Price card */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Récapitulatif estimatif</h3>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-400/10 to-cyan-400/10 border border-blue-500/20 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Nettoyage de bureau</p>
                      <p className="text-xs text-[var(--text-muted)]">{selectedSurface.label}</p>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] space-y-1">
                    <div className="flex justify-between">
                      <span>Durée estimée</span>
                      <span className="font-medium text-[var(--text-primary)]">{duration}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux horaire</span>
                      <span className="font-medium text-[var(--text-primary)]">{hourlyRateUnit === "CDF" ? hourlyRate.toLocaleString("fr-FR") : hourlyRate} {hourlyRateUnit}/h</span>
                    </div>
                    {selectedSurface.multiplier > 1 && (
                      <div className="flex justify-between">
                        <span>Coefficient surface</span>
                        <span className="font-medium text-[var(--text-primary)]">×{selectedSurface.multiplier}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-[var(--border-color)] pt-4">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Sous-total HT</span>
                    <span>{fmtAmount(baseAmount)}</span>
                  </div>
                  {fraisActifs.filter(t => t.type === "frais_fixe" && t.unite === "USD").map(t => (
                    <div key={t.id} className="flex justify-between text-blue-600 dark:text-blue-400">
                      <span>{t.nom}</span>
                      <span>+{Number(t.montant).toFixed(2)} FC</span>
                    </div>
                  ))}
                  {fraisActifs.filter(t => t.type === "commission" && t.unite === "%").map(t => (
                    <div key={t.id} className="flex justify-between text-blue-600 dark:text-blue-400">
                      <span>{t.nom} ({t.montant}%)</span>
                      <span>+{commissionAmount.toFixed(2)} FC</span>
                    </div>
                  ))}
                  {fraisActifs.filter(t => t.unite === "CDF").map(t => (
                    <div key={t.id} className="flex justify-between text-blue-600 dark:text-blue-400">
                      <span>{t.nom}</span>
                      <span>+{Number(t.montant).toLocaleString("fr-FR")} CDF</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>TVA (16%)</span>
                    <span>{fmtAmount(tvaAmount)}</span>
                  </div>
                  {dates.length > 1 && (
                    <div className="flex justify-between text-blue-600 dark:text-blue-400">
                      <span>Nombre de séances</span>
                      <span>×{dates.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-[var(--text-primary)] pt-2 border-t border-[var(--border-color)]">
                    <span>Total estimé TTC</span>
                    <span className="text-blue-500">{fmtAmount(totalAmount * Math.max(1, dates.length))}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
                  * Ce montant est une estimation. Le total final sera calculé sur la durée réelle enregistrée par QR code.
                </p>

                <button
                  onClick={handleSubmit}
                  className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Réserver maintenant
                  <ArrowRightIcon className="w-4 h-4" />
                </button>

                {attempted && !isValid && (
                  <p className="text-xs text-red-500 text-center mt-2">Veuillez compléter tous les champs requis</p>
                )}
              </div>

              {/* Guarantees */}
              <div className="mt-4 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-3">Nos garanties</p>
                <div className="space-y-2">
                  {[
                    "Agents certifiés et formés",
                    "Matériel professionnel fourni",
                    "Annulation gratuite 24h avant",
                    "Satisfaction garantie ou reprise",
                  ].map((g) => (
                    <div key={g} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-[var(--text-secondary)]">{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



