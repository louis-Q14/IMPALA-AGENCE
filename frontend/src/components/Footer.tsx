"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogoFull } from "./Logo";

const footerLinks = {
  services: [
    { name: "Immobilier", href: "/immobilier" },
    { name: "Automobile", href: "/automobile" },
    { name: "Multi-Impala", href: "/multi-impala" },
  ],
  entreprise: [
    { name: "À propos", href: "/a-propos" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ],
  legal: [
    { name: "Mentions légales", href: "/mentions-legales" },
    { name: "CGU", href: "/cgu" },
    { name: "Politique de confidentialité", href: "/confidentialite" },
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
              {[
                { src: "/immobilier-icon.png", alt: "Immobilier" },
                { src: "/automobile-icon.png", alt: "Automobile" },
                { src: "/multi-impala-icon.png", alt: "Multi-Impala" },
              ].map((icon) => (
                <div
                  key={icon.alt}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center
                    border border-[var(--border-color)] p-1.5"
                >
                  <Image src={icon.src} alt={icon.alt} width={28} height={28} className="object-contain" />
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

        </div>
      </div>
    </footer>
  );
}
