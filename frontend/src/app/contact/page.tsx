"use client";
import { useState } from "react";
import { EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: intégrer un service d'envoi d'email ici
    setSent(true);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Contactez-nous</h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
          Une question, un projet ou une demande de partenariat ? Notre équipe vous répond dans les plus brefs délais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Infos de contact */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Nos coordonnées</h2>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                <EnvelopeIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-1">Email</p>
                <a
                  href="mailto:contact@impala-agence.com"
                  className="text-sm font-medium text-[var(--text-primary)] hover:underline"
                >
                  contact@impala-agence.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 mt-5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                <MapPinIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-1">Adresse</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">Impala-Agence</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Horaires d&apos;assistance</h2>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex justify-between">
                <span>Lundi – Vendredi</span>
                <span className="font-medium text-[var(--text-primary)]">8h – 18h</span>
              </li>
              <li className="flex justify-between">
                <span>Samedi</span>
                <span className="font-medium text-[var(--text-primary)]">9h – 13h</span>
              </li>
              <li className="flex justify-between">
                <span>Dimanche</span>
                <span className="font-medium text-[var(--text-primary)]">Fermé</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <EnvelopeIcon className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Message envoyé !</h3>
              <p className="text-[var(--text-secondary)]">
                Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Envoyer un message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      required
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                        text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jean@exemple.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                        text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Sujet <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sujet"
                    required
                    value={form.sujet}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Sélectionner un sujet</option>
                    <option value="immobilier">Immobilier</option>
                    <option value="automobile">Automobile</option>
                    <option value="services">Services complémentaires</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Décrivez votre demande..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
                    text-sm transition-colors"
                >
                  Envoyer le message
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
