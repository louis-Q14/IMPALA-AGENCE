import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales — IMPALA",
  description: "Mentions légales du site impala-agence, conformément à la législation en vigueur en République Démocratique du Congo.",
};

const sections = [
  {
    id: "editeur",
    num: "1.",
    title: "Éditeur du site",
    content: (
      <div className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>Le présent site est édité par :</p>
        <ul className="space-y-1 mt-3">
          <li><span className="font-medium text-[var(--text-primary)]">Dénomination sociale :</span> IMPALA</li>
          <li><span className="font-medium text-[var(--text-primary)]">Statut juridique :</span> Société à responsabilité limitée (SARL)</li>
          <li><span className="font-medium text-[var(--text-primary)]">Siège social :</span> République Démocratique du Congo <span className="text-[var(--text-muted)] italic">(adresse en cours)</span></li>
          <li><span className="font-medium text-[var(--text-primary)]">RCCM :</span> <span className="text-[var(--text-muted)] italic">en attente du document</span></li>
          <li><span className="font-medium text-[var(--text-primary)]">Numéro d&apos;identification nationale :</span> <span className="text-[var(--text-muted)] italic">en attente</span></li>
          <li><span className="font-medium text-[var(--text-primary)]">NIF :</span> <span className="text-[var(--text-muted)] italic">en attente</span></li>
        </ul>
        <p className="mt-4 font-medium text-[var(--text-primary)]">Coordonnées de contact :</p>
        <ul className="space-y-1">
          <li><span className="font-medium text-[var(--text-primary)]">Téléphone :</span> <span className="text-[var(--text-muted)] italic">+243 — en cours</span></li>
          <li>
            <span className="font-medium text-[var(--text-primary)]">Courriel :</span>{" "}
            <a href="mailto:contact@impala-agence.com" className="text-primary hover:underline">
              contact@impala-agence.com
            </a>
          </li>
          <li><span className="font-medium text-[var(--text-primary)]">Adresse physique :</span> <span className="text-[var(--text-muted)] italic">en construction</span></li>
        </ul>
      </div>
    ),
  },
  {
    id: "directeur",
    num: "2.",
    title: "Directeur de la publication",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <ul className="space-y-1">
          <li><span className="font-medium text-[var(--text-primary)]">Nom et prénom :</span> Francisco Mendess — Gérant légal d&apos;IMPALA</li>
          <li><span className="font-medium text-[var(--text-primary)]">Qualité :</span> Gérant</li>
        </ul>
        <p>
          Le directeur de la publication est responsable du contenu éditorial publié sur le site impala-agence.
        </p>
      </div>
    ),
  },
  {
    id: "objet",
    num: "3.",
    title: "Objet du site",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Le site impala-agence a pour vocation de présenter la société IMPALA, ses activités, son expertise, ainsi que l&apos;ensemble des services qu&apos;elle propose à sa clientèle particulière et professionnelle en République Démocratique du Congo.
        </p>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">Activités principales :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><span className="font-medium">Immobilier :</span> transactions, location, gestion locative, conseil et accompagnement immobilier</li>
            <li><span className="font-medium">Automobile :</span> vente, achat, mise en relation et services connexes</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">Services complémentaires :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Service après-déménagement</li>
            <li>Service de ramassage des poubelles</li>
            <li>Service de repassage à domicile</li>
            <li>Service de nettoyage de bureau</li>
          </ul>
        </div>
        <p>
          Le site met également à disposition des utilisateurs une plateforme de vente en ligne spécialisée dans l&apos;immobilier et l&apos;automobile, ainsi que l&apos;ensemble des services connexes liés au secteur immobilier.
        </p>
      </div>
    ),
  },
  {
    id: "propriete",
    num: "4.",
    title: "Propriété intellectuelle",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          L&apos;ensemble des éléments composant le site impala-agence — notamment les textes, images, photographies, illustrations, logos, marques, vidéos, sons, architecture, structure, mise en page, base de données et code source — est la propriété exclusive de la société IMPALA ou fait l&apos;objet d&apos;une autorisation régulière d&apos;utilisation.
        </p>
        <p>
          Ces éléments sont protégés par les dispositions légales relatives à la propriété intellectuelle en vigueur en République Démocratique du Congo, notamment l&apos;Ordonnance-loi n° 86-033 du 5 avril 1986 portant protection des droits d&apos;auteur et des droits voisins.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication, adaptation, traduction ou exploitation, totale ou partielle, des éléments du site, par quelque procédé et sur quelque support que ce soit, est <strong className="text-[var(--text-primary)]">strictement interdite</strong> sans l&apos;autorisation écrite préalable d&apos;IMPALA.
        </p>
        <p>
          Toute exploitation non autorisée du site ou de l&apos;un quelconque de ses éléments est susceptible d&apos;engager la responsabilité civile et pénale de son auteur.
        </p>
      </div>
    ),
  },
  {
    id: "responsabilite",
    num: "5.",
    title: "Responsabilité civile",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Conformément à l&apos;article 258 du décret du 30 juillet 1888 portant des contrats ou des obligations conventionnelles (Code civil congolais, Livre III), la société IMPALA s&apos;engage à mettre en œuvre tous les moyens raisonnables pour assurer l&apos;exactitude et la fiabilité des informations diffusées sur son site.
        </p>
        <p className="font-medium text-[var(--text-primary)]">Néanmoins, IMPALA ne saurait être tenue responsable :</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>des éventuelles erreurs, inexactitudes ou omissions présentes sur le site ;</li>
          <li>des dommages directs ou indirects résultant de l&apos;utilisation du site ou de l&apos;impossibilité d&apos;y accéder ;</li>
          <li>des interruptions de service, bugs, virus ou tout autre dysfonctionnement technique ;</li>
          <li>des contenus des sites tiers vers lesquels des liens hypertextes pourraient renvoyer.</li>
        </ul>
        <p>
          La responsabilité d&apos;IMPALA ne pourra être engagée qu&apos;en cas de faute prouvée par l&apos;utilisateur, conformément à la législation congolaise en vigueur.
        </p>
      </div>
    ),
  },
  {
    id: "contrats",
    num: "6.",
    title: "Droit des contrats et obligations conventionnelles",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Les relations contractuelles entre IMPALA et ses clients sont régies par les dispositions du décret du 30 juillet 1888 portant des contrats ou des obligations conventionnelles, ainsi que par toute autre disposition légale applicable en République Démocratique du Congo.
        </p>
        <p>
          Conformément aux principes de la force obligatoire du contrat et de l&apos;autonomie de la volonté des parties reconnus par le droit positif congolais, les conditions générales de vente et d&apos;utilisation de la plateforme s&apos;imposent aux parties dès leur acceptation.
        </p>
        <p>
          L&apos;utilisation du site et des services proposés par IMPALA emporte acceptation pleine et entière des présentes mentions légales et des conditions générales en vigueur.
        </p>
      </div>
    ),
  },
  {
    id: "donnees",
    num: "7.",
    title: "Protection des données personnelles",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Conformément à la loi n° 15/027 du 22 décembre 2015 relative à la protection des données à caractère personnel en République Démocratique du Congo, IMPALA s&apos;engage à respecter la vie privée des utilisateurs et à protéger les données personnelles qu&apos;elle collecte dans le cadre de la fourniture de ses services.
        </p>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">À ce titre, IMPALA s&apos;engage à :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>collecter et traiter les données personnelles de manière licite, loyale et transparente ;</li>
            <li>ne collecter que les données strictement nécessaires aux finalités annoncées (principe de minimisation) ;</li>
            <li>ne pas conserver les données au-delà de la durée nécessaire à la finalité du traitement ;</li>
            <li>mettre en œuvre les mesures techniques et organisationnelles appropriées pour garantir la sécurité et la confidentialité des données ;</li>
            <li>ne pas céder ni communiquer les données à des tiers sans le consentement préalable de l&apos;utilisateur, sauf obligation légale.</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">Droits des utilisateurs :</p>
          <p className="mb-2">Conformément à la législation congolaise, tout utilisateur dispose des droits suivants sur ses données personnelles :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>droit d&apos;accès aux données collectées le concernant ;</li>
            <li>droit de rectification des données inexactes ou incomplètes ;</li>
            <li>droit d&apos;opposition au traitement pour motif légitime ;</li>
            <li>droit à la suppression des données dans les conditions prévues par la loi.</li>
          </ul>
        </div>
        <p>
          Pour exercer ces droits, l&apos;utilisateur peut adresser sa demande, accompagnée d&apos;un justificatif d&apos;identité, à l&apos;adresse de contact figurant à la{" "}
          <a href="#contact" className="text-primary hover:underline">section 10</a> des présentes.
        </p>
      </div>
    ),
  },
  {
    id: "cookies",
    num: "8.",
    title: "Cookies et traceurs",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Le site impala-agence est susceptible d&apos;utiliser des cookies et autres traceurs afin de faciliter la navigation, mesurer l&apos;audience du site et améliorer l&apos;expérience utilisateur.
        </p>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">Types de cookies utilisés :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>cookies techniques nécessaires au fonctionnement du site ;</li>
            <li>cookies de mesure d&apos;audience et statistiques ;</li>
            <li>cookies de personnalisation, le cas échéant.</li>
          </ul>
        </div>
        <p>
          L&apos;utilisateur peut, à tout moment, configurer son navigateur pour accepter ou refuser les cookies, ou être averti de leur dépôt. Le refus de certains cookies est susceptible d&apos;affecter le bon fonctionnement de tout ou partie du site.
        </p>
      </div>
    ),
  },
  {
    id: "juridiction",
    num: "9.",
    title: "Droit applicable et attribution de juridiction",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Les présentes mentions légales ainsi que l&apos;ensemble des relations entre IMPALA et les utilisateurs du site sont régies par le droit positif de la République Démocratique du Congo.
        </p>
        <p>
          En cas de litige relatif à l&apos;interprétation, à l&apos;exécution ou à la résiliation des présentes, les parties s&apos;efforceront de rechercher, en priorité, une solution amiable.
        </p>
        <p>
          À défaut d&apos;accord amiable, et conformément aux règles de compétence territoriale en vigueur, les tribunaux compétents de <strong className="text-[var(--text-primary)]">Kinshasa / Gombe</strong> — ou ceux du ressort du siège social d&apos;IMPALA — seront seuls compétents pour connaître de tout litige.
        </p>
      </div>
    ),
  },
  {
    id: "contact",
    num: "10.",
    title: "Contact pour réclamations",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Pour toute réclamation, demande d&apos;information ou exercice des droits relatifs aux données personnelles, l&apos;utilisateur peut s&apos;adresser au :
        </p>
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5">
          <p className="font-semibold text-[var(--text-primary)]">Service juridique – IMPALA</p>
          <p><span className="font-medium text-[var(--text-primary)]">Adresse postale :</span> <span className="italic text-[var(--text-muted)]">en attente</span></p>
          <p>
            <span className="font-medium text-[var(--text-primary)]">Courriel :</span>{" "}
            <a href="mailto:contact@impala-agence.com" className="text-primary hover:underline">
              contact@impala-agence.com
            </a>
          </p>
          <p><span className="font-medium text-[var(--text-primary)]">Téléphone :</span> <span className="italic text-[var(--text-muted)]">en attente</span></p>
        </div>
        <p>
          Toute réclamation fera l&apos;objet d&apos;un accusé de réception et d&apos;un traitement dans les meilleurs délais.
        </p>
      </div>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Légal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-3">
            Mentions légales
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
            Conformément à la législation en vigueur en République Démocratique du Congo.
            Site internet : <strong>impala-agence.com</strong>
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-4">Dernière mise à jour : 12 mai 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Table des matières — sticky sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Sommaire
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)] hover:text-primary transition-colors py-1 leading-snug"
                >
                  <span className="font-bold text-primary flex-shrink-0">{s.num}</span>
                  {s.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Contenu */}
          <main className="lg:col-span-3 space-y-10">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-24 pb-10 border-b border-[var(--border-color)] last:border-0"
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-black text-primary leading-none">{s.num}</span>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                    {s.title}
                  </h2>
                </div>
                {s.content}
              </section>
            ))}

            {/* Footer de page */}
            <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-[var(--text-muted)]">
                © IMPALA – Tous droits réservés
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
              >
                Nous contacter →
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
