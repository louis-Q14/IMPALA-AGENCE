"use client";

export const dynamic = 'force-dynamic';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PhotoIcon, XMarkIcon, PlusIcon, HomeModernIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PROPERTY_TYPES = [
  { key: "appartement", label: "Appartement", emoji: "🏢" },
  { key: "maison", label: "Maison", emoji: "🏠" },
  { key: "villa", label: "Villa", emoji: "🏡" },
  { key: "hotel", label: "Hôtel / Chambre d'hôtel", emoji: "🏨" },
  { key: "chambre", label: "Chambre privée", emoji: "🛏️" },
  { key: "bureau", label: "Bureau / Espace de travail", emoji: "💼" },
  { key: "salle", label: "Salle de fête / Événement", emoji: "🎉" },
  { key: "autre", label: "Autre", emoji: "📦" },
];

const LISTING_TYPES = [
  { key: "nuit", label: "À la nuit", desc: "Location courte durée" },
  { key: "semaine", label: "À la semaine", desc: "Location moyenne durée" },
  { key: "mois", label: "Au mois", desc: "Location longue durée" },
];

const AMENITIES_LIST = [
  "WiFi", "TV", "Cuisine équipée", "Climatisation", "Chauffage", "Parking gratuit",
  "Piscine", "Terrasse / Balcon", "Jardin", "Machine à laver", "Sèche-linge",
  "Réfrigérateur", "Micro-ondes", "Lave-vaisselle", "Fer à repasser",
  "Coffre-fort", "Ascenseur", "Salle de sport", "Accès PMR",
  "Animaux acceptés", "Fumeurs acceptés", "Baby-foot", "Billard",
];

const CANCELLATION = [
  { key: "flexible", label: "Flexible", desc: "Remboursement intégral jusqu'à 24h avant l'arrivée" },
  { key: "moderate", label: "Modérée", desc: "Remboursement 50% jusqu'à 5 jours avant" },
  { key: "strict", label: "Stricte", desc: "Aucun remboursement après la réservation" },
];

const STEPS = ["Type", "Détails", "Équipements", "Prix", "Photos"];

