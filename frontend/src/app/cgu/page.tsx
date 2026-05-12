import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — IMPALA",
  description: "Conditions Générales d'Utilisation de la plateforme impala-agence, éditée par la société IMPALA.",
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
          Les présentes Conditions Générales d&apos;Utilisation (ci-après « les CGU ») ont pour objet de définir les modalités d&apos;accès et d&apos;utilisation de la plateforme impala-agence (ci-après « la Plateforme ») éditée par la société IMPALA, ainsi que l&apos;ensemble des services qui y sont proposés.
        </p>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">La Plateforme propose notamment :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><span className="font-medium">Services principaux :</span> transactions immobilières et automobiles ;</li>
            <li><span className="font-medium">Sous-services :</span> prestations après-déménagement, ramassage des poubelles, repassage à domicile, nettoyage de bureaux ;</li>
            <li>Une plateforme de vente en ligne dédiée à l&apos;immobilier et à l&apos;automobile ;</li>
            <li>L&apos;ensemble des services connexes liés à l&apos;immobilier (estimation, diagnostic, accompagnement administratif).</li>
          </ul>
        </div>
        <p>
          En accédant à la Plateforme et/ou en utilisant l&apos;un de ses services, l&apos;Utilisateur reconnaît avoir pris connaissance des présentes CGU, les avoir comprises et les accepter sans réserve. À défaut d&apos;acceptation, l&apos;Utilisateur est invité à ne pas utiliser la Plateforme.
        </p>
      </div>
    ),
  },
  {
    id: "definitions",
    num: "Art. 1",
    title: "Définitions",
    content: (
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
        <p className="mb-4">Pour l&apos;interprétation des présentes CGU, les termes ci-dessous, lorsqu&apos;ils sont employés avec une majuscule, ont la signification suivante :</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--bg-tertiary)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] w-1/4">Terme</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Définition</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Plateforme", "Le site internet impala-agence et l'ensemble de ses fonctionnalités, sous-domaines et applications associées."],
                ["IMPALA", "La société éditrice de la Plateforme, assurant l'exploitation et la maintenance des services proposés."],
                ["Utilisateur", "Toute personne physique majeure ou personne morale accédant à la Plateforme, à titre gratuit ou onéreux."],
                ["Client", "Tout Utilisateur ayant souscrit à un service ou réalisé une transaction sur la Plateforme."],
                ["Annonceur", "Tout Utilisateur publiant une annonce immobilière ou automobile sur la Plateforme."],
                ["Acheteur", "Tout Utilisateur manifestant un intérêt pour une annonce ou un service publié."],
                ["Service", "L'une des prestations proposées par IMPALA, qu'elle soit gratuite ou payante."],
                ["Contenu", "Toute information, texte, photographie, vidéo, annonce ou donnée publié(e) sur la Plateforme."],
                ["Compte", "Espace personnel sécurisé permettant à l'Utilisateur d'accéder aux fonctionnalités réservées."],
              ].map(([terme, def], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)] align-top">{terme}</td>
                  <td className="px-4 py-2.5 border border-[var(--border-color)]">{def}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "acces",
    num: "Art. 2",
    title: "Accès à la plateforme",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">2.1 Accès libre et gratuit</p>
          <p>L&apos;accès à la Plateforme est libre et gratuit pour la consultation des services et des annonces publiées. Les frais de connexion (internet, téléphonie) restent à la charge exclusive de l&apos;Utilisateur.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">2.2 Création de compte</p>
          <p className="mb-2">Certaines fonctionnalités requièrent la création préalable d&apos;un compte personnel, notamment :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Publier une annonce immobilière ou automobile ;</li>
            <li>Contacter directement un Annonceur via la messagerie sécurisée ;</li>
            <li>Souscrire à un service à domicile (ménage, repassage, ramassage des poubelles, etc.) ;</li>
            <li>Accéder à l&apos;historique des transactions, devis et factures ;</li>
            <li>Bénéficier des offres promotionnelles réservées aux membres.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">2.3 Conditions de création de compte</p>
          <p className="mb-2">Pour créer un compte sur la Plateforme, l&apos;Utilisateur doit :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Être âgé d&apos;au moins dix-huit (18) ans ou être valablement émancipé ;</li>
            <li>Disposer de la capacité juridique de contracter ;</li>
            <li>Fournir des informations exactes, complètes, sincères et tenues à jour ;</li>
            <li>Choisir un identifiant et un mot de passe robustes, et en préserver strictement la confidentialité ;</li>
            <li>Informer IMPALA sans délai de toute utilisation non autorisée ou suspicion de compromission de son compte.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">2.4 Suspension ou suppression de compte</p>
          <p className="mb-2">IMPALA se réserve le droit, à tout moment et sans préavis, de suspendre temporairement ou de supprimer définitivement tout compte, notamment dans les cas suivants :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Violation, même partielle, des présentes CGU ;</li>
            <li>Comportement frauduleux, malveillant ou contraire aux bonnes mœurs ;</li>
            <li>Fausses déclarations ou usurpation d&apos;identité ;</li>
            <li>Non-paiement des prestations souscrites ;</li>
            <li>Réclamations répétées et fondées d&apos;autres Utilisateurs.</li>
          </ul>
          <p className="mt-2">Toute suspension ou suppression est notifiée à l&apos;Utilisateur par courrier électronique à l&apos;adresse renseignée lors de l&apos;inscription.</p>
        </div>
      </div>
    ),
  },
  {
    id: "services",
    num: "Art. 3",
    title: "Services proposés",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">3.1 Services immobiliers</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Mise en relation entre propriétaires/vendeurs et acquéreurs/locataires ;</li>
            <li>Diffusion d&apos;annonces immobilières (vente, location, colocation) ;</li>
            <li>Accompagnement dans les démarches administratives liées à l&apos;immobilier ;</li>
            <li>Service après-déménagement (installation, petits travaux, raccordements).</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">3.2 Services automobiles</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Mise en relation entre vendeurs et acheteurs de véhicules d&apos;occasion ou neufs ;</li>
            <li>Diffusion d&apos;annonces automobiles avec photos et fiche technique ;</li>
            <li>Assistance optionnelle à la rédaction de l&apos;annonce et à la valorisation du véhicule.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">3.3 Services à domicile et aux entreprises</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Ramassage et évacuation des poubelles (particuliers et copropriétés) ;</li>
            <li>Repassage à domicile, à la pièce ou au forfait ;</li>
            <li>Nettoyage de bureaux et locaux professionnels (ponctuel ou récurrent) ;</li>
            <li>Prestations d&apos;entretien complémentaires sur devis.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">3.4 Plateforme de vente en ligne</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Espace dédié aux transactions immobilières et automobiles ;</li>
            <li>Messagerie sécurisée entre Annonceurs et Acheteurs ;</li>
            <li>Outils de mise en avant des annonces (options payantes).</li>
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
          <strong>Important :</strong> IMPALA agit en qualité d&apos;intermédiaire technique et de plateforme de mise en relation. Sauf mention contraire explicite, IMPALA n&apos;est pas partie prenante aux transactions conclues directement entre Utilisateurs et n&apos;engage pas sa responsabilité au titre de leur exécution.
        </div>
      </div>
    ),
  },
  {
    id: "annonces",
    num: "Art. 4",
    title: "Annonces immobilières et automobiles",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-3">4.1 Publication d&apos;une annonce</p>
          <p className="mb-3">Toute annonce publiée sur la Plateforme doit impérativement respecter les règles ci-dessous :</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--bg-tertiary)]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Règle à respecter</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Sanction en cas de non-respect</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Contenu honnête, précis et conforme à la réalité du bien ou du véhicule", "Suppression de l'annonce"],
                  ["Photographies authentiques et récentes du bien ou du véhicule", "Suppression et avertissement"],
                  ["Prix clair, lisible, indiquant si les frais sont inclus ou exclus", "Modification forcée par IMPALA"],
                  ["Absence de propos discriminatoires, illicites ou contraires aux bonnes mœurs", "Suppression et bannissement"],
                  ["Respect du droit d'auteur et des droits voisins (interdiction des photos volées)", "Suppression et engagement de responsabilité"],
                  ["Conformité à la législation congolaise applicable au bien proposé", "Retrait immédiat"],
                ].map(([regle, sanction], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                    <td className="px-4 py-2.5 border border-[var(--border-color)] align-top">{regle}</td>
                    <td className="px-4 py-2.5 border border-[var(--border-color)] align-top font-medium text-red-500 dark:text-red-400">{sanction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">4.2 Vérification et modération</p>
          <p className="mb-2">IMPALA se réserve le droit, sans que cela ne constitue pour autant une obligation, de :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Modérer toute annonce avant ou après sa publication ;</li>
            <li>Demander à l&apos;Annonceur tout justificatif utile (titre de propriété, carte grise, pièce d&apos;identité, mandat) ;</li>
            <li>Supprimer sans préavis toute annonce manifestement non conforme aux présentes CGU ou à la loi.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">4.3 Durée de validité des annonces</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Une annonce est publiée pour une durée de trente (30) jours, renouvelable à la demande de l&apos;Annonceur ;</li>
            <li>L&apos;Annonceur peut, à tout moment, désactiver ou supprimer son annonce depuis son espace personnel ;</li>
            <li>Toute annonce dont le bien a été vendu ou loué doit être désactivée sans délai.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">4.4 Responsabilité de l&apos;Annonceur</p>
          <p>L&apos;Annonceur est seul responsable du contenu de son annonce et des conséquences directes ou indirectes pouvant en résulter, en ce compris la véracité des informations, la légalité du bien proposé et le respect des obligations fiscales attachées à la transaction.</p>
        </div>
      </div>
    ),
  },
  {
    id: "commandes",
    num: "Art. 5",
    title: "Commande de services à domicile",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>Le présent article s&apos;applique aux prestations de ménage, repassage, ramassage des poubelles, nettoyage de bureaux et autres services à domicile proposés par IMPALA.</p>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">5.1 Demande de devis</p>
          <p className="mb-2">Le Client peut solliciter un devis selon les modalités suivantes :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Remplir le formulaire de demande disponible en ligne sur la Plateforme ;</li>
            <li>Contacter directement IMPALA par téléphone ou par courrier électronique ;</li>
            <li>Se rendre au siège social aux horaires d&apos;ouverture indiqués à l&apos;article 15.</li>
          </ul>
          <p className="mt-2">Un devis détaillé est transmis au Client dans un délai maximum de quarante-huit (48) heures ouvrées.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">5.2 Confirmation de la prestation</p>
          <p className="mb-2">Toute prestation est réputée confirmée après :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Acceptation expresse du devis par le Client (par signature, courriel ou validation en ligne) ;</li>
            <li>Versement de l&apos;acompte requis, le cas échéant, dont le montant est précisé sur le devis.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-3">5.3 Annulation par le Client</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--bg-tertiary)]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Délai d&apos;annulation avant la prestation</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">Conséquence financière</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Plus de 48 heures", "Remboursement intégral (hors frais bancaires éventuels)"],
                  ["Entre 24 et 48 heures", "50 % du montant total dû"],
                  ["Moins de 24 heures", "100 % du montant total dû"],
                ].map(([delai, consequence], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : ""}>
                    <td className="px-4 py-2.5 border border-[var(--border-color)]">{delai}</td>
                    <td className="px-4 py-2.5 border border-[var(--border-color)] font-medium text-[var(--text-primary)]">{consequence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">5.4 Annulation par IMPALA</p>
          <p className="mb-2">En cas d&apos;empêchement légitime (maladie du prestataire, accident, cas de force majeure), IMPALA s&apos;engage à :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Proposer un nouveau créneau horaire dans un délai raisonnable ;</li>
            <li>Ou, à défaut d&apos;accord, rembourser intégralement le Client des sommes versées.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">5.5 Réclamation</p>
          <p>Toute réclamation relative à une prestation doit être adressée à IMPALA par écrit dans un délai maximum de <strong className="text-[var(--text-primary)]">sept (7) jours calendaires</strong> à compter de la fin de la prestation. Passé ce délai, la prestation sera réputée acceptée sans réserve.</p>
        </div>
      </div>
    ),
  },
  {
    id: "tarifs",
    num: "Art. 6",
    title: "Tarifs et paiement",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">6.1 Tarifs</p>
          <p>Les tarifs applicables sont ceux affichés sur la Plateforme au moment de la commande, exprimés en francs congolais (CDF) ou en dollars américains (USD), toutes taxes comprises lorsque la législation l&apos;exige. IMPALA se réserve le droit de modifier ses tarifs à tout moment, sous réserve d&apos;en informer préalablement les Utilisateurs ; les tarifs en vigueur au jour de la commande demeurent applicables à celle-ci.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">6.2 Modes de paiement acceptés</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Carte bancaire, via un prestataire de paiement sécurisé certifié PCI-DSS ;</li>
            <li>Mobile money (M-Pesa, Orange Money, Airtel Money), sous réserve de disponibilité ;</li>
            <li>Virement bancaire vers le compte indiqué sur la facture ;</li>
            <li>Paiement en espèces, exclusivement pour les prestations à domicile et sur présentation d&apos;une facture en bonne et due forme.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">6.3 Sécurité des paiements</p>
          <p>Les transactions par carte bancaire sont entièrement sécurisées par un prestataire certifié PCI-DSS. IMPALA ne stocke à aucun moment les données bancaires complètes de ses Clients. Les opérations sont protégées par un protocole de chiffrement SSL/TLS.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">6.4 Retard et défaut de paiement</p>
          <p>Tout retard de paiement entraîne, de plein droit et sans mise en demeure préalable, l&apos;application d&apos;intérêts de retard au taux légal en vigueur en République Démocratique du Congo, ainsi que la suspension immédiate des prestations en cours.</p>
        </div>
      </div>
    ),
  },
  {
    id: "obligations",
    num: "Art. 7",
    title: "Obligations des utilisateurs",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>L&apos;Utilisateur s&apos;engage, de manière générale, à utiliser la Plateforme de bonne foi et dans le respect des dispositions légales en vigueur. Il s&apos;interdit notamment :</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>D&apos;utiliser la Plateforme à des fins contraires aux lois et règlements applicables en République Démocratique du Congo ;</li>
          <li>De diffuser tout contenu frauduleux, illégal, diffamatoire, injurieux, raciste, xénophobe ou trompeur ;</li>
          <li>De tenter, par quelque moyen que ce soit, de pirater, contaminer ou perturber le fonctionnement de la Plateforme ;</li>
          <li>De collecter, stocker ou exploiter les données personnelles d&apos;autres Utilisateurs sans leur consentement explicite ;</li>
          <li>De publier de fausses annonces, des annonces fictives ou portant sur des biens inexistants ;</li>
          <li>De ne pas respecter scrupuleusement les rendez-vous fixés avec les prestataires ou les Annonceurs ;</li>
          <li>De contourner les outils de paiement ou la messagerie sécurisée mis à disposition par IMPALA.</li>
        </ul>
        <p className="font-medium text-[var(--text-primary)]">En cas de manquement avéré, IMPALA pourra :</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Supprimer sans préavis le contenu litigieux ;</li>
          <li>Suspendre ou supprimer définitivement le compte de l&apos;Utilisateur ;</li>
          <li>Engager toute action judiciaire utile devant les juridictions compétentes en application du droit congolais.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "responsabilite",
    num: "Art. 8",
    title: "Responsabilité",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">8.1 Responsabilité d&apos;IMPALA</p>
          <p className="mb-2">IMPALA met en œuvre tous les moyens raisonnables pour assurer :</p>
          <ul className="list-disc list-inside space-y-1 pl-1 mb-3">
            <li>La disponibilité de la Plateforme, sous réserve des opérations de maintenance et des cas de force majeure ;</li>
            <li>La sécurité des données personnelles traitées ;</li>
            <li>La modération des annonces manifestement frauduleuses ou contraires aux CGU.</li>
          </ul>
          <p className="mb-2">IMPALA ne saurait en aucun cas être tenue responsable :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>De l&apos;inexactitude, de l&apos;incomplétude ou de la fausseté des informations publiées par les Utilisateurs ;</li>
            <li>Des transactions conclues directement entre Utilisateurs sans intervention d&apos;IMPALA ;</li>
            <li>Des dommages indirects subis par l&apos;Utilisateur (perte de chance, préjudice commercial, atteinte à l&apos;image, etc.) ;</li>
            <li>Des interruptions de service indépendantes de sa volonté (panne réseau, coupure d&apos;électricité, attaque informatique).</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">8.2 Responsabilité des Utilisateurs</p>
          <p className="mb-2">Chaque Utilisateur demeure seul responsable :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Des informations qu&apos;il publie ou transmet sur la Plateforme ;</li>
            <li>De ses contacts, échanges et transactions avec les autres Utilisateurs ;</li>
            <li>Du respect des obligations fiscales, sociales et déclaratives découlant de ses activités.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">8.3 Assurance</p>
          <p>IMPALA recommande vivement à chaque Utilisateur de souscrire les polices d&apos;assurance adaptées à son activité (assurance habitation, responsabilité civile, assurance automobile, etc.).</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">8.4 Base légale (droit congolais)</p>
          <p>Conformément à l&apos;article 258 du décret du 30 juillet 1888 portant Code civil congolais, livre III, la responsabilité d&apos;IMPALA ne pourra être engagée qu&apos;en cas de faute prouvée à sa charge, en lien direct et certain avec le préjudice allégué.</p>
        </div>
      </div>
    ),
  },
  {
    id: "force-majeure",
    num: "Art. 9",
    title: "Force majeure",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Est considéré comme cas de force majeure tout événement extérieur, imprévisible et irrésistible, au sens de la jurisprudence congolaise et de l&apos;article 300 du décret du 30 juillet 1888 portant Code civil congolais, livre III.
        </p>
        <div>
          <p className="font-medium text-[var(--text-primary)] mb-2">Sont notamment considérés comme cas de force majeure :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Catastrophe naturelle (inondation, séisme, tempête majeure) ;</li>
            <li>Guerre, conflit armé, émeute, insurrection ou trouble grave à l&apos;ordre public ;</li>
            <li>Grève générale ou mouvement social paralysant l&apos;activité ;</li>
            <li>Panne d&apos;électricité, de télécommunications ou de réseau internet de longue durée ;</li>
            <li>Décision gouvernementale ou administrative empêchant l&apos;exécution des prestations ;</li>
            <li>Cyberattaque majeure affectant les systèmes d&apos;information d&apos;IMPALA ou de ses prestataires ;</li>
            <li>Épidémie ou pandémie déclarée par les autorités compétentes.</li>
          </ul>
        </div>
        <p>
          En cas de force majeure dûment constatée, l&apos;exécution des obligations contractuelles est suspendue de plein droit pendant toute la durée de l&apos;empêchement. Si le cas de force majeure persiste au-delà de <strong className="text-[var(--text-primary)]">trente (30) jours consécutifs</strong>, le contrat pourra être résilié par l&apos;une ou l&apos;autre des parties, sans indemnité ni préavis, sur simple notification écrite.
        </p>
      </div>
    ),
  },
  {
    id: "pi",
    num: "Art. 10",
    title: "Propriété intellectuelle",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">10.1 Contenu d&apos;IMPALA</p>
          <p>L&apos;ensemble des éléments composant la Plateforme — textes, logos, marques, graphismes, photographies, vidéos, code source, structure de la base de données et identité visuelle — est la propriété exclusive d&apos;IMPALA ou fait l&apos;objet d&apos;une licence régulièrement consentie. Toute reproduction, représentation, adaptation, traduction ou exploitation, totale ou partielle, est strictement interdite sans autorisation écrite et préalable d&apos;IMPALA, sous peine de poursuites judiciaires.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">10.2 Contenu des Utilisateurs</p>
          <p className="mb-2">Les Utilisateurs conservent l&apos;intégralité de leurs droits de propriété intellectuelle sur les contenus qu&apos;ils publient. En publiant un Contenu, l&apos;Utilisateur concède toutefois à IMPALA une licence non exclusive, gratuite et transférable aux seules fins de :</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Afficher, reproduire et diffuser ce Contenu sur la Plateforme et ses supports de communication ;</li>
            <li>Adapter techniquement le Contenu aux contraintes d&apos;affichage (recadrage, compression) ;</li>
            <li>Archiver le Contenu pour des raisons de preuve et de sécurité.</li>
          </ul>
          <p className="mt-2">L&apos;Utilisateur garantit IMPALA être titulaire des droits nécessaires à la publication des contenus qu&apos;il met en ligne et l&apos;indemnise de toute action en revendication de tiers.</p>
        </div>
      </div>
    ),
  },
  {
    id: "donnees",
    num: "Art. 11",
    title: "Protection des données personnelles",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>Les données à caractère personnel collectées dans le cadre de l&apos;utilisation de la Plateforme sont traitées conformément à :</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>La loi n° 15/027 du 22 décembre 2015 portant protection des données à caractère personnel en RDC ;</li>
          <li>La Politique de confidentialité d&apos;IMPALA, accessible en permanence sur la Plateforme.</li>
        </ul>
        <p>En utilisant la Plateforme, l&apos;Utilisateur consent expressément au traitement de ses données aux fins décrites dans la Politique de confidentialité.</p>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-2">Droits des Utilisateurs</p>
          <p className="mb-2">Conformément à la législation applicable, l&apos;Utilisateur dispose d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de limitation et de portabilité de ses données.</p>
          <p>Pour exercer ces droits, il convient d&apos;adresser une demande accompagnée d&apos;une copie d&apos;une pièce d&apos;identité à :{" "}
            <a href="mailto:dpo@impala-agence.com" className="text-primary hover:underline">dpo@impala-agence.com</a>.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "modification",
    num: "Art. 12",
    title: "Modification des CGU",
    content: (
      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          IMPALA se réserve le droit de modifier, à tout moment et sans préavis, tout ou partie des présentes CGU, afin notamment de les adapter aux évolutions législatives, réglementaires, jurisprudentielles, techniques ou commerciales. Les modifications entrent en vigueur dès leur publication sur la Plateforme.
        </p>
        <p>
          L&apos;Utilisateur est invité à consulter régulièrement la version en vigueur des CGU. La poursuite de l&apos;utilisation de la Plateforme après publication des modifications vaut acceptation pleine et entière des nouvelles CGU. À défaut d&apos;acceptation, l&apos;Utilisateur doit cesser toute utilisation de la Plateforme.
        </p>
      </div>
    ),
  },
  {
    id: "litiges",
    num: "Art. 13",
    title: "Résolution des litiges",
    content: (
      <div className="space-y-5 text-sm text-[var(--text-secondary)] leading-relaxed">
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">13.1 Médiation préalable obligatoire</p>
          <p>En cas de litige, les parties s&apos;engagent à rechercher prioritairement une solution amiable, dans un délai de <strong className="text-[var(--text-primary)]">quinze (15) jours calendaires</strong> à compter de la notification écrite du différend. Cette phase de médiation préalable constitue une condition de recevabilité de toute action contentieuse.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">13.2 Juridiction compétente</p>
          <p>À défaut d&apos;accord amiable dans le délai imparti, le litige sera soumis à la compétence exclusive des tribunaux du ressort de <strong className="text-[var(--text-primary)]">Kinshasa/Gombe (RDC)</strong>, nonobstant pluralité de défendeurs ou appel en garantie, et quel que soit le lieu d&apos;exécution de la prestation ou le domicile du défendeur.</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">13.3 Droit applicable</p>
          <p>Les présentes CGU sont régies, interprétées et exécutées exclusivement conformément au droit positif de la République Démocratique du Congo.</p>
        </div>
      </div>
    ),
  },
  {
    id: "nullite",
    num: "Art. 14",
    title: "Nullité partielle",
    content: (
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        Si l&apos;une quelconque des stipulations des présentes CGU venait à être déclarée nulle, illicite ou inapplicable par une décision de justice devenue définitive, les autres stipulations conserveront toute leur force et leur portée. Les parties s&apos;efforceront alors de remplacer la stipulation invalidée par une stipulation valide produisant un effet économique équivalent.
      </p>
    ),
  },
  {
    id: "contact",
    num: "Art. 15",
    title: "Contact",
    content: (
      <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>Pour toute question, demande d&apos;information ou réclamation relative aux présentes CGU, l&apos;Utilisateur peut contacter le Service client d&apos;IMPALA :</p>
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5">
          <p>
            <span className="font-medium text-[var(--text-primary)]">Email :</span>{" "}
            <a href="mailto:contact@impala-agence.com" className="text-primary hover:underline">contact@impala-agence.com</a>
          </p>
          <p><span className="font-medium text-[var(--text-primary)]">Téléphone :</span> <span className="italic text-[var(--text-muted)]">en attente</span></p>
          <p><span className="font-medium text-[var(--text-primary)]">Adresse :</span> <span className="italic text-[var(--text-muted)]">siège social — en cours</span></p>
          <p><span className="font-medium text-[var(--text-primary)]">Horaires :</span> du lundi au vendredi, de 8h00 à 17h00 (hors jours fériés)</p>
          <p>
            <span className="font-medium text-[var(--text-primary)]">DPO :</span>{" "}
            <a href="mailto:dpo@impala-agence.com" className="text-primary hover:underline">dpo@impala-agence.com</a>
          </p>
        </div>
      </div>
    ),
  },
];

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Légal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-3">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
            Plateforme : <strong>impala-agence.com</strong> — Éditeur : société IMPALA
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
            Document juridique — à lire attentivement avant toute utilisation de la plateforme.
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4">Dernière mise à jour : 12 mai 2026</p>
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
                  {!s.hideNum && (
                    <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">{s.title}</h2>
                  )}
                  {s.hideNum && (
                    <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">Préambule</h2>
                  )}
                </div>
                {s.content}
              </section>
            ))}

            {/* Footer de page */}
            <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-[var(--text-muted)]">© IMPALA – Tous droits réservés</p>
              <div className="flex gap-4 text-xs font-medium text-primary">
                <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
                <Link href="/confidentialite" className="hover:underline">Politique de confidentialité</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
