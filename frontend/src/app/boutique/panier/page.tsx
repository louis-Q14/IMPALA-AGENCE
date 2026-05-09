"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/context/BoutiqueCartContext";
import { formatCDF, formatUSD } from "../data";

export default function PanierPage() {
  const router = useRouter();
  const { items, totalItems, totalCDF, totalUSD, updateQuantity, removeFromCart, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBagIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Votre panier est vide</h2>
        <p className="text-gray-500 mb-8">Découvrez nos produits !</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/boutique/menager" className="bg-[#e63900] text-white font-bold px-6 py-3 rounded-full hover:bg-[#c43200] transition-colors text-sm">
            Électroménager
          </Link>
          <Link href="/boutique/automobile" className="bg-gray-900 text-white font-bold px-6 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm">
            Pièces auto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mon panier</h1>
          <p className="text-gray-400 text-sm mt-1">{totalItems} article{totalItems > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
        >
          <TrashIcon className="w-4 h-4" />
          Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* ── Article list ── */}
        <div className="lg:col-span-3">

          {/* Column headers */}
          <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-1">
            <span className="col-span-6">Produit</span>
            <span className="col-span-3 text-center">Qté</span>
            <span className="col-span-3 text-right">Total</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-700 mb-1" />

          {/* Rows */}
          {items.map(({ product, quantite }, idx) => (
            <div key={product.id}>
              <div className="grid grid-cols-12 items-center py-5 gap-2">

                {/* Image + info */}
                <div className="col-span-6 flex items-center gap-4">
                  <Link href={`/boutique/produit/${product.id}`} className="flex-shrink-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image src={product.image} alt={product.nom} fill className="object-cover" sizes="64px" />
                    </div>
                  </Link>
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{product.marque}</div>
                    <Link href={`/boutique/produit/${product.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#e63900] transition-colors line-clamp-2 leading-snug">
                      {product.nom}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">{formatCDF(product.prix_cdf)} / unité</div>
                  </div>
                </div>

                {/* Qty */}
                <div className="col-span-3 flex justify-center">
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-600 rounded-full px-1 py-1">
                    <button
                      onClick={() => updateQuantity(product.id, quantite - 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{quantite}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantite + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Price + delete */}
                <div className="col-span-3 flex items-center justify-end gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900 dark:text-white">{formatCDF(product.prix_cdf * quantite)}</div>
                    {product.prix_usd && (
                      <div className="text-[11px] text-gray-400">≈ {formatUSD(product.prix_usd * quantite)}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              {idx < items.length - 1 && (
                <div className="h-px bg-gray-100 dark:bg-gray-700" />
              )}
            </div>
          ))}

          <div className="h-px bg-gray-100 dark:bg-gray-700 mt-1" />

          <Link href="/boutique" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-5">
            ← Continuer mes achats
          </Link>
        </div>

        {/* ── Summary ── */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 sticky top-24">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5">Récapitulatif</h2>

            {/* Line items */}
            <div className="flex flex-col gap-2.5 mb-5">
              {items.map(({ product, quantite }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                    {product.nom.length > 22 ? product.nom.slice(0, 22) + "…" : product.nom} ×{quantite}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white ml-2 flex-shrink-0">
                    {formatCDF(product.prix_cdf * quantite)}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700 mb-4" />

            <div className="flex justify-between items-baseline mb-1">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Sous-total</span>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{formatCDF(totalCDF)}</div>
                <div className="text-xs text-gray-400">≈ {formatUSD(totalUSD)}</div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-6">
              <span>Livraison</span>
              <span className="text-green-600 font-medium">Calculée à la commande</span>
            </div>

            {/* Mobile Money */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">M-PESA</span>
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">ORANGE MONEY</span>
              <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">AIRTEL MONEY</span>
            </div>

            <button
              onClick={() => router.push("/boutique/commande")}
              className="w-full bg-[#e63900] hover:bg-[#c43200] text-white font-black py-4 rounded-2xl transition-colors text-sm"
            >
              Passer la commande →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/boutique/menager"
            className="bg-[#e63900] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#c43200] transition-colors"
          >
            🏠 Voir l&apos;électroménager
          </Link>
          <Link
            href="/boutique/automobile"
            className="bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl hover:bg-slate-900 transition-colors"
          >
            🚗 Voir les pièces auto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          Panier · <span className="text-[#e63900]">{totalItems} article{totalItems > 1 ? "s" : ""}</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <TrashIcon className="w-4 h-4" />
          Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map(({ product, quantite }) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100"
            >
              <Link href={`/boutique/produit/${product.id}`} className="flex-shrink-0">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.nom}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  {product.marque} · {product.sous_categorie}
                </div>
                <Link
                  href={`/boutique/produit/${product.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-[#e63900] line-clamp-2 transition-colors"
                >
                  {product.nom}
                </Link>

                <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(product.id, quantite - 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-200 text-gray-800"
                    >
                      <MinusIcon className="w-3.5 h-3.5 text-gray-900" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{quantite}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantite + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-200 text-gray-800"
                    >
                      <PlusIcon className="w-3.5 h-3.5 text-gray-900" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-[#e63900] font-black text-sm">
                      {formatCDF(product.prix_cdf * quantite)}
                    </div>
                    {product.prix_usd && (
                      <div className="text-gray-400 text-xs">
                        ≈ {formatUSD(product.prix_usd * quantite)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeFromCart(product.id)}
                className="flex-shrink-0 self-start text-gray-300 hover:text-red-500 transition-colors p-1"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-black text-gray-900 mb-5">Récapitulatif</h2>

            <div className="flex flex-col gap-3 mb-5">
              {items.map(({ product, quantite }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[160px]">
                    {product.nom} ×{quantite}
                  </span>
                  <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">
                    {formatCDF(product.prix_cdf * quantite)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 text-sm">Sous-total</span>
                <div className="text-right">
                  <div className="text-xl font-black text-[#e63900]">{formatCDF(totalCDF)}</div>
                  <div className="text-xs text-gray-400">≈ {formatUSD(totalUSD)}</div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                <span>Livraison</span>
                <span className="text-green-600 font-medium">Calculée à la commande</span>
              </div>
            </div>

            {/* Mobile Money logos */}
            <div className="bg-green-50 rounded-xl p-3 mb-5">
              <div className="text-xs text-green-700 font-semibold mb-2">Paiement accepté :</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">M-PESA</span>
                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ORANGE MONEY</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AIRTEL MONEY</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/boutique/commande")}
              className="w-full bg-[#e63900] hover:bg-[#c43200] text-white font-black py-4 rounded-2xl transition-colors text-sm"
            >
              Passer la commande →
            </button>

            <Link
              href="/boutique"
              className="mt-3 w-full flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs transition-colors"
            >
              ← Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