export default function NouveauBienPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  const [form, setForm] = useState({
    property_type: "",
    listing_type: "nuit",
    title: "",
    description: "",
    city: "",
    address: "",
    country: "République Démocratique du Congo",
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    surface: "",
    floor: "",
    price_per_night: "",
    price_per_week: "",
    price_per_month: "",
    currency: "USD",
    cancellation_policy: "flexible",
    check_in_time: "14:00",
    check_out_time: "11:00",
    min_stay: 1,
    max_stay: "",
    instant_booking: false,
    amenities: [] as string[],
  });

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (a: string) => {
    set("amenities", form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPreviews = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 20));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.property_type) { setError("Sélectionnez un type de bien"); setStep(0); return; }
    if (!form.title || !form.city) { setError("Titre et ville requis"); setStep(1); return; }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) { router.push("/connexion"); return; }

    setSaving(true);
    try {
      // Create property
      const createRes = await fetch(`${API}/reservation/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
          price_per_week: form.price_per_week ? parseFloat(form.price_per_week) : null,
          price_per_month: form.price_per_month ? parseFloat(form.price_per_month) : null,
          surface: form.surface ? parseFloat(form.surface) : null,
          max_stay: form.max_stay ? parseInt(form.max_stay) : null,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) { setError(createData.error || "Erreur création"); setSaving(false); return; }

      const propId = createData.id;

      // Upload images
      if (previews.length > 0) {
        const fd = new FormData();
        previews.forEach(p => fd.append("images", p.file));
        await fetch(`${API}/reservation/properties/${propId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      router.push("/tableau-de-bord/reservation");
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.property_type;
    if (step === 1) return !!(form.title && form.city);
    if (step === 3) {
      const hasPrice = form.listing_type === "nuit" ? !!form.price_per_night
        : form.listing_type === "semaine" ? !!form.price_per_week
        : !!form.price_per_month;
      return hasPrice;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/tableau-de-bord/reservation" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Publier un bien</h1>
            <p className="text-sm text-gray-500">Étape {step + 1} sur {STEPS.length}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-rose-500" : "bg-gray-200 dark:bg-gray-800"}`} />
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 text-sm mb-6">
              {error}
            </div>
          )}

          {/* STEP 0 — Type */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quel type de bien proposez-vous ?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sélectionnez la catégorie qui correspond le mieux.</p>
              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map(t => (
                  <button key={t.key} onClick={() => set("property_type", t.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      form.property_type === t.key
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}>
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Informations du bien</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Décrivez votre bien avec précision.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Titre de l'annonce *</label>
                <input type="text" value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="Ex: Bel appartement meublé avec vue sur le fleuve"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
                  placeholder="Décrivez votre bien : ambiance, équipements, accès, proximités..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ville *</label>
                  <input type="text" value={form.city} onChange={e => set("city", e.target.value)}
                    placeholder="Ex: Kinshasa"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Pays</label>
                  <input type="text" value={form.country} onChange={e => set("country", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Adresse complète</label>
                <input type="text" value={form.address} onChange={e => set("address", e.target.value)}
                  placeholder="Quartier, avenue, numéro..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Chambres</label>
                  <input type="number" min="0" value={form.bedrooms} onChange={e => set("bedrooms", parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Salles de bain</label>
                  <input type="number" min="0" value={form.bathrooms} onChange={e => set("bathrooms", parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Voyageurs max</label>
                  <input type="number" min="1" value={form.max_guests} onChange={e => set("max_guests", parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Surface (m²)</label>
                  <input type="number" min="0" value={form.surface} onChange={e => set("surface", e.target.value)} placeholder="Ex: 85"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Étage</label>
                  <input type="number" value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="0 = RDC"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Amenities */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Équipements & services</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cochez tout ce que votre bien propose.</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES_LIST.map(a => (
                  <button key={a} onClick={() => toggleAmenity(a)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                      form.amenities.includes(a)
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}>
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-xs ${form.amenities.includes(a) ? "bg-rose-500 text-white" : "border border-gray-300 dark:border-gray-600"}`}>
                      {form.amenities.includes(a) && "✓"}
                    </span>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Prix */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tarifs et conditions</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Définissez vos prix et conditions de location.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mode de location</label>
                <div className="grid grid-cols-3 gap-3">
                  {LISTING_TYPES.map(t => (
                    <button key={t.key} onClick={() => set("listing_type", t.key)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.listing_type === t.key
                          ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {form.listing_type === "nuit" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Prix par nuit *</label>
                    <input type="number" min="0" value={form.price_per_night} onChange={e => set("price_per_night", e.target.value)}
                      placeholder="Ex: 50"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                  </div>
                )}
                {form.listing_type === "semaine" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Prix par semaine *</label>
                    <input type="number" min="0" value={form.price_per_week} onChange={e => set("price_per_week", e.target.value)}
                      placeholder="Ex: 300"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                  </div>
                )}
                {form.listing_type === "mois" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Prix par mois *</label>
                    <input type="number" min="0" value={form.price_per_month} onChange={e => set("price_per_month", e.target.value)}
                      placeholder="Ex: 800"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Devise</label>
                  <select value={form.currency} onChange={e => set("currency", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-rose-400 transition-colors">
                    <option value="USD">USD ($)</option>
                    <option value="CDF">CDF (FC)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Heure d'arrivée</label>
                  <input type="time" value={form.check_in_time} onChange={e => set("check_in_time", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Heure de départ</label>
                  <input type="time" value={form.check_out_time} onChange={e => set("check_out_time", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Politique d'annulation</label>
                <div className="space-y-2">
                  {CANCELLATION.map(c => (
                    <button key={c.key} onClick={() => set("cancellation_policy", c.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        form.cancellation_policy === c.key
                          ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}>
                      <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${form.cancellation_policy === c.key ? "border-rose-500 bg-rose-500" : "border-gray-400"}`} />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.label}</p>
                        <p className="text-xs text-gray-500">{c.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${form.instant_booking ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.instant_booking ? "left-5" : "left-1"}`} />
                </div>
                <input type="checkbox" className="hidden" checked={form.instant_booking} onChange={e => set("instant_booking", e.target.checked)} />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Réservation instantanée</p>
                  <p className="text-xs text-gray-500">Les voyageurs peuvent réserver sans demande de confirmation</p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 4 — Photos */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Photos de votre bien</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Ajoutez jusqu'à 20 photos. La première sera la photo de couverture.</p>

              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFiles(e.target.files)} />

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all mb-4">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Cliquez pour ajouter des photos</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG · Max 15 Mo par image · Max 20 images</p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previews.map((p, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                          Couverture
                        </span>
                      )}
                      <button onClick={() => setPreviews(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-rose-400 hover:text-rose-500 transition-all">
                    <PlusIcon className="w-8 h-8" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.push("/tableau-de-bord/reservation")}
            className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Retour
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => { if (canNext()) { setError(""); setStep(s => s + 1); } else setError("Veuillez remplir les champs requis."); }}
              className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors">
              Continuer
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="px-8 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publication...</> : "Publier mon bien"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
