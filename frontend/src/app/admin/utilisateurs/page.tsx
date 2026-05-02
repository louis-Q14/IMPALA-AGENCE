"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  BellAlertIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface PendingUser {
  id: string;
  full_name: string;
  nom?: string;
  post_nom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  nationalite?: string;
  etat_civil?: string;
  profession?: string;
  numero_piece?: string;
  piece_identite_url?: string;
  adresse?: string;
  email: string;
  phone: string;
  phone_fixe?: string;
  role: string;
  services: string[];
  service_status_map?: Record<string, string>;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
  real_estate: "Immobilier",
  auto: "Automobile",
  trash: "Poubelles",
  nettoyage: "Nettoyage",
  repassage: "Repassage",
  demenagement: "Demenagement",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminUtilisateurs() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PendingUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modalTab, setModalTab] = useState<"profil" | "abonnements">("profil");
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [calOffset, setCalOffset] = useState(0);
  const [trashSub, setTrashSub] = useState<{ plan: string; frequency: string; amount: string; status: string } | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, "pending" | "approved" | "rejected">>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteServicePending, setDeleteServicePending] = useState<string | null>(null);
  const [progTab, setProgTab] = useState<string>("");
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Reset drag position, tab and calendar offset when modal opens
  // Reset only when a *different* user opens the modal, not when same user status updates
  useEffect(() => {
    if (selectedUser) {
      const isNewUser = selectedUser.id !== prevUserIdRef.current;
      prevUserIdRef.current = selectedUser.id;
      if (isNewUser) {
        setDragPos(null); setModalTab("profil"); setCalOffset(0); setTrashSub(null); setSaveSuccess(false); setDeleteServicePending(null); setProgTab("");
        const init: Record<string, "pending" | "approved" | "rejected"> = {};
          (selectedUser.services || []).forEach(sv => {
            const raw = selectedUser.service_status_map?.[sv] ?? 'pending';
            init[sv] = (raw === 'active' || raw === 'approved') ? 'approved' : (raw === 'rejected' ? 'rejected' : 'pending');
          });
          setServiceStatuses(init);
        if (selectedUser.services?.includes("trash")) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/trash/subscriptions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
          }).then(r => r.ok ? r.json() : []).then((data: Array<{ email: string; plan: string; frequency: string; amount: string; status: string }>) => {
            const found = data.find((s) => s.email?.toLowerCase() === selectedUser.email?.toLowerCase());
            setTrashSub(found || null);
          }).catch(() => {});
        }
      }
    } else {
      prevUserIdRef.current = null;
    }
  }, [selectedUser]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const currentX = dragPos?.x ?? 0;
    const currentY = dragPos?.y ?? 0;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: currentX, origY: currentY };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setDragPos({
        x: dragRef.current.origX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (ev.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dragPos]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const getToken = () => localStorage.getItem("token") || "";

  // Load users from backend API
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUserStatus = async (userId: string, newStatus: "approved" | "rejected" | "suspended") => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Update local state
        const updated = users.map((u) => u.id === userId ? { ...u, status: newStatus } : u);
        setUsers(updated);

        // When approving, sync user subscriptions to poubelles localStorage
        if (newStatus === "approved") {
          const user = updated.find((u) => u.id === userId);
          if (user?.services?.includes("trash")) {
            const poubellesSubs = JSON.parse(localStorage.getItem("poubelles_subs") || "[]");
            const alreadyExists = poubellesSubs.some((s: { email: string }) => s.email.toLowerCase() === user.email.toLowerCase());
            if (!alreadyExists) {
              poubellesSubs.push({
                id: user.id,
                user: user.full_name,
                email: user.email,
                zone: user.adresse || "Non renseignée",
                plan: "basic",
                frequency: "1x/semaine",
                bins: 1,
                status: "active",
                nextPickup: new Date(Date.now() + 7 * 86400000).toLocaleDateString("fr-FR"),
                amount: "15 FC/mois",
                startDate: new Date().toLocaleDateString("fr-FR"),
                address: user.adresse || "",
                collectDays: ["Lundi"],
              });
              localStorage.setItem("poubelles_subs", JSON.stringify(poubellesSubs));
            }
          }
          window.dispatchEvent(new Event("storage"));
        }

        // Add notification log
        const target = users.find((u) => u.id === userId);
        if (target) {
          const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
          const actionLabel = newStatus === "approved" ? "approuvé" : newStatus === "rejected" ? "refusé" : "suspendu";
          notifications.unshift({
            id: `status-${Date.now()}`,
            title: `Compte ${actionLabel}`,
            message: `Le compte de ${target.full_name} a été ${actionLabel}.`,
            type: "utilisateur",
            link: "/admin/utilisateurs",
            read: true,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem("admin_notifications", JSON.stringify(notifications));
        }

        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update user status:", err);
    }
  };

  const deleteUser = async (user: PendingUser) => {
    try {
      const res = await fetch(`${API}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));

        const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]");
        notifications.unshift({
          id: Date.now(),
          type: "user_deleted",
          message: `Compte de ${user.full_name} supprimé définitivement`,
          read: true,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("admin_notifications", JSON.stringify(notifications));

        if (selectedUser?.id === user.id) setSelectedUser(null);
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    const statuses = Object.values(serviceStatuses);
    let newStatus: "approved" | "rejected" | "suspended" = "approved";
    if (statuses.length > 0 && statuses.every(s => s === "rejected")) newStatus = "rejected";
    else if (statuses.some(s => s === "approved")) newStatus = "approved";
    await updateUserStatus(selectedUser.id, newStatus);
    // Persist per-service statuses to DB
    await fetch(`${API}/admin/users/${selectedUser.id}/services/statuses`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ statuses: serviceStatuses }),
    }).catch(() => {});
    setSaveSuccess(true);
  };


  const deleteService = async (userId: string, service: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/services/${service}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId
          ? { ...u, services: u.services.filter(sv => sv !== service) }
          : u
        ));
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, services: prev.services.filter(sv => sv !== service) } : null);
        }
        const saved = localStorage.getItem(`svc_status_${userId}`);
        if (saved) {
          try { const st = JSON.parse(saved); delete st[service]; localStorage.setItem(`svc_status_${userId}`, JSON.stringify(st)); } catch {}
        }
        setDeleteServicePending(null);
        setSaveSuccess(false);
      }
    } catch (err) { console.error("Delete service error:", err); }
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const approvedCount = users.filter((u) => u.status === "approved").length;
  const rejectedCount = users.filter((u) => u.status === "rejected").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;

  const filtered = users.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "En attente", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
    approved: { label: "Approuvé", color: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
    rejected: { label: "Refusé", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/30" },
    suspended: { label: "Suspendu", color: "text-gray-700 dark:text-gray-300", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestion des utilisateurs</h1>
        <p className="text-sm text-[var(--text-muted)]">Approuvez ou refusez les inscriptions</p>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <BellAlertIcon className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {pendingCount} inscription{pendingCount > 1 ? "s" : ""} en attente de validation
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Ces utilisateurs ne peuvent pas se connecter tant que leur compte n&apos;est pas approuvé.</p>
          </div>
          <button onClick={() => setStatusFilter("pending")} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-all">
            Voir
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: users.length, icon: UserGroupIcon, color: "bg-blue-500" },
          { label: "En attente", value: pendingCount, icon: ClockIcon, color: "bg-amber-500" },
          { label: "Approuvés", value: approvedCount, icon: ShieldCheckIcon, color: "bg-emerald-500" },
          { label: "Refusés / Suspendus", value: rejectedCount + suspendedCount, icon: ExclamationTriangleIcon, color: "bg-red-500" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "Tous" },
            { key: "pending", label: `En attente (${pendingCount})` },
            { key: "approved", label: "Approuvés" },
            { key: "rejected", label: "Refusés" },
            { key: "suspended", label: "Suspendus" },
          ].map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${statusFilter === f.key ? "bg-primary text-white" : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <div className="text-center py-16">
          <UserGroupIcon className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucun utilisateur inscrit</h3>
          <p className="text-sm text-[var(--text-muted)]">Les nouveaux inscrits apparaîtront ici pour validation.</p>
        </div>
      )}

      {users.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">Aucun résultat pour ce filtre.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  {["Utilisateur", "Rôle", "Services", "Inscription", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((u) => (
                  <tr key={u.id} className={`transition-all ${u.status === "pending" ? "bg-amber-50/50 dark:bg-amber-900/5" : "hover:bg-[var(--bg-hover)]"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-primary/10 text-primary"
                        }`}>
                          {u.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{u.full_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                          {u.phone && <p className="text-xs text-[var(--text-muted)]">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === "pro" || u.role === "professional" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      }`}>
                        {u.role === "pro" || u.role === "professional" ? "Professionnel" : "Particulier"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.services.map((s) => {
                          const svcStatus = u.service_status_map?.[s] ?? 'pending';
                          const isActive = svcStatus === 'active' || svcStatus === 'approved';
                          const isRejected = svcStatus === 'rejected' || svcStatus === 'inactive';
                          return (
                          <span key={s} className={"px-2 py-0.5 text-xs rounded-md font-medium ${isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : isRejected ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}"}>
                            {SERVICE_LABELS[s] || s}
                          </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--text-muted)]">{formatDate(u.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[u.status]?.bgColor} ${statusConfig[u.status]?.color}`}>
                        {statusConfig[u.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Détails"
                          className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(u)}
                          title="Supprimer le compte"
                          className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
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
        </div>
      )}

      {/* Detail modal — glassmorphism draggable */}
      {mounted && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
          {/* Modal */}
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl
              bg-white/15 dark:bg-gray-900/25 backdrop-blur-2xl
              shadow-[0_8px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]
              border border-white/30 dark:border-white/10
              ring-1 ring-white/20 dark:ring-white/5"
            style={dragPos ? { transform: `translate(${dragPos.x}px, ${dragPos.y}px)` } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — draggable handle */}
            <div
              className="flex-shrink-0 px-6 pt-5 pb-4 cursor-grab active:cursor-grabbing select-none
              bg-white/20 dark:bg-white/5 rounded-t-3xl
              border-b border-white/30 dark:border-white/10"
              onMouseDown={onDragStart}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg ${
                  selectedUser.status === "pending"
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                    : selectedUser.status === "approved"
                    ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white"
                    : selectedUser.status === "suspended"
                    ? "bg-gradient-to-br from-gray-400 to-gray-600 text-white"
                    : "bg-gradient-to-br from-red-400 to-red-600 text-white"
                }`}>
                  {selectedUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedUser.full_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig[selectedUser.status]?.bgColor} ${statusConfig[selectedUser.status]?.color}`}>
                  {statusConfig[selectedUser.status]?.label}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {[
                  { key: "profil" as const, label: "Profil", emoji: "👤" },
                  { key: "abonnements" as const, label: "Abonnements", emoji: "💳" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setModalTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      modalTab === tab.key
                        ? "bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{tab.emoji}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content — scrollable zone only */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* === TAB: Profil === */}
              {modalTab === "profil" && (<>

              {/* Informations Personnelles */}
              <div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                  <span className="text-blue-500 dark:text-blue-400">🪪</span>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Informations Personnelles</h4>
                </div>
                <div className="divide-y divide-white/30 dark:divide-white/5">
                  {[
                    { label: "Nom", value: selectedUser.nom },
                    { label: "Post-nom", value: selectedUser.post_nom },
                    { label: "Prénom", value: selectedUser.prenom },
                    { label: "Date de naissance", value: selectedUser.date_naissance ? new Date(selectedUser.date_naissance).toLocaleDateString("fr-FR") : undefined },
                    { label: "Sexe", value: selectedUser.sexe },
                    { label: "Nationalité", value: selectedUser.nationalite },
                    { label: "État civil", value: selectedUser.etat_civil },
                    { label: "Profession", value: selectedUser.profession },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{item.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pièce d'identité */}
              <div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                  <span className="text-amber-500 dark:text-amber-400">🪪</span>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Pièce d&apos;identité</h4>
                </div>
                <div className="divide-y divide-white/30 dark:divide-white/5">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">N° pièce</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.numero_piece || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Document joint</span>
                    {selectedUser.piece_identite_url ? (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:5000"}${selectedUser.piece_identite_url}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Voir le document</a>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Aucun</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                  <span className="text-emerald-500 dark:text-emerald-400">📍</span>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Coordonnées</h4>
                </div>
                <div className="divide-y divide-white/30 dark:divide-white/5">
                  {[
                    { label: "Adresse", value: selectedUser.adresse },
                    { label: "Téléphone portable", value: selectedUser.phone },
                    { label: "Téléphone fixe", value: selectedUser.phone_fixe },
                    { label: "Email", value: selectedUser.email },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{item.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compte */}
              <div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                  <span className="text-purple-500 dark:text-purple-400">👤</span>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Compte</h4>
                </div>
                <div className="divide-y divide-white/30 dark:divide-white/5">
                  {[
                    { label: "Rôle", value: selectedUser.role === "pro" || selectedUser.role === "professional" ? "Professionnel" : "Particulier" },
                    { label: "Services", value: selectedUser.services.map((s) => SERVICE_LABELS[s] || s).join(", ") || "—" },
                    { label: "Date d'inscription", value: formatDate(selectedUser.created_at) },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              </>)}

              {/* === TAB: Abonnements === */}
              {modalTab === "abonnements" && (
                <div className="space-y-4">

                  {/* Services souscrits */}
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                      <span className="text-indigo-500 dark:text-indigo-400">📦</span>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Services souscrits</h4>
                    </div>
                    {selectedUser.services && selectedUser.services.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {selectedUser.services.map((s) => {
                          const serviceInfo: Record<string, { label: string; color: string; icon: string; desc: string }> = {
                            real_estate: { label: "Immobilier", color: "from-blue-500 to-indigo-600", icon: "🏠", desc: "Publication et gestion d'annonces immobilières" },
                            auto: { label: "Automobile", color: "from-amber-500 to-orange-600", icon: "🚗", desc: "Publication et gestion d'annonces automobiles" },
                            trash: { label: "Poubelles", color: "from-emerald-500 to-green-600", icon: "♻️", desc: "Service de collecte et gestion des déchets" },
                          };
                          const info = serviceInfo[s] || { label: s, color: "from-gray-500 to-gray-600", icon: "📋", desc: "Service" };
                          return (
                            <div key={s} className="flex flex-col gap-3 px-4 py-3 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-lg shadow-md`}>
                                  {info.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{info.label}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{info.desc}</p>
                                  {s === "trash" && trashSub && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                        trashSub.plan === "premium" ? "bg-purple-500/20 text-purple-700 dark:text-purple-300" :
                                        trashSub.plan === "standard" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" :
                                        "bg-gray-400/20 text-gray-600 dark:text-gray-300"
                                      }`}>
                                        {trashSub.plan === "premium" ? "⭐ Premium" : trashSub.plan === "standard" ? "🔵 Standard" : "⚪ Basic"}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                        🔄 {trashSub.frequency}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                        💰 {trashSub.amount}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  serviceStatuses[s] === "approved"
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                    : serviceStatuses[s] === "rejected"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                }`}>
                                  {serviceStatuses[s] === "approved" ? "Actif" : serviceStatuses[s] === "rejected" ? "Refusé" : "En attente"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setSaveSuccess(false); setServiceStatuses(prev => ({ ...prev, [s]: "approved" })); }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    serviceStatuses[s] === "approved"
                                      ? "bg-emerald-500 text-white shadow-sm"
                                      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                                  }`}
                                >
                                  <CheckCircleIcon className="w-3.5 h-3.5" /> Approuver
                                </button>
                                <button
                                  onClick={() => { setSaveSuccess(false); setServiceStatuses(prev => ({ ...prev, [s]: "rejected" })); }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    serviceStatuses[s] === "rejected"
                                      ? "bg-red-500 text-white shadow-sm"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                  }`}
                                >
                                  <XCircleIcon className="w-3.5 h-3.5" /> Refuser
                                </button>
                              </div>
                              {deleteServicePending === s ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => deleteService(selectedUser.id, s)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" /> Confirmer la suppression
                                  </button>
                                  <button
                                    onClick={() => setDeleteServicePending(null)}
                                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 transition-all"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteServicePending(s)}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-300 dark:border-red-800/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                  <TrashIcon className="w-3 h-3" /> Supprimer l&apos;abonnement
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aucun service souscrit</p>
                      </div>
                    )}
                  </div>

                  {/* Détails de l'abonnement */}
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                      <span className="text-amber-500 dark:text-amber-400">💳</span>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Détails de l&apos;abonnement</h4>
                    </div>
                    <div className="divide-y divide-white/30 dark:divide-white/5">
                      {[
                        { label: "Type de compte", value: selectedUser.role === "pro" || selectedUser.role === "professional" ? "Professionnel" : "Particulier" },
                        { label: "Nombre de services", value: `${selectedUser.services?.length || 0} service${(selectedUser.services?.length || 0) > 1 ? "s" : ""}` },
                        { label: "Statut du compte", value: statusConfig[selectedUser.status]?.label || selectedUser.status },
                        { label: "Date de souscription", value: formatDate(selectedUser.created_at) },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center px-4 py-2.5">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historique */}
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-1">
                      <span className="text-cyan-500 dark:text-cyan-400">📊</span>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Résumé</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { label: "Annonces", value: "0", color: "from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10", text: "text-blue-700 dark:text-blue-300" },
                        { label: "Messages", value: "0", color: "from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10", text: "text-emerald-700 dark:text-emerald-300" },
                        { label: "Paiements", value: "0", color: "from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10", text: "text-amber-700 dark:text-amber-300" },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.color} border border-white/20 dark:border-white/10 p-3 text-center`}>
                          <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendrier de consommation */}
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200/40 dark:bg-white/8 mb-3">
                      <span className="text-violet-500 dark:text-violet-400">📅</span>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Progression de l&apos;abonnement</h4>
                    </div>
                    {selectedUser.services && selectedUser.services.length > 0 ? (() => {
                      const svcColors: Record<string,{bar:string;today:string;ring:string}> = {
                        trash:{bar:"from-emerald-500 to-green-600",today:"from-emerald-500 to-green-600",ring:"ring-emerald-400/60"},
                        real_estate:{bar:"from-blue-500 to-indigo-600",today:"from-blue-500 to-indigo-600",ring:"ring-blue-400/60"},
                        auto:{bar:"from-amber-500 to-orange-600",today:"from-amber-500 to-orange-600",ring:"ring-amber-400/60"},
                        nettoyage:{bar:"from-cyan-500 to-teal-600",today:"from-cyan-500 to-teal-600",ring:"ring-cyan-400/60"},
                        repassage:{bar:"from-purple-500 to-pink-600",today:"from-purple-500 to-pink-600",ring:"ring-purple-400/60"},
                        demenagement:{bar:"from-rose-500 to-red-600",today:"from-rose-500 to-red-600",ring:"ring-rose-400/60"},
                      };
                      const svcMeta: Record<string,{label:string;icon:string}> = {
                        trash:{label:"Poubelles",icon:"♻️"},real_estate:{label:"Immobilier",icon:"🏠"},
                        auto:{label:"Automobile",icon:"🚗"},nettoyage:{label:"Nettoyage",icon:"🧹"},
                        repassage:{label:"Repassage",icon:"👔"},demenagement:{label:"Déménagement",icon:"📦"},
                      };
                      const activeTab = progTab || selectedUser.services[0];
                      const colors = svcColors[activeTab] || {bar:"from-violet-500 to-blue-500",today:"from-violet-500 to-blue-600",ring:"ring-violet-400/60"};
                      const subStart = new Date(selectedUser.created_at);
                      subStart.setHours(0,0,0,0);
                      const subEnd = new Date(subStart);
                      subEnd.setMonth(subEnd.getMonth()+1);
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const totalDays = Math.round((subEnd.getTime()-subStart.getTime())/86400000);
                      const consumedDays = Math.min(Math.max(Math.round((today.getTime()-subStart.getTime())/86400000),0),totalDays);
                      const remainingDays = totalDays-consumedDays;
                      const progressPct = Math.round((consumedDays/totalDays)*100);
                      const baseDate = new Date(subStart.getFullYear(),subStart.getMonth()+calOffset,1);
                      const calYear=baseDate.getFullYear(); const calMonth=baseDate.getMonth();
                      const firstDay=new Date(calYear,calMonth,1).getDay();
                      const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
                      const dayOffset=(firstDay+6)%7;
                      const cells=Array.from({length:dayOffset+daysInMonth},(_,i)=>i<dayOffset?null:i-dayOffset+1);
                      const monthNames=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
                      return (
                        <div className="space-y-3">
                          {selectedUser.services.length > 1 && (
                            <div className="flex gap-1.5 flex-wrap px-1">
                              {selectedUser.services.map((sv) => {
                                const meta = svcMeta[sv] || {label:sv,icon:"📋"};
                                const isActive = activeTab === sv;
                                return (
                                  <button key={sv} onClick={() => {setProgTab(sv); setCalOffset(0);}}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                                      ? "bg-white/30 dark:bg-white/15 text-gray-900 dark:text-white shadow-sm border border-white/40 dark:border-white/20"
                                      : "text-gray-500 dark:text-gray-400 hover:bg-white/15 dark:hover:bg-white/8 border border-transparent"
                                    }`}>
                                    <span>{meta.icon}</span><span>{meta.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="px-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{consumedDays} j. consommés</span>
                              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{progressPct}%</span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{remainingDays} j. restants</span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`} style={{width:`${progressPct}%`}} />
                            </div>
                            <div className="flex justify-between mt-1.5">
                              <span className="text-xs text-gray-600 dark:text-gray-300">{subStart.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">{subEnd.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</span>
                            </div>
                          </div>
                          <div className="px-4 rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <button onClick={() => setCalOffset(o => o-1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-all font-bold text-lg leading-none">‹</button>
                              <p className="text-base font-bold text-gray-900 dark:text-white">{monthNames[calMonth]} {calYear}</p>
                              <button onClick={() => setCalOffset(o => o+1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-all font-bold text-lg leading-none">›</button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d,i)=>(
                                <div key={i} className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-1">{d}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {cells.map((day,i) => {
                                if (!day) return <div key={i} />;
                                const thisDay=new Date(calYear,calMonth,day);
                                const isToday=thisDay.getTime()===today.getTime();
                                const isConsumed=thisDay>=subStart&&thisDay<today;
                                const isRemaining=thisDay>=today&&thisDay<subEnd;
                                const isSubStart=thisDay.getTime()===subStart.getTime();
                                const isSubEnd=thisDay.getTime()===subEnd.getTime();
                                let cls="w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm font-semibold cursor-default select-none ";
                                if(isToday) cls+=`bg-gradient-to-br ${colors.today} text-white shadow-lg ring-2 ${colors.ring}`;
                                else if(isSubStart) cls+="ring-2 ring-violet-500 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200";
                                else if(isSubEnd) cls+="ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200";
                                else if(isConsumed) cls+="bg-blue-100 dark:bg-blue-500/25 text-blue-800 dark:text-blue-200";
                                else if(isRemaining) cls+="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200";
                                else cls+="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors";
                                return(<div key={i} className="flex items-center justify-center py-0.5"><div className={cls}>{day}</div></div>);
                              })}
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full bg-blue-200 dark:bg-blue-500/40 border border-blue-300 dark:border-blue-500/50"/><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Consommé</span></div>
                              <div className="flex items-center gap-1.5"><div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${colors.today}`}/><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Aujourd&apos;hui</span></div>
                              <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full bg-emerald-200 dark:bg-emerald-500/40 border border-emerald-300 dark:border-emerald-500/50"/><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Restant</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="px-4 py-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aucun abonnement actif</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Footer actions */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5 rounded-b-3xl flex gap-3">
              <button
                onClick={handleSave}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 text-sm shadow-lg ${
                  saveSuccess
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700"
                }`}
              >
                {saveSuccess
                  ? <><CheckCircleIcon className="w-4 h-4" /><span>Enregistré !</span></>  
                  : "Enregistrer les modifications"
                }
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 rounded-xl border border-white/20 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/5 transition-all backdrop-blur-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation modal */}
      {mounted && deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer ce compte ?</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Vous êtes sur le point de supprimer définitivement le compte de{" "}
                <span className="font-semibold text-[var(--text-primary)]">{deleteConfirm.full_name}</span>.
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-2 font-medium">
                Cette action est irréversible. Toutes les données associées seront perdues.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteUser(deleteConfirm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all text-sm"
              >
                <TrashIcon className="w-4 h-4" /> Confirmer la suppression
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
