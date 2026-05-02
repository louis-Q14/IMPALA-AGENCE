"use client";
import { usePathname } from "next/navigation";import Link from "next/link";
import { LogoFull } from "./Logo";
import {
  HomeIcon,
  TruckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const footerLinks = {
  services: [
    { name: "Immobilier", href: "/immobilier" },
    { name: "Automobile", href: "/automobile" },
    { name: "Ramassage Poubelles", href: "/poubelles" },
    { name: "Tarifs", href: "/tarifs" },
  ],
  entreprise: [
    { name: "À propos", href: "/a-propos" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
    { name: "Carrières", href: "/carrieres" },
  ],
  legal: [
    { name: "Mentions légales", href: "/mentions-legales" },
    { name: "CGU", href: "/cgu" },
    { name: "Politique de confidentialité", href: "/confidentialite" },
    { name: "Cookies", href: "/cookies" },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  if (['/connexion', '/inscription'].includes(pathname ?? '')) return null;
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <LogoFull className="h-8 w-auto" />

            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Votre plateforme multiservices pour l&apos;immobilier, l&apos;automobile et le ramassage de poubelles.
            </p>
            <div className="flex gap-3">
              {[HomeIcon, TruckIcon, TrashIcon].map((Icon, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center
                    border border-[var(--border-color)]"
                >
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              ))}
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Services
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Entreprise
            </h3>
            <ul className="space-y-3">
              {footerLinks.entreprise.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Légal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} IMPALA-AGENCE. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--text-muted)]">
              Made with ❤️ in France
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
