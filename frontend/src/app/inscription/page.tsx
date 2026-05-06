"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { LogoFull } from "@/components/Logo";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  PhoneIcon,
  HomeIcon,
  TruckIcon,
  TrashIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  IdentificationIcon,
  MapPinIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ScissorsIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const serviceOptions = [
  {
    id: "real_estate",
    label: "Immobilier",
    description: "Vente et location de biens",
    icon: HomeIcon,
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "auto",
    label: "Automobile",
    description: "Vente et location de véhicules",
    icon: TruckIcon,
    color: "from-amber-500 to-orange-600",
  },
];

const multiImpalaServices = [
  {
    id: "trash",
    label: "Ramassage de poubelles",
    description: "Collecte à domicile",
    icon: TrashIcon,
    color: "from-emerald-500 to-green-700",
  },
  {
    id: "nettoyage",
    label: "Nettoyage de bureau",
    description: "Service professionnel de nettoyage",
    icon: SparklesIcon,
    color: "from-blue-400 to-cyan-500",
  },
  {
    id: "repassage",
    label: "Repassage",
    description: "Service professionnel de repassage",
    icon: ScissorsIcon,
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "demenagement",
    label: "Déménagement",
    description: "Transport et installation de vos biens",
    icon: ArchiveBoxIcon,
    color: "from-orange-400 to-amber-500",
  },
];

const multiImpalaServiceUrls: Record<string, string> = {
  trash: "/multi-impala/poubelles/paiement",
  nettoyage: "/multi-impala/nettoyage",
  repassage: "/multi-impala/repassage",
  demenagement: "/multi-impala/demenagement",
};

const sexeOptions = ["Masculin", "Féminin"];
const nationaliteOptions = ["Congolaise", "Française", "Belge", "Camerounaise", "Ivoirienne", "Sénégalaise", "Autre"];
const etatCivilOptions = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"];

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionContent />
    </Suspense>
  );
}

function InscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [role, setRole] = useState<"user" | "pro" | "visiteur">("user");

  // Pre-select service from URL param (e.g. ?service=nettoyage or ?service=real_estate)
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam) {
      const validServices = ["real_estate", "auto", "trash", "nettoyage", "repassage", "demenagement"];
      if (validServices.includes(serviceParam)) {
        setSelectedServices([serviceParam]);
      }
    }
  }, [searchParams]);

  // Step 2 — Identité
  const [nom, setNom] = useState("");
  const [postNom, setPostNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [sexe, setSexe] = useState("");
  const [nationalite, setNationalite] = useState("");
  const [etatCivil, setEtatCivil] = useState("");
  const [profession, setProfession] = useState("");
  const [nomEtablissement, setNomEtablissement] = useState("");

  // Step 3 — Coordonnées & Sécurité
  const [typePiece, setTypePiece] = useState<"" | "carte_electeur" | "passeport">("");
  const [numeroPiece, setNumeroPiece] = useState("");
  const [pieceFile, setPieceFile] = useState<File | null>(null);
  const [pieceError, setPieceError] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephonePortable, setTelephonePortable] = useState("");
  const [telephoneFixe, setTelephoneFixe] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step3Attempted, setStep3Attempted] = useState(false);

  // OTP verification
  const [userId, setUserId] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCooldown]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const fullName = `${nom} ${postNom} ${prenom}`.trim();

  const isStep2Valid =
    nom.trim().length >= 2 &&
    postNom.trim().length >= 1 &&
    prenom.trim().length >= 1 &&
    dateNaissance !== "" &&
    lieuNaissance.trim().length >= 2 &&
    sexe !== "" &&
    nationalite !== "" &&
    etatCivil !== "" &&
    profession.trim().length >= 2 &&
    (role !== "pro" || nomEtablissement.trim().length >= 2);

  const isStep3Valid =
    (
      (typePiece === "carte_electeur" && /^\d{11}$/.test(numeroPiece.trim())) ||
      (typePiece === "passeport" && /^[A-Z]{2}\d{7}$/.test(numeroPiece.trim().toUpperCase()))
    ) &&
    adresse.trim().length >= 5 &&
    telephonePortable.trim().length >= 8 &&
    email.includes("@") &&
    password.length >= 8 &&
    confirmPassword === password;

  const handleSubmit = async () => {
    if (!acceptCGU) return;
    setIsLoading(true);
    try {
      // Use FormData to send file + fields
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("nom", nom);
      formData.append("post_nom", postNom);
      formData.append("prenom", prenom);
      formData.append("date_naissance", dateNaissance);
      formData.append("lieu_naissance", lieuNaissance);
      formData.append("sexe", sexe);
      formData.append("nationalite", nationalite);
      formData.append("etat_civil", etatCivil);
      formData.append("profession", profession);
      if (nomEtablissement.trim()) formData.append("nom_etablissement", nomEtablissement);
      formData.append("type_piece", typePiece);
      formData.append("numero_piece", numeroPiece);
      formData.append("adresse", adresse);
      formData.append("email", email);
      formData.append("phone", telephonePortable);
      if (telephoneFixe) formData.append("phone_fixe", telephoneFixe);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("services", JSON.stringify(selectedServices));
      if (pieceFile) {
        formData.append("piece_identite", pieceFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.requires_verification) {
        setUserId(data.user_id);
        setEmailMasked(data.email_masked || email);
        setOtpResendCooldown(60);
        setStep(5);
      } else if (!res.ok) {
        alert(data.error || "Erreur lors de l'inscription");
      }
    } catch {
      alert("Service d'inscription indisponible");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6 || otpLoading) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, otp: otpCode }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/tableau-de-bord");
      } else {
        setOtpError(data.error || "Code incorrect");
        setOtpCode("");
      }
    } catch {
      setOtpError("Erreur de connexion. Réessayez.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setOtpError("");
    setOtpCode("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setOtpResendCooldown(60);
      } else {
        setOtpError(data.error || "Impossible d'envoyer le code");
      }
    } catch {
      setOtpError("Erreur de connexion");
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              <LogoFull className="h-8 w-auto" />
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
            Créer un compte
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Rejoignez IMPALA-AGENCE en quelques étapes
          </p>
        </div>

        {/* Steps Indicator */}
        {step <= 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { n: 1, label: "Services" },
              { n: 2, label: "Identité" },
              { n: 3, label: "Coordonnées" },
              { n: 4, label: "Confirmation" },
              { n: 5, label: "Vérification" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step >= s.n
                        ? "bg-primary text-white"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-color)]"
                    }`}
                  >
                    {step > s.n ? <CheckCircleIcon className="w-5 h-5" /> : s.n}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 hidden sm:block">{s.label}</span>
                </div>
                {i < 4 && (
                  <div className={`w-6 sm:w-10 h-0.5 ${step > s.n ? "bg-primary" : "bg-[var(--border-color)]"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="p-4 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
          {/* ==================== Step 1: Services ==================== */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Choisissez vos services
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Sélectionnez un ou plusieurs services
              </p>

              <div className="space-y-3 mb-6">
                {serviceOptions.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${`
                      selectedServices.includes(svc.id)
                        ? "border-primary bg-primary/5"
                        : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center flex-shrink-0`}>
                      <svc.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">{svc.label}</p>
                      <p className="text-sm text-[var(--text-muted)]">{svc.description}</p>
                    </div>
                    {selectedServices.includes(svc.id) && (
                      <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Multi-Impala group */}
                <div className={`rounded-xl border-2 overflow-hidden transition-all ${
                  multiImpalaServices.some((s) => selectedServices.includes(s.id))
                    ? "border-primary"
                    : "border-[var(--border-color)]"
                }`}>
                  {/* Header */}
                  <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)]">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                      <BuildingStorefrontIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">Multi-Impala</p>
                      <p className="text-sm text-[var(--text-muted)]">Services du quotidien</p>
                    </div>
                    {multiImpalaServices.some((s) => selectedServices.includes(s.id)) && (
                      <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                  {/* Sub-services */}
                  <div className="divide-y divide-[var(--border-color)]">
                    {multiImpalaServices.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className={`w-full flex items-center gap-4 pl-8 pr-4 py-3 text-left transition-all ${
                          selectedServices.includes(svc.id)
                            ? "bg-primary/5"
                            : "hover:bg-[var(--bg-secondary)]"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center flex-shrink-0`}>
                          <svc.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text-primary)] text-sm">{svc.label}</p>
                          <p className="text-xs text-[var(--text-muted)]">{svc.description}</p>
                        </div>
                        {selectedServices.includes(svc.id) && (
                          <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Vous êtes</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setRole("user")}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all ${
                      role === "user"
                        ? "border-primary bg-primary/5"
                        : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <p className="font-medium text-sm text-[var(--text-primary)]">Particulier</p>
                  </button>
                  <button
                    onClick={() => setRole("pro")}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all ${
                      role === "pro"
                        ? "border-primary bg-primary/5"
                        : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <p className="font-medium text-sm text-[var(--text-primary)]">Professionnel</p>
                  </button>
                  <button
                    onClick={() => { setRole("visiteur"); setSelectedServices([]); }}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all ${
                      role === "visiteur"
                        ? "border-primary bg-primary/5"
                        : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <p className="font-medium text-sm text-[var(--text-primary)]">Visiteur</p>
                  </button>
                </div>
                {role === "visiteur" && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Compte sans abonnement — accès à la consultation des annonces et à la messagerie.
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (role === "visiteur" || selectedServices.length > 0) setStep(2);
                }}
                disabled={role !== "visiteur" && selectedServices.length === 0}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          )}

          {/* ==================== Step 2: Identité ==================== */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Informations personnelles
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Renseignez votre identité
                  </p>
                </div>
              </div>

              <form className="space-y-4 mt-6" onSubmit={(e) => e.preventDefault()}>
                {/* Nom / Post-nom / Prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Nom *</label>
                    <input
                      type="text"
                      placeholder="Kabila"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Post-nom *</label>
                    <input
                      type="text"
                      placeholder="Mulongo"
                      value={postNom}
                      onChange={(e) => setPostNom(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Prénom *</label>
                    <input
                      type="text"
                      placeholder="Jean"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Date & Lieu de naissance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date de naissance *</label>
                    <input
                      type="date"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Lieu de naissance *</label>
                    <input
                      type="text"
                      placeholder="Lubumbashi"
                      value={lieuNaissance}
                      onChange={(e) => setLieuNaissance(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Sexe / Nationalité */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Sexe *</label>
                    <select
                      value={sexe}
                      onChange={(e) => setSexe(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sélectionner...</option>
                      {sexeOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nationalité *</label>
                    <select
                      value={nationalite}
                      onChange={(e) => setNationalite(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sélectionner...</option>
                      {nationaliteOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* État civil / Profession */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>État civil *</label>
                    <select
                      value={etatCivil}
                      onChange={(e) => setEtatCivil(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sélectionner...</option>
                      {etatCivilOptions.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Profession *</label>
                    <input
                      type="text"
                      placeholder="Ingénieur, Commerçant..."
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Nom de l'établissement — compte pro uniquement */}
                {role === "pro" && (
                  <div>
                    <label className={labelClass}>Nom de l'établissement *</label>
                    <input
                      type="text"
                      placeholder="Nom de votre entreprise ou agence"
                      value={nomEtablissement}
                      onChange={(e) => setNomEtablissement(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 sm:py-3.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)]
                      font-medium hover:bg-[var(--bg-hover)] transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => isStep2Valid && setStep(3)}
                    disabled={!isStep2Valid}
                    className="flex-1 py-3 sm:py-3.5 rounded-xl bg-primary text-white font-semibold
                      hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== Step 3: Coordonnées & Sécurité ==================== */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <IdentificationIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Coordonnées & Sécurité
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    Pièce d&apos;identité, adresse et accès au compte
                  </p>
                </div>
              </div>

              <form className="space-y-4 mt-6" onSubmit={(e) => e.preventDefault()}>
                {/* Pièce d'identité */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Type de pièce *</label>
                    <select
                      value={typePiece}
                      onChange={(e) => {
                        setTypePiece(e.target.value as "" | "carte_electeur" | "passeport");
                        setNumeroPiece("");
                        if (step3Attempted) setStep3Attempted(false);
                      }}
                      className={`${inputClass} ${step3Attempted && typePiece === "" ? "border-red-500 ring-1 ring-red-500" : ""} mb-3`}
                    >
                      <option value="">Sélectionner le type...</option>
                      <option value="carte_electeur">Carte d&apos;électeur</option>
                      <option value="passeport">Passeport</option>
                    </select>

                    <label className={labelClass}>N° pièce d&apos;identité *</label>
                    <div className="relative">
                      <IdentificationIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder={typePiece === "passeport" ? "Ex: AB1234567" : "Ex: 12345678901"}
                        value={numeroPiece}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (typePiece === "carte_electeur") {
                            setNumeroPiece(raw.replace(/\D/g, "").slice(0, 11));
                            return;
                          }
                          if (typePiece === "passeport") {
                            setNumeroPiece(raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9));
                            return;
                          }
                          setNumeroPiece(raw);
                        }}
                        className={`${inputClass} pl-12 ${step3Attempted && !((typePiece === "carte_electeur" && /^\d{11}$/.test(numeroPiece.trim())) || (typePiece === "passeport" && /^[A-Z]{2}\d{7}$/.test(numeroPiece.trim().toUpperCase()))) ? "border-red-500 ring-1 ring-red-500" : ""}`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {typePiece === "passeport"
                        ? "Format passeport: 2 lettres majuscules + 7 chiffres (ex: AB1234567)."
                        : "Format carte d'électeur: 11 chiffres."}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Upload pièce d&apos;identité <span className="text-xs text-[var(--text-muted)]">(bientôt disponible)</span></label>
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-sm border-[var(--border-color)] text-[var(--text-muted)] opacity-50 cursor-not-allowed">
                      <DocumentArrowUpIcon className="w-5 h-5" />
                      Fonctionnalité temporairement désactivée
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className={labelClass}>Adresse complète *</label>
                  <div className="relative">
                    <MapPinIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="123 Avenue de la Paix, Lubumbashi"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      className={`${inputClass} pl-12 ${step3Attempted && adresse.trim().length < 5 ? "border-red-500 ring-1 ring-red-500" : ""}`}
                    />
                  </div>
                </div>

                {/* Téléphones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Téléphone portable *</label>
                    <div className="relative">
                      <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="tel"
                        placeholder="+243 812 345 678"
                        value={telephonePortable}
                        onChange={(e) => setTelephonePortable(e.target.value)}
                        className={`${inputClass} pl-12 ${step3Attempted && telephonePortable.trim().length < 8 ? "border-red-500 ring-1 ring-red-500" : ""}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone fixe <span className="text-[var(--text-muted)] font-normal">(optionnel)</span></label>
                    <div className="relative">
                      <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="tel"
                        placeholder="+243 1 234 567"
                        value={telephoneFixe}
                        onChange={(e) => setTelephoneFixe(e.target.value)}
                        className={`${inputClass} pl-12`}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Adresse mail *</label>
                  <div className="relative">
                    <EnvelopeIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} pl-12 ${step3Attempted && !email.includes("@") ? "border-red-500 ring-1 ring-red-500" : ""}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Mot de passe *</label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pl-12 pr-12 ${step3Attempted && password.length < 8 ? "border-red-500 ring-1 ring-red-500" : ""}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">Le mot de passe doit contenir au moins 8 caractères</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirmer le mot de passe *</label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Répétez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pl-12 pr-12 ${step3Attempted && confirmPassword !== password ? "border-red-500 ring-1 ring-red-500" : confirmPassword.length > 0 && confirmPassword === password ? "border-green-500 ring-1 ring-green-500" : ""}`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                  {confirmPassword.length > 0 && confirmPassword === password && password.length >= 8 && (
                    <p className="text-xs text-green-500 mt-1">Les mots de passe correspondent ✓</p>
                  )}
                </div>

                {step3Attempted && !isStep3Valid && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Veuillez remplir tous les champs obligatoires :</p>
                        <ul className="mt-2 list-disc list-inside text-xs space-y-1">
                          {typePiece === "" && <li>Type de pièce d&apos;identité</li>}
                          {typePiece === "carte_electeur" && !/^\d{11}$/.test(numeroPiece.trim()) && <li>N° carte d&apos;électeur (11 chiffres)</li>}
                          {typePiece === "passeport" && !/^[A-Z]{2}\d{7}$/.test(numeroPiece.trim().toUpperCase()) && <li>N° passeport (2 lettres majuscules + 7 chiffres)</li>}

                          {adresse.trim().length < 5 && <li>Adresse complète (min. 5 caractères)</li>}
                          {telephonePortable.trim().length < 8 && <li>Téléphone portable (min. 8 chiffres)</li>}
                          {!email.includes("@") && <li>Adresse mail valide</li>}
                          {password.length < 8 && <li>Mot de passe (min. 8 caractères)</li>}
                          {confirmPassword !== password && <li>Les mots de passe ne correspondent pas</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 sm:py-3.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)]
                      font-medium hover:bg-[var(--bg-hover)] transition-all"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isStep3Valid) {
                        setStep3Attempted(false);
                        setStep(4);
                      } else {
                        setStep3Attempted(true);
                      }
                    }}
                    className="flex-1 py-3 sm:py-3.5 rounded-xl bg-primary text-white font-semibold
                      hover:bg-primary-hover shadow-md transition-all"
                  >
                    Continuer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== Step 4: Confirmation ==================== */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  Vérifiez vos informations
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Assurez-vous que tout est correct avant de créer votre compte
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Identité */}
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Identité</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Nom complet", value: `${nom} ${postNom} ${prenom}` },
                      { label: "Date de naissance", value: dateNaissance ? new Date(dateNaissance).toLocaleDateString("fr-FR") : "" },
                      { label: "Lieu de naissance", value: lieuNaissance },
                      { label: "Sexe", value: sexe },
                      { label: "Nationalité", value: nationalite },
                      { label: "État civil", value: etatCivil },
                      { label: "Profession", value: profession },
                      ...(nomEtablissement.trim() ? [{ label: "Établissement", value: nomEtablissement }] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{item.label}</span>
                        <span className="font-medium text-[var(--text-primary)] text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Coordonnées</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Type de pièce", value: typePiece === "passeport" ? "Passeport" : "Carte d'électeur" },
                      { label: "N° pièce d'identité", value: numeroPiece },

                      { label: "Adresse", value: adresse },
                      { label: "Tél. portable", value: telephonePortable },
                      ...(telephoneFixe ? [{ label: "Tél. fixe", value: telephoneFixe }] : []),
                      { label: "Email", value: email },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">{item.label}</span>
                        <span className="font-medium text-[var(--text-primary)] text-right max-w-[60%] truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Compte</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Type</span>
                      <span className="font-medium text-[var(--text-primary)]">{role === "pro" ? "Professionnel" : "Particulier"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Services</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {selectedServices.map((s) => serviceOptions.find((o) => o.id === s)?.label).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-[var(--text-secondary)] mb-6 text-left">
                <input type="checkbox" checked={acceptCGU} onChange={(e) => setAcceptCGU(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] text-primary" />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="/cgu" className="text-primary hover:underline">conditions d&apos;utilisation</Link>
                  {" "}et la{" "}
                  <Link href="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 sm:py-3.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)]
                    font-medium hover:bg-[var(--bg-hover)] transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!acceptCGU || isLoading}
                  className="flex-1 py-3 sm:py-3.5 rounded-xl bg-primary text-white font-semibold
                    hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Création..." : "Créer mon compte"}
                </button>
              </div>
            </div>
          )}

          {/* ==================== Step 5: Vérification OTP ==================== */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <EnvelopeIcon className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Vérification de votre email
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Un code à 6 chiffres a été envoyé à
              </p>
              <p className="text-base font-semibold text-[var(--text-primary)] mb-6">
                {emailMasked}
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpError("");
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="w-full text-center text-3xl font-bold tracking-[0.6em] px-4 py-4 rounded-xl
                  bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)]
                  placeholder:tracking-normal placeholder:text-2xl
                  focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
                placeholder="••••••"
                autoFocus
              />

              {otpError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  {otpError}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={otpCode.length !== 6 || otpLoading}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Vérification...
                  </span>
                ) : (
                  "Confirmer le code"
                )}
              </button>

              <button
                onClick={handleResendOtp}
                disabled={otpResendCooldown > 0}
                className="text-sm text-primary hover:underline disabled:text-[var(--text-muted)] disabled:no-underline transition-colors"
              >
                {otpResendCooldown > 0
                  ? `Renvoyer le code dans ${otpResendCooldown}s`
                  : "Renvoyer le code"}
              </button>

              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Le code est valide 10 minutes. Vérifiez vos spams si vous ne le trouvez pas.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
