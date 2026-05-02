"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

type Ad = {
  id: string;
  title: string;
  price: number | null;
  rent_price: number | null;
  surface: number | null;
  rooms: number | null;
  address: string;
  city: string | null;
  ad_type: "sale" | "rent";
  photos: string[];
  author_name?: string;
  author_phone?: string | null;
  author_email?: string | null;
};

function formatPrice(price: number, type: "sale" | "rent") {
  return type === "rent"
    ? `${price.toLocaleString("fr-FR")} FC/mois`
    : `${price.toLocaleString("fr-FR")} FC`;
}

export default function VendeurPage() {
  const { userId } = useParams<{ userId: string }>();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState<string>("");
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [sellerEmail, setSellerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/real-estate/ads/by-user/${userId}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const list: Ad[] = Array.isArray(data.data) ? data.data : [];
        setAds(list);
        if (list.length > 0) {
          setSellerName(list[0].author_name || "Vendeur");
          setSellerPhone(list[0].author_phone || null);
          setSellerEmail(list[0].author_email || null);
        }
      } catch {
        setAds([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <span>/</span>
            <Link href="/immobilier" className="hover:text-primary">Immobilier</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Vendeur</span>
          </div>

          <Link
            href="/immobilier"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary mb-5 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour aux annonces
          </Link>

          {/* Profil vendeur */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
              <img src="/UserIcon.png" alt="Vendeur" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {loading ? "Chargement..." : sellerName || "Vendeur"}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                {loading ? "" : `${ads.length} annonce${ads.length !== 1 ? "s" : ""} publiée${ads.length !== 1 ? "s" : ""}`}
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                {sellerPhone && (
                  <a href={`tel:${sellerPhone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <img src="/PhoneIcon.png" alt="Tel" className="w-4 h-4 object-contain" />
                    {sellerPhone}
                  </a>
                )}
                {sellerEmail && (
                  <a href={`mailto:${sellerEmail}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <img src="/EnvelopeIcon.png" alt="Email" className="w-4 h-4 object-contain" />
                    {sellerEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annonces */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[var(--bg-secondary)]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <HomeIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] text-lg">Aucune annonce active pour ce vendeur.</p>
            <Link href="/immobilier" className="mt-4 inline-block text-primary hover:underline text-sm">
              Voir toutes les annonces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => {
              const displayPrice = ad.price ?? ad.rent_price;
              return (
                <Link
                  key={ad.id}
                  href={`/immobilier/${ad.id}`}
                  className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]
                    overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
                    {ad.photos?.[0] ? (
                      <img
                        src={ad.photos[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-slate-700/40 flex items-center justify-center">
                        <HomeIcon className="w-12 h-12 text-white/60" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        ad.ad_type === "rent" ? "bg-emerald-500" : "bg-blue-600"
                      }`}>
                        {ad.ad_type === "rent" ? "Location" : "Vente"}
                      </span>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {ad.title}
                    </h3>
                    {displayPrice && (
                      <p className="text-lg font-bold text-primary mb-2">
                        {formatPrice(displayPrice, ad.ad_type)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                      {ad.surface && <span>{ad.surface} m²</span>}
                      {ad.rooms && <span>{ad.rooms} pièce{ad.rooms > 1 ? "s" : ""}</span>}
                    </div>
                    {(ad.city || ad.address) && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-[var(--text-muted)]">
                        <img src="/MapPinIcon.png" alt="Localisation" className="w-3.5 h-3.5 object-contain shrink-0" />
                        <span className="truncate">{ad.city || ad.address}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
