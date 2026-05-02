"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface BookingData {
  address: string;
  date: string;
  time: string;
  duration: number;
  quantity: string;
  quantityLabel: string;
  clothingTypes: string[];
  baseAmount: string;
  tvaAmount: string;
  totalAmount: string;
  notes: string;
  status: string;
  currency?: string;
}

export default function PaiementRepassage() {
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
      const data = localStorage.getItem("repassage_booking");
      if (!data) { router.push("/multi-impala/repassage"); return; }
      setBooking(JSON.parse(data));
    } catch {
      router.push("/multi-impala/repassage");
    }
  }, [router]);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const token = localStorage.getItem("token");
      if (token && booking) {
        await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/services/repassage/booking", {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ address: booking.address, date: booking.date, time: booking.time, duration: booking.duration, quantity: booking.quantity, clothingTypes: booking.clothingTypes, amount: booking.currency === "CDF" ? Math.round(Number(booking.totalAmount)).toLocaleString("fr-FR") + " CDF" : Number(booking.totalAmount).toFixed(2) + " FC", notes: booking.notes, status: "active" }),
        });
      }
    } catch {}
    setProcessing(false);
    setPaid(true);
    localStorage.removeItem("repassage_booking");
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Réservation confirmée !</h2>
          <p className="text-[var(--text-secondary)] mb-2">
            Votre intervention de repassage est planifiée pour le{" "}
            <strong className="text-[var(--text-primary)]">
              {new Date(booking.date).toLocaleDateString("fr-FR", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </strong>{" "}
            à <strong className="text-[var(--text-primary)]">{booking.time}</strong>.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Un agent vous sera assigné. Votre QR code d&apos;intervention vous sera envoyé par e-mail.
          </p>

          {/* QR code placeholder */}
          <div className="my-6 p-6 rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 inline-block mx-auto">
            <QrCodeIcon className="w-20 h-20 text-purple-500 mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)]">Votre QR code d&apos;intervention</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Envoyé par e-mail · Valable le jour J uniquement</p>
          </div>

          {/* Recap */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left mb-6 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Adresse</span>
              <span className="font-medium text-[var(--text-primary)]">{booking.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Date</span>
              <span className="font-medium text-[var(--text-primary)]">
                {new Date(booking.date).toLocaleDateString("fr-FR")} à {booking.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Quantité</span>
              <span className="font-medium text-[var(--text-primary)]">{booking.quantityLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Durée estimée</span>
              <span className="font-medium text-[var(--text-primary)]">{booking.duration}h</span>
            </div>
            {booking.clothingTypes.length > 0 && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-[var(--text-muted)]">Vêtements</span>
                <span className="font-medium text-[var(--text-primary)] text-right text-xs">{booking.clothingTypes.join(", ")}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--border-color)] pt-2">
              <span className="text-[var(--text-muted)]">Montant estimé TTC</span>
              <span className="font-bold text-purple-500">{booking.totalAmount} FC</span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] mb-6">
            * Le montant final sera calculé sur la durée réelle (scan QR de début – fin). Une facture PDF vous sera envoyée automatiquement.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              href="/tableau-de-bord"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold hover:opacity-90 transition-all"
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
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/multi-impala/repassage"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour à la réservation
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-2xl">
              👕
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Confirmer la réservation</h1>
              <p className="text-sm text-[var(--text-secondary)]">Service de repassage à domicile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            {/* Récap intervention */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Détails de l&apos;intervention</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <MapPinIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Adresse</p>
                    <p className="font-medium text-[var(--text-primary)] text-sm">{booking.address}</p>
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
                  <span className="text-xl flex-shrink-0">👕</span>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Quantité · Types</p>
                    <p className="font-medium text-[var(--text-primary)] text-sm">
                      {booking.quantityLabel}
                      {booking.clothingTypes.length > 0 && ` · ${booking.clothingTypes.join(", ")}`}
                    </p>
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
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-start gap-3">
              <QrCodeIcon className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">QR code d&apos;intervention</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Après confirmation, un QR code unique est généré et envoyé par e-mail. L&apos;agent le scanne à l&apos;arrivée et au départ. La facture finale est calculée automatiquement sur la durée réelle de prestation.
                </p>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Mode de paiement</h2>
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
                          ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10"
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
                        isActive ? "border-purple-500" : "border-[var(--border-color)]"
                      }`}>
                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
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
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
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
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">Date d&apos;expiration</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">CVV</label>
                      <input
                        type="text"
                        placeholder="XXX"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: recap + confirm */}
          <div className="space-y-6">
            <div className="sticky top-6">
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
                    <span className="text-purple-500">{booking.totalAmount} FC</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-3 leading-relaxed">
                  * La facture finale est calculée sur la durée réelle (scan QR de début – fin).
                </p>

                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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



