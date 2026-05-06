"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingCartIcon, AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { PRODUITS, formatCDF, formatUSD } from "../data";
import { useCart } from "@/context/BoutiqueCartContext";
import type { Product } from "@/context/BoutiqueCartContext";

interface CataloguePageProps {
  categorie: "menager" | "automobile";
  titre: string;
  emoji: string;
  sousCats: { id: string; label: string; icon: string }[];
  accentColor: string;
  bgClass: string;
}

function ProductCard({
  product,
  accentColor,
}: {
  product: Product;
  accentColor: string;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <Link
      href={`/boutique/produit/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <Image
          src={product.image}
          alt={product.nom}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {!product.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Rupture de stock
            </span>
          </div>
        )}
        <span
          className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: accentColor }}
        >
          {product.marque}
        </span>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Plus que {product.stock} !
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{product.sous_categorie}</div>
        <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.nom}</div>
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarSolid key={i} className="w-3 h-3 text-amber-400" />
          ))}
          <span className="text-xs text-gray-400 ml-1">(24)</span>
        </div>
        <div className="mt-auto pt-2">
          <div className="font-black text-base" style={{ color: accentColor }}>
            {formatCDF(product.prix_cdf)}
          </div>
          {product.prix_usd && (
            <div className="text-gray-400 text-xs">≈ {formatUSD(product.prix_usd)}</div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!product.disponible}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all text-white"
          style={
            added
              ? { backgroundColor: "#22c55e" }
              : product.disponible
              ? { backgroundColor: accentColor }
              : { backgroundColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }
          }
        >
          <ShoppingCartIcon className="w-4 h-4" />
          {added ? "Ajouté ✓" : product.disponible ? "Ajouter au panier" : "Indisponible"}
        </button>
      </div>
    </Link>
  );
}

export default function CataloguePage({
  categorie,
  titre,
  emoji,
  sousCats,
  accentColor,
  bgClass,
}: CataloguePageProps) {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");

  const [activeCat, setActiveCat] = useState<string | null>(catParam);
  const [marqueFilter, setMarqueFilter] = useState<string | null>(null);
  const [prix, setPrix] = useState<[number, number]>([0, 2_000_000]);
  const [dispoOnly, setDispoOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<"prix_asc" | "prix_desc" | "nom">("nom");

  const produits = PRODUITS.filter((p) => p.categorie === categorie);
  const marques = [...new Set(produits.map((p) => p.marque))];

  const filtered = useMemo(() => {
    let list = produits;
    if (activeCat) list = list.filter((p) => p.sous_categorie === activeCat);
    if (marqueFilter) list = list.filter((p) => p.marque === marqueFilter);
    if (dispoOnly) list = list.filter((p) => p.disponible);
    list = list.filter((p) => p.prix_cdf >= prix[0] && p.prix_cdf <= prix[1]);
    if (sort === "prix_asc") list = [...list].sort((a, b) => a.prix_cdf - b.prix_cdf);
    if (sort === "prix_desc") list = [...list].sort((a, b) => b.prix_cdf - a.prix_cdf);
    if (sort === "nom") list = [...list].sort((a, b) => a.nom.localeCompare(b.nom));
    return list;
  }, [produits, activeCat, marqueFilter, dispoOnly, prix, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className={`rounded-3xl ${bgClass} p-8 mb-8 flex items-center gap-4`}>
        <span className="text-5xl">{emoji}</span>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">{titre}</h1>
          <p className="text-white/70 text-sm mt-1">{filtered.length} produit{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Sous-catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        <button
          onClick={() => setActiveCat(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
            !activeCat
              ? "text-white border-transparent"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
          style={!activeCat ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
        >
          Tout
        </button>
        {sousCats.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveCat(activeCat === id ? null : id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
              activeCat === id
                ? "text-white border-transparent"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
            style={activeCat === id ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:border-gray-300 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          Filtres
          {(marqueFilter || dispoOnly) && (
            <span
              className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            >
              {[marqueFilter, dispoOnly ? "dispo" : null].filter(Boolean).length}
            </span>
          )}
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none hover:border-gray-300 transition-colors"
        >
          <option value="nom">Nom A-Z</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex flex-wrap gap-6">
          {/* Marque */}
          <div>
            <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Marque</div>
            <div className="flex flex-wrap gap-2">
              {marques.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarqueFilter(marqueFilter === m ? null : m)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    marqueFilter === m ? "text-white border-transparent" : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                  style={marqueFilter === m ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Disponibilité */}
          <div>
            <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Disponibilité</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dispoOnly}
                onChange={(e) => setDispoOnly(e.target.checked)}
                className="rounded"
                style={{ accentColor }}
              />
              <span className="text-sm text-gray-700">En stock uniquement</span>
            </label>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setMarqueFilter(null); setDispoOnly(false); setPrix([0, 2_000_000]); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto self-end"
          >
            <XMarkIcon className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>Aucun produit ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} accentColor={accentColor} />
          ))}
        </div>
      )}
    </div>
  );
}
