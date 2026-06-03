"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useServiceGuard } from "@/hooks/useServiceGuard";

type AdType = "sale" | "rent";

type DossierForm = {
  adType: AdType;
  title: string;
  city: string;
  postalCode: string;
  address: string;
  surface: string;
  rooms: string;
  bedrooms: string;
  price: string;
  rentPrice: string;
  charges: string;
  sellerFullName: string;
  sellerPhone: string;
  sellerEmail: string;
  buyerFullName: string;
  buyerPhone: string;
  buyerEmail: string;
  maritalRegimeSeller: string;
  maritalRegimeBuyer: string;
  cadastralSection: string;
  cadastralNumbers: string;
  yearBuilt: string;
  levelsCount: string;
  habitableSurface: string;
  isolation: string;
  generalState: string;
  bathroomsCount: string;
  waterRoomsCount: string;
  separateWcCount: string;
  hasGarage: string;
  garageCars: string;
  hasTerrace: string;
  terraceSurface: string;
  hasPool: string;
  livingRooms: number | "";
  kitchens: number | "";
  dpeClass: string;
  gasInstallState: string;
  electricInstallState: string;
  asbestos: string;
  termites: string;
  leadRisk: string;
  ernmtRisk: string;
  loiCarrezSurface: string;
  syndicName: string;
  lotCount: string;
  annualCharges: string;
  sellerDebt: string;
  sellerDebtAmount: string;
  worksVotedNotDone: string;
  coownershipRulesProvided: string;
  netSellerPrice: string;
  buyerTotalPrice: string;
  guaranteeDeposit: string;
  guaranteeHeldBy: string;
  mortgageCondition: string;
  mortgageMaxAmount: string;
  mortgageDurationYears: string;
  mortgageRateMax: string;
  compromiseDate: string;
  authenticActDate: string;
  retractationApplicable: string;
  entryInPossession: string;
  forceClause: string;
  declarationNoHypotheque: boolean;
  declarationNoProcedure: boolean;
  declarationNoServitude: boolean;
  declarationNoTermites: boolean;
  declarationConformUrbanisme: boolean;
  specialObservations: string;
};

const initialForm: DossierForm = {
  adType: "sale",
  title: "",
  city: "",
  postalCode: "",
  address: "",
  surface: "",
  rooms: "",
  bedrooms: "",
  price: "",
  rentPrice: "",
  charges: "",
  sellerFullName: "",
  sellerPhone: "",
  sellerEmail: "",
  buyerFullName: "",
  buyerPhone: "",
  buyerEmail: "",
  maritalRegimeSeller: "",
  maritalRegimeBuyer: "",
  cadastralSection: "",
  cadastralNumbers: "",
  yearBuilt: "",
  levelsCount: "",
  habitableSurface: "",
  isolation: "",
  generalState: "",
  bathroomsCount: "",
  waterRoomsCount: "",
  separateWcCount: "",
  hasGarage: "",
  garageCars: "",
  hasTerrace: "",
  terraceSurface: "",
  hasPool: "",
  livingRooms: "",
  kitchens: "",
  dpeClass: "",
  gasInstallState: "",
  electricInstallState: "",
  asbestos: "",
  termites: "",
  leadRisk: "",
  ernmtRisk: "",
  loiCarrezSurface: "",
  syndicName: "",
  lotCount: "",
  annualCharges: "",
  sellerDebt: "",
  sellerDebtAmount: "",
  worksVotedNotDone: "",
  coownershipRulesProvided: "",
  netSellerPrice: "",
  buyerTotalPrice: "",
  guaranteeDeposit: "",
  guaranteeHeldBy: "",
  mortgageCondition: "",
  mortgageMaxAmount: "",
  mortgageDurationYears: "",
  mortgageRateMax: "",
  compromiseDate: "",
  authenticActDate: "",
  retractationApplicable: "",
  entryInPossession: "",
  forceClause: "",
  declarationNoHypotheque: false,
  declarationNoProcedure: false,
  declarationNoServitude: false,
  declarationNoTermites: false,
  declarationConformUrbanisme: false,
  specialObservations: "",
};

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

