"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TrashIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface SubData {
  plan: string;
  frequency: string;
  bins: number;
  amount: string;
  status: string;
  collectDays?: string[];
  address?: string;
}

export default function PaiementPoubelles() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sub, setSub] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card" | "cash">("mobile");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { router.push("/connexion"); return; }
        const res = await fetch(`${API}/trash/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) setSub(data.subscription);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [router]);

  const handlePay = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setPaid(true);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Aucun abonnement trouvé</p>
          <Link href="/multi-impala/poubelles" className="text-primary hover:underline">Retour</Link>
        </div>
      </div>
    );
  }

  const amount = sub.amount || "15 FC/mois";
  const numAmount = parseInt(amount) || 15;

  if (paid) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Paiement confirmé !</h2>
          <p className="text-[var(--text-secondary)] mb-2">
            Votre paiement de <strong className="text-emerald-500">{numAmount} FC</strong> a été traité avec succès.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Un reçu a été envoyé à votre adresse e-mail.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/tableau-de-bord" className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all">
              Tableau de bord
            </Link>
            <Link href="/multi-impala/poubelles" className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-all">
              Mon abonnement
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
      desc: "Au bureau ou à la collecte",
      icon: BanknotesIcon,
      gradient: "from-emerald-400 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/multi-impala/poubelles" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-4">
            <ArrowLeftIcon className="w-4 h-4" />
            Retour à l&apos;abonnement
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <TrashIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paiement</h1>
              <p className="text-sm text-[var(--text-secondary)]">Service de ramassage poubelles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Payment form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order summary */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Résumé de la commande</h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <TrashIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      Abonnement {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{sub.frequency} · {sub.bins} bac{sub.bins > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary">{numAmount} FC/mois</p>
              </div>
            </div>

            {/* Payment method */}
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
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
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
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isActive ? "border-primary" : "border-[var(--border-color)]"
                      }`}>
                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment details */}
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
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Un SMS de confirmation sera envoyé à ce numéro
                </p>
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
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">Expiration</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">CVC</label>
                      <input
                        type="text"
                        placeholder="XXX"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "cash" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Paiement en espèces</h2>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">Instructions</p>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">1.</span>
                      Présentez-vous à nos bureaux avec votre pièce d&apos;identité
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">2.</span>
                      Effectuez le paiement au comptoir
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">3.</span>
                      Vous recevrez un reçu par SMS et e-mail
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Total à payer</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Abonnement {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}</span>
                  <span className="font-medium text-[var(--text-primary)]">{numAmount} FC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Période</span>
                  <span className="font-medium text-[var(--text-primary)]">1 mois</span>
                </div>
                <div className="border-t border-[var(--border-color)] pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">Total</span>
                    <span className="text-2xl font-bold text-primary">{numAmount} FC</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={processing || (paymentMethod === "mobile" && !phoneNumber.trim())}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    Payer {numAmount} FC
                    <CreditCardIcon className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Paiement sécurisé et chiffré</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
