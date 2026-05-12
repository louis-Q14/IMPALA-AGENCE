import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — IMPALA",
  description:
    "Politique de confidentialité de la plateforme impala-agence. Découvrez comment IMPALA collecte, utilise et protège vos données personnelles.",
};

const sections = [
  {
    id: "preambule",
    num: "Préambule",
    title: "",
    hideNum: true,
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          La société IMPALA-AGENCE (ci-après « IMPALA », « nous », « notre » ou « nos ») attache la plus grande importance au respect de la vie privée et à la protection des données à caractère personnel des utilisateurs de son site internet et des bénéficiaires de ses services. La présente politique de confidentialité a pour objet d&apos;informer toute personne concernée des conditions dans lesquelles ses données sont collectées, utilisées, partagées, conservées et protégées.
        </p>
        <p>
          Elle s&apos;applique à l&apos;ensemble de nos activités, à savoir : services immobiliers, services automobiles, prestations d&apos;après-déménagement, ramassage de poubelles, repassage à domicile, nettoyage de bureaux, ainsi qu&apos;à l&apos;utilisation de notre plateforme de vente en ligne.
        </p>
        <p>
          Le présent document est établi conformément à la loi n° 15/027 du 22 décembre 2015 portant protection des données à caractère personnel en République Démocratique du Congo et aux principes du droit civil congolais applicables.
        </p>
      </div>
    ),
  },
  {
    id: "champ-application",
    num: "Art. 1",
    title: "Champ d'application",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>La présente politique s&apos;applique à toute personne physique ou morale entrant en relation avec IMPALA, et notamment :</p>
        <ul className="space-y-1.5 pl-1">
          {[
            "aux utilisateurs du site internet impala-agence ;",
            "à l'ensemble des clients, prospects et partenaires d'IMPALA ;",
            "à toute personne utilisant la plateforme de vente en ligne dédiée aux secteurs immobilier et automobile.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "categories-donnees",
    num: "Art. 2",
    title: "Catégories de données collectées",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          En fonction de la nature des relations entretenues avec nous et des services sollicités, IMPALA peut être amenée à collecter les catégories de données suivantes :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] w-1/3">Catégorie</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Exemples</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Identité", "Nom, prénom, sexe, date de naissance"],
                ["Coordonnées", "Adresse postale, adresse électronique, numéro de téléphone"],
                ["Données professionnelles", "Nom de l'entreprise, fonction, adresse de bureau"],
                ["Données immobilières", "Adresse du bien, surface, type de bien (vente / location)"],
                ["Données automobiles", "Marque, modèle, année, numéro de châssis (partiel), kilométrage"],
                ["Données de connexion", "Adresse IP, type de navigateur, pages visitées, durée de visite"],
                ["Données de paiement", "Le cas échéant ; les données bancaires complètes ne sont pas conservées"],
                ["Communications", "Historique des échanges avec le service client"],
              ].map(([cat, ex], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] align-top">{cat}</td>
                  <td className="px-4 py-2.5 border border-[var(--border-color)]">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs italic text-[var(--text-muted)] border-l-2 border-[var(--border-color)] pl-3">
          IMPALA ne collecte délibérément aucune donnée sensible, telle que les données relatives à la santé, aux origines raciales ou ethniques, aux opinions politiques, aux convictions religieuses ou à la vie sexuelle des personnes concernées.
        </p>
      </div>
    ),
  },
  {
    id: "base-legale",
    num: "Art. 3",
    title: "Base légale des traitements",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Conformément à l&apos;article 6 de la loi n° 15/027 du 22 décembre 2015, IMPALA traite les données à caractère personnel uniquement sur le fondement de l&apos;une des bases légales suivantes :
        </p>
        <ul className="space-y-2 pl-1">
          {[
            "le consentement préalable et explicite de la personne concernée (par exemple, inscription à la lettre d'information, dépôt de cookies non essentiels) ;",
            "l'exécution d'un contrat ou de mesures précontractuelles (par exemple, mise en relation dans le cadre d'une vente immobilière ou automobile) ;",
            "l'intérêt légitime poursuivi par IMPALA, à condition qu'il ne porte pas atteinte aux droits et libertés des personnes concernées (notamment l'amélioration des services et la sécurité informatique) ;",
            "le respect d'une obligation légale ou réglementaire (notamment la conservation des factures et pièces comptables).",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "finalites",
    num: "Art. 4",
    title: "Finalités de la collecte",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Les données collectées sont traitées pour des finalités déterminées, explicites et légitimes, détaillées dans le tableau ci-dessous :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Finalité</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Données concernées</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Gestion du compte client", "Identité, coordonnées"],
                ["Réalisation d'une prestation (immobilier, automobile, ménage, repassage, etc.)", "Selon le service sollicité"],
                ["Mise en relation entre acheteurs et vendeurs sur la plateforme", "Annonces, coordonnées"],
                ["Réponse aux demandes (contact, devis, réclamation)", "Communications"],
                ["Amélioration du site et des services", "Données de connexion"],
                ["Sécurisation des transactions et lutte contre la fraude", "Données de connexion, de paiement"],
                ["Respect des obligations légales (fiscales, judiciaires)", "Données de facturation, identité"],
              ].map(([fin, data], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                  <td className="px-4 py-2.5 border border-[var(--border-color)] align-top">{fin}</td>
                  <td className="px-4 py-2.5 border border-[var(--border-color)] align-top font-medium text-[var(--text-primary)]">{data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "conservation",
    num: "Art. 5",
    title: "Durée de conservation des données",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          IMPALA ne conserve les données à caractère personnel que pour la durée strictement nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées, dans le respect des obligations légales applicables. Les durées de conservation appliquées sont les suivantes :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Type de donnée</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Durée de conservation</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Données client actif", "Durée de la relation contractuelle, augmentée de 3 ans à compter de la dernière interaction"],
                ["Données prospect", "3 ans à compter du dernier contact"],
                ["Données de connexion (logs)", "13 mois maximum"],
                ["Données de facturation", "10 ans, conformément à la législation fiscale congolaise"],
                ["Données d'annonces (immobilier / automobile)", "Jusqu'à la fin de la diffusion de l'annonce, augmentée d'1 an"],
              ].map(([type, duree], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] align-top">{type}</td>
                  <td className="px-4 py-2.5 border border-[var(--border-color)]">{duree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs italic text-[var(--text-muted)] border-l-2 border-[var(--border-color)] pl-3">
          À l&apos;expiration de ces délais, les données concernées font l&apos;objet d&apos;une anonymisation irréversible ou d&apos;une suppression définitive.
        </p>
      </div>
    ),
  },
  {
    id: "destinataires",
    num: "Art. 6",
    title: "Destinataires des données",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Les données collectées par IMPALA sont exclusivement accessibles aux personnes et entités suivantes, dans la stricte limite de leurs missions respectives :
        </p>
        <ul className="space-y-1.5 pl-1">
          {[
            "le personnel d'IMPALA habilité à les traiter (équipes commerciales, techniques et service client) ;",
            "les sous-traitants techniques d'IMPALA (notamment hébergeur, prestataire de messagerie, fournisseur de solution CRM), dûment liés par un contrat conforme aux exigences de la loi congolaise ;",
            "les autorités judiciaires ou administratives compétentes, sur réquisition légale uniquement.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="font-medium text-[var(--text-primary)]">
          IMPALA s&apos;engage à ne jamais céder, louer ou commercialiser les données à caractère personnel des utilisateurs à des tiers.
        </p>
      </div>
    ),
  },
  {
    id: "transferts",
    num: "Art. 7",
    title: "Transfert des données hors de la RDC",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Les données collectées peuvent être hébergées sur des serveurs situés en République Démocratique du Congo ou à l&apos;étranger, notamment au sein de l&apos;Union européenne ou aux États-Unis d&apos;Amérique. En cas de transfert hors du territoire congolais, IMPALA s&apos;assure que :
        </p>
        <ul className="space-y-1.5 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
            <span>le pays destinataire offre un niveau de protection adéquat au sens de la loi n° 15/027 ; ou, à défaut,</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
            <span>des garanties contractuelles appropriées sont mises en place, notamment par la conclusion de clauses contractuelles types.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "droits",
    num: "Art. 8",
    title: "Droits des personnes concernées",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Conformément aux articles 34 à 43 de la loi n° 15/027 du 22 décembre 2015, toute personne concernée dispose des droits suivants, qu&apos;elle peut exercer à tout moment :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] w-1/3">Droit</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Droit d'accès", "Obtenir la confirmation que ses données font l'objet d'un traitement et y accéder"],
                ["Droit de rectification", "Faire corriger des données inexactes, incomplètes ou obsolètes"],
                ["Droit à l'effacement", "Demander la suppression de ses données, dit « droit à l'oubli »"],
                ["Droit à la limitation", "Obtenir le blocage temporaire de l'utilisation de ses données"],
                ["Droit d'opposition", "S'opposer à certains traitements, notamment à des fins de prospection commerciale"],
                ["Droit à la portabilité", "Recevoir ses données dans un format structuré, couramment utilisé et lisible par machine"],
                ["Droit de retrait du consentement", "Retirer son consentement à tout moment, sans effet rétroactif"],
              ].map(([droit, desc], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] align-top">{droit}</td>
                  <td className="px-4 py-2.5 border border-[var(--border-color)]">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
          <p className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wide">Modalités d&apos;exercice des droits</p>
          <p>
            Pour exercer ces droits, adressez une demande à{" "}
            <a href="mailto:dpo@impala-agence.com" className="text-primary hover:underline font-medium">dpo@impala-agence.com</a>
            {" "}en indiquant : vos nom, prénom et adresse électronique, une copie d&apos;une pièce d&apos;identité en cours de validité, et l&apos;objet précis de la demande.
          </p>
          <p>
            IMPALA s&apos;engage à apporter une réponse motivée dans un délai maximum de{" "}
            <strong className="text-[var(--text-primary)]">trente (30) jours</strong> à compter de la réception de la demande.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "securite",
    num: "Art. 9",
    title: "Sécurité des données",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          IMPALA met en œuvre des mesures techniques et organisationnelles appropriées afin de garantir la confidentialité, l&apos;intégrité et la disponibilité des données traitées, et notamment :
        </p>
        <ul className="space-y-1.5 pl-1">
          {[
            "le chiffrement des échanges au moyen des protocoles SSL / TLS sur l'ensemble des pages du site ;",
            "la restriction et l'authentification des accès aux bases de données ;",
            "la mise en place de pare-feu, d'antivirus et de systèmes de détection d'intrusion ;",
            "la formation continue du personnel aux exigences de confidentialité ;",
            "l'application d'une politique de mots de passe robustes assortie d'un renouvellement régulier.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">En cas de violation de données à caractère personnel, IMPALA s&apos;engage à :</p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>informer les personnes concernées dans un délai de <strong className="text-[var(--text-primary)]">soixante-douze (72) heures</strong> lorsque la violation est susceptible d&apos;engendrer un risque élevé pour leurs droits et libertés ;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>notifier l&apos;Autorité de Protection des Données Personnelles (APVP) compétente lorsque la loi l&apos;exige.</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "cookies",
    num: "Art. 10",
    title: "Cookies et traceurs",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>Le site internet d&apos;IMPALA recourt à des cookies et autres traceurs aux fins suivantes :</p>
        <ul className="space-y-1.5 pl-1">
          {[
            "assurer le bon fonctionnement technique de la plateforme ;",
            "mesurer la fréquentation et analyser l'audience (par exemple, le nombre de visiteurs uniques) ;",
            "mémoriser les préférences de l'utilisateur (langue, paramètres d'affichage).",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">L&apos;utilisateur peut, à tout moment :</p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>configurer son navigateur afin de refuser le dépôt de cookies ;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>modifier ses choix au moyen de l&apos;outil de gestion des cookies accessible via la bannière prévue à cet effet sur le site.</span>
            </li>
          </ul>
        </div>
        <p className="font-medium text-[var(--text-primary)]">
          IMPALA n&apos;utilise aucun cookie publicitaire sans le consentement préalable et explicite de l&apos;utilisateur.
        </p>
      </div>
    ),
  },
  {
    id: "responsabilite",
    num: "Art. 11",
    title: "Responsabilité en cas de litige",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>La présente politique est régie par le droit congolais, et notamment par les textes suivants :</p>
        <ul className="space-y-1.5 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
            <span>la loi n° 15/027 du 22 décembre 2015 relative à la protection des données à caractère personnel ;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
            <span>le décret du 30 juillet 1888 portant des contrats ou des obligations conventionnelles, notamment son article 258 relatif à la responsabilité civile.</span>
          </li>
        </ul>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">En cas de dommage résultant d&apos;un traitement illicite de ses données, la personne concernée dispose des voies de recours suivantes :</p>
          <ol className="space-y-1.5 list-decimal list-inside pl-1">
            <li>saisir prioritairement IMPALA selon les modalités prévues à l&apos;article 13 de la présente politique ;</li>
            <li>saisir l&apos;Autorité de Protection des Données Personnelles (APVP) de la République Démocratique du Congo ;</li>
            <li>introduire une action devant les juridictions compétentes du ressort de <strong className="text-[var(--text-primary)]">Kinshasa / Gombe</strong>.</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "annonces",
    num: "Art. 12",
    title: "Dispositions particulières aux annonces en ligne",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>Lorsqu&apos;un utilisateur publie une annonce sur la plateforme d&apos;IMPALA, les règles suivantes s&apos;appliquent :</p>
        <ul className="space-y-1.5 pl-1">
          {[
            "les coordonnées du déposant ne sont rendues visibles qu'après accord mutuel des parties, par l'intermédiaire d'une messagerie sécurisée ;",
            "les annonces font l'objet d'une modération préalable destinée à prévenir toute fraude ;",
            "le déposant peut supprimer son annonce à tout moment ; les données associées sont alors anonymisées dans un délai de trente (30) jours.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5 flex-shrink-0">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "contact-dpo",
    num: "Art. 13",
    title: "Contact — Délégué à la protection des données",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Pour toute question, réclamation ou demande relative à la présente politique de confidentialité, ou pour exercer leurs droits, les personnes concernées peuvent contacter le Délégué à la protection des données (DPO) aux coordonnées suivantes :
        </p>
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5">
          <p>
            <span className="font-medium text-[var(--text-primary)]">Email DPO :</span>{" "}
            <a href="mailto:dpo@impala-agence.com" className="text-primary hover:underline">dpo@impala-agence.com</a>
          </p>
          <p>
            <span className="font-medium text-[var(--text-primary)]">Email général :</span>{" "}
            <a href="mailto:contact@impala-agence.com" className="text-primary hover:underline">contact@impala-agence.com</a>
          </p>
          <p><span className="font-medium text-[var(--text-primary)]">Adresse postale :</span> <span className="italic text-[var(--text-muted)]">siège social — en cours</span></p>
          <p><span className="font-medium text-[var(--text-primary)]">Téléphone :</span> <span className="italic text-[var(--text-muted)]">en attente</span></p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Il est recommandé d&apos;utiliser, à titre prioritaire, le formulaire de contact sécurisé disponible sur le site ou l&apos;adresse électronique ci-dessus.
        </p>
      </div>
    ),
  },
  {
    id: "modifications",
    num: "Art. 14",
    title: "Modifications de la présente politique",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          IMPALA se réserve le droit de modifier la présente politique de confidentialité à tout moment, afin notamment de l&apos;adapter aux évolutions législatives, réglementaires, jurisprudentielles ou techniques. La date figurant en en-tête du document, mentionnant la « dernière mise à jour », sera modifiée en conséquence.
        </p>
        <p>
          En cas de modification substantielle, IMPALA en informera les utilisateurs par voie de courrier électronique ou par une notification mise en évidence sur le site.
        </p>
        <p>
          La poursuite de l&apos;utilisation des services postérieurement à la publication d&apos;une nouvelle version de la présente politique vaut acceptation pleine et entière de celle-ci.
        </p>
      </div>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Légal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-3">
            Politique de confidentialité
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
            Plateforme : <strong>impala-agence.com</strong> — Éditeur : société IMPALA-AGENCE
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-4">
            Dernière mise à jour : 12 mai 2026 &nbsp;·&nbsp; Conformité : loi n° 15/027 du 22 décembre 2015 (RDC)
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Sidebar sommaire */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">Sommaire</p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)] hover:text-primary transition-colors py-1 leading-snug"
                >
                  <span className="font-bold text-primary flex-shrink-0">{s.num}</span>
                  {s.hideNum ? "Préambule" : s.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Contenu */}
          <main className="lg:col-span-3 space-y-10">
            {sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-24 pb-10 border-b border-[var(--border-color)] last:border-0"
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-black text-primary leading-none">{s.num}</span>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                    {s.hideNum ? "Préambule" : s.title}
                  </h2>
                </div>
                {s.content}
              </section>
            ))}

            {/* Encadré de clôture */}
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">IMPALA — Votre confiance est notre priorité.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Conformité garantie avec la loi n° 15/027 du 22 décembre 2015 de la République Démocratique du Congo.
              </p>
            </div>

            {/* Footer de page */}
            <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-[var(--text-muted)]">© IMPALA – Tous droits réservés</p>
              <div className="flex gap-4 text-xs font-medium text-primary">
                <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
                <Link href="/cgu" className="hover:underline">CGU</Link>
                <Link href="/contact" className="hover:underline">Contact</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
