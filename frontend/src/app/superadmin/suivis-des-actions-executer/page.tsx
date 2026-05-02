"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface AuditActor {
  userId: string;
  email: string;
  role: string;
  full_name?: string;
}

interface AuditEntry {
  id: string;
  createdAt: string;
  actor: AuditActor;
  action: string;
  details: string;
  method: string;
  path: string;
  statusCode: number;
}

function roleLabel(role: string) {
  if (role === "admin") return "Administrateur système";
  if (role === "support_agent") return "Agent support";
  if (role === "finance_agent") return "Agent finance";
  return role;
}

function statusPill(code: number) {
  if (code >= 200 && code < 300) return "bg-emerald-500/10 text-emerald-600";
  if (code >= 400) return "bg-red-500/10 text-red-600";
  return "bg-amber-500/10 text-amber-600";
}

function closeTo(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default function SuivisActionsExecuterPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AuditEntry | null>(null);
  const [editAction, setEditAction] = useState("");
  const [editDetails, setEditDetails] = useState("");

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      const res = await fetch(`${API}/superadmin/audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de charger les actions");
        setEntries([]);
      } else {
        setEntries(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Erreur de connexion au service de suivi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const roleOk = roleFilter === "all" || entry.actor?.role === roleFilter;
      if (!roleOk) return false;
      if (!search) return true;
      return (
        closeTo(entry.action || "", search)
        || closeTo(entry.path || "", search)
        || closeTo(entry.method || "", search)
        || closeTo(entry.actor?.full_name || "", search)
        || closeTo(entry.actor?.email || "", search)
      );
    });
  }, [entries, roleFilter, search]);

  async function openHtmlFile() {
    try {
      const token = getToken();
      const res = await fetch(`${API}/superadmin/audit/html`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Impossible d'ouvrir le fichier HTML");
        return;
      }
      const html = await res.text();
      const popup = window.open("", "_blank");
      if (!popup) {
        setError("Le navigateur a bloqué l'ouverture d'une nouvelle fenêtre");
        return;
      }
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    } catch {
      setError("Impossible d'ouvrir le fichier HTML");
    }
  }

  function startEdit(entry: AuditEntry) {
    setEditing(entry);
    setEditAction(entry.action || "");
    setEditDetails(entry.details || "");
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      const token = getToken();
      const res = await fetch(`${API}/superadmin/audit/${editing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: editAction, details: editDetails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Modification impossible");
        return;
      }
      setEntries((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setEditing(null);
    } catch {
      setError("Modification impossible");
    }
  }

  async function removeEntry(id: string) {
    if (!confirm("Supprimer cette entrée de suivi ?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API}/superadmin/audit/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Suppression impossible");
        return;
      }
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Suppression impossible");
    }
  }

  async function clearAll() {
    if (!confirm("Supprimer tout le suivi des actions exécutées ?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API}/superadmin/audit`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de vider l'historique");
        return;
      }
      setEntries([]);
    } catch {
      setError("Impossible de vider l'historique");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Suivis des actions executer</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Historique HTML des actions réalisées par administrateurs système, agents support et agents finance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            className="px-3 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] inline-flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Rafraîchir
          </button>
          <button
            onClick={openHtmlFile}
            className="px-3 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] inline-flex items-center gap-2"
          >
            <EyeIcon className="w-4 h-4" />
            Ouvrir fichier HTML
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 hover:bg-red-500/20"
          >
            Vider
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une action..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)]"
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Administrateurs système</option>
          <option value="support_agent">Agents support</option>
          <option value="finance_agent">Agents finance</option>
        </select>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Chargement...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
            <p className="text-[var(--text-muted)]">Aucune action trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Date</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Acteur</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Rôle</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Méthode</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Chemin</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Statut</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Action</th>
                  <th className="text-right text-xs uppercase tracking-wide text-[var(--text-muted)] px-4 py-3">Opérations</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {entry.actor?.full_name || entry.actor?.email || "Inconnu"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{roleLabel(entry.actor?.role)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{entry.method}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{entry.path}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusPill(Number(entry.statusCode))}`}>
                        {entry.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{entry.action}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-[var(--text-muted)] hover:text-blue-600"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--text-primary)]">Modifier une entrée</h2>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Action</label>
                <input
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Détails</label>
                <textarea
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-primary)]"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
