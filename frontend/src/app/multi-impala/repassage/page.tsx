"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const HOURLY_RATE = 25; // $ par heure
const TVA = 0.16;

const quantityOptions = [
  { id: "small", label: "Petit lot", desc: "< 10 pièces", multiplier: 1 },
  { id: "medium", label: "Lot moyen", desc: "10 – 25 pièces", multiplier: 1.4 },
  { id: "large", label: "Grand lot", desc: "> 25 pièces", multiplier: 1.8 },
];

const durationOptions = [1, 2, 3, 4, 5, 6];

const clothingTypes = [
  "Chemises / chemisiers",
  "Pantalons / jupes",
  "Robes / costumes",
  "Draps / linge de maison",
  "Vêtements enfants",
  "Uniformes / tenues pro",
];

const howItWorks = [
  {
    step: "01",
    icon: CalendarDaysIcon,
    title: "Réservez un créneau",
    desc: "Choisissez votre date, heure et la quantité de linge à repasser.",
    color: "from-purple-400 to-violet-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    step: "02",
    icon: QrCodeIcon,
    title: "QR code unique",
    desc: "Recevez votre QR code par e-mail. L'agent le scanne à l'arrivée et au départ.",
    color: "from-rose-400 to-pink-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    step: "03",
    icon: ClockIcon,
    title: "Payez le temps réel",
    desc: "La facturation est automatique, calculée à la minute sur la durée effective de l'agent.",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

const features = [
  { label: "Agent formé & vérifié" },
  { label: "Matériel fourni (fer, planche)" },
  { label: "Linge traité avec soin" },
  { label: "Facture PDF automatique" },
  { label: "Annulation gratuite 24h avant" },
  { label: "À domicile ou au bureau" },
];


const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "En attente de confirmation", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  confirmed:  { label: "Confirme",                  color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  in_progress:{ label: "En cours",                  color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" },
  completed:  { label: "Termine",                   color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  cancelled:  { label: "Annule",                    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
};
export default function RepassagePage() {
  const router = useRouter();
  const [existingBooking, setExistingBooking] = useState<Record<string,string> | null>(null);

  const [address, setAddress] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState(2);
  const [quantity, setQuantity] = useState<"small" | "medium" | "large">("small");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [attempted, setAttempted] = useState(false);

  const [hourlyRate, setHourlyRate] = useState(HOURLY_RATE);
  const [hourlyRateUnit, setHourlyRateUnit] = useState<string>("$");
  const [fraisActifs, setFraisActifs] = useState<{id: number; nom: string; type: string; montant: number; unite: string}[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/tarifs-frais/public?service=repassage`)
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
      fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/services/repassage/my-booking", {
        headers: { Authorization: "Bearer " + token },
      }).then(r => r.ok ? r.json() : null).then(d => { if (d?.booking) setExistingBooking(d.booking); }).catch(() => {});
    }
  }, []);

  const selectedQuantity = quantityOptions.find((q) => q.id === quantity)!;
  const baseAmount = hourlyRate * duration * selectedQuantity.multiplier;
  const tarifsUsdFees = fraisActifs.filter(t => t.type === "frais_fixe" && t.unite === "USD").reduce((sum, t) => sum + Number(t.montant), 0);
  const tarifsCommPct = fraisActifs.filter(t => t.type === "commission" && t.unite === "%").reduce((sum, t) => sum + Number(t.montant), 0);
  const commissionAmount = (baseAmount + tarifsUsdFees) * (tarifsCommPct / 100);
  const tvaAmount = (baseAmount + tarifsUsdFees + commissionAmount) * TVA;
  const totalAmount = baseAmount + tarifsUsdFees + commissionAmount + tvaAmount;
  const fmtAmount = (amount: number) =>
    hourlyRateUnit === "CDF"
      ? `${Math.round(amount).toLocaleString("fr-FR")} CDF`
      : `${amount.toFixed(2)} FC`;

  const isValid = address.trim().length >= 5 && dates.length > 0;
  const today = new Date().toISOString().split("T")[0];

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

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
      router.push("/inscription?service=repassage");
      return;
    }

    const bookingData = {
      address,
      date: dates.join(","),
      dates,
      time,
      duration,
      quantity,
      quantityLabel: selectedQuantity.label,
      clothingTypes: selectedTypes,
      baseAmount: baseAmount.toFixed(2),
      tvaAmount: (tvaAmount * Math.max(1, dates.length)).toFixed(2),
      totalAmount: (totalAmount * Math.max(1, dates.length)).toFixed(2),
      notes,
      status: "pending",
      currency: hourlyRateUnit,
    };
    localStorage.setItem("repassage_booking", JSON.stringify(bookingData));
    router.push("/multi-impala/repassage/paiement");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
          <Link
            href="/multi-impala"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-6"
          >
            ← Multi-Impala
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">👕</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-500">MULTI-IMPALA</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Repassage à domicile</h1>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mt-2">
            Confiez votre linge à nos agents qualifiés. Intervention à domicile selon vos disponibilités – vous payez uniquement le temps effectivement travaillé.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                <CheckCircleIcon className="w-4 h-4 text-purple-500" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Existing booking banner */}
      {existingBooking && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="rounded-2xl border-2 border-violet-500/30 bg-violet-500/5 p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-0.5">Ma reservation</p>
                  <h3 className="font-bold text-[var(--text-primary)]">Repassage</h3>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_LABELS[existingBooking.status]?.color || "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[existingBooking.status]?.label || existingBooking.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {existingBooking.quantity && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Quantite</p><p className="font-semibold text-sm text-[var(--text-primary)]">{{ small: "Petit lot", medium: "Lot moyen", large: "Grand lot" }[existingBooking.quantity] || existingBooking.quantity}</p></div>
              )}
              {existingBooking.address && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Adresse</p><p className="font-semibold text-sm text-[var(--text-primary)] truncate">{existingBooking.address}</p></div>
              )}
              {existingBooking.date && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Date</p><p className="font-semibold text-sm text-[var(--text-primary)]">{existingBooking.date} {existingBooking.time}</p></div>
              )}
              {existingBooking.amount && (
                <div className="bg-[var(--bg-card)] rounded-xl p-3"><p className="text-xs text-[var(--text-muted)]">Montant</p><p className="font-semibold text-sm text-violet-500">{existingBooking.amount}</p></div>
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

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Adresse d&apos;intervention <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPinIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Avenue Kasa-Vubu, Kinshasa"
                      className={`w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${
                        attempted && address.trim().length < 5 ? "border-red-500" : "border-[var(--border-color)]"
                      }`}
                    />
                  </div>
                  {attempted && address.trim().length < 5 && (
                    <p className="text-xs text-red-500 mt-1">Adresse trop courte</p>
                  )}
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Quantité de linge</label>
                  <div className="grid grid-cols-3 gap-3">
                    {quantityOptions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setQuantity(q.id as "small" | "medium" | "large")}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          quantity === q.id
                            ? "border-purple-500 bg-purple-500/5"
                            : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        <p className="font-medium text-sm text-[var(--text-primary)]">{q.label}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{q.desc}</p>
                        {q.multiplier > 1 && (
                          <p className="text-xs text-purple-500 font-semibold mt-1">×{q.multiplier}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Types de vêtements */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Types de vêtements
                    <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">(optionnel)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {clothingTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedTypes.includes(type)
                            ? "border-purple-500 bg-purple-500 text-white"
                            : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-purple-400"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates + Heure */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Dates d&apos;intervention <span className="text-red-500">*</span>
                    </label>
                    {dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {dates.map(d => (
                          <span key={d} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-[var(--text-primary)]">
                            <CalendarDaysIcon className="w-3.5 h-3.5 text-purple-500" />
                            {new Date(d + "T12:00:00").toLocaleDateString("fr-FR")}
                            <button type="button" onClick={() => removeDate(d)} className="ml-1 text-[var(--text-muted)] hover:text-red-500 transition-colors font-bold">×</button>
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
                          onChange={e => setNewDate(e.target.value)}
                          className={`w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${attempted && dates.length === 0 ? "border-red-500" : "border-[var(--border-color)]"}`}
                        />
                      </div>
                      <button type="button" onClick={addDate} disabled={!newDate || dates.includes(newDate)} className="px-4 py-3 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap">+ Ajouter</button>
                    </div>
                    {attempted && dates.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Sélectionnez au moins une date</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Heure souhaitée</label>
                    <div className="relative">
                      <ClockIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
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
                            ? "border-purple-500 bg-purple-500 text-white"
                            : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-purple-400"
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
                    placeholder="Ex: ne pas repasser les cols à chaud, utiliser de la vapeur sur les costumes..."
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
              <InformationCircleIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Facturation au temps réel</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  La durée estimée sert uniquement d&apos;indicateur. Le montant final est calculé automatiquement à partir du scan QR de début et de fin de prestation. Vous ne payez que le temps effectivement travaillé, à la minute près.
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

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-400/10 to-violet-400/10 border border-purple-500/20 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-xl">
                      👕
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Repassage à domicile</p>
                      <p className="text-xs text-[var(--text-muted)]">{selectedQuantity.label}</p>
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
                    {selectedQuantity.multiplier > 1 && (
                      <div className="flex justify-between">
                        <span>Coefficient quantité</span>
                        <span className="font-medium text-[var(--text-primary)]">×{selectedQuantity.multiplier}</span>
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
                    <div key={t.id} className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span>{t.nom}</span>
                      <span>+{Number(t.montant).toFixed(2)} FC</span>
                    </div>
                  ))}
                  {fraisActifs.filter(t => t.type === "commission" && t.unite === "%").map(t => (
                    <div key={t.id} className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span>{t.nom} ({t.montant}%)</span>
                      <span>+{commissionAmount.toFixed(2)} FC</span>
                    </div>
                  ))}
                  {fraisActifs.filter(t => t.unite === "CDF").map(t => (
                    <div key={t.id} className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span>{t.nom}</span>
                      <span>+{Number(t.montant).toLocaleString("fr-FR")} CDF</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>TVA (16%)</span>
                    <span>{fmtAmount(tvaAmount)}</span>
                  </div>
                  {dates.length > 1 && (
                    <div className="flex justify-between text-purple-600 dark:text-purple-400 font-medium">
                      <span>Nombre de séances</span>
                      <span>× {dates.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-[var(--text-primary)] pt-2 border-t border-[var(--border-color)]">
                    <span>Total estimé TTC{dates.length > 1 ? ` (${dates.length} séances)` : ""}</span>
                    <span className="text-purple-500">{fmtAmount(totalAmount * Math.max(1, dates.length))}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
                  * Ce montant est une estimation. Le total final est calculé sur la durée réelle enregistrée par QR code.
                </p>

                <button
                  onClick={handleSubmit}
                  className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
                    "Agent formé & certifié",
                    "Fer vapeur professionnel fourni",
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


