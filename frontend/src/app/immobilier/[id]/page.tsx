"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type DossierData = {
  sellerFullName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  buyerFullName?: string;
  city?: string;
  postalCode?: string;
  constructionType?: string;
  habitableSurface?: string;
  yearBuilt?: string;
  generalState?: string;
  apartmentCount?: string;
  salonCount?: string;
  bathroomsCount?: string;
  waterRoomsCount?: string;
  separateWcCount?: string;
  heatingType?: string;
  dpeClass?: string;
  gasInstallState?: string;
  electricInstallState?: string;
  asbestos?: string;
  termites?: string;
  leadRisk?: string;
  ernmtRisk?: string;
  annualCharges?: string;
  guaranteeDeposit?: string;
  compromiseDate?: string;
  authenticActDate?: string;
  specialObservations?: string;
  mediaSummary?: {
    imageCount?: number;
    videoName?: string;
    videoSizeMb?: number;
  };
};

type RealEstateDetail = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number | null;
  rent_price: number | null;
  charges: number | null;
  surface: number | null;
  rooms: number | null;
  bedrooms: number | null;
  address: string;
  city: string | null;
  postal_code: string | null;
  ad_type: "sale" | "rent";
  status: string;
  views: number;
  created_at: string;
  author_name?: string;
  author_role?: string;
  author_email?: string | null;
  author_phone?: string | null;
  author_adresse?: string | null;
  photos: string[];
};

function formatPrice(ad: RealEstateDetail) {
  const value = Number(ad.price ?? ad.rent_price ?? 0);
  return ad.ad_type === "rent"
    ? `${value.toLocaleString("fr-FR")} FC/mois`
    : `${value.toLocaleString("fr-FR")} FC`;
}

function parseDossier(description: string | null): DossierData | null {
  if (!description) return null;
  try {
    return JSON.parse(description) as DossierData;
  } catch {
    return null;
  }
}

