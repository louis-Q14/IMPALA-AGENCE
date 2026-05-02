"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  SparklesIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  CalendarDaysIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface BookingData {
  companyName: string;
  address: string;
  date: string;
  time: string;
  duration: number;
  surface: string;
  surfaceLabel: string;
  baseAmount: string;
  tvaAmount: string;
  totalAmount: string;
  notes: string;
  status: string;
  currency?: string;
}

export default function PaiementNettoyage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card" | "cash">("mobile");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const data = localStorage.getItem("nettoyage_booking");
      if (!data) { router.push("/multi-impala/nettoyage"); return; }
      setBooking(JSON.parse(data));
    } catch {
      router.push("/multi-impala/nettoyage");
    }
  }, [router]);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const token = localStorage.getItem("token");
      if (token && booking) {
        await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/services/nettoyage/booking", {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ company: booking.companyName, address: booking.address, date: booking.date, time: booking.time, duration: booking.duration, surface: booking.surface, amount: booking.currency === "CDF" ? Math.round(Number(booking.totalAmount)).toLocaleString("fr-FR") + " CDF" : Number(booking.totalAmount).toFixed(2) + " FC", notes: booking.notes, status: "active" }),
        });
      }
    } catch {}
    setProcessing(false);
    setPaid(true);
    localStorage.removeItem("nettoyage_booking");
  };

  if (!mounted || !booking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Réservation confirmée !</h2>
          <p className="text-[var(--text-secondary)] mb-2">
            Votre intervention de nettoyage est planifiée pour le{" "}
            <strong className="text-[var(--text-primary)]">
              {new Date(booking.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </strong>{" "}
            à <strong className="text-[var(--text-primary)]">{booking.time}</strong>.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Un agent vous sera assigné. Votre QR code d&apos;intervention vous sera envoyé par e-mail.
          </p>

          {/* QR code placeholder */}
          <div className="my-6 p-6 rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 inline-block mx-auto">
            <QrCodeIcon className="w-20 h-20 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)]">Votre QR code d&apos;intervention</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Envoyé par e-mail · Valable le jour J uniquement</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left mb-6 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Entreprise</span>
              <span className="font-medium text-[var(--text-primary)]">{booking.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Date</span>
              <span className="font-medium text-[var(--text-primary)]">{new Date(booking.date).toLocaleDateString("fr-FR")} à {booking.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Durée estimée</span>
              <span className="font-medium text-[var(--text-primary)]">{booking.duration}h</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border-color)] pt-2">
              <span className="text-[var(--text-muted)]">Montant estimé TTC</span>
              <span className="font-bold text-blue-500">{booking.totalAmount} FC</span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] mb-6">
            * Le montant final sera calculé sur la durée réelle enregistrée par QR code. Une facture PDF vous sera envoyée automatiquement à la fin de l&apos;intervention.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              href="/tableau-de-bord"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              Tableau de bord
            </Link>
            <Link
              href="/multi-impala"
              className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-all"
            >
              Nos services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const methods = [
    {
      id: "mobile" as const,
      label: "Mobile Money",
      desc: "M-Pesa, Airtel Money, Orange Money",
      icon: DevicePhoneMobileIcon,
      gradient: "from-orange-400 to-orange-600",
    },
    {
      id: "card" as const,
      label: "Carte bancaire",
      desc: "Visa, Mastercard",
      icon: CreditCardIcon,
      gradient: "from-blue-400 to-indigo-600",
    },
    {
      id: "cash" as const,
      label: "Paiement en espèces",
      desc: "À la fin de l'intervention",
      icon: BanknotesIcon,
      gradient: "from-emerald-400 to-green-600",
    },
  ];

  const formattedDate = new Date(booking.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/multi-impala/nettoyage"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour à la réservation
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Confirmer la réservation</h1>
              <p className="text-sm text-[var(--text-secondary)]">Service de nettoyage de bureau</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Payment form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Récapitulatif intervention */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Détails de l&apos;intervention</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <BuildingOfficeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Entreprise</p>
                    <p className="font-medium text-[var(--text-primary)] text-sm">{booking.companyName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{booking.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <CalendarDaysIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Date</p>
                      <p className="font-medium text-[var(--text-primary)] text-sm capitalize">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <ClockIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Heure · Durée estimée</p>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{booking.time} · ~{booking.duration}h</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <SparklesIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Surface</p>
                    <p className="font-medium text-[var(--text-primary)] text-sm">{booking.surfaceLabel}</p>
                  </div>
                </div>
                {booking.notes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-[var(--text-muted)]">Instructions</p>
                    <p className="text-sm text-[var(--text-primary)] mt-0.5">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR code info */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
              <QrCodeIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">QR code d&apos;intervention</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Après confirmation, un QR code unique sera généré et envoyé à votre adresse e-mail. L&apos;agent le scannera à l&apos;arrivée et au départ. La facture finale sera calculée automatiquement sur la durée réelle.
                </p>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Mode de paiement de l&apos;acompte</h2>
              <div className="space-y-3">
                {methods.map((m) => {
                  const Icon = m.icon;
                  const isActive = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                          : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--text-primary)]">{m.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isActive ? "border-blue-500" : "border-[var(--border-color)]"
                      }`}>
                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Money input */}
            {paymentMethod === "mobile" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Numéro Mobile Money</h2>
                <div className="relative">
                  <DevicePhoneMobileIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+243 XXX XXX XXX"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">Un SMS de confirmation sera envoyé à ce numéro</p>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informations de carte</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1 block">Numéro de carte</label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">Date d&apos;expiration</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">CVV</label>
                      <input
                        type="text"
                        placeholder="XXX"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order recap + confirm */}
          <div className="space-y-6">
            <div className="sticky top-6">
              {/* Amount recap */}
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Montant estimé</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Sous-total HT</span>
                    <span>{booking.baseAmount} FC</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>TVA (16%)</span>
                    <span>{booking.tvaAmount} FC</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-[var(--text-primary)] pt-3 border-t border-[var(--border-color)]">
                    <span>Total estimé TTC</span>
                    <span className="text-blue-500">{booking.totalAmount} FC</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
                  * La facture finale est calculée sur la durée réelle (scan QR de début – fin).
                </p>

                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-4 h-4" />
                      Confirmer la réservation
                    </>
                  )}
                </button>
              </div>

              {/* Security note */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                Paiement sécurisé · Données chiffrées
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



