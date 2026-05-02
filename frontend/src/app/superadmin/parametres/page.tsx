"use client";

import { Cog6ToothIcon, ShieldCheckIcon, ServerIcon } from "@heroicons/react/24/outline";

export default function SuperAdminParametresPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paramètres système</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Configuration avancée de la plateforme</p>
      </div>

      <div className="space-y-4">
        {/* Identity block */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-violet-600" />
            <h2 className="font-semibold text-[var(--text-primary)]">Compte Root</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-muted)] mb-1">Email</p>
              <p className="font-medium text-[var(--text-primary)]">louis.quatorze@impala-agence.com</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] mb-1">Rôle</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-violet-600/10 text-violet-600 border border-violet-500/20">
                SUPER_ADMIN · ROOT
              </span>
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-4">
            <ServerIcon className="w-6 h-6 text-blue-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">Informations système</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-muted)] mb-1">Plateforme</p>
              <p className="font-medium text-[var(--text-primary)]">IMPALA-AGENCE</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] mb-1">Backend</p>
              <p className="font-medium text-[var(--text-primary)]">Node.js / PostgreSQL</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] mb-1">Frontend</p>
              <p className="font-medium text-[var(--text-primary)]">Next.js</p>
            </div>
          </div>
        </div>

        {/* Permissions summary */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-amber-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">Permissions accordées</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              "Créer / supprimer des comptes administrateurs",
              "Créer / supprimer des agents service clientèle",
              "Créer / supprimer des agents finances",
              "Voir et modifier tous les utilisateurs",
              "Approuver / refuser / suspendre tout compte",
              "Gérer toutes les annonces (immobilier + auto)",
              "Accès complet aux données financières",
              "Accès au panneau admin standard",
              "Non visible dans la liste des utilisateurs",
            ].map((perm) => (
              <div key={perm} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span className="text-[var(--text-secondary)]">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
