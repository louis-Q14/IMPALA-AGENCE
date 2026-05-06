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
        <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-800 mb-2">Votre panier est vide</h2>
        <p className="text-gray-500 mb-8">Tala biloko na biso — découvrez nos produits !</p>
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
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(product.id, quantite - 1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{quantite}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantite + 1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
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
