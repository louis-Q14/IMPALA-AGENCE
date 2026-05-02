"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TruckIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface Tarif {
  id: number;
  nom: string;
  montant: string;
  unite: string;
  description: string | null;
}

export default function PaiementAutomobile() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tarif, setTarif] = useState<Tarif | null>(null);
  const [loadingTarif, setLoadingTarif] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card" | "cash">("mobile");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/connexion?redirect=/automobile/paiement");
      return;
    }
    // Si abonnement deja actif, aller directement au formulaire
    fetch(`${API}/subscriptions/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((subs) => {
        if (Array.isArray(subs) && subs.some((s: { plan_type: string }) => s.plan_type === "auto_pro")) {
          router.push("/automobile/publier");
        }
      })
      .catch(() => {});
    fetch(`${API}/tarifs-frais/public?service=automobile&type=abonnement`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setTarif(arr[0] ?? { id: 0, nom: "Abonnement Automobile", montant: "40000", unite: "CDF", description: null });
      })
      .catch(() => setTarif({ id: 0, nom: "Abonnement Automobile", montant: "40000", unite: "CDF", description: null }))
      .finally(() => setLoadingTarif(false));
  }, [router]);

  const handlePay = async () => {
    setError("");
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/connexion"); return; }
      const res = await fetch(`${API}/subscriptions/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service_type: "automobile",
          payment_method: paymentMethod,
          amount: tarif ? parseFloat(tarif.montant) : 40000,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur lors du paiement");
        return;
      }
      setPaid(true);
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setProcessing(false);
    }
  };

  if (!mounted || loadingTarif) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  const montant = tarif ? Math.round(parseFloat(tarif.montant)).toLocaleString("fr-FR") : "40 000";
  const unite = tarif?.unite ?? "CDF";

  if (paid) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Abonnement active !</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Votre abonnement <strong>Automobile</strong> est actif pour 30 jours. Vous pouvez maintenant publier vos annonces.
          </p>
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left mb-8 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Service</span>
              <span className="font-medium text-[var(--text-primary)]">Automobile</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Duree</span>
              <span className="font-medium text-[var(--text-primary)]">30 jours</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border-color)] pt-3">
              <span className="text-[var(--text-muted)]">Montant paye</span>
              <span className="font-bold text-amber-500">{montant} {unite}</span>
            </div>
          </div>

          <div className="my-6 p-6 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5">
            <QrCodeIcon className="w-16 h-16 text-amber-500 mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)]">Votre justificatif de paiement</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Envoye par e-mail</p>
          </div>

          <button
            onClick={() => router.push("/automobile/publier")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold shadow-lg hover:opacity-90 transition-all mb-3"
          >
            Publier mon annonce maintenant
          </button>
          <Link href="/automobile" className="block text-sm text-[var(--text-muted)] hover:text-primary transition-colors">
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  const methods = [
    { id: "mobile" as const, label: "Mobile Money", desc: "M-Pesa, Airtel Money, Orange Money", icon: DevicePhoneMobileIcon, gradient: "from-orange-400 to-orange-600" },
    { id: "card" as const, label: "Carte bancaire", desc: "Visa, Mastercard", icon: CreditCardIcon, gradient: "from-blue-400 to-indigo-600" },
    { id: "cash" as const, label: "Paiement en especes", desc: "En agence IMPALA", icon: BanknotesIcon, gradient: "from-emerald-400 to-green-600" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/automobile" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition-colors mb-4">
            <ArrowLeftIcon className="w-4 h-4" /> Retour aux annonces
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Activer l abonnement Automobile</h1>
              <p className="text-sm text-[var(--text-secondary)]">Publiez vos annonces de vente et location</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Ce que vous obtenez</h2>
              <ul className="space-y-3">
                {[
                  "Publication d annonces vente et location de vehicules",
                  "Visibilite aupres de milliers d acheteurs et locataires",
                  "Photos, descriptions et specifications techniques",
                  "Tableau de bord de gestion de vos annonces",
                  "Assistance IMPALA incluse",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Mode de paiement</h2>
              <div className="space-y-3">
                {methods.map((m) => {
                  const Icon = m.icon;
                  const isActive = paymentMethod === m.id;
                  return (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${isActive ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10" : "border-[var(--border-color)] hover:border-[var(--border-hover)]"}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--text-primary)]">{m.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? "border-amber-500" : "border-[var(--border-color)]"}`}>
                        {isActive && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "mobile" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Numero Mobile Money</h2>
                <div className="relative">
                  <DevicePhoneMobileIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+243 XXX XXX XXX"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">Un SMS de confirmation sera envoye a ce numero</p>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informations de carte</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1 block">Numero de carte</label>
                    <input type="text" placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">Date d expiration</label>
                      <input type="text" placeholder="MM/AA"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1 block">CVV</label>
                      <input type="text" placeholder="XXX"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="sticky top-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Abonnement Automobile</span>
                    <span>30 jours</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-[var(--text-primary)] pt-3 border-t border-[var(--border-color)]">
                    <span>Total</span>
                    <span className="text-amber-500">{montant} {unite}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                  <LockClosedIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">Acces immediat apres paiement. Valable 30 jours.</p>
                </div>
                <button onClick={handlePay} disabled={processing}
                  className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {processing
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Traitement...</>
                    : <><ShieldCheckIcon className="w-4 h-4" /> Payer {montant} {unite}</>}
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                Paiement securise · Donnees chiffrees
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}