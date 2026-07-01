"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserGroupIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Agent {
  id: string;
  email: string;
  full_name: string;
  role: "support_agent" | "finance_agent";
  status: string;
  is_verified: boolean;
  created_at: string;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  support_agent: { label: "Agent support", color: "bg-emerald-500/10 text-emerald-600" },
  finance_agent: { label: "Agent finance", color: "bg-amber-500/10 text-amber-600" },
};

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

function AgentsContent() {
  const searchParams = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Agent | null>(null);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "support_agent" });
  const [editForm, setEditForm] = useState({ full_name: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<"all" | "support_agent" | "finance_agent">("all");

  const fetchAgents = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/staff`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAgents(Array.isArray(data) ? data.filter((s: Agent) => ["support_agent", "finance_agent"].includes(s.role)) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
    const action = searchParams.get("action");
    const role = searchParams.get("role");
    if (action === "create") {
      setShowCreate(true);
      if (role === "finance_agent") setForm((f) => ({ ...f, role: "finance_agent" }));
    }
  }, [fetchAgents, searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Agent créé avec succès");
      setShowCreate(false);
      setForm({ email: "", full_name: "", password: "", role: "support_agent" });
      fetchAgents();
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
      setSuccess("Agent mis à jour");
      setEditTarget(null);
      fetchAgents();
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
    fetchAgents();
  };

  const filtered = filter === "all" ? agents : agents.filter((a) => a.role === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agents</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Agents du service clientèle et des finances</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Nouvel agent
        </button>
      </div>

      {success && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">{success}</div>}
      {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[["all", "Tous"], ["support_agent", "Support"], ["finance_agent", "Finance"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val as typeof filter)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === val
              ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
          >
            {label} {val !== "all" && `(${agents.filter(a => a.role === val).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserGroupIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">Aucun agent créé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rôle</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Créé le</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const rc = roleLabels[a.role];
                return (
                  <tr key={a.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)] text-sm">{a.full_name}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{a.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rc.color}`}>{rc.label}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-muted)]">{new Date(a.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditTarget(a); setEditForm({ full_name: a.full_name, password: "", role: a.role }); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-blue-500"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.full_name)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Créer un agent" onClose={() => { setShowCreate(false); setError(""); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Type d&apos;agent</label>
              <select
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="support_agent">Agent service clientèle</option>
                <option value="finance_agent">Agent finances</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom complet</label>
              <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500"
                placeholder="agent@impala-agence.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Mot de passe</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Minimum 8 caractères" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-hover)] transition-all">
                Annuler
              </button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all">
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
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Rôle</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500">
                <option value="support_agent">Agent service clientèle</option>
                <option value="finance_agent">Agent finances</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom complet</label>
              <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nouveau mot de passe <span className="text-[var(--text-muted)] font-normal">(optionnel)</span></label>
              <input type="password" minLength={8} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Laisser vide pour ne pas changer" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setEditTarget(null); setError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-hover)] transition-all">
                Annuler
              </button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all">
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AgentsContent />
    </Suspense>
  );
}
