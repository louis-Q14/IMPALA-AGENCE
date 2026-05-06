"use client";

import { useParams, notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { PRODUITS, formatCDF, formatUSD } from "../../data";
import { useCart } from "@/context/BoutiqueCartContext";

export default function ProduitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const product = PRODUITS.find((p) => p.id === Number(id));

  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return notFound();

  const images = product.images?.length ? product.images : [product.image];
  const accentColor = product.categorie === "automobile" ? "#0ea5e9" : "#e63900";
  const related = PRODUITS.filter(
    (p) => p.categorie === product.categorie && p.id !== product.id && p.disponible
  ).slice(0, 4);

  function handleAdd() {
    addToCart(product!, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addToCart(product!, qty);
    router.push("/boutique/panier");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/boutique" className="hover:text-gray-600">Boutique</Link>
        <span>/</span>
        <Link
          href={`/boutique/${product.categorie}`}
          className="hover:text-gray-600 capitalize"
        >
          {product.categorie === "automobile" ? "Auto & Pièces" : "Ménager"}
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[200px]">{product.nom}</span>
      </nav>

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-md">
            <Image
              src={images[activeImg]}
              alt={product.nom}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {!product.disponible && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full">
                  Rupture de stock
                </span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === activeImg ? "border-current" : "border-transparent"
                  }`}
                  style={i === activeImg ? { borderColor: accentColor } : {}}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <span
              className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: accentColor }}
            >
              {product.marque}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-2">
              {product.nom}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarSolid key={i} className="w-4 h-4 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-400">4.8 · 24 avis</span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="text-3xl font-black" style={{ color: accentColor }}>
              {formatCDF(product.prix_cdf)}
            </div>
            {product.prix_usd && (
              <div className="text-gray-400 text-sm mt-1">≈ {formatUSD(product.prix_usd)}</div>
            )}
            <div className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${product.disponible ? "text-green-600" : "text-red-500"}`}>
              <div className={`w-2 h-2 rounded-full ${product.disponible ? "bg-green-500" : "bg-red-500"}`} />
              {product.disponible
                ? product.stock <= 5
                  ? `Plus que ${product.stock} en stock — commandez vite !`
                  : "En stock — livraison disponible"
                : "Rupture de stock"}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Specs */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Spécifications
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl px-3 py-2">
                    <div className="text-[10px] text-gray-400 uppercase">{k}</div>
                    <div className="text-sm font-semibold text-gray-800">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + CTA */}
          {product.disponible && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-600">Quantité :</div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all text-white"
                  style={added ? { backgroundColor: "#22c55e" } : { backgroundColor: accentColor }}
                >
                  {added ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Ajouté au panier
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="w-5 h-5" />
                      Ajouter au panier
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all hover:text-white"
                  style={{ borderColor: accentColor, color: accentColor }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentColor;
                    (e.currentTarget as HTMLButtonElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = accentColor;
                  }}
                >
                  Acheter maintenant
                </button>
              </div>
            </div>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TruckIcon className="w-4 h-4 text-green-500" />
              Livraison dans toute la RDC
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
              Paiement Mobile Money sécurisé
            </div>
          </div>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/243000000000?text=Bonjour, je suis intéressé(e) par ${encodeURIComponent(product.nom)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
          >
            💬 Commander via WhatsApp
          </a>
        </div>
      </div>

      {/* Produits similaires */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-5">Produits similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/boutique/produit/${p.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={p.image}
                    alt={p.nom}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3">
                  <div className="text-xs font-semibold text-gray-800 line-clamp-2">{p.nom}</div>
                  <div className="font-black text-sm mt-1" style={{ color: accentColor }}>
                    {formatCDF(p.prix_cdf)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