export default function PublierImmobilierPage() {
  const router = useRouter();
  useServiceGuard("real_estate");
  const [tab, setTab] = useState<"dossier" | "media">("dossier");
  const [form, setForm] = useState<DossierForm>(initialForm);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    form.title.trim().length >= 4 &&
    form.address.trim().length >= 5 &&
    ((form.adType === "sale" && Number(form.price) > 0) ||
      (form.adType === "rent" && Number(form.rentPrice) > 0));

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Regenerate previews (with HEIC conversion) whenever the images array changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const heic2any = (await import("heic2any")).default;
      const urls = await Promise.all(
        images.map(async (f) => {
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
      if (!cancelled) setImagePreviews(urls);
    })();
    return () => { cancelled = true; };
  }, [images]);

  const update = <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const picked = Array.from(files).filter((f) =>
      f.type.startsWith("image/") ||
      f.name.toLowerCase().endsWith(".heic") ||
      f.name.toLowerCase().endsWith(".heif")
    );
    const combined = [...images, ...picked];
    if (combined.length > 25) {
      setError("Vous pouvez uploader un maximum de 25 images.");
      setImages(combined.slice(0, 25));
      return;
    }
    setImages(combined);
  };

  const handleVideo = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");
    const selected = fileList[0];
    if (!selected.type.startsWith("video/")) {
      setError("Le fichier sélectionné n'est pas une vidéo.");
      return;
    }
    const maxVideoSize = 150 * 1024 * 1024;
    if (selected.size > maxVideoSize) {
      setError("La vidéo dépasse 150 MB.");
      return;
    }
    setVideo(selected);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submitAd = async () => {
    if (!canSubmit) {
      setError("Veuillez remplir les informations obligatoires (titre, adresse et prix). ");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous devez être connecté pour publier une annonce.");
      router.push("/connexion");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullDossier = {
        ...form,
        mediaSummary: {
          imageCount: images.length,
          videoName: video?.name || "",
          videoSizeMb: video ? Number((video.size / (1024 * 1024)).toFixed(2)) : 0,
        },
      };

      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", JSON.stringify(fullDossier, null, 2));
      if (form.adType === "sale") {
        payload.append("price", form.price);
      }
      if (form.adType === "rent") {
        payload.append("rent_price", form.rentPrice);
      }
      if (form.charges) payload.append("charges", form.charges);
      if (form.surface) payload.append("surface", form.surface);
      if (form.rooms) payload.append("rooms", form.rooms);
      if (form.bedrooms) payload.append("bedrooms", form.bedrooms);
      if (form.livingRooms !== "") payload.append("living_rooms", String(form.livingRooms));
      if (form.kitchens !== "") payload.append("kitchens", String(form.kitchens));
      payload.append("address", form.address);
      payload.append("city", form.city);
      payload.append("postal_code", form.postalCode);
      payload.append("ad_type", form.adType);
      for (const image of images) {
        payload.append("images", image);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!res.ok) {
        let errMsg = "Erreur lors de la publication";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          const text = await res.text().catch(() => "");
          if (text && !text.startsWith("<") && text.length < 200) errMsg = text;
        }
        throw new Error(errMsg);
      }

      const createdAd = await res.json();

      setSuccess("Annonce créée avec succès.");
      setForm(initialForm);
      setImages([]);
      setVideo(null);
      setTab("dossier");
      if (createdAd?.id) {
        router.push(`/immobilier/${createdAd.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/immobilier" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-primary">
            <ArrowLeftIcon className="w-4 h-4" /> Retour Immobilier
          </Link>
          <div className="inline-flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1">
            <button
              onClick={() => setTab("dossier")}
              className={`px-4 py-2 rounded-lg text-sm ${tab === "dossier" ? "bg-primary text-white" : "text-[var(--text-secondary)]"}`}
            >
              Dossier complet
            </button>
            <button
              onClick={() => setTab("media")}
              className={`px-4 py-2 rounded-lg text-sm ${tab === "media" ? "bg-primary text-white" : "text-[var(--text-secondary)]"}`}
            >
              Upload médias
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">{success}</div>}

        {tab === "dossier" ? (
          <div className="space-y-6">
            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Formulaire de vente de maison - Dossier complet</h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Type d'annonce</label>
                  <select className={inputClass} value={form.adType} onChange={(e) => update("adType", e.target.value as AdType)}>
                    <option value="sale">Vente</option>
                    <option value="rent">Location</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Titre de l'annonce *</label>
                  <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Villa 5 chambres avec jardin" />
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">1. Identification des parties</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Vendeur(s) - Nom complet</label>
                  <input className={inputClass} value={form.sellerFullName} onChange={(e) => update("sellerFullName", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Régime matrimonial vendeur</label>
                  <input className={inputClass} value={form.maritalRegimeSeller} onChange={(e) => update("maritalRegimeSeller", e.target.value)} placeholder="Communauté / Séparation / Autre" />
                </div>
                <div>
                  <label className={labelClass}>Téléphone vendeur</label>
                  <input className={inputClass} value={form.sellerPhone} onChange={(e) => update("sellerPhone", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email vendeur</label>
                  <input className={inputClass} value={form.sellerEmail} onChange={(e) => update("sellerEmail", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Acquéreur(s) - Nom complet</label>
                  <input className={inputClass} value={form.buyerFullName} onChange={(e) => update("buyerFullName", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Régime matrimonial acquéreur</label>
                  <input className={inputClass} value={form.maritalRegimeBuyer} onChange={(e) => update("maritalRegimeBuyer", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Téléphone acquéreur</label>
                  <input className={inputClass} value={form.buyerPhone} onChange={(e) => update("buyerPhone", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email acquéreur</label>
                  <input className={inputClass} value={form.buyerEmail} onChange={(e) => update("buyerEmail", e.target.value)} />
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">2. Identification du bien</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Adresse complète *</label>
                  <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Ville</label>
                  <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Code postal</label>
                  <input className={inputClass} value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Section cadastrale</label>
                  <input className={inputClass} value={form.cadastralSection} onChange={(e) => update("cadastralSection", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Numéros de parcelles</label>
                  <input className={inputClass} value={form.cadastralNumbers} onChange={(e) => update("cadastralNumbers", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Surface terrain (m2)</label>
                  <input className={inputClass} type="number" value={form.surface} onChange={(e) => update("surface", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Pièces principales</label>
                  <input className={inputClass} type="number" value={form.rooms} onChange={(e) => update("rooms", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Chambres</label>
                  <input className={inputClass} type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Surface habitable (m2)</label>
                  <input className={inputClass} type="number" value={form.habitableSurface} onChange={(e) => update("habitableSurface", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Année de construction</label>
                  <input className={inputClass} type="number" value={form.yearBuilt} onChange={(e) => update("yearBuilt", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nombre de niveaux</label>
                  <input className={inputClass} type="number" value={form.levelsCount} onChange={(e) => update("levelsCount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Isolation</label>
                  <select className={inputClass} value={form.isolation} onChange={(e) => update("isolation", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="partielle">Partielle</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>État général</label>
                  <select className={inputClass} value={form.generalState} onChange={(e) => update("generalState", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="excellent">Excellent</option>
                    <option value="bon">Bon</option>
                    <option value="renover">A renover</option>
                    <option value="vetuste">Vetuste</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">3. Caractéristiques détaillées</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nb salles de bains</label>
                  <input className={inputClass} type="number" value={form.bathroomsCount} onChange={(e) => update("bathroomsCount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nb salles d'eau</label>
                  <input className={inputClass} type="number" value={form.waterRoomsCount} onChange={(e) => update("waterRoomsCount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nb WC séparés</label>
                  <input className={inputClass} type="number" value={form.separateWcCount} onChange={(e) => update("separateWcCount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Garage</label>
                  <select className={inputClass} value={form.hasGarage} onChange={(e) => update("hasGarage", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Places garage</label>
                  <input className={inputClass} type="number" value={form.garageCars} onChange={(e) => update("garageCars", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Terrasse</label>
                  <select className={inputClass} value={form.hasTerrace} onChange={(e) => update("hasTerrace", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Surface terrasse (m2)</label>
                  <input className={inputClass} type="number" value={form.terraceSurface} onChange={(e) => update("terraceSurface", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Piscine</label>
                  <select className={inputClass} value={form.hasPool} onChange={(e) => update("hasPool", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nombre de chambres</label>
                  <input className={inputClass} type="number" min="0" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nombre de salons</label>
                  <input className={inputClass} type="number" min="0" value={form.livingRooms ?? ""} onChange={(e) => update("livingRooms", e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Nombre de cuisines</label>
                  <input className={inputClass} type="number" min="0" value={form.kitchens ?? ""} onChange={(e) => update("kitchens", e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">4. Diagnostics techniques obligatoires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Classe DPE</label>
                  <select className={inputClass} value={form.dpeClass} onChange={(e) => update("dpeClass", e.target.value)}>
                    <option value="">Sélectionner</option>
                    {"ABCDEFG".split("").map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Installation gaz</label>
                  <select className={inputClass} value={form.gasInstallState} onChange={(e) => update("gasInstallState", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="conforme">Conforme</option>
                    <option value="non_conforme">Non conforme</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Installation électrique</label>
                  <select className={inputClass} value={form.electricInstallState} onChange={(e) => update("electricInstallState", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="conforme">Conforme</option>
                    <option value="non_conforme">Non conforme</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amiante</label>
                  <select className={inputClass} value={form.asbestos} onChange={(e) => update("asbestos", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="presence">Présence</option>
                    <option value="absence">Absence</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Termites</label>
                  <select className={inputClass} value={form.termites} onChange={(e) => update("termites", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="presence">Présence</option>
                    <option value="absence">Absence</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Risque plomb (CREP)</label>
                  <select className={inputClass} value={form.leadRisk} onChange={(e) => update("leadRisk", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="presence">Présence</option>
                    <option value="absence">Absence</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Risques naturels/techno (ERNMT)</label>
                  <select className={inputClass} value={form.ernmtRisk} onChange={(e) => update("ernmtRisk", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Risque oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Surface loi Carrez (m2)</label>
                  <input className={inputClass} type="number" value={form.loiCarrezSurface} onChange={(e) => update("loiCarrezSurface", e.target.value)} />
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">5. Copropriété</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nom du syndic</label>
                  <input className={inputClass} value={form.syndicName} onChange={(e) => update("syndicName", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nombre total de lots</label>
                  <input className={inputClass} type="number" value={form.lotCount} onChange={(e) => update("lotCount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Charges annuelles moyennes</label>
                  <input className={inputClass} type="number" value={form.annualCharges} onChange={(e) => update("annualCharges", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Dette du vendeur</label>
                  <select className={inputClass} value={form.sellerDebt} onChange={(e) => update("sellerDebt", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Montant dette</label>
                  <input className={inputClass} type="number" value={form.sellerDebtAmount} onChange={(e) => update("sellerDebtAmount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Travaux votés non effectués</label>
                  <select className={inputClass} value={form.worksVotedNotDone} onChange={(e) => update("worksVotedNotDone", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Règlement copropriété fourni</label>
                  <select className={inputClass} value={form.coownershipRulesProvided} onChange={(e) => update("coownershipRulesProvided", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">6. Conditions de la vente</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {form.adType === "sale" ? (
                  <div>
                    <label className={labelClass}>Prix de vente (hors frais) *</label>
                    <input className={inputClass} type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Loyer mensuel *</label>
                    <input className={inputClass} type="number" value={form.rentPrice} onChange={(e) => update("rentPrice", e.target.value)} />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Charges</label>
                  <input className={inputClass} type="number" value={form.charges} onChange={(e) => update("charges", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Prix net vendeur</label>
                  <input className={inputClass} type="number" value={form.netSellerPrice} onChange={(e) => update("netSellerPrice", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Prix total acquéreur</label>
                  <input className={inputClass} type="number" value={form.buyerTotalPrice} onChange={(e) => update("buyerTotalPrice", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Dépôt de garantie</label>
                  <input className={inputClass} type="number" value={form.guaranteeDeposit} onChange={(e) => update("guaranteeDeposit", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Déposé chez</label>
                  <select className={inputClass} value={form.guaranteeHeldBy} onChange={(e) => update("guaranteeHeldBy", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="notaire">Notaire</option>
                    <option value="agence">Agence</option>
                    <option value="sequestre">Séquestre professionnel</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">7. Modalités financières et délais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Date signature compromis</label>
                  <input className={inputClass} type="date" value={form.compromiseDate} onChange={(e) => update("compromiseDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Date acte authentique</label>
                  <input className={inputClass} type="date" value={form.authenticActDate} onChange={(e) => update("authenticActDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Délai rétractation</label>
                  <select className={inputClass} value={form.retractationApplicable} onChange={(e) => update("retractationApplicable", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="applicable">Applicable</option>
                    <option value="non_applicable">Non applicable</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Entrée en jouissance</label>
                  <input className={inputClass} value={form.entryInPossession} onChange={(e) => update("entryInPossession", e.target.value)} placeholder="À la signature / date..." />
                </div>
                <div>
                  <label className={labelClass}>Clause réitération forcée</label>
                  <select className={inputClass} value={form.forceClause} onChange={(e) => update("forceClause", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Condition prêt (montant max)</label>
                  <input className={inputClass} type="number" value={form.mortgageMaxAmount} onChange={(e) => update("mortgageMaxAmount", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Durée prêt (ans)</label>
                  <input className={inputClass} type="number" value={form.mortgageDurationYears} onChange={(e) => update("mortgageDurationYears", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Taux max (%)</label>
                  <input className={inputClass} type="number" value={form.mortgageRateMax} onChange={(e) => update("mortgageRateMax", e.target.value)} />
                </div>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">8. Déclarations du vendeur</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[var(--text-secondary)]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.declarationNoHypotheque} onChange={(e) => update("declarationNoHypotheque", e.target.checked)} /> Bien non hypothéqué</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.declarationNoProcedure} onChange={(e) => update("declarationNoProcedure", e.target.checked)} /> Aucune procédure en cours</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.declarationNoServitude} onChange={(e) => update("declarationNoServitude", e.target.checked)} /> Aucune servitude non mentionnée</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.declarationNoTermites} onChange={(e) => update("declarationNoTermites", e.target.checked)} /> Aucune contamination termites/mérule</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.declarationConformUrbanisme} onChange={(e) => update("declarationConformUrbanisme", e.target.checked)} /> Conforme aux règles d'urbanisme</label>
              </div>
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">9. Observations particulières</h2>
              <textarea
                className={`${inputClass} min-h-[140px]`}
                value={form.specialObservations}
                onChange={(e) => update("specialObservations", e.target.value)}
                placeholder="Clauses spécifiques, travaux à prévoir, meubles inclus/exclus, litiges éventuels..."
              />
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Upload des images</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">Maximum 25 images</p>
              <label className="w-full rounded-2xl border-2 border-dashed border-[var(--border-color)] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                <CloudArrowUpIcon className="w-10 h-10 text-primary mb-2" />
                <span className="text-[var(--text-primary)] font-medium">Ajouter des images</span>
                <span className="text-sm text-[var(--text-muted)]">PNG, JPG, WEBP, HEIC...</span>
                <input type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
              </label>

              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {imagePreviews.map((src, i) => (
                    <div key={`${src}-${i}`} className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                      <img src={src} alt={`Aperçu ${i + 1}`} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Upload de la vidéo</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">1 vidéo maximum, taille maximale 150 MB</p>
              <label className="w-full rounded-2xl border-2 border-dashed border-[var(--border-color)] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                <VideoCameraIcon className="w-10 h-10 text-primary mb-2" />
                <span className="text-[var(--text-primary)] font-medium">Ajouter une vidéo</span>
                <span className="text-sm text-[var(--text-muted)]">MP4, MOV, WEBM...</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideo(e.target.files)} />
              </label>
              {video && (
                <div className="mt-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
                  <PhotoIcon className="w-5 h-5 text-primary" />
                  <div className="text-sm text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--text-primary)]">{video.name}</p>
                    <p>{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-8 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">Astuce: remplissez d'abord le dossier, puis ajoutez les médias.</p>
          <button
            onClick={submitAd}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {loading ? "Publication..." : "Publier l'annonce"}
          </button>
        </div>
      </div>
    </div>
  );
}