export default function ImmobilierDetailPage() {
  const params = useParams<{ id: string }>();
  const [ad, setAd] = useState<RealEstateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editAd, setEditAd] = useState<Partial<RealEstateDetail>>({});
  const [editDossier, setEditDossier] = useState<DossierData>({});
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser({ id: String(u.id), role: u.role });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const loadAd = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads/${params.id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setAd(null);
          return;
        }
        const data = await res.json();
        setAd({
          ...data,
          photos: Array.isArray(data.photos) ? data.photos : [],
        });
      } catch {
        setAd(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadAd();
    }
  }, [params.id]);

  const dossier = useMemo(() => parseDossier(ad?.description ?? null), [ad?.description]);
  const gallery = ad?.photos ?? [];

  useEffect(() => {
    if (!isDescriptionOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDescriptionOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDescriptionOpen]);

  const canEdit =
    !!ad &&
    !!currentUser &&
    (currentUser.id === String(ad.user_id) ||
      currentUser.role === "super_admin");

  const enterEditMode = () => {
    if (!ad) return;
    setEditAd({
      title: ad.title,
      address: ad.address,
      city: ad.city,
      postal_code: ad.postal_code,
      surface: ad.surface,
      rooms: ad.rooms,
      bedrooms: ad.bedrooms,
      price: ad.price,
      rent_price: ad.rent_price,
      charges: ad.charges,
      ad_type: ad.ad_type,
    });
    setEditDossier({ ...(dossier ?? {}) });
    setRemovedPhotos([]);
    setNewImageFiles([]);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditAd({});
    setEditDossier({});
    setRemovedPhotos([]);
    setNewImageFiles([]);
  };

  const togglePhotoRemoval = (url: string) => {
    setRemovedPhotos((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    setNewImageFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeNewFile = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEdit = async () => {
    if (!ad) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      const adFields: Array<keyof RealEstateDetail> = [
        "title",
        "address",
        "city",
        "postal_code",
        "surface",
        "rooms",
        "bedrooms",
        "price",
        "rent_price",
        "charges",
        "ad_type",
      ];
      adFields.forEach((k) => {
        const v = editAd[k];
        if (v !== undefined && v !== null) fd.append(k, String(v));
        else fd.append(k, "");
      });
      fd.append("description", JSON.stringify(editDossier));
      if (removedPhotos.length) fd.append("removedPhotos", JSON.stringify(removedPhotos));
      newImageFiles.forEach((file) => fd.append("newImages", file));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads/${ad.id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la mise à jour");
      }
      const updated = await res.json();
      setAd({ ...updated, photos: Array.isArray(updated.photos) ? updated.photos : [] });
      setIsEditing(false);
      setRemovedPhotos([]);
      setNewImageFiles([]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const sendContactMessage = async () => {
    if (!ad) return;
    if (!contactMessage.trim()) {
      setContactFeedback({ type: "err", text: "Veuillez saisir un message." });
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setShowAuthPrompt(true);
      return;
    }
    if (currentUser && currentUser.id === ad.user_id) {
      setContactFeedback({ type: "err", text: "Vous ne pouvez pas vous contacter vous-même." });
      return;
    }
    setContactSending(true);
    setContactFeedback(null);
    try {
      const prefix = contactName || contactEmail || contactPhone
        ? `Nom: ${contactName || "—"}\nEmail: ${contactEmail || "—"}\nTéléphone: ${contactPhone || "—"}\n\n`
        : "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/messages/contact-seller`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adId: ad.id,
            adType: "real_estate",
            content: prefix + contactMessage.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");
      setContactFeedback({ type: "ok", text: "Message envoyé au vendeur. Suivez la conversation dans votre Messagerie." });
      setContactMessage("");
    } catch (e) {
      setContactFeedback({ type: "err", text: e instanceof Error ? e.message : "Erreur lors de l'envoi" });
    } finally {
      setContactSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)]">
        Chargement de l'annonce...
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Annonce introuvable</h1>
          <p className="text-[var(--text-muted)] mb-6">Cette annonce n'existe pas ou a été supprimée.</p>
          <Link href="/immobilier" className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-all">
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  const dossierItems = [
    { label: "Type de construction", value: dossier?.constructionType || "Non renseigné" },
    { label: "Surface habitable", value: dossier?.habitableSurface || (ad.surface ? `${ad.surface} m²` : "Non renseigné") },
    { label: "État général", value: dossier?.generalState || "Non renseigné" },
    { label: "Année construction", value: dossier?.yearBuilt || "Non renseigné" },
    { label: "Salles de bains", value: dossier?.bathroomsCount || "Non renseigné" },
    { label: "Salles d'eau", value: dossier?.waterRoomsCount || "Non renseigné" },
    { label: "WC séparés", value: dossier?.separateWcCount || "Non renseigné" },
    { label: "Chauffage", value: dossier?.heatingType || "Non renseigné" },
    { label: "DPE", value: dossier?.dpeClass || "Non renseigné" },
  ];

  const diagnosticItems = [
    { label: "Gaz", value: dossier?.gasInstallState || "Non renseigné" },
    { label: "Électricité", value: dossier?.electricInstallState || "Non renseigné" },
    { label: "Amiante", value: dossier?.asbestos || "Non renseigné" },
    { label: "Termites", value: dossier?.termites || "Non renseigné" },
    { label: "Plomb", value: dossier?.leadRisk || "Non renseigné" },
    { label: "ERNMT", value: dossier?.ernmtRisk || "Non renseigné" },
  ];

  const descriptiveSections = [
    {
      title: "Présentation",
      items: [
        { label: "Description libre", value: dossier?.specialObservations || "Aucune description détaillée renseignée." },
        { label: "Type d'annonce", value: ad.ad_type === "sale" ? "Vente" : "Location" },
        { label: "Adresse", value: [ad.address, ad.postal_code, ad.city].filter(Boolean).join(", ") || "Non renseigné" },
      ],
    },
    {
      title: "Caractéristiques",
      items: dossierItems,
    },
    {
      title: "Diagnostics",
      items: diagnosticItems,
    },
    {
      title: "Dossier vendeur",
      items: [
        { label: "Vendeur", value: dossier?.sellerFullName || ad.author_name || "Non renseigné" },
        { label: "Téléphone", value: dossier?.sellerPhone || "Non renseigné" },
        { label: "Email", value: dossier?.sellerEmail || "Non renseigné" },
        { label: "Charges annuelles", value: dossier?.annualCharges || (ad.charges ? `${ad.charges} FC` : "Non renseigné") },
        { label: "Dépôt de garantie", value: dossier?.guaranteeDeposit || "Non renseigné" },
        { label: "Compromis", value: dossier?.compromiseDate || "Non renseigné" },
        { label: "Acte authentique", value: dossier?.authenticActDate || "Non renseigné" },
      ],
    },
  ];

  const goToPreviousImage = () => {
    if (gallery.length <= 1) {
      return;
    }
    setCurrentImage((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    if (gallery.length <= 1) {
      return;
    }
    setCurrentImage((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-primary)] py-8 lg:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/immobilier" className="inline-flex items-center gap-2 text-[11px] text-[var(--text-secondary)] hover:text-primary mb-6 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> Retour
          </Link>

          <div className="space-y-6">
            <section className="rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="relative aspect-[16/9] bg-[var(--bg-secondary)] overflow-hidden">
                {gallery[currentImage] ? (
                  <img src={gallery[currentImage]} alt={ad.title} className="w-full h-full object-cover transition-all duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-slate-700/40 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                    <HomeIcon className="w-20 h-20 text-white/60" />
                    <span>Aucune image disponible</span>
                  </div>
                )}

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/92 text-slate-700 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Image précédente"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/92 text-slate-700 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Image suivante"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                      {currentImage + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {gallery.length > 1 && (
                <div className="flex gap-1 p-2 bg-[var(--bg-card)] overflow-x-auto">
                  {gallery.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setCurrentImage(index)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                        index === currentImage ? "ring-2 ring-primary opacity-100" : "opacity-50 hover:opacity-80"
                      }`}
                      aria-label={`Image ${index + 1}`}
                    >
                      <img src={photo} alt={`Miniature ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),320px] gap-8 items-start">
              <div className="space-y-5">
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {ad.ad_type === "sale" ? "Vente" : "Location"}
                    </span>
                    <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize">
                      {ad.status}
                    </span>
                  </div>

                  <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">{ad.title}</h1>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      <span>{[ad.address, ad.postal_code, ad.city].filter(Boolean).join(", ")}</span>
                    </div>
                  </div>

                  <div className="text-[28px] leading-none font-bold text-primary">{formatPrice(ad)}</div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    {(ad.surface != null && ad.surface > 0) && (
                      <div className="min-w-[110px] rounded-2xl bg-[var(--bg-secondary)] px-5 py-3.5 text-center">
                        <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{ad.surface} m²</div>
                        <div className="mt-1.5 text-[11px] text-[var(--text-muted)]">Surface</div>
                      </div>
                    )}
                    {(ad.rooms != null && ad.rooms > 0) && (
                      <div className="min-w-[110px] rounded-2xl bg-[var(--bg-secondary)] px-5 py-3.5 text-center">
                        <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{ad.rooms}</div>
                        <div className="mt-1.5 text-[11px] text-[var(--text-muted)]">Pièces</div>
                      </div>
                    )}
                    {(dossier?.constructionType === "appartement" || dossier?.constructionType === "immeuble") && dossier?.apartmentCount && Number(dossier.apartmentCount) > 0 && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                        <img src="/appartement.png" alt="Appartement" className="w-6 h-6 object-contain shrink-0" />
                        <div>
                          <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{dossier.apartmentCount}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">Appartement{Number(dossier.apartmentCount) > 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    )}
                    {dossier?.salonCount && Number(dossier.salonCount) > 0 && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                        <img src="/salon.png" alt="Salon" className="w-6 h-6 object-contain shrink-0" />
                        <div>
                          <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{dossier.salonCount}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">Salon{Number(dossier.salonCount) > 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    )}
                    {ad.bedrooms != null && ad.bedrooms > 0 && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                        <img src="/chambre.png" alt="Chambre" className="w-6 h-6 object-contain shrink-0" />
                        <div>
                          <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{ad.bedrooms}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">Chambre{ad.bedrooms > 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    )}
                    {dossier?.bathroomsCount && Number(dossier.bathroomsCount) > 0 && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                        <img src="/sdb.png" alt="Salle de bain" className="w-6 h-6 object-contain shrink-0" />
                        <div>
                          <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{dossier.bathroomsCount}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">Salle de bain</div>
                        </div>
                      </div>
                    )}
                    {dossier?.separateWcCount && Number(dossier.separateWcCount) > 0 && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                        <img src="/wc.png" alt="Toilette" className="w-6 h-6 object-contain shrink-0" />
                        <div>
                          <div className="text-[15px] font-bold leading-none text-[var(--text-primary)]">{dossier.separateWcCount}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">Toilette{Number(dossier.separateWcCount) > 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="py-2">
                  <h2 className="text-[16px] font-bold leading-none text-[var(--text-primary)]">Description</h2>
                  <p className="mt-2 max-w-2xl text-[13px] text-[var(--text-secondary)] leading-[1.55] whitespace-pre-wrap line-clamp-3">
                    {dossier?.specialObservations || ad.description || "Aucune description disponible."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDescriptionOpen(true)}
                    className="mt-2 text-[16px] font-bold text-primary hover:underline"
                  >
                    Plus de détails
                  </button>
                </section>
              </div>

              <aside className="lg:sticky lg:top-24">
                <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                  <h2 className="text-[20px] font-bold leading-none text-[var(--text-primary)] mb-4">Contacter le vendeur</h2>

                  <div className={`gap-5 ${(ad.author_phone || ad.author_email || ad.author_adresse) ? 'grid grid-cols-1 sm:grid-cols-2' : ''}`}>
                    {/* Formulaire de contact */}
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Votre nom"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                      />
                      <input
                        type="email"
                        placeholder="Votre email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                      />
                      <input
                        type="tel"
                        placeholder="Téléphone (optionnel)"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                      />
                      <textarea
                        rows={4}
                        placeholder="Votre message..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value.slice(0, 5000))}
                        className="w-full resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                      />
                      {contactFeedback && (
                        <p className={`text-[11px] ${contactFeedback.type === "ok" ? "text-emerald-500" : "text-red-500"}`}>
                          {contactFeedback.text}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={sendContactMessage}
                        disabled={contactSending}
                        className="w-full rounded-full bg-primary px-4 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                      >
                        {contactSending ? "Envoi..." : "Envoyer"}
                      </button>
                    </div>

                    {/* Coordonnées du vendeur */}
                    {(ad.author_phone || ad.author_email || ad.author_adresse) && (
                      <div className="flex flex-col gap-3">
                        <p className="text-[16px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Coordonnées du vendeur</p>
                        {ad.author_name && (
                          <div className="flex items-center gap-2.5">
                            <img src="/UserIcon.png" alt="Vendeur" className="w-6 h-6 object-contain shrink-0" />
                            <Link
                              href={`/immobilier/vendeur/${ad.user_id}`}
                              className="text-[18px] text-primary hover:underline break-all font-medium"
                            >
                              {ad.author_name}
                            </Link>
                          </div>
                        )}
                        {ad.author_phone && (
                          <div className="flex items-center gap-2.5">
                            <img src="/PhoneIcon.png" alt="Téléphone" className="w-6 h-6 object-contain shrink-0" />
                            <a href={`tel:${ad.author_phone}`} className="text-[18px] text-primary hover:underline break-all">
                              {ad.author_phone}
                            </a>
                          </div>
                        )}
                        {ad.author_phone && (
                          <div className="flex items-center gap-2.5">
                            <img src="/ChatBubbleLeftEllipsisIcon.png" alt="WhatsApp" className="w-6 h-6 object-contain shrink-0" />
                            <a
                              href={`https://wa.me/${ad.author_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[18px] text-emerald-500 hover:underline break-all"
                            >
                              WhatsApp
                            </a>
                          </div>
                        )}
                        {ad.author_email && (
                          <div className="flex items-center gap-2.5">
                            <img src="/EnvelopeIcon.png" alt="Email" className="w-6 h-6 object-contain shrink-0" />
                            <a href={`mailto:${ad.author_email}`} className="text-[18px] text-primary hover:underline break-all">
                              {ad.author_email}
                            </a>
                          </div>
                        )}
                        {ad.author_adresse && (
                          <div className="flex items-start gap-2.5">
                            <img src="/MapPinIcon.png" alt="Adresse" className="w-6 h-6 object-contain shrink-0 mt-0.5" />
                            <span className="text-[18px] text-[var(--text-primary)] break-words">{ad.author_adresse}</span>
                          </div>
                        )}
                        {!ad.author_phone && !ad.author_email && !ad.author_adresse && (
                          <p className="text-[11px] text-[var(--text-secondary)]">Coordonnées non renseignées</p>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {isDescriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fermer la fenêtre descriptive"
            onClick={() => {
              if (isEditing) return;
              setIsDescriptionOpen(false);
            }}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 bg-[var(--bg-card)]/40 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] ring-1 ring-white/10 flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-white/15 bg-white/5 backdrop-blur-xl px-5 py-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-amber-400">📄</span>
                <h2 className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {isEditing ? "Modification" : "Description"} – {ad.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isEditing) cancelEdit();
                  setIsDescriptionOpen(false);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {!isEditing ? (
                descriptiveSections.map((section) => (
                  <section key={section.title} className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
                    <div className="bg-white/10 px-4 py-2.5 border-b border-white/15">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      {section.items.map((item) => (
                        <div key={`${section.title}-${item.label}`} className="flex items-start justify-between gap-4 px-4 py-2.5">
                          <div className="text-[13px] text-[var(--text-secondary)] flex-shrink-0">{item.label}</div>
                          <div className="text-[13px] text-[var(--text-primary)] text-right break-words whitespace-pre-wrap">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <EditForm
                  ad={ad}
                  editAd={editAd}
                  setEditAd={setEditAd}
                  editDossier={editDossier}
                  setEditDossier={setEditDossier}
                  removedPhotos={removedPhotos}
                  togglePhotoRemoval={togglePhotoRemoval}
                  newImageFiles={newImageFiles}
                  removeNewFile={removeNewFile}
                  handleAddImages={handleAddImages}
                  fileInputRef={fileInputRef}
                />
              )}
            </div>

            {canEdit && (
              <div className="border-t border-white/15 bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-end gap-2">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={enterEditMode}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" /> Modifier
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-[var(--text-primary)] px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showAuthPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] text-center mb-2">
              Compte requis
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] text-center mb-6">
              Veuillez créer un compte pour utiliser la messagerie et contacter le vendeur.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <Link
                href="/connexion"
                className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-[12px] font-medium text-[var(--text-primary)] text-center hover:bg-[var(--bg-hover)] transition-all"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-white text-center hover:bg-primary-hover transition-all"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type EditFormProps = {
  ad: RealEstateDetail;
  editAd: Partial<RealEstateDetail>;
  setEditAd: React.Dispatch<React.SetStateAction<Partial<RealEstateDetail>>>;
  editDossier: DossierData;
  setEditDossier: React.Dispatch<React.SetStateAction<DossierData>>;
  removedPhotos: string[];
  togglePhotoRemoval: (url: string) => void;
  newImageFiles: File[];
  removeNewFile: (index: number) => void;
  handleAddImages: (files: FileList | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

function EditForm({
  ad,
  editAd,
  setEditAd,
  editDossier,
  setEditDossier,
  removedPhotos,
  togglePhotoRemoval,
  newImageFiles,
  removeNewFile,
  handleAddImages,
  fileInputRef,
}: EditFormProps) {
  const setAdField = <K extends keyof RealEstateDetail>(key: K, value: RealEstateDetail[K] | string) => {
    setEditAd((prev) => ({ ...prev, [key]: value as RealEstateDetail[K] }));
  };
  const setDossierField = (key: keyof DossierData, value: string) => {
    setEditDossier((prev) => ({ ...prev, [key]: value }));
  };

  const sectionClass = "rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl overflow-hidden shadow-sm";
  const headerClass = "bg-white/10 px-4 py-2.5 border-b border-white/15";
  const headerTitleClass = "text-sm font-semibold text-[var(--text-primary)]";
  const rowClass = "px-4 py-2.5 border-b border-white/10 last:border-b-0";
  const labelClass = "text-[12px] text-[var(--text-secondary)] mb-1 block";
  const inputClass =
    "w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-primary";

  return (
    <>
      <section className={sectionClass}>
        <div className={headerClass}><h3 className={headerTitleClass}>Présentation</h3></div>
        <div>
          <div className={rowClass}>
            <label className={labelClass}>Titre</label>
            <input className={inputClass} value={editAd.title ?? ""} onChange={(e) => setAdField("title", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Description libre</label>
            <textarea
              rows={3}
              className={inputClass + " resize-none"}
              value={editDossier.specialObservations ?? ""}
              onChange={(e) => setDossierField("specialObservations", e.target.value)}
            />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Type d&apos;annonce</label>
            <select
              className={inputClass}
              value={editAd.ad_type ?? "sale"}
              onChange={(e) => setAdField("ad_type", e.target.value as "sale" | "rent")}
            >
              <option value="sale">Vente</option>
              <option value="rent">Location</option>
            </select>
          </div>
          <div className={rowClass}>
            <label className={labelClass}>{editAd.ad_type === "rent" ? "Loyer ($)" : "Prix ($)"}</label>
            {editAd.ad_type === "rent" ? (
              <input
                type="number"
                className={inputClass}
                value={editAd.rent_price ?? ""}
                onChange={(e) => setAdField("rent_price", e.target.value === "" ? null : Number(e.target.value))}
              />
            ) : (
              <input
                type="number"
                className={inputClass}
                value={editAd.price ?? ""}
                onChange={(e) => setAdField("price", e.target.value === "" ? null : Number(e.target.value))}
              />
            )}
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Adresse</label>
            <input className={inputClass} value={editAd.address ?? ""} onChange={(e) => setAdField("address", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Ville</label>
            <input className={inputClass} value={editAd.city ?? ""} onChange={(e) => setAdField("city", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Code postal</label>
            <input className={inputClass} value={editAd.postal_code ?? ""} onChange={(e) => setAdField("postal_code", e.target.value)} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={headerClass}><h3 className={headerTitleClass}>Caractéristiques</h3></div>
        <div>
          <div className={rowClass}>
            <label className={labelClass}>Surface (m²)</label>
            <input
              type="number"
              className={inputClass}
              value={editAd.surface ?? ""}
              onChange={(e) => setAdField("surface", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Pièces</label>
            <input
              type="number"
              className={inputClass}
              value={editAd.rooms ?? ""}
              onChange={(e) => setAdField("rooms", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Chambres</label>
            <input
              type="number"
              className={inputClass}
              value={editAd.bedrooms ?? ""}
              onChange={(e) => setAdField("bedrooms", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Type de construction</label>
            <select className={inputClass} value={editDossier.constructionType ?? ""} onChange={(e) => setDossierField("constructionType", e.target.value)}>
              <option value="">-- Sélectionner --</option>
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
              <option value="villa_de_luxe">Villa de luxe</option>
              <option value="terrasse">Terrasse</option>
              <option value="détaché">Détaché</option>
              <option value="semi-détaché">Semi-détaché</option>
              <option value="duplex">Duplex</option>
              <option value="studio">Studio</option>
              <option value="immeuble">Immeuble</option>
              <option value="bureau">Bureau</option>
              <option value="commerce">Commerce</option>
            </select>
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Surface habitable (texte)</label>
            <input className={inputClass} value={editDossier.habitableSurface ?? ""} onChange={(e) => setDossierField("habitableSurface", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>État général</label>
            <input className={inputClass} value={editDossier.generalState ?? ""} onChange={(e) => setDossierField("generalState", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Année construction</label>
            <input className={inputClass} value={editDossier.yearBuilt ?? ""} onChange={(e) => setDossierField("yearBuilt", e.target.value)} />
          </div>
          {(editDossier.constructionType === "immeuble" || editDossier.constructionType === "appartement") && (
            <div className="mx-4 my-3 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
              <div className="px-4 py-2 border-b border-primary/20 bg-primary/10">
                <span className="text-[12px] font-semibold text-primary">Composition de l&apos;immeuble</span>
              </div>
              <div className="px-4 py-2.5">
                <label className={labelClass}>Nombre d&apos;appartements</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={editDossier.apartmentCount ?? ""}
                  onChange={(e) => setDossierField("apartmentCount", e.target.value)}
                  placeholder="Ex: 12"
                />
              </div>
            </div>
          )}
          <div className={rowClass}>
            <label className={labelClass}>Salons</label>
            <input type="number" min="0" className={inputClass} value={editDossier.salonCount ?? ""} onChange={(e) => setDossierField("salonCount", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Salles de bains</label>
            <input className={inputClass} value={editDossier.bathroomsCount ?? ""} onChange={(e) => setDossierField("bathroomsCount", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Salles d&apos;eau</label>
            <input className={inputClass} value={editDossier.waterRoomsCount ?? ""} onChange={(e) => setDossierField("waterRoomsCount", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>WC séparés</label>
            <input className={inputClass} value={editDossier.separateWcCount ?? ""} onChange={(e) => setDossierField("separateWcCount", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Chauffage</label>
            <input className={inputClass} value={editDossier.heatingType ?? ""} onChange={(e) => setDossierField("heatingType", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>DPE</label>
            <input className={inputClass} value={editDossier.dpeClass ?? ""} onChange={(e) => setDossierField("dpeClass", e.target.value)} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={headerClass}><h3 className={headerTitleClass}>Diagnostics</h3></div>
        <div>
          {([
            ["gasInstallState", "Gaz"],
            ["electricInstallState", "Électricité"],
            ["asbestos", "Amiante"],
            ["termites", "Termites"],
            ["leadRisk", "Plomb"],
            ["ernmtRisk", "ERNMT"],
          ] as Array<[keyof DossierData, string]>).map(([k, label]) => (
            <div key={k as string} className={rowClass}>
              <label className={labelClass}>{label}</label>
              <input
                className={inputClass}
                value={(editDossier[k] as string) ?? ""}
                onChange={(e) => setDossierField(k, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <div className={headerClass}><h3 className={headerTitleClass}>Dossier vendeur</h3></div>
        <div>
          <div className={rowClass}>
            <label className={labelClass}>Vendeur</label>
            <input className={inputClass} value={editDossier.sellerFullName ?? ""} onChange={(e) => setDossierField("sellerFullName", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Téléphone</label>
            <input className={inputClass} value={editDossier.sellerPhone ?? ""} onChange={(e) => setDossierField("sellerPhone", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={editDossier.sellerEmail ?? ""} onChange={(e) => setDossierField("sellerEmail", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Charges annuelles ($)</label>
            <input
              type="number"
              className={inputClass}
              value={editAd.charges ?? ""}
              onChange={(e) => setAdField("charges", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Dépôt de garantie</label>
            <input className={inputClass} value={editDossier.guaranteeDeposit ?? ""} onChange={(e) => setDossierField("guaranteeDeposit", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Compromis</label>
            <input className={inputClass} value={editDossier.compromiseDate ?? ""} onChange={(e) => setDossierField("compromiseDate", e.target.value)} />
          </div>
          <div className={rowClass}>
            <label className={labelClass}>Acte authentique</label>
            <input className={inputClass} value={editDossier.authenticActDate ?? ""} onChange={(e) => setDossierField("authenticActDate", e.target.value)} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={headerClass}>
          <div className="flex items-center justify-between">
            <h3 className={headerTitleClass}>Images</h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-white px-2.5 py-1 text-[12px] font-medium hover:bg-primary-hover transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Ajouter
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleAddImages(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ad.photos.map((url) => {
              const removed = removedPhotos.includes(url);
              return (
                <div key={url} className={`relative aspect-square rounded-md overflow-hidden border ${removed ? "border-red-500/60 opacity-40" : "border-white/15"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => togglePhotoRemoval(url)}
                    className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                    title={removed ? "Annuler la suppression" : "Supprimer"}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {newImageFiles.map((f, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-md overflow-hidden border border-emerald-500/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 rounded bg-emerald-600/80 text-white text-[10px] px-1.5 py-0.5">Nouvelle</span>
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {ad.photos.length === 0 && newImageFiles.length === 0 && (
              <div className="col-span-full flex items-center justify-center gap-2 text-[12px] text-[var(--text-secondary)] py-6">
                <PhotoIcon className="w-4 h-4" /> Aucune image
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
