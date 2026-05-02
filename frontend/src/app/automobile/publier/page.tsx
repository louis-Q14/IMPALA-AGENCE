"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TruckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useServiceGuard } from "@/hooks/useServiceGuard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const inputCls = "w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50";
const labelCls = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

export default function PublierAutomobilePage() {
  const router = useRouter();
  useServiceGuard("auto");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    ad_type: "vente", brand: "", model: "", year: "", mileage: "",
    fuel: "Essence", transmission: "Manuelle", color: "", doors: "",
    plate_number: "", location_text: "", price: "", rent_price_day: "",
    description: "", power: "", displacement: "", circulation_date: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/connexion?redirect=/automobile/publier");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function up(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleImages(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).filter((f) =>
      f.type.startsWith("image/") ||
      f.name.toLowerCase().endsWith(".heic") ||
      f.name.toLowerCase().endsWith(".heif")
    );
    const combined = [...imageFiles, ...picked].slice(0, 15);
    setImageFiles(combined);

    // Generate previews, converting HEIC files on the fly
    (async () => {
      const heic2any = (await import("heic2any")).default;
      const urls = await Promise.all(
        combined.map(async (f) => {
          const isHeic =
            f.name.toLowerCase().endsWith(".heic") ||
            f.name.toLowerCase().endsWith(".heif") ||
            f.type === "image/heic" ||
            f.type === "image/heif";
          if (isHeic) {
            try {
              const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.8 });
              return URL.createObjectURL(Array.isArray(blob) ? blob[0] : blob);
            } catch {
              return "";
            }
          }
          return URL.createObjectURL(f);
        })
      );
      setPreviews(urls);
    })();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand || !form.model || !form.year) {
      setError("Marque, modele et annee sont obligatoires.");
      return;
    }
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/connexion"); return; }
      const fd = new FormData();
      fd.append("ad_type", form.ad_type);
      fd.append("brand", form.brand);
      fd.append("model", form.model);
      fd.append("year", form.year ? String(parseInt(form.year)) : "");
      fd.append("mileage", form.mileage ? String(parseInt(form.mileage)) : "");
      fd.append("fuel", form.fuel);
      fd.append("transmission", form.transmission);
      fd.append("color", form.color);
      fd.append("doors", form.doors ? String(parseInt(form.doors)) : "");
      fd.append("plate_number", form.plate_number);
      fd.append("location_text", form.location_text);
      fd.append("price", form.price ? String(parseFloat(form.price)) : "");
      fd.append("rent_price_day", form.rent_price_day ? String(parseFloat(form.rent_price_day)) : "");
      fd.append("description", form.description);
      fd.append("power", form.power);
      fd.append("displacement", form.displacement);
      fd.append("circulation_date", form.circulation_date);
      fd.append("status", "pending");
      imageFiles.forEach((file) => fd.append("photos", file));
      const res = await fetch(`${API}/auto/ads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur lors de la publication");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Annonce soumise !</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Votre annonce est en cours de validation par notre equipe. Elle sera publiee sous 24h apres verification.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setSuccess(false); setForm({ ad_type: "vente", brand: "", model: "", year: "", mileage: "", fuel: "Essence", transmission: "Manuelle", color: "", doors: "", plate_number: "", location_text: "", price: "", rent_price_day: "", description: "", power: "", displacement: "", circulation_date: "" }); setPreviews([]); setImageFiles([]); }}
              className="py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:opacity-90 transition-all">
              Publier une autre annonce
            </button>
            <Link href="/automobile" className="py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-all">
              Voir les annonces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/automobile" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-primary">
            <ArrowLeftIcon className="w-4 h-4" /> Retour
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Publier une annonce vehicule</h1>
            <p className="text-sm text-[var(--text-secondary)]">Votre annonce sera verifiee avant publication</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informations principales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Type d annonce *</label>
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
                <label className={labelCls}>Plaque d immatriculation</label>
                <input value={form.plate_number} onChange={(e) => up("plate_number", e.target.value)} className={inputCls} placeholder="AB 1234 CD" />
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

          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Motorisation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Carburant</label>
                <select value={form.fuel} onChange={(e) => up("fuel", e.target.value)} className={inputCls}>
                  {["Essence", "Diesel", "Hybride", "Electrique", "GPL", "Autre"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Transmission</label>
                <select value={form.transmission} onChange={(e) => up("transmission", e.target.value)} className={inputCls}>
                  {["Manuelle", "Automatique", "Semi-automatique", "CVT"].map((t) => <option key={t}>{t}</option>)}
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

          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Photos du vehicule</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Jusqu a 15 photos (JPG, PNG, WEBP, HEIC)</p>
            <label className="w-full rounded-2xl border-2 border-dashed border-[var(--border-color)] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
              <CloudArrowUpIcon className="w-10 h-10 text-primary mb-2" />
              <span className="text-[var(--text-primary)] font-medium">Ajouter des photos</span>
              <span className="text-sm text-[var(--text-muted)]">PNG, JPG, WEBP, HEIC</span>
              <input type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
            </label>
            {previews.length > 0 && (
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                    <img src={src} alt="" className="w-full h-20 object-cover" />
                    <button type="button" onClick={() => {
                      const nf = imageFiles.filter((_, j) => j !== i);
                      setImageFiles(nf);
                      setPreviews(nf.map((f) => URL.createObjectURL(f)));
                    }} className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">X</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Description</h2>
            <textarea rows={5} value={form.description} onChange={(e) => up("description", e.target.value)}
              className={inputCls} placeholder="Decrivez votre vehicule : etat, equipements, historique d entretien, points forts..." />
          </section>

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">Votre annonce sera verifiee par notre equipe avant publication (24h max).</p>
            <button type="submit" disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap">
              {loading ? "Publication..." : "Soumettre l annonce"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}