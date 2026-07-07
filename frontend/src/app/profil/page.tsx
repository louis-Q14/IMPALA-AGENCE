"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CameraIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  HomeIcon,
  TruckIcon,
  TrashIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon as ShieldSolid, StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
function getToken() { try { return localStorage.getItem("token") || sessionStorage.getItem("token") || null; } catch { return null; } }

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

interface ProfileData {
  full_name: string;
  nom: string;
  post_nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  nationalite: string;
  etat_civil: string;
  profession: string;
  numero_piece: string;
  piece_identite: string;
  email: string;
  phone: string;
  phone_fixe: string;
  adresse: string;
  role: string;
  services: string[];
  bio: string;
  company_name: string;
  siret: string;
  website: string;
  avatar_url: string;
  created_at: string;
}

const serviceIcons: Record<string, { icon: typeof HomeIcon; label: string; color: string }> = {
  real_estate: { icon: HomeIcon, label: "Immobilier", color: "bg-blue-500" },
  auto: { icon: TruckIcon, label: "Automobile", color: "bg-amber-500" },
  trash: { icon: TrashIcon, label: "Poubelles", color: "bg-emerald-500" },
  reservation: { icon: BuildingOffice2Icon, label: "Réservation", color: "bg-rose-500" },
};

const tabs = [
  { id: "info", label: "Informations", icon: UserCircleIcon },
  { id: "security", label: "Sécurité", icon: ShieldCheckIcon },
  { id: "services", label: "Services", icon: StarIcon },
  { id: "activity", label: "Activité", icon: EyeIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
];

export default function ProfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [apiStats, setApiStats] = useState<any>(null);
  const [userServices, setUserServices] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    nom: "",
    post_nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "",
    nationalite: "",
    etat_civil: "",
    profession: "",
    numero_piece: "",
    piece_identite: "",
    email: "",
    phone: "",
    phone_fixe: "",
    adresse: "",
    role: "",
    services: [],
    bio: "",
    company_name: "",
    siret: "",
    website: "",
    avatar_url: "",
    created_at: "",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    email_new_message: true,
    email_ad_approved: true,
    email_ad_rejected: true,
    email_rental_request: true,
    email_payment: true,
    push_new_message: true,
    push_ad_approved: false,
    push_promotions: false,
    newsletter: true,
  });

  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem("user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch { /* ignore */ } }
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    // Fetch real profile
    fetch(`${API}/auth/me`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setUser(data);
        setUserServices(Array.isArray(data.services) ? data.services : []);
        setProfile(prev => ({
          ...prev,
          full_name: data.full_name || "",
          nom: data.nom || "",
          post_nom: data.post_nom || "",
          prenom: data.prenom || "",
          date_naissance: data.date_naissance ? String(data.date_naissance).split("T")[0] : "",
          lieu_naissance: data.lieu_naissance || "",
          sexe: data.sexe || "",
          nationalite: data.nationalite || "",
          etat_civil: data.etat_civil || "",
          profession: data.profession || "",
          numero_piece: data.numero_piece || "",
          piece_identite: data.piece_identite || "",
          email: data.email || "",
          phone: data.phone || "",
          phone_fixe: data.phone_fixe || "",
          adresse: data.adresse || "",
          role: data.role || "",
          services: Array.isArray(data.services) ? data.services.map((s: any) => s.service) : [],
          avatar_url: data.avatar_url || "",
          created_at: data.created_at || "",
        }));
      })
      .catch(() => {});
    // Fetch stats
    fetch(`${API}/auth/stats`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setApiStats(data); })
      .catch(() => {});
    // Fetch recent guest bookings for activity
    fetch(`${API}/reservation/bookings/guest`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setRecentBookings(data.slice(0, 5)); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const token = getToken();
    setSaveError("");
    if (token) {
      const r = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); setSaveError(e.error || "Erreur serveur"); return; }
    }
    if (user) {
      const updated = { ...user, full_name: profile.full_name, email: profile.email };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    }
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = async () => {
    setPwError(""); setPwSuccess(false);
    if (passwords.newPass.length < 8) { setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères"); return; }
    if (passwords.newPass !== passwords.confirm) { setPwError("Les mots de passe ne correspondent pas"); return; }
    const token = getToken();
    if (!token) { setPwError("Non connecté"); return; }
    const r = await fetch(`${API}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: passwords.current, new_password: passwords.newPass }),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setPwError(e.error || "Erreur serveur"); return; }
    setPasswords({ current: "", newPass: "", confirm: "" });
    setPwSuccess(true);
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "–";

  // Real activity from recent bookings
  const activities = recentBookings.map(b => ({
    type: "reservation",
    title: b.title || "Réservation",
    date: new Date(b.created_at).toLocaleDateString("fr-FR"),
    status: b.status,
    views: null,
  }));

  const stats = {
    ads_count: apiStats?.totals?.ads ?? 0,
    favorites: apiStats?.totals?.favorites ?? 0,
    messages: apiStats?.totals?.messages ?? 0,
    reviews_avg: apiStats?.reviews_given?.avg ?? 0,
    reviews_count: apiStats?.reviews_given?.count ?? 0,
    views_total: apiStats?.totals?.views ?? 0,
    reservations: (apiStats?.reservation?.properties ?? 0) + (apiStats?.reservation?.guest_bookings ?? 0),
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="text-center p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
          <UserCircleIcon className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Non connecté</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Connectez-vous pour accéder à votre profil</p>
          <Link href="/connexion" className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMi4yLTEuOC00LTQtNHMtNCAxLjgtNCA0IDEuOCA0IDQgNCA0LTEuOCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 relative">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center
                border-4 border-white/30 shadow-xl text-white text-3xl font-bold">
                {initials}
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center
                shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.full_name}</h1>
                {user.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                    <ShieldSolid className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm mt-1">{profile.email}</p>
              <p className="text-blue-200 text-xs mt-1 flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" /> Membre depuis {memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards (overlap) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Annonces", value: stats.ads_count, icon: DocumentTextIcon, color: "text-blue-500" },
            { label: "Favoris", value: stats.favorites, icon: HeartIcon, color: "text-red-500" },
            { label: "Messages", value: stats.messages, icon: ChatBubbleLeftRightIcon, color: "text-indigo-500" },
            { label: "Réservations", value: stats.reservations, icon: BuildingOffice2Icon, color: "text-rose-500" },
            { label: "Vues totales", value: stats.views_total.toLocaleString(), icon: EyeIcon, color: "text-emerald-500" },
            { label: "Avis donnés", value: `${stats.reviews_avg > 0 ? Number(stats.reviews_avg).toFixed(1) : 0}/5`, icon: StarSolid, color: "text-orange-500" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-md)] text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Success Toast */}
        {saved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
            <CheckIcon className="w-5 h-5" /> Modifications enregistrées avec succès
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 text-sm">{saveError}</div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)] overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all
                    ${activeTab === tab.id
                      ? "bg-primary/10 text-primary border-l-3 border-primary"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
              <div className="border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500
                    hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* --- TAB: Informations --- */}
            {activeTab === "info" && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Informations personnelles</h2>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        text-primary hover:bg-primary/10 transition-all">
                      <PencilSquareIcon className="w-4 h-4" /> Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
                          text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all">
                        <XMarkIcon className="w-4 h-4" /> Annuler
                      </button>
                      <button onClick={handleSave}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
                          bg-primary text-white hover:bg-primary-hover transition-all">
                        <CheckIcon className="w-4 h-4" /> Enregistrer
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Informations Personnelles */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                      <span>👤</span> Informations Personnelles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Nom" icon={UserCircleIcon} value={profile.nom}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, nom: v })} />
                      <Field label="Post-nom" icon={UserCircleIcon} value={profile.post_nom}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, post_nom: v })} />
                      <Field label="Prénom" icon={UserCircleIcon} value={profile.prenom}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, prenom: v })} />
                      <Field label="Date de naissance" icon={CalendarDaysIcon} value={profile.date_naissance}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, date_naissance: v })} type="date" />
                      <Field label="Lieu de naissance" icon={MapPinIcon} value={profile.lieu_naissance || ""}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, lieu_naissance: v })} />
                      <Field label="Sexe" icon={UserCircleIcon} value={profile.sexe}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, sexe: v })} />
                      <Field label="Nationalité" icon={UserCircleIcon} value={profile.nationalite}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, nationalite: v })} />
                      <Field label="État civil" icon={UserCircleIcon} value={profile.etat_civil}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, etat_civil: v })} />
                      <Field label="Profession" icon={DocumentTextIcon} value={profile.profession}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, profession: v })} />
                    </div>
                  </div>

                  {/* Pièce d'identité */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                      <span>🪪</span> Pièce d&apos;identité
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Numéro de pièce" icon={DocumentTextIcon} value={profile.numero_piece}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, numero_piece: v })} />
                      <Field label="Type de pièce" icon={DocumentTextIcon} value={profile.piece_identite}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, piece_identite: v })} />
                    </div>
                  </div>

                  {/* Coordonnées */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                      <span>📍</span> Coordonnées
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Adresse" icon={MapPinIcon} value={profile.adresse}
                          editing={isEditing} onChange={(v) => setProfile({ ...profile, adresse: v })} />
                      </div>
                      <Field label="Téléphone portable" icon={PhoneIcon} value={profile.phone}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, phone: v })} type="tel" />
                      <Field label="Téléphone fixe" icon={PhoneIcon} value={profile.phone_fixe}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, phone_fixe: v })} type="tel" />
                      <Field label="Email" icon={EnvelopeIcon} value={profile.email}
                        editing={isEditing} onChange={(v) => setProfile({ ...profile, email: v })} type="email" />
                    </div>
                  </div>

                  {/* Compte */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                      <span>⚙️</span> Compte
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Rôle" icon={DocumentTextIcon} value={profile.role}
                        editing={false} onChange={() => {}} />
                      <Field label="Services" icon={DocumentTextIcon}
                        value={Array.isArray(profile.services) ? profile.services.join(", ") : ""}
                        editing={false} onChange={() => {}} />
                      <Field label="Membre depuis" icon={CalendarDaysIcon}
                        value={profile.created_at ? new Date(profile.created_at).toLocaleDateString("fr-FR") : ""}
                        editing={false} onChange={() => {}} />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                      <span>📝</span> À propos
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Présentez-vous en quelques lignes..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                          text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                          focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {profile.bio || <span className="text-[var(--text-muted)] italic">Aucune description</span>}
                      </p>
                    )}
                  </div>

                  {/* Professional Info */}
                  {(user.role === "professional" || user.role === "admin") && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                        <span>🏢</span> Informations professionnelles
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nom de l'entreprise" icon={DocumentTextIcon} value={profile.company_name} placeholder="Mon Agence"
                          editing={isEditing} onChange={(v) => setProfile({ ...profile, company_name: v })} />
                        <Field label="SIRET" icon={DocumentTextIcon} value={profile.siret} placeholder="123 456 789 00012"
                          editing={isEditing} onChange={(v) => setProfile({ ...profile, siret: v })} />
                        <div className="sm:col-span-2">
                          <Field label="Site web" icon={DocumentTextIcon} value={profile.website} placeholder="https://mon-site.fr"
                            editing={isEditing} onChange={(v) => setProfile({ ...profile, website: v })} type="url" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: Sécurité --- */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                  <div className="px-6 py-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Changer le mot de passe</h2>
                  </div>
                  <div className="p-6 space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Mot de passe actuel</label>
                      <input type="password" value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                          text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nouveau mot de passe</label>
                      <input type="password" value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                          text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      {passwords.newPass && (
                        <div className="mt-2 flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${
                              passwords.newPass.length >= i * 3
                                ? i <= 2 ? "bg-red-400" : i === 3 ? "bg-amber-400" : "bg-emerald-400"
                                : "bg-[var(--border-color)]"
                            }`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Confirmer</label>
                      <input type="password" value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                          text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      {passwords.confirm && passwords.confirm !== passwords.newPass && (
                        <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                      )}
                    </div>
                    {pwError && <p className="text-sm text-red-500">{pwError}</p>}
                    {pwSuccess && <p className="text-sm text-emerald-600">✓ Mot de passe mis à jour avec succès</p>}
                    <button onClick={handlePasswordChange}
                      disabled={!passwords.current || !passwords.newPass || passwords.newPass !== passwords.confirm}
                      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold
                        hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      Mettre à jour
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                  <div className="px-6 py-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sessions actives</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-lg">🖥️</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Navigateur actuel</p>
                          <p className="text-xs text-[var(--text-muted)]">Session active maintenant</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Active</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-6">
                  <h3 className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">Zone dangereuse</h3>
                  <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">La suppression du compte est irréversible.</p>
                  <button className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400
                    text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all">
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB: Services --- */}
            {activeTab === "services" && (
              <div className="space-y-6">
                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                  <div className="px-6 py-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Mes services actifs</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {userServices.length === 0 ? (
                      <div className="text-center py-8 text-[var(--text-muted)]">
                        <p className="text-sm">Aucun service souscrit</p>
                        <Link href="/abonnement" className="mt-3 inline-block px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary-hover transition-all">Voir les abonnements</Link>
                      </div>
                    ) : userServices.map((svc: any, i: number) => {
                      const key = svc.service || svc.service_type || "";
                      const meta = serviceIcons[key] || { icon: DocumentTextIcon, label: key, color: "bg-gray-500" };
                      const isActive = svc.status === "active" || svc.status === "approved";
                      const endDate = svc.endDate || svc.subscription_end;
                      return (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center`}>
                              <meta.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">{meta.label}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {endDate ? `Expire le ${new Date(endDate).toLocaleDateString("fr-FR")}` : "Abonnement actif"}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          }`}>
                            {isActive ? "Actif" : "En attente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                  <div className="px-6 py-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Abonnement</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/20">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Plan Complet</p>
                        <p className="text-sm text-[var(--text-muted)]">49 FC/mois · Prochain paiement le 16 mai 2026</p>
                      </div>
                      <Link href="/tarifs" className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all">
                        Gérer
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: Activité --- */}
            {activeTab === "activity" && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Activité récente</h2>
                  <Link href="/tableau-de-bord/reservation?tab=mes-reservations" className="text-sm text-primary hover:underline">Voir tout</Link>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                  {activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                      <CalendarDaysIcon className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">Aucune activité récente</p>
                      <Link href="/reservation" className="mt-3 text-sm text-primary hover:underline">Explorer les biens</Link>
                    </div>
                  )}
                  {activities.map((act, idx) => (
                    <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-hover)] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-100 dark:bg-rose-900/30">
                          <BuildingOffice2Icon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{act.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{act.date}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        act.status === "confirmed" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                        act.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                        act.status === "cancelled" ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" :
                        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      }`}>
                        {act.status === "confirmed" ? "Confirmée" : act.status === "pending" ? "En attente" : act.status === "cancelled" ? "Annulée" : act.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB: Notifications --- */}
            {activeTab === "notifications" && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="px-6 py-4 border-b border-[var(--border-color)]">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Préférences de notification</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Email</h3>
                    <div className="space-y-3">
                      {[
                        { key: "email_new_message", label: "Nouveau message reçu" },
                        { key: "email_ad_approved", label: "Annonce approuvée" },
                        { key: "email_ad_rejected", label: "Annonce refusée" },
                        { key: "email_rental_request", label: "Demande de location" },
                        { key: "email_payment", label: "Confirmation de paiement" },
                      ].map((n) => (
                        <Toggle key={n.key} label={n.label}
                          checked={notifPrefs[n.key as keyof typeof notifPrefs]}
                          onChange={(v) => setNotifPrefs({ ...notifPrefs, [n.key]: v })} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Push</h3>
                    <div className="space-y-3">
                      {[
                        { key: "push_new_message", label: "Nouveau message" },
                        { key: "push_ad_approved", label: "Annonce approuvée" },
                        { key: "push_promotions", label: "Offres et promotions" },
                      ].map((n) => (
                        <Toggle key={n.key} label={n.label}
                          checked={notifPrefs[n.key as keyof typeof notifPrefs]}
                          onChange={(v) => setNotifPrefs({ ...notifPrefs, [n.key]: v })} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Autre</h3>
                    <Toggle label="Newsletter mensuelle" checked={notifPrefs.newsletter}
                      onChange={(v) => setNotifPrefs({ ...notifPrefs, newsletter: v })} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Components ─── */

function Field({ label, icon: Icon, value, placeholder, editing, onChange, type = "text" }: {
  label: string;
  icon: typeof UserCircleIcon;
  value: string;
  placeholder?: string;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
      {editing ? (
        <div className="relative">
          <Icon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
              text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
              focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 text-sm">
          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
          <span className={value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] italic"}>
            {value || placeholder || "Non renseigné"}
          </span>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-[var(--border-color)]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}
