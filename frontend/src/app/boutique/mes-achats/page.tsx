"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCDF } from "../data";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  ShoppingBagIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

/* ── Types ── */
type StatutCommande = "confirme" | "en_preparation" | "expedie" | "livre" | "annule";

interface ArticleCommande {
  nom: string;
  quantite: number;
  prix_unitaire: number;
}

interface Commande {
  ref: string;
  date: string; // ISO string
  statut: StatutCommande;
  client?: { nom: string; telephone: string; ville: string; adresse?: string };
  paiement?: { methode: string; numero: string; code_transaction?: string };
  livraison?: { type: string; frais: number };
  articles?: ArticleCommande[];
  total_cdf: number;
}

/* ── Statut config ── */
const STATUTS: { id: StatutCommande; label: string; short: string; color: string; bg: string; icon: React.ElementType }[] = [
  { id: "confirme",       label: "Commande confirmée",   short: "Confirmé",      color: "text-blue-600",  bg: "bg-blue-100",   icon: CheckCircleIcon },
  { id: "en_preparation", label: "En préparation",        short: "Préparation",   color: "text-amber-600", bg: "bg-amber-100",  icon: ClockIcon },
  { id: "expedie",        label: "Colis expédié",         short: "Expédié",       color: "text-purple-600",bg: "bg-purple-100", icon: TruckIcon },
  { id: "livre",          label: "Livré avec succès",     short: "Livré",         color: "text-green-600", bg: "bg-green-100",  icon: CheckCircleSolid },
];

const STEPS: StatutCommande[] = ["confirme", "en_preparation", "expedie", "livre"];

function getStepIndex(statut: StatutCommande) {
  return STEPS.indexOf(statut);
}

/* ── Simulate statut from elapsed time (demo) ── */
function simulateStatut(dateStr: string, storedStatut?: StatutCommande): StatutCommande {
  if (storedStatut === "annule") return "annule";
  const elapsed = Date.now() - new Date(dateStr).getTime();
  const h = elapsed / 3600000;
  if (h < 1) return "confirme";
  if (h < 24) return "en_preparation";
  if (h < 72) return "expedie";
  return "livre";
}

/* ── Statut badge ── */
function StatutBadge({ statut }: { statut: StatutCommande }) {
  if (statut === "annule") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
        <XCircleIcon className="w-3.5 h-3.5" /> Annulé
      </span>
    );
  }
  const cfg = STATUTS.find((s) => s.id === statut);
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.short}
    </span>
  );
}

