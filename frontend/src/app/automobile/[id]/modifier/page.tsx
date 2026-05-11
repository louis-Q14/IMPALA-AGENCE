"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  TruckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50";
const labelCls = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

const fuelToDisplay: Record<string, string> = {
  essence: "Essence", diesel: "Diesel", hybride: "Hybride", electrique: "Electrique",
};
const transToDisplay: Record<string, string> = {
  manuelle: "Manuelle", automatique: "Automatique",
};
const adTypeToDisplay: Record<string, string> = { sale: "vente", rent: "location" };
const fuelMap: Record<string, string> = {
  Essence: "essence", Diesel: "diesel", Hybride: "hybride", Electrique: "electrique",
  GPL: "essence", Autre: "essence",
};
const transMap: Record<string, string> = {
  Manuelle: "manuelle", Automatique: "automatique",
  "Semi-automatique": "manuelle", CVT: "automatique",
};
const adTypeMap: Record<string, string> = { vente: "sale", location: "rent" };

export default function ModifierAutomobilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const [form, setForm] = useState({
    ad_type: "vente", brand: "", model: "", year: "", mileage: "",
    fuel: "Essence", transmission: "Manuelle", color: "", doors: "",
    plate_number: "", location_text: "", price: "", rent_price_day: "",
    description: "", power: "", displacement: "", circulation_date: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push(`/connexion?redirect=/automobile/${id}/modifier`); return; }

    fetch(`${API}/auto/ads/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) { router.push("/automobile"); return; }
        // Vérification de propriété côté client
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (d.user_id !== payload.userId && payload.role !== "admin" && payload.role !== "super_admin") {
            router.push(`/automobile/${id}`);
            return;
          }
        } catch {
          router.push(`/automobile/${id}`);
          return;
        }
        setExistingPhotos(Array.isArray(d.photos) ? d.photos : []);
        setForm({
          ad_type: adTypeToDisplay[d.ad_type] ?? "vente",
          brand: d.brand ?? "",
          model: d.model ?? "",
          year: d.year ? String(d.year) : "",
          mileage: d.mileage ? String(d.mileage) : "",
          fuel: fuelToDisplay[d.fuel] ?? "Essence",
          transmission: transToDisplay[d.transmission] ?? "Manuelle",
          color: d.color ?? "",
          doors: d.doors ? String(d.doors) : "",
          plate_number: d.plate_number ?? "",
          location_text: d.location_text ?? "",
          price: d.price ? String(d.price) : "",
          rent_price_day: d.rent_price_day ? String(d.rent_price_day) : "",
          description: d.description ?? "",
          power: d.power ?? "",
          displacement: d.displacement ?? "",
          circulation_date: d.circulation_date
            ? new Date(d.circulation_date).toISOString().split("T")[0]
            : "",
        });
      })
      .catch(() => router.push("/automobile"))
      .finally(() => setFetchLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function up(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand || !form.model || !form.year) {
      setError("Marque, modele et annee sont obligatoires.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/connexion"); return; }

      const body = {
        ad_type: adTypeMap[form.ad_type] ?? form.ad_type,
        brand: form.brand,
        model: form.model,
        year: form.year ? parseInt(form.year) : null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        fuel: fuelMap[form.fuel] ?? form.fuel.toLowerCase(),
        transmission: transMap[form.transmission] ?? form.transmission.toLowerCase(),
        color: form.color,
        doors: form.doors ? parseInt(form.doors) : null,
        plate_number: form.plate_number,
        location_text: form.location_text,
        price: form.price ? parseFloat(form.price) : null,
        rent_price_day: form.rent_price_day ? parseFloat(form.rent_price_day) : null,
        description: form.description,
        power: form.power,
        displacement: form.displacement,
        circulation_date: form.circulation_date || null,
      };

      const res = await fetch(`${API}/auto/ads/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try { const d = await res.json(); msg = d.error ?? msg; } catch { /* ignore */ }
        setError(msg);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <span className="text-[var(--text-muted)]">Chargement...</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Annonce mise à jour !</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Les modifications ont été enregistrées. L&apos;annonce repassera en validation avant republication.
          </p>
          <Link
            href={`/automobile/${id}`}
            className="inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:opacity-90 transition-all"
          >
            Voir l&apos;annonce
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/automobile/${id}`} className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-primary">
            <ArrowLeftIcon className="w-4 h-4" /> Retour à l&apos;annonce
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Modifier l&apos;annonce</h1>
            <p className="text-sm text-[var(--text-secondary)]">Les modifications seront vérifiées avant republication</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {existingPhotos.length > 0 && (
          <div className="mb-6 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Photos actuelles</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {existingPhotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="flex-shrink-0 w-24 h-16 object-cover rounded-lg border border-[var(--border-color)]"
                />
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Pour modifier les photos, contactez l&apos;équipe via WhatsApp.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informations principales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Type d&apos;annonce *</label>
                <select value={form.ad_type} onChange={(e) => up("ad_type", e.target.value)} className={inputCls}>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Marque *</label>
                <input required value={form.brand} onChange={(e) => up("brand", e.target.value)} className={inputCls} placeholder="Toyota, BMW, Mercedes..." />
              </div>
              <div>
                <label className={labelCls}>Modele *</label>
                <input required value={form.model} onChange={(e) => up("model", e.target.value)} className={inputCls} placeholder="Corolla, X5, Classe C..." />
              </div>
              <div>
                <label className={labelCls}>Annee *</label>
                <input required type="number" min={1990} max={2030} value={form.year} onChange={(e) => up("year", e.target.value)} className={inputCls} placeholder="2020" />
              </div>
              <div>
                <label className={labelCls}>Kilometrage (km)</label>
                <input type="number" min={0} value={form.mileage} onChange={(e) => up("mileage", e.target.value)} className={inputCls} placeholder="50000" />
              </div>
              <div>
                <label className={labelCls}>Couleur</label>
                <input value={form.color} onChange={(e) => up("color", e.target.value)} className={inputCls} placeholder="Blanc, Noir, Gris..." />
              </div>
              <div>
                <label className={labelCls}>Plaque d&apos;immatriculation</label>
                <input value={form.plate_number} onChange={(e) => up("plate_number", e.target.value)} className={inputCls} placeholder="EA 1234 KN" />
              </div>
              <div>
                <label className={labelCls}>Nombre de portes</label>
                <input type="number" min={2} max={7} value={form.doors} onChange={(e) => up("doors", e.target.value)} className={inputCls} placeholder="4" />
              </div>
              <div>
                <label className={labelCls}>Date de mise en circulation</label>
                <input type="date" value={form.circulation_date} onChange={(e) => up("circulation_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ville / Localisation</label>
                <input value={form.location_text} onChange={(e) => up("location_text", e.target.value)} className={inputCls} placeholder="Kinshasa, Gombe..." />
              </div>
            </div>
          </section>

          {/* Motorisation */}
          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Motorisation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Carburant</label>
                <select value={form.fuel} onChange={(e) => up("fuel", e.target.value)} className={inputCls}>
                  {["Essence", "Diesel", "Hybride", "Electrique", "GPL", "Autre"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Transmission</label>
                <select value={form.transmission} onChange={(e) => up("transmission", e.target.value)} className={inputCls}>
                  {["Manuelle", "Automatique", "Semi-automatique", "CVT"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Puissance (ex: 150 ch)</label>
                <input value={form.power} onChange={(e) => up("power", e.target.value)} className={inputCls} placeholder="150 ch" />
              </div>
              <div>
                <label className={labelCls}>Cylindree (ex: 2.0L)</label>
                <input value={form.displacement} onChange={(e) => up("displacement", e.target.value)} className={inputCls} placeholder="2.0L" />
              </div>
            </div>
          </section>

          {/* Prix */}
          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Prix</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.ad_type === "vente" ? (
                <div className="sm:col-span-2">
                  <label className={labelCls}>Prix de vente ($) *</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => up("price", e.target.value)} className={inputCls} placeholder="15000" />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className={labelCls}>Prix de location / jour ($) *</label>
                  <input type="number" min={0} value={form.rent_price_day} onChange={(e) => up("rent_price_day", e.target.value)} className={inputCls} placeholder="80" />
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Description</h2>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => up("description", e.target.value)}
              className={inputCls}
              placeholder="Décrivez votre véhicule : état, équipements, historique d'entretien..."
            />
          </section>

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              Les modifications seront vérifiées par notre équipe avant republication (24h max).
            </p>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
