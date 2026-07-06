"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PhotoIcon, XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";

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
  { key: "nuit", label: "À la nuit" },
  { key: "semaine", label: "À la semaine" },
  { key: "mois", label: "Au mois" },
];

const AMENITIES_LIST = [
  "WiFi", "TV", "Cuisine équipée", "Climatisation", "Chauffage", "Parking gratuit",
  "Piscine", "Terrasse / Balcon", "Jardin", "Machine à laver", "Sèche-linge",
  "Réfrigérateur", "Micro-ondes", "Lave-vaisselle", "Fer à repasser",
  "Coffre-fort", "Ascenseur", "Salle de sport", "Accès PMR",
  "Animaux acceptés", "Fumeurs acceptés", "Baby-foot", "Billard",
];

export default function EditerBienPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; is_cover: boolean }[]>([]);

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

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) { router.push("/connexion"); return; }

    fetch(`${API}/reservation/properties/${id}`)
      .then(r => r.json())
      .then(p => {
        if (!p.id) { router.push("/tableau-de-bord/reservation"); return; }
        setForm({
          property_type: p.property_type || "",
          listing_type: p.listing_type || "nuit",
          title: p.title || "",
          description: p.description || "",
          city: p.city || "",
          address: p.address || "",
          country: p.country || "République Démocratique du Congo",
          bedrooms: p.bedrooms || 1,
          bathrooms: p.bathrooms || 1,
          max_guests: p.max_guests || 2,
          surface: p.surface ? String(p.surface) : "",
          price_per_night: p.price_per_night ? String(p.price_per_night) : "",
          price_per_week: p.price_per_week ? String(p.price_per_week) : "",
          price_per_month: p.price_per_month ? String(p.price_per_month) : "",
          currency: p.currency || "USD",
          cancellation_policy: p.cancellation_policy || "flexible",
          check_in_time: p.check_in_time || "14:00",
          check_out_time: p.check_out_time || "11:00",
          min_stay: p.min_stay || 1,
          max_stay: p.max_stay ? String(p.max_stay) : "",
          instant_booking: p.instant_booking || false,
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
        });
        setExistingImages(Array.isArray(p.images) ? p.images : []);
      })
      .catch(() => router.push("/tableau-de-bord/reservation"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (a: string) =>
    set("amenities", form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setNewFiles(prev => [...prev, ...Array.from(files)].slice(0, 20 - existingImages.length));
  };

  const deleteExistingImage = async (imgId: string) => {
    const token = getToken();
    await fetch(`${API}/reservation/images/${imgId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
  };

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!form.title || !form.city) { setError("Titre et ville requis"); return; }

    const token = getToken();
    if (!token) { router.push("/connexion"); return; }

    setSaving(true);
    try {
      const updateRes = await fetch(`${API}/reservation/properties/${id}`, {
        method: "PUT",
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
      if (!updateRes.ok) {
        const d = await updateRes.json();
        setError(d.error || "Erreur mise à jour");
        setSaving(false);
        return;
      }

      if (newFiles.length > 0) {
        const fd = new FormData();
        newFiles.forEach(f => fd.append("images", f));
        await fetch(`${API}/reservation/properties/${id}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      setSuccess("Bien mis à jour avec succès !");
      setTimeout(() => router.push("/tableau-de-bord/reservation"), 1500);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/tableau-de-bord/reservation" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronLeftIcon className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Modifier le bien</h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">{success}</p>}

          {/* Type */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Type de bien</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => set("property_type", t.key)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.property_type === t.key
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}>
                  <span className="text-xl mb-1">{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listing type */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Mode de location</label>
            <div className="flex gap-2">
              {LISTING_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => set("listing_type", t.key)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.listing_type === t.key
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Infos de base */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Titre *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Ville *</label>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Adresse</label>
                <input value={form.address} onChange={e => set("address", e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Chambres</label>
                <input type="number" min="1" value={form.bedrooms} onChange={e => set("bedrooms", parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Sdb</label>
                <input type="number" min="1" value={form.bathrooms} onChange={e => set("bathrooms", parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">Max voyageurs</label>
                <input type="number" min="1" value={form.max_guests} onChange={e => set("max_guests", parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Prix</label>
            <div className="grid grid-cols-2 gap-4">
              {form.listing_type === "nuit" && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Prix / nuit</label>
                  <input type="number" min="0" value={form.price_per_night} onChange={e => set("price_per_night", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
                </div>
              )}
              {form.listing_type === "semaine" && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Prix / semaine</label>
                  <input type="number" min="0" value={form.price_per_week} onChange={e => set("price_per_week", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
                </div>
              )}
              {form.listing_type === "mois" && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Prix / mois</label>
                  <input type="number" min="0" value={form.price_per_month} onChange={e => set("price_per_month", e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Devise</label>
                <select value={form.currency} onChange={e => set("currency", e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none">
                  <option value="USD">USD ($)</option>
                  <option value="CDF">CDF (FC)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Équipements */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Équipements</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    form.amenities.includes(a)
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}>{a}</button>
              ))}
            </div>
          </div>

          {/* Photos existantes */}
          {existingImages.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                Photos actuelles ({existingImages.length})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingImages.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.is_cover && (
                      <span className="absolute top-1 left-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Cover</span>
                    )}
                    <button onClick={() => deleteExistingImage(img.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles photos */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Ajouter des photos</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center cursor-pointer hover:border-rose-300 transition-colors">
              <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Cliquez pour ajouter des photos</p>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handleFiles(e.target.files)} />
            </div>
            {newFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {newFiles.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setNewFiles(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/tableau-de-bord/reservation"
              className="flex-1 text-center py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Annuler
            </Link>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
