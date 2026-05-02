"use client";

import { useState } from "react";
import { Cog6ToothIcon, EnvelopeIcon, GlobeAltIcon, ShieldCheckIcon, PaintBrushIcon, BellIcon } from "@heroicons/react/24/outline";

const tabs = [
  { key: "general", label: "Général", icon: Cog6ToothIcon },
  { key: "email", label: "Email", icon: EnvelopeIcon },
  { key: "security", label: "Sécurité", icon: ShieldCheckIcon },
  { key: "appearance", label: "Apparence", icon: PaintBrushIcon },
  { key: "notifications", label: "Notifications", icon: BellIcon },
  { key: "seo", label: "SEO", icon: GlobeAltIcon },
];

export default function AdminParametres() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paramètres</h1>
        <p className="text-sm text-[var(--text-muted)]">Configuration de la plateforme</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}>
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informations de la plateforme</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom du site</label>
                    <input type="text" defaultValue="IMPALA AGENCE" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea defaultValue="Plateforme multiservice : immobilier, automobile et collecte de poubelles" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email de contact</label>
                      <input type="email" defaultValue="contact@impala-agence.com" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Téléphone</label>
                      <input type="tel" defaultValue="+33 1 23 45 67 89" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Maintenance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Mode maintenance</p>
                      <p className="text-xs text-[var(--text-muted)]">Désactiver temporairement le site pour les utilisateurs</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors">
                      <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Inscription ouverte</p>
                      <p className="text-xs text-[var(--text-muted)]">Permettre aux nouveaux utilisateurs de s&apos;inscrire</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-primary transition-colors">
                      <span className="absolute left-6 top-1 w-4 h-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Configuration SMTP</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Serveur SMTP</label>
                    <input type="text" defaultValue="smtp.impala-agence.com" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Port</label>
                    <input type="text" defaultValue="587" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Utilisateur</label>
                    <input type="text" defaultValue="noreply@impala-agence.com" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mot de passe</label>
                    <input type="password" defaultValue="••••••••" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                    Envoyer un email test
                  </button>
                  <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all">Enregistrer</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Politique de sécurité</h3>
                <div className="space-y-4">
                  {[
                    { label: "Authentification à deux facteurs obligatoire", desc: "Exiger la 2FA pour tous les comptes pro", enabled: false },
                    { label: "Vérification email obligatoire", desc: "Les utilisateurs doivent vérifier leur email", enabled: true },
                    { label: "Limite de connexions échouées", desc: "Bloquer après 5 tentatives échouées", enabled: true },
                    { label: "Expiration de session", desc: "Déconnecter après 24h d'inactivité", enabled: true },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{setting.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{setting.desc}</p>
                      </div>
                      <button className={`relative w-12 h-6 rounded-full transition-colors ${setting.enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${setting.enabled ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Personnalisation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Couleur principale</label>
                  <div className="flex gap-3">
                    {["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"].map((c) => (
                      <button key={c} className="w-10 h-10 rounded-xl border-2 border-transparent hover:border-[var(--text-primary)] transition-all" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Logo du site</label>
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-[var(--border-color)]">
                    <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-white text-2xl font-bold">IA</div>
                    <div>
                      <button className="text-sm text-primary font-medium hover:underline">Changer le logo</button>
                      <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG ou SVG, max 2MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Notifications admin</h3>
              <div className="space-y-4">
                {[
                  { label: "Nouvelle inscription", desc: "Recevoir un email à chaque nouvel inscrit", enabled: true },
                  { label: "Nouvelle annonce en attente", desc: "Notification quand une annonce nécessite validation", enabled: true },
                  { label: "Paiement reçu", desc: "Notification pour chaque transaction", enabled: false },
                  { label: "Signalement utilisateur", desc: "Alerte quand un utilisateur est signalé", enabled: true },
                  { label: "Rapport hebdomadaire", desc: "Résumé des statistiques chaque lundi", enabled: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{notif.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{notif.desc}</p>
                    </div>
                    <button className={`relative w-12 h-6 rounded-full transition-colors ${notif.enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notif.enabled ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Référencement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Titre du site (meta title)</label>
                  <input type="text" defaultValue="IMPALA AGENCE - Immobilier, Auto & Services" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Meta description</label>
                  <textarea defaultValue="IMPALA AGENCE est une plateforme multiservice permettant de publier des annonces immobilières, vendre des véhicules et gérer la collecte de poubelles." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mots-clés</label>
                  <input type="text" defaultValue="immobilier, automobile, voiture, collecte, poubelles, annonces" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="flex justify-end pt-4">
                  <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all">Enregistrer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
