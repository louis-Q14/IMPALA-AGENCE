"use client";

import { useEffect, useState, useCallback } from "react";
import { UsersIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_verified: boolean;
  phone: string;
  created_at: string;
}

const roleColors: Record<string, string> = {
  user: "bg-blue-500/10 text-blue-600",
  pro: "bg-purple-500/10 text-purple-600",
  admin: "bg-violet-500/10 text-violet-600",
  support_agent: "bg-emerald-500/10 text-emerald-600",
  finance_agent: "bg-amber-500/10 text-amber-600",
  trash_agent: "bg-red-500/10 text-red-600",
};

const roleLabels: Record<string, string> = {
  user: "Utilisateur",
  pro: "Professionnel",
  admin: "Admin",
  support_agent: "Agent support",
  finance_agent: "Agent finance",
  trash_agent: "Agent poubelle",
};

const statusColors: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  rejected: "bg-red-500/10 text-red-600",
  suspended: "bg-gray-500/10 text-gray-500",
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/superadmin/users?limit=500`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async (id: string, status: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/superadmin/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement le compte de ${name} ?`)) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/superadmin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tous les utilisateurs</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Vue complète — tous les comptes de la plateforme</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text" placeholder="Rechercher un utilisateur..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-violet-500">
          <option value="all">Tous les rôles</option>
          <option value="user">Utilisateurs</option>
          <option value="pro">Professionnels</option>
          <option value="admin">Administrateurs</option>
          <option value="support_agent">Agents support</option>
          <option value="finance_agent">Agents finance</option>
          <option value="trash_agent">Agents poubelle</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nom</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rôle</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Créé le</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)] text-sm whitespace-nowrap">{u.full_name}</td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || "bg-gray-500/10 text-gray-500"}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select value={u.status} onChange={(e) => handleStatusChange(u.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusColors[u.status] || ""}`}>
                        <option value="pending">En attente</option>
                        <option value="approved">Approuvé</option>
                        <option value="rejected">Refusé</option>
                        <option value="suspended">Suspendu</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-muted)] whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(u.id, u.full_name)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">{filtered.length} utilisateur(s) affiché(s)</p>
    </div>
  );
}
