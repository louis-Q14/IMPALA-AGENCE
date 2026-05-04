"use client";
import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Avis {
  id: string;
  auteur_nom: string;
  auteur_avatar?: string;
  note: number | null;
  titre: string | null;
  contenu: string;
  created_at: string;
}

interface Stats {
  moyenne: string | null;
  total: number;
}

function StarRating({ note, onChange }: { note: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || note);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => onChange && setHover(star)}
            onMouseLeave={() => onChange && setHover(0)}
            className={onChange ? "cursor-pointer" : "cursor-default"}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            {filled ? (
              <StarIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarOutlineIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function AvisCard({ avis }: { avis: Avis }) {
  const initials = avis.auteur_nom
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-3">
      {avis.note && <StarRating note={avis.note} />}
      {avis.titre && (
        <h3 className="font-semibold text-[var(--text-primary)] text-sm">{avis.titre}</h3>
      )}
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1">{avis.contenu}</p>
      <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-color)]">
        {avis.auteur_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avis.auteur_avatar} alt={avis.auteur_nom} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{avis.auteur_nom}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {new Date(avis.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 9;

  // Form state
  const [form, setForm] = useState({ nom: "", email: "", note: 5, titre: "", contenu: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Detect logged-in user
  const [loggedUser, setLoggedUser] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setLoggedUser(JSON.parse(stored));
    } catch {
      // not logged in
    }
  }, []);

  async function fetchAvis(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/blog/avis?page=${p}&limit=${LIMIT}`);
      const data = await res.json();
      setAvis(data.avis || []);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAvis(page);
  }, [page]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body: Record<string, unknown> = {
        note: form.note,
        titre: form.titre || undefined,
        contenu: form.contenu,
      };
      if (!token) {
        body.nom = form.nom;
        body.email = form.email || undefined;
      }

      const res = await fetch(`${API}/blog/avis`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setFormSuccess(true);
      setForm({ nom: "", email: "", note: 5, titre: "", contenu: "" });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setFormLoading(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
          Avis &amp; Témoignages
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
          Découvrez ce que nos clients pensent d&apos;Impala-Agence et partagez votre expérience.
        </p>

        {/* Stats bar */}
        {stats && stats.total > 0 && (
          <div className="mt-6 inline-flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-6 py-3">
            <div className="flex items-center gap-2">
              <StarIcon className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.moyenne ?? "—"}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">/ 5</span>
            </div>
            <div className="w-px h-6 bg-[var(--border-color)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {stats.total} avis vérifié{stats.total > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Avis list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-[var(--bg-secondary)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : avis.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-secondary)]">
              Aucun avis pour le moment. Soyez le premier à partager votre expérience !
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {avis.map((a) => (
                  <AvisCard key={a.id} avis={a} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm
                      text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <span className="px-4 py-2 text-sm text-[var(--text-secondary)]">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm
                      text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Form */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 h-fit sticky top-6">
          {formSuccess ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Merci !</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Votre avis a été soumis et sera visible après modération.
              </p>
              <button
                onClick={() => setFormSuccess(false)}
                className="mt-4 text-sm text-blue-500 hover:underline"
              >
                Laisser un autre avis
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">
                Donnez votre avis
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Show name/email fields only for non-authenticated users */}
                {!loggedUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        required
                        value={form.nom}
                        onChange={handleFormChange}
                        placeholder="Votre nom"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                          text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Email (optionnel)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleFormChange}
                        placeholder="votre@email.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                          text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </>
                )}

                {loggedUser && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Connecté en tant que <span className="font-medium text-[var(--text-primary)]">{loggedUser.full_name}</span>
                  </p>
                )}

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Note
                  </label>
                  <StarRating note={form.note} onChange={(n) => setForm({ ...form, note: n })} />
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    name="titre"
                    value={form.titre}
                    onChange={handleFormChange}
                    placeholder="Résumé de votre expérience"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Contenu */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Votre avis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="contenu"
                    required
                    rows={4}
                    value={form.contenu}
                    onChange={handleFormChange}
                    placeholder="Partagez votre expérience avec Impala-Agence..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1 text-right">
                    {form.contenu.length}/2000
                  </p>
                </div>

                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                    text-white font-semibold text-sm transition-colors"
                >
                  {formLoading ? "Envoi en cours..." : "Soumettre mon avis"}
                </button>
                <p className="text-xs text-[var(--text-secondary)] text-center">
                  Votre avis sera visible après modération.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
