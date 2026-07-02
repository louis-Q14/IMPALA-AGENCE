"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { LogoFull } from "@/components/Logo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Step = "email" | "otp" | "password" | "done";

export default function MotDePasseOubliePage() {
  const [step, setStep] = useState<Step>("email");

  // Step 1
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailMasked, setEmailMasked] = useState("");

  // Step 2
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    resendTimer.current = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => { if (resendTimer.current) clearTimeout(resendTimer.current); };
  }, [resendCooldown]);

  // Step 1 Ã¢â‚¬â€ send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim()) { setEmailError("Veuillez saisir votre adresse email"); return; }
    setEmailLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setEmailError(data.error || "Trop de tentatives. Veuillez attendre.");
      } else if (!res.ok) {
        setEmailError(data.error || "Erreur lors de l'envoi");
      } else {
        setEmailMasked(data.email_masked || email);
        setResendCooldown(120);
        setStep("otp");
      }
    } catch {
      setEmailError("Service indisponible. RÃƒÂ©essayez.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Step 2 Ã¢â‚¬â€ verify OTP inline (just move to step 3, real validation at step 3 submit)
  const handleVerifyOtp = () => {
    if (otp.trim().length !== 6) { setOtpError("Saisissez le code ÃƒÂ  6 chiffres"); return; }
    setOtpError("");
    setStep("password");
  };

  // Step 2 Ã¢â‚¬â€ resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setOtpError(data.error || "Veuillez attendre avant de renvoyer.");
      } else if (res.ok) {
        setResendCooldown(120);
        setOtpError("");
      }
    } catch {
      setOtpError("Erreur de connexion. RÃƒÂ©essayez.");
    }
  };

  // Step 3 Ã¢â‚¬â€ reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (password.length < 8) { setPasswordError("Le mot de passe doit contenir au moins 8 caractÃƒÂ¨res"); return; }
    if (password !== confirmPassword) { setPasswordError("Les mots de passe ne correspondent pas"); return; }
    setPasswordLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("done");
      } else {
        setPasswordError(data.error || "Erreur lors de la rÃƒÂ©initialisation");
        if (data.error?.includes("Code invalide") || data.error?.includes("expirÃƒÂ©")) {
          setStep("otp");
          setOtp("");
          setOtpError(data.error);
        }
      }
    } catch {
      setPasswordError("Service indisponible. RÃƒÂ©essayez.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center mb-2">
            <LogoFull className="h-12 w-auto" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
            {step === "email" && "Mot de passe oubliÃƒÂ©"}
            {step === "otp" && "VÃƒÂ©rification du code"}
            {step === "password" && "Nouveau mot de passe"}
            {step === "done" && "Mot de passe mis ÃƒÂ  jour"}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {step === "email" && "Entrez votre email pour recevoir un code de rÃƒÂ©initialisation"}
            {step === "otp" && `Un code ÃƒÂ  6 chiffres a ÃƒÂ©tÃƒÂ© envoyÃƒÂ© ÃƒÂ  ${emailMasked}`}
            {step === "password" && "Choisissez un mot de passe sÃƒÂ©curisÃƒÂ©"}
            {step === "done" && "Votre mot de passe a ÃƒÂ©tÃƒÂ© modifiÃƒÂ© avec succÃƒÂ¨s"}
          </p>
        </div>

        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["email", "otp", "password"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s ? "w-8 bg-primary" :
                  (["email", "otp", "password"].indexOf(step) > i) ? "w-2 bg-primary/60" :
                  "w-2 bg-[var(--border-color)]"
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ STEP 1: Email Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {emailError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {emailError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </span>
                ) : "Envoyer le code"}
              </button>
              <div className="text-center pt-2">
                <Link href="/connexion" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Retour ÃƒÂ  la connexion
                </Link>
              </div>
            </form>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ STEP 2: OTP Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <EnvelopeIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  VÃƒÂ©rifiez vos spams si vous ne trouvez pas l&apos;email.
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtpError("");
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="w-full text-center text-3xl font-bold tracking-[0.6em] px-4 py-4 rounded-xl
                  bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)]
                  placeholder:tracking-normal placeholder:text-2xl
                  focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢"
                autoFocus
              />

              {otpError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {otpError}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  onClick={() => { setStep("email"); setOtp(""); setOtpError(""); }}
                  className="text-[var(--text-secondary)] hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  Changer l&apos;email
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-primary hover:underline disabled:text-[var(--text-muted)] disabled:no-underline transition-colors"
                >
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                </button>
              </div>
            </div>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ STEP 3: New password Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {passwordError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractÃƒÂ¨res"
                    autoFocus
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary">
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-500 mt-1">Minimum 8 caractÃƒÂ¨res ({password.length}/8)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="RÃƒÂ©pÃƒÂ©tez le mot de passe"
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]
                      text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary">
                    {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <button
                type="submit"
                disabled={passwordLoading || password.length < 8 || password !== confirmPassword}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold
                  hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Mise ÃƒÂ  jour...
                  </span>
                ) : "Mettre ÃƒÂ  jour le mot de passe"}
              </button>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("otp"); setPasswordError(""); }}
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Retour au code
                </button>
              </div>
            </form>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ STEP 4: Done Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Mot de passe mis ÃƒÂ  jour !
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Votre mot de passe a ÃƒÂ©tÃƒÂ© modifiÃƒÂ© avec succÃƒÂ¨s. Vous pouvez maintenant vous connecter.
              </p>
              <Link
                href="/connexion"
                className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all"
              >
                Se connecter
              </Link>
            </div>
          )}

        </div>

        {step === "email" && (
          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/connexion" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

