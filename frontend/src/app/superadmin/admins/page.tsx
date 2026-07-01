"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheckIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_verified: boolean;
  created_at: string;
}

interface FormData {
  email: string;
  full_name: string;
  password: string;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-hover)]">
            <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminsPage() {
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<FormData>({ email: "", full_name: "", password: "" });
  const [editForm, setEditForm] = useState({ full_name: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStaff = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/staff`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setStaff(Array.isArray(data) ? data.filter((s: StaffMember) => s.role === "admin") : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
    if (searchParams.get("action") === "create") setShowCreate(true);
  }, [fetchStaff, searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, role: "admin" }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Administrateur créé avec succès");
      setShowCreate(false);
      setForm({ email: "", full_name: "", password: "" });
      fetchStaff();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data.error || "Erreur lors de la création");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/staff/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Administrateur mis à jour");
      setEditTarget(null);
      fetchStaff();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data.error || "Erreur");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le compte de ${name} ?`)) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/superadmin/staff/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchStaff();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Administrateurs système</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Gestion des comptes administrateurs</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Nouvel administrateur
        </button>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">{success}</div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Chargement...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">Aucun administrateur créé</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-violet-600 text-sm hover:underline">
              Créer le premier administrateur
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Créé le</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)] text-sm">{s.full_name}</td>
                  <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{s.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.is_verified ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {s.is_verified ? "Actif" : "En attente"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-[var(--text-muted)]">{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditTarget(s); setEditForm({ full_name: s.full_name, password: "" }); }}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.full_name)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Créer un administrateur" onClose={() => { setShowCreate(false); setError(""); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom complet</label>
              <input
                type="text" required
                value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500"
                placeholder="Prénom Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500"
                placeholder="admin@impala-agence.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Mot de passe</label>
              <input
                type="password" required minLength={8}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500"
                placeholder="Minimum 8 caractères"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-hover)] transition-all">
                Annuler
              </button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all">
                Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Modifier — ${editTarget.full_name}`} onClose={() => { setEditTarget(null); setError(""); }}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom complet</label>
              <input
                type="text"
                value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nouveau mot de passe <span className="text-[var(--text-muted)]">(laisser vide pour ne pas changer)</span></label>
              <input
                type="password" minLength={8}
                value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500"
                placeholder="Minimum 8 caractères"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setEditTarget(null); setError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-hover)] transition-all">
                Annuler
              </button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all">
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
