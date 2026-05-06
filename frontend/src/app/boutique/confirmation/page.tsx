"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { formatCDF } from "../data";

interface CommandeInfo {
  ref: string;
  client?: { nom: string; telephone: string; ville: string };
  total_cdf: number;
  paiement?: { methode: string; numero: string };
}

export default function ConfirmationPage() {
  const [commande, setCommande] = useState<CommandeInfo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("impala_last_commande");
      if (raw) setCommande(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {/* Success icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Commande confirmée !</h1>
      <p className="text-gray-500 mb-2">Merci pour votre achat 🎉</p>
      <p className="text-gray-400 text-sm mb-8">
        Notre équipe va traiter votre commande et vous contactera par SMS/WhatsApp pour la livraison.
      </p>

      {/* Order details card */}
      {commande && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 text-left">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
            Détails de la commande
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Référence</span>
              <span className="font-mono font-bold text-gray-900">{commande.ref}</span>
            </div>
            {commande.client?.nom && (
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-semibold text-gray-900">{commande.client.nom}</span>
              </div>
            )}
            {commande.client?.telephone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Téléphone</span>
                <span className="font-semibold text-gray-900">{commande.client.telephone}</span>
              </div>
            )}
            {commande.client?.ville && (
              <div className="flex justify-between">
                <span className="text-gray-500">Ville</span>
                <span className="font-semibold text-gray-900">{commande.client.ville}</span>
              </div>
            )}
            {commande.paiement?.methode && (
              <div className="flex justify-between">
                <span className="text-gray-500">Paiement</span>
                <span className="font-bold text-gray-900 uppercase">{commande.paiement.methode}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-black text-gray-900">Total payé</span>
              <span className="font-black text-[#e63900] text-lg">{formatCDF(commande.total_cdf)}</span>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp follow-up */}
      <a
        href={`https://wa.me/243000000000?text=Bonjour IMPALA BOUTIQUE ! Ma commande ${commande?.ref ?? ""} a été passée. Je souhaite avoir des informations sur la livraison.`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm mb-4"
      >
        💬 Suivre ma commande sur WhatsApp
      </a>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/boutique"
          className="bg-[#e63900] hover:bg-[#c43200] text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm"
        >
          ← Retour à la boutique
        </Link>
        <Link
          href="/boutique/menager"
          className="border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-2xl transition-colors text-sm"
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