/* ── Timeline ── */
function Timeline({ statut }: { statut: StatutCommande }) {
  if (statut === "annule") return null;
  const currentIdx = getStepIndex(statut);

  return (
    <div className="flex items-center gap-0 w-full mt-4 mb-2">
      {STATUTS.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? active
                    ? `border-[#e63900] bg-[#e63900] text-white`
                    : `border-green-500 bg-green-500 text-white`
                  : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400`
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px] ${
                done ? (active ? "text-[#e63900] font-bold" : "text-green-600 font-semibold") : "text-gray-400"
              }`}>
                {s.short}
              </span>
            </div>
            {i < STATUTS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < currentIdx ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Order card ── */
function CommandeCard({ commande, onCancel }: { commande: Commande; onCancel: (ref: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const statut = commande.statut;
  const canCancel = statut === "confirme" || statut === "en_preparation";

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{commande.ref}</span>
            <StatutBadge statut={statut} />
          </div>
          <div className="text-xs text-gray-400">
            {new Date(commande.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
          {commande.client?.ville && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              📍 {commande.client.ville}
              {commande.livraison?.type === "retrait" ? " — Retrait en boutique" : " — Livraison à domicile"}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[#e63900] font-black text-base">{formatCDF(commande.total_cdf)}</div>
          {commande.paiement?.methode && (
            <div className="text-xs text-gray-400 uppercase">{commande.paiement.methode}</div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {statut !== "annule" && (
        <div className="px-4">
          <Timeline statut={statut} />
        </div>
      )}

      {/* Annulé message */}
      {statut === "annule" && (
        <div className="mx-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <XCircleIcon className="w-5 h-5 flex-shrink-0" />
          Cette commande a été annulée.
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 rounded-xl px-3 py-2 transition-colors"
        >
          {expanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          {expanded ? "Masquer les détails" : "Voir les détails"}
        </button>

        {canCancel && (
          <button
            onClick={() => onCancel(commande.ref)}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-3 py-2 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            Annuler la commande
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 flex flex-col gap-4">
          {/* Articles */}
          {commande.articles && commande.articles.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Articles</div>
              <div className="flex flex-col gap-1.5">
                {commande.articles.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{a.nom} × {a.quantite}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCDF(a.prix_unitaire * a.quantite)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client info */}
          {commande.client && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Informations de livraison</div>
              <div className="flex flex-col gap-1 text-sm">
                {commande.client.nom && <div className="flex justify-between"><span className="text-gray-500">Nom</span><span className="text-gray-900 dark:text-white font-semibold">{commande.client.nom}</span></div>}
                {commande.client.telephone && <div className="flex justify-between"><span className="text-gray-500">Téléphone</span><span className="text-gray-900 dark:text-white font-semibold">{commande.client.telephone}</span></div>}
                {commande.client.adresse && <div className="flex justify-between"><span className="text-gray-500">Adresse</span><span className="text-gray-900 dark:text-white font-semibold text-right max-w-[60%]">{commande.client.adresse}</span></div>}
              </div>
            </div>
          )}

          {/* Paiement */}
          {commande.paiement?.methode && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Paiement</div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Méthode</span><span className="font-bold uppercase text-gray-900 dark:text-white">{commande.paiement.methode}</span></div>
                {commande.paiement.numero && <div className="flex justify-between"><span className="text-gray-500">Numéro</span><span className="text-gray-900 dark:text-white">{commande.paiement.numero}</span></div>}
                {commande.paiement.code_transaction && <div className="flex justify-between"><span className="text-gray-500">Réf. transaction</span><span className="font-mono text-gray-900 dark:text-white">{commande.paiement.code_transaction}</span></div>}
              </div>
            </div>
          )}

          {/* Livraison statut détaillé */}
          {statut !== "annule" && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-300">
              {statut === "confirme" && "⏳ Votre commande est confirmée. Nous allons commencer la préparation très prochainement."}
              {statut === "en_preparation" && "📦 Votre colis est en cours de préparation par notre équipe. Vous serez contacté(e) avant l'expédition."}
              {statut === "expedie" && "🚚 Votre colis a été expédié ! Notre livreur est en route. Vous recevrez un appel avant la livraison."}
              {statut === "livre" && "✅ Votre commande a été livrée. Merci de votre confiance !"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Cancel modal ── */
function CancelModal({ ref, onConfirm, onClose }: { ref: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white text-center mb-2">Annuler la commande ?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
          Commande <span className="font-mono font-bold">{ref}</span>
        </p>
        <p className="text-xs text-gray-400 text-center mb-6">
          Cette action est irréversible. Le remboursement sera traité sous 48h.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-sm hover:border-gray-300 transition-colors"
          >
            Non, garder
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-colors"
          >
            Oui, annuler
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
const TABS = [
  { id: "tous",           label: "Tous" },
  { id: "en_cours",       label: "En cours" },
  { id: "livre",          label: "Livrés" },
  { id: "annule",         label: "Annulés" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function MesAchatsPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [tab, setTab] = useState<TabId>("tous");
  const [cancelRef, setCancelRef] = useState<string | null>(null);

  /* Load from localStorage */
  useEffect(() => {
    try {
      // Try the new multi-commandes store first
      const raw = localStorage.getItem("impala_commandes");
      if (raw) {
        const parsed: Commande[] = JSON.parse(raw);
        // Simulate statut from time
        const updated = parsed.map((c) => ({
          ...c,
          statut: simulateStatut(c.date, c.statut),
        }));
        setCommandes(updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        return;
      }
      // Migrate legacy single commande
      const legacy = localStorage.getItem("impala_last_commande");
      if (legacy) {
        const c = JSON.parse(legacy);
        const commande: Commande = {
          ref: c.ref || `IB-${Date.now()}`,
          date: c.date || new Date().toISOString(),
          statut: simulateStatut(c.date || new Date().toISOString()),
          client: c.client,
          paiement: c.paiement,
          livraison: c.livraison,
          articles: c.articles,
          total_cdf: c.total_cdf || 0,
        };
        setCommandes([commande]);
        // Save to new format
        localStorage.setItem("impala_commandes", JSON.stringify([commande]));
      }
    } catch { /* ignore */ }
  }, []);

  const handleCancel = useCallback((ref: string) => {
    setCommandes((prev) => {
      const updated = prev.map((c) => c.ref === ref ? { ...c, statut: "annule" as StatutCommande } : c);
      localStorage.setItem("impala_commandes", JSON.stringify(updated));
      return updated;
    });
    setCancelRef(null);
  }, []);

  /* Filter */
  const filtered = commandes.filter((c) => {
    if (tab === "tous") return true;
    if (tab === "en_cours") return c.statut === "confirme" || c.statut === "en_preparation" || c.statut === "expedie";
    if (tab === "livre") return c.statut === "livre";
    if (tab === "annule") return c.statut === "annule";
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Mes achats</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${
              tab === t.id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBagIcon className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {tab === "tous" ? "Aucune commande pour l'instant." : `Aucune commande dans cet onglet.`}
          </p>
          <Link href="/boutique" className="inline-block mt-4 text-sm font-bold text-[#e63900] hover:underline">
            Découvrir la boutique →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((c) => (
            <CommandeCard key={c.ref} commande={c} onCancel={setCancelRef} />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      {cancelRef && (
        <CancelModal
          ref={cancelRef}
          onConfirm={() => handleCancel(cancelRef)}
          onClose={() => setCancelRef(null)}
        />
      )}
    </div>
  );
}
