"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HomeIcon,
  ArrowRightIcon,
  TruckIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  DocumentTextIcon,
  CalculatorIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  StarIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  CameraIcon,
  PencilSquareIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const services = [
  {
    id: 1,
    title: "Services après vente ou location",
    color: "violet",
    icon: WrenchScrewdriverIcon,
    description: "Une fois votre bien vendu ou loué, ces professionnels vous accompagnent dans toutes les démarches pratiques d'installation et d'entretien.",
    items: [
      {
        label: "Déménageur",
        icon: TruckIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Le déménageur professionnel : un partenaire clé pour une transition en toute sérénité</p>
            <p>Le déménageur professionnel ne se limite pas au simple transport de vos biens d&apos;un logement à un autre. Il intervient à chaque étape clé de votre projet pour vous offrir une solution complète, sécurisée et adaptée à vos contraintes.</p>
            <p><strong>1. Une prise en charge globale de vos effets personnels</strong><br />Dès la phase préparatoire, le déménageur évalue le volume et la nature des objets à déplacer. Il assure ensuite l&apos;emballage méthodique de vos meubles, cartons, objets fragiles (miroirs, œuvres d&apos;art, équipements électroniques) et effets personnels, à l&apos;aide de matériaux professionnels (cartons renforcés, film bulle, couvertures de protection). Cette prestation inclut souvent le démontage et le remontage des meubles volumineux (armoires, lits, bureaux).</p>
            <p><strong>2. Logistique complète : chargement, transport, déchargement</strong><br />Le professionnel prend en charge le chargement sécurisé dans un camion adapté, en respectant les règles de répartition des charges pour éviter tout dommage durant le transport. Il assure ensuite le convoyage jusqu&apos;à la nouvelle résidence, en veillant au respect des délais et des accès (étages, ascenseurs, stationnement). Enfin, il procède au déchargement et au repositionnement des biens selon vos instructions, voire au remontage des meubles démontés.</p>
            <p><strong>3. Solutions de flexibilité : le service de garde-meubles</strong><br />En cas de décalage entre la date de sortie et celle d&apos;entrée dans votre nouveau logement (travaux, rupture de bail, etc.), le déménageur peut proposer une prestation de garde-meubles agréé. Vos affaires sont alors entreposées dans un entrepôt sécurisé, climatisé et surveillé, pour une durée modulable (quelques jours à plusieurs mois). Cette option vous évite toute double gestion locative ou stress logistique.</p>
            <p><strong>4. Garanties et protection juridique : l&apos;importance de l&apos;agrément</strong><br />Faire appel à un déménageur agréé (par exemple, titulaire d&apos;une licence de transport de marchandises ou d&apos;une certification comme ISO 9001) vous offre une sécurité essentielle. En cas de casse, de perte ou de détérioration, vous bénéficiez d&apos;une couverture d&apos;assurance responsabilité civile professionnelle, complétée par une garantie dommages aux biens transportés. L&apos;agrément implique également le respect des conditions générales de vente, d&apos;un inventaire détaillé (état des lieux des biens avant/après) et d&apos;un délai de réclamation transparent.</p>
            <p><strong>5. Valeur ajoutée : gain de temps, réduction du stress et prévention des risques physiques</strong><br />Au-delà des aspects matériels, le recours à un professionnel vous libère d&apos;une charge mentale et physique lourde. Vous évitez le port de charges lourdes, les risques de blessures, les allers-retours multiples et la location d&apos;un véhicule inadapté. Le déménageur apporte son expertise sur les passages difficiles, le stationnement réglementé, et l&apos;optimisation du chargement.</p>
            <p><strong>En conclusion</strong><br />Opter pour un déménageur agréé, c&apos;est s&apos;assurer un service intégré (emballage, transport, déchargement, garde-meubles) avec des garanties solides contre la casse ou la perte. C&apos;est aussi choisir la sérénité, la traçabilité et une logistique maîtrisée, pour que votre déménagement devienne une étape fluide, et non une source d&apos;inquiétude.</p>
          </div>
        ),
      },
      {
        label: "Nettoyeur / ménage fin de chantier",
        icon: SparklesIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Le nettoyeur professionnel après travaux ou avant remise des clés : l&apos;exigence d&apos;une propreté irréprochable</p>
            <p>Spécialiste de l&apos;intervention en phase finale de chantier ou de transaction immobilière, ce prestataire réalise un nettoyage en profondeur, technique et méthodique, pour rendre tout espace parfaitement conforme aux attentes des occupants ou des visiteurs. Son intervention est bien plus qu&apos;un simple ménage : il s&apos;agit d&apos;une prestation de remise en état professionnelle.</p>
            <p><strong>1. Élimination complète des pollutions liées aux travaux</strong><br />Le prestataire intervient systématiquement après des travaux de construction, rénovation, ravalement ou aménagement. Il cible et élimine :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Les poussières fines de chantier (plâtre, béton, ponçage, découpe) incrustées dans les moindres recoins, prises électriques, gorges de plinthes, radiateurs ou menuiseries.</li>
              <li>Les résidus de peinture (projections, éclaboussures, coulures) sur les sols, les vitres, les poignées ou les plans de travail.</li>
              <li>Les traces de colle (moquette, carrelage, revêtements adhésifs) ainsi que les résidus de silicone, mastic, joint ou ruban adhésif de masquage.</li>
              <li>Les déchets de chantier (morceaux de carrelage, vis, clous, petits gravats, poussières d&apos;agglomérats).</li>
            </ul>
            <p><strong>2. Une remise en état « prêt à habiter » ou « prêt à visiter »</strong><br />L&apos;objectif final est d&apos;obtenir un bien immaculé, neutre et accueillant, sans aucune trace du passage des prestataires techniques. Selon les besoins, le nettoyage peut inclure :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le lavage des sols (carrelage, parquet, béton ciré, PVC) avec des produits adaptés sans risque d&apos;altération.</li>
              <li>Le nettoyage des vitres, miroirs et surfaces vitrées sans traces.</li>
              <li>Le dépoussiérage des hauteurs (plafonds, corniches, caches luminaires) et des surfaces verticales.</li>
              <li>La décontamination des équipements sanitaires, de la cuisine, des éviers, robinetteries et plans de travail.</li>
              <li>L&apos;aspiration finale des textiles (rideaux, moquettes, tissus d&apos;ameublement restants).</li>
            </ul>
            <p><strong>3. Intervenants clés pour des professionnels et particuliers exigeants</strong><br />Cette prestation s&apos;avère indispensable pour plusieurs acteurs :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Les promoteurs immobiliers</strong> : pour livrer des logements neufs ou rénovés sans réserves lors des remises de clés aux acquéreurs.</li>
              <li><strong>Les bailleurs</strong> (agences immobilières, gestionnaires de patrimoine) : avant l&apos;entrée du nouveau locataire ou après le départ d&apos;un occupant afin d&apos;éviter les litiges sur l&apos;état des lieux.</li>
              <li><strong>Les particuliers vendeurs</strong> : pour maximiser l&apos;attractivité d&apos;un bien lors des visites (vente après rénovation ou rafraîchissement) et rassurer les acheteurs potentiels.</li>
              <li><strong>Les architectes, artisans ou maîtres d&apos;ouvrage</strong> : pour présenter un chantier terminé dans des conditions irréprochables avant réception.</li>
            </ul>
            <p><strong>4. Valeur ajoutée : gain de temps, conformité, image professionnelle</strong><br />Faire appel à ce spécialiste évite au particulier ou au professionnel d&apos;improviser un nettoyage long, fastidieux et souvent inefficace face aux résidus tenaces de chantier. Le prestataire :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dispose d&apos;équipements spécifiques (aspirateur à poussières fines, monobrosse, nettoyeur vapeur, produits dégraissants et anti-traces).</li>
              <li>Intervient rapidement (y compris en urgence) avec une logistique adaptée aux contraintes de chantier (accès, absence d&apos;eau ou d&apos;électricité temporaire).</li>
              <li>Garantit une propreté conforme aux standards des états des lieux de location ou des réceptions de chantier.</li>
            </ul>
            <p><strong>En conclusion</strong><br />Le nettoyeur professionnel après travaux ou avant remise des clés est bien plus qu&apos;un agent d&apos;entretien : c&apos;est un acteur technique de la valorisation immobilière. Pour les promoteurs, bailleurs ou particuliers, son intervention transforme un espace encore marqué par le chantier en un bien impeccable, prêt à être habité, loué ou vendu. Indispensable pour éviter les retards, les mauvaises impressions ou les litiges, ce service constitue un investissement de sérénité et de qualité.</p>
          </div>
        ),
      },
      {
        label: "Gardien / concierge",
        icon: ShieldCheckIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Le gardien ou concierge d&apos;immeuble : acteur central de la vie collective et de la sérénité résidentielle</p>
            <p>Présent sur place (en loge) ou disponible à distance (via astreinte ou plateforme numérique), le gardien ou concierge joue un rôle bien plus large qu&apos;un simple surveillant. Il est à la fois un agent de prévention, un facilitateur du quotidien et un maillon essentiel de la communication au sein des copropriétés. Ses missions, souvent polyvalentes, participent directement à la qualité de vie, à la sécurité et à la cohésion entre résidents.</p>
            <p><strong>1. Surveillance et sécurité : veiller sur l&apos;immeuble et ses occupants</strong><br />Qu&apos;il soit physiquement présent ou interconnecté à distance, le gardien assure une veille constante de l&apos;immeuble :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Surveillance des parties communes (hall, couloirs, escaliers, caves, toitures) pour détecter toute anomalie (dégâts des eaux, intrusions, dysfonctionnements techniques).</li>
              <li>Contrôle des accès : il veille au respect des règles d&apos;entrée, identifie les personnes étrangères à l&apos;immeuble (livreurs, visiteurs, prestataires), et gère les clés ou badges selon les consignes.</li>
              <li>Prévention des risques (incendie, fuites de gaz, obstacles dangereux) et alerte des secours ou des services techniques en cas d&apos;urgence.</li>
              <li>Dissuasion : sa simple présence, même intermittente, constitue un facteur dissuasif face aux actes malveillants (cambriolages, dégradations).</li>
            </ul>
            <p><strong>2. Gestion des accès et des flux de visiteurs</strong><br />Le concierge organise et fluidifie la circulation dans l&apos;immeuble :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Il ouvre et ferme les portes d&apos;entrée principales selon les horaires définis (ou à distance via des systèmes connectés).</li>
              <li>Il filtre et oriente les visiteurs, artisans, livreurs ou nouveaux acquéreurs.</li>
              <li>Il gère les plages d&apos;accès pour des interventions spécifiques (déménagement, travaux, dépannage).</li>
            </ul>
            <p><strong>3. Réception des colis et services logistiques aux résidents</strong><br />Dans un contexte de développement fulgurant du e-commerce, cette mission prend une importance majeure :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Il réceptionne l&apos;ensemble des colis, recommandés et livraisons diverses en l&apos;absence des résidents.</li>
              <li>Il assure leur stockage sécurisé (local dédié, loge, consigne) et leur remise ultérieure.</li>
              <li>Il peut également gérer les départs de courriers ou de plis en recommandé.</li>
              <li>Pour les gardiens connectés à distance, des solutions numériques permettent d&apos;informer en temps réel les résidents de l&apos;arrivée d&apos;un colis.</li>
            </ul>
            <p><strong>4. Petites missions d&apos;entretien courant et de maintenance légère</strong><br />Le gardien ou concierge n&apos;est pas nécessairement un technicien spécialisé, mais il peut exécuter de nombreuses tâches simples qui évitent des appels coûteux à des prestataires extérieurs :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Changement d&apos;ampoules dans les parties communes.</li>
              <li>Petites réparations (poignées, serrures, interrupteurs, plinthes).</li>
              <li>Entretien courant des espaces verts, du local poubelles ou du hall d&apos;entrée (balayage, dépoussiérage).</li>
              <li>Vérification et entretien des équipements communs (extincteurs, digicodes, éclairages temporisés).</li>
              <li>Signalement précis des anomalies nécessitant une intervention spécialisée (plombier, électricien, ascensoriste).</li>
            </ul>
            <p><strong>5. Lien privilégié entre les résidents et le syndic de copropriété</strong><br />Dans une copropriété, le gardien joue souvent le rôle d&apos;interface humaine incontournable :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Il remonte aux résidents les informations émanant du conseil syndical ou du syndic (travaux, assemblées générales, consignes de sécurité, arrêtés municipaux).</li>
              <li>Il transmet au syndic les doléances, demandes d&apos;intervention, observations ou conflits d&apos;usage relevés dans l&apos;immeuble.</li>
              <li>Il assiste parfois aux réunions de copropriété ou aux états des lieux des parties communes.</li>
              <li>Il facilite les relations de bon voisinage (médiation légère, affichage, organisation de petites convivialités).</li>
            </ul>
            <p><strong>6. Contribution au sentiment de sécurité et au bon fonctionnement collectif</strong><br />Au-delà des tâches opérationnelles, le gardien ou concierge crée un environnement de confiance :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Il rassure les résidents, notamment les personnes âgées, isolées ou absentes fréquemment.</li>
              <li>Il réduit les tensions liées à la gestion quotidienne (horaires de sortie des poubelles, utilisation des parties communes, bruits anormaux).</li>
              <li>Il favorise un esprit de voisinage positif en étant un repère stable et accessible.</li>
              <li>Il permet au syndic de se concentrer sur la gestion stratégique (comptes, travaux lourds, juridique) en prenant en charge le quotidien.</li>
            </ul>
            <p><strong>Valeur ajoutée selon le mode de présence : sur site ou à distance</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-4 font-semibold text-[var(--text-primary)]">Critère</th>
                    <th className="text-left py-2 pr-4 font-semibold text-[var(--text-primary)]">Sur place</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">À distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-4">Présence</td><td className="py-1.5 pr-4">Continue ou horaires fixes</td><td className="py-1.5">Discontinue, astreinte ou plateforme</td></tr>
                  <tr><td className="py-1.5 pr-4">Contact humain</td><td className="py-1.5 pr-4">Direct, quotidien</td><td className="py-1.5">Intermittent, via téléphone/appli</td></tr>
                  <tr><td className="py-1.5 pr-4">Interventions physiques</td><td className="py-1.5 pr-4">Immédiates</td><td className="py-1.5">Planifiées ou après déclenchement</td></tr>
                  <tr><td className="py-1.5 pr-4">Coût pour la copropriété</td><td className="py-1.5 pr-4">Plus élevé</td><td className="py-1.5">Modéré, adaptable</td></tr>
                  <tr><td className="py-1.5 pr-4">Idéal pour</td><td className="py-1.5 pr-4">Grandes copropriétés, immeubles sensibles</td><td className="py-1.5">Petites copropriétés, budgets contraints, résidences secondaires</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Conclusion</strong><br />Le gardien ou concierge est bien plus qu&apos;un employé d&apos;immeuble : c&apos;est un professionnel du lien social et de la prévention. Qu&apos;il soit présent physiquement ou relié à distance, il contribue directement à la sécurité, à la fluidité des services, à la réduction des nuisances et à la qualité du cadre de vie. Dans une copropriété, il incarne souvent la mémoire des lieux, la réactivité face aux imprévus et le sourire discret qui rassure. Investir dans cette fonction, c&apos;est faire le choix d&apos;une gestion apaisée et humaine de l&apos;habitat collectif.</p>
          </div>
        ),
      },
      {
        label: "Domoticien (systèmes connectés)",
        icon: CpuChipIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Le domoticien : l&apos;architecte du confort connecté pour un logement intelligent, sécurisé et économe</p>
            <p>Le domoticien est un spécialiste de l&apos;intégration technologique au sein de l&apos;habitat. Son rôle ne se limite pas à l&apos;installation d&apos;objets connectés : il conçoit, installe, paramètre et fait interagir des systèmes d&apos;automatisme pour centraliser le contrôle du logement. Grâce à son expertise, le résident peut piloter à distance ou en local un large panel d&apos;équipements, généralement via une application dédiée sur smartphone, tablette ou assistante vocale.</p>
            <p><strong>1. Installation et configuration des systèmes d&apos;automatisation du logement</strong><br />Le domoticien intervient généralement en phase de construction, de rénovation ou d&apos;adaptation technologique d&apos;un bien existant. Ses prestations couvrent plusieurs domaines complémentaires :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contrôle de l&apos;éclairage</strong> : programmation horaires, détection de présence, réglage de l&apos;intensité lumineuse (variateur), scénarios personnalisés (ex. : mode « cinéma », mode « réveil progressif »).</li>
              <li><strong>Gestion du chauffage et de la climatisation</strong> : installation de thermostats connectés, régulation pièce par pièce, optimisation selon l&apos;occupation ou la météo, programmation à distance pour réduire la consommation en absence.</li>
              <li><strong>Commande des volets, stores et occultations</strong> : ouverture/fermeture programmée (lever/coucher du soleil) ou manuelle à distance, intégration avec des capteurs de lumière ou de température.</li>
              <li><strong>Serrures connectées et contrôle d&apos;accès</strong> : ouverture par code, empreinte digitale, smartphone ou clé virtuelle ; gestion des autorisations temporaires pour un artisan, un gardien ou un locataire.</li>
              <li><strong>Alarmes et caméras de surveillance</strong> : installation de détecteurs d&apos;ouverture, de mouvement, de bris de verre ou de fumée ; paramétrage de caméras IP accessibles en direct ou avec déclenchement sur notification ; couplage avec une centrale de télésurveillance.</li>
            </ul>
            <p><strong>2. Amélioration du confort : un quotidien simplifié et personnalisé</strong><br />Au-delà des simples commandes à distance, le domoticien crée des scénarios d&apos;automatisme qui rendent le logement véritablement « intelligent » :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Scénario matin</strong> : chauffage enclenché, lumières allumées progressivement, volets ouverts partiellement.</li>
              <li><strong>Scénario absence</strong> : simulation de présence (lumières aléatoires, fermeture différée des volets), chauffage réduit, alarme armée.</li>
              <li><strong>Scénario bien-être</strong> : musique d&apos;ambiance, éclairage tamisé, température douce, déclenchés d&apos;une simple commande vocale.</li>
            </ul>
            <p>Le résultat : une réduction des gestes répétitifs, une adaptation continue aux habitudes des occupants, et un environnement qui « anticipe » leurs besoins.</p>
            <p><strong>3. Renforcement de la sécurité du bien et des personnes</strong><br />L&apos;automatisation apporte une sécurité active, permanente et réactive :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Surveillance en temps réel</strong> : les caméras et détecteurs alertent immédiatement l&apos;utilisateur sur son smartphone en cas d&apos;intrusion, d&apos;incendie, de fuite d&apos;eau ou d&apos;ouverture anormale.</li>
              <li><strong>Contrôle d&apos;accès à distance</strong> : savoir qui entre et sort, donner accès ponctuellement sans clé physique.</li>
              <li><strong>Prévention des risques</strong> : coupure automatique du chauffage en cas d&apos;oubli, détection de fumée ou de monoxyde de carbone avec alerte même loin du logement.</li>
              <li><strong>Sécurisation des personnes vulnérables</strong> : routine de vérification pour des personnes âgées ou isolées (détection d&apos;absence anormale, chute).</li>
            </ul>
            <p><strong>4. Optimisation de l&apos;efficacité énergétique : un levier pour la transition écologique</strong><br />Le domoticien participe activement à la réduction de l&apos;empreinte énergétique du logement :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Bye-bye les consommations inutiles</strong> : extinction automatique des lumières et appareils en zone vide, chauffage réduit en absence, régulation fine de la température.</li>
              <li><strong>Suivi des consommations</strong> : remontée des données en temps réel (électricité, chauffage, eau) pour identifier les postes énergivores.</li>
              <li><strong>Couplage avec des énergies renouvelables</strong> : pilotage des panneaux solaires, batteries domestiques ou bornes de recharge pour véhicule électrique.</li>
              <li><strong>Économies mesurables</strong> : jusqu&apos;à 20 à 30 % d&apos;économies sur la facture énergétique selon l&apos;équipement.</li>
            </ul>
            <p><strong>5. Un atout majeur pour la valeur du bien sur le marché immobilier</strong><br />Un logement équipé par un domoticien professionnel n&apos;est plus un simple « logement connecté gadget » : c&apos;est un bien différenciant sur le marché de la vente ou de la location.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Attractivité accrue</strong> : les acheteurs ou locataires, notamment jeunes actifs, télétravailleurs ou familles, recherchent de plus en plus le confort pilotable, la sécurité à distance et les économies d&apos;énergie programmées.</li>
              <li><strong>Valorisation financière</strong> : une installation domotique bien intégrée et pérenne (norme, évolutive, compatible avec les assistants vocaux) peut justifier un prix de vente ou un loyer supérieur à un bien standard.</li>
              <li><strong>Argument différenciant</strong> : face à un marché concurrentiel, mentionner « logement connecté », « domotique intégrée » ou « gestion énergétique intelligente » devient un critère de choix déterminant.</li>
            </ul>
            <p><strong>6. Intervention sur mesure et accompagnement complet</strong><br />Le domoticien ne se limite pas à l&apos;installation : il conseille, audite et forme.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Audit initial</strong> : identification des besoins réels (confort, économies, accessibilité, sécurité) et compatibilité avec l&apos;existant.</li>
              <li><strong>Conception</strong> : schéma d&apos;automatisation, choix des protocoles (filaire, sans fil, mixte), compatibilité entre marques.</li>
              <li><strong>Installation et paramétrage</strong> : câblage, association des périphériques, configuration des scénarios, réglage des notifications.</li>
              <li><strong>Formation de l&apos;utilisateur</strong> : prise en main de l&apos;application, compréhension des alertes, mise à jour du système.</li>
              <li><strong>Maintenance et évolutivité</strong> : suivi à long terme, ajout de nouveaux capteurs ou modules, mise à jour de sécurité.</li>
            </ul>
            <p><strong>Conclusion</strong><br />Le domoticien est bien plus qu&apos;un technicien en électronique : c&apos;est un artisan du confort augmenté, au carrefour de l&apos;énergie, de la sécurité et du numérique. Installer un système domotique professionnel, c&apos;est transformer son logement en un habitat réactif, intuitif et durable. Pour un propriétaire occupant, cela améliore le quotidien et réduit les factures. Pour un vendeur ou un bailleur, c&apos;est un investissement rentable qui rendra son bien immédiatement plus séduisant et mieux valorisé sur un marché immobilier de plus en plus tourné vers l&apos;intelligence du foyer.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 2,
    title: "Diagnostics techniques",
    color: "orange",
    icon: ClipboardDocumentCheckIcon,
    description: "Avant toute vente ou location, la loi impose la réalisation de diagnostics techniques obligatoires afin d'informer l'acquéreur ou le locataire sur l'état réel du bien.",
    items: [
      {
        label: "Diagnostiqueur immobilier (DPE, amiante, plomb, termites, gaz, électricité…)",
        icon: ClipboardDocumentCheckIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Les diagnostics techniques obligatoires avant vente ou location : transparence légale et protection de l&apos;acquéreur ou du locataire</p>
            <p>Avant toute mise en vente ou location d&apos;un bien immobilier, la loi impose au propriétaire (vendeur ou bailleur) de réaliser un ensemble de diagnostics techniques. Ces évaluations obligatoires, encadrées par le Code de la construction et de l&apos;habitation ainsi que le Code de l&apos;environnement, ont un double objectif : informer en toute transparence l&apos;acquéreur ou le locataire sur l&apos;état réel du bien, et prévenir les risques (santé, sécurité, performance énergétique). Ces documents sont rassemblés dans un dossier de diagnostic technique (DDT) à annexer à la promesse de vente ou au contrat de location.</p>
            <p><strong>1. Fondement juridique : une obligation d&apos;information précontractuelle</strong><br />La loi impose au propriétaire de fournir ces diagnostics avant la signature du contrat (compromis, vente définitive ou bail). Leur absence ou leur caractère incomplet peut entraîner :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La nullité de la vente ou du contrat de location.</li>
              <li>Une réduction du prix de vente.</li>
              <li>Des dommages et intérêts en cas de vice caché ou de non-divulgation.</li>
              <li>Des sanctions pénales (amendes, voire emprisonnement dans certains cas).</li>
            </ul>
            <p><strong>2. Diagnostics obligatoires selon la nature du bien et du contrat</strong></p>
            <p><em>a) Pour toute vente (maison, appartement, local commercial à usage d&apos;habitation) :</em></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Diagnostic</th>
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Contenu</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Validité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">DPE</td><td className="py-1.5 pr-3">Évaluation de la consommation énergétique (étiquette A à G) et estimation des émissions de gaz à effet de serre. Inclut des recommandations de travaux.</td><td className="py-1.5">10 ans</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">CREP (plomb)</td><td className="py-1.5 pr-3">Recherche de revêtements contenant du plomb (peintures) pour les logements construits avant 1949.</td><td className="py-1.5">Illimité si absence détectée</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Installation gaz</td><td className="py-1.5 pr-3">Contrôle de sécurité de l&apos;installation de gaz fixe — obligatoire pour les installations de plus de 15 ans.</td><td className="py-1.5">3 ans</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Installation électrique</td><td className="py-1.5 pr-3">Vérification de la conformité et des risques pour les installations ayant plus de 15 ans.</td><td className="py-1.5">3 ans</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Amiante</td><td className="py-1.5 pr-3">Obligatoire pour les logements dont le permis de construire date d&apos;avant le 1er juillet 1997.</td><td className="py-1.5">Illimité si absence</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">ERNMT</td><td className="py-1.5 pr-3">Information sur les risques auxquels le bien est exposé (inondation, séisme, radon, argile, etc.) selon zonage réglementaire.</td><td className="py-1.5">6 mois</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Termites</td><td className="py-1.5 pr-3">Dans les zones délimitées à risque, recherche d&apos;insectes xylophages.</td><td className="py-1.5">6 mois</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Loi Carrez</td><td className="py-1.5 pr-3">Pour les lots en copropriété : surface privative habitable — opposable et contractuel.</td><td className="py-1.5">Sans limite</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Assainissement non collectif</td><td className="py-1.5 pr-3">Pour les logements avec installation d&apos;assainissement autonome (fosse septique) : contrôle de conformité.</td><td className="py-1.5">3 ans</td></tr>
                </tbody>
              </table>
            </div>
            <p><em>b) Pour toute location :</em> Sont obligatoires : le DPE, le CREP plomb (logements antérieurs à 1949), l&apos;état de l&apos;installation de gaz et électrique (si plus de 15 ans), l&apos;ERNMT et, le cas échéant, le diagnostic termites ou assainissement. Depuis la loi Climat et Résilience (2021), les logements très énergivores (étiquettes F et G) voient leur mise en location progressivement interdite.</p>
            <p><strong>3. Qui réalise les diagnostics ? – L&apos;importance du diagnostiqueur certifié</strong><br />Tous ces diagnostics doivent être réalisés par un diagnostiqueur immobilier certifié et indépendant. Il doit être couvert par une assurance responsabilité civile professionnelle, respecter les méthodes normalisées et attester de sa qualification via un organisme certificateur (ex. : Certibat, LNE, Apave, Socotec, Bureau Veritas). Un faux diagnostic ou une non-conformité engage la responsabilité civile et pénale du diagnostiqueur.</p>
            <p><strong>4. Valeur ajoutée des diagnostics pour les parties prenantes</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Pour l&apos;acquéreur ou locataire</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Pour le vendeur ou bailleur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3">Transparence complète sur l&apos;état du bien</td><td className="py-1.5">Sérénité juridique et contractualisation sécurisée</td></tr>
                  <tr><td className="py-1.5 pr-3">Connaissance des travaux à prévoir (DPE, électricité, gaz)</td><td className="py-1.5">Valorisation ou dépréciation assumée du bien</td></tr>
                  <tr><td className="py-1.5 pr-3">Estimation des coûts énergétiques futurs</td><td className="py-1.5">Protection contre les recours pour vices cachés</td></tr>
                  <tr><td className="py-1.5 pr-3">Droit de rétractation ou de renégociation si anomalie grave</td><td className="py-1.5">Évitement d&apos;annulation de vente ou de condamnation</td></tr>
                  <tr><td className="py-1.5 pr-3">Comparaison objective entre biens</td><td className="py-1.5">Crédibilité et confiance de l&apos;acheteur / locataire</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>5. Cas particuliers et évolutions récentes</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Logements neufs (moins de 5 ans)</strong> : Dispensés de certains diagnostics (plomb, amiante, termites sauf risque particulier), mais DPE obligatoire depuis juillet 2021.</li>
              <li><strong>Vente en VEFA</strong> : DPE prévisionnel obligatoire.</li>
              <li><strong>Baux mobilités, saisonniers, étudiants</strong> : Obligations allégées mais DPE et plomb restent requis.</li>
              <li><strong>Performance énergétique renforcée</strong> : À partir de 2024, audit énergétique réglementaire pour les logements classés F et G lors de la vente.</li>
              <li><strong>Regroupement des validités</strong> : Un même bien peut avoir des diagnostics avec des durées de validité différentes ; attention à la date du plus ancien pour constituer un DDT complet.</li>
            </ul>
            <p><strong>6. Conclusion : une obligation protectrice et valorisante</strong><br />Les diagnostics techniques obligatoires ne sont ni une contrainte bureaucratique inutile, ni un frein à la transaction immobilière. Ils constituent un socle de confiance entre les parties, une protection contre les vices cachés et les risques sanitaires ou sécuritaires, et un levier de transparence énergétique dans un contexte de transition écologique. Faire réaliser ces diagnostics par un professionnel certifié, c&apos;est investir dans une transaction sereine, durable et conforme à la loi.</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 3,
    title: "Juridique et fiscal",
    color: "red",
    icon: ScaleIcon,
    description: "Les aspects juridiques et fiscaux d'une transaction immobilière sont complexes. Ces experts vous protègent et optimisent votre situation à chaque étape.",
    items: [
      {
        label: "Notaire",
        icon: DocumentTextIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Le notaire : officier ministériel clé de la sécurisation des transactions immobilières</p>
            <p>Officier ministériel nommé par l&apos;État, le notaire occupe une place centrale et incontournable dans toute transaction immobilière (vente, donation, partage, apport en société, etc.). Loin de se réduire à une simple formalité administrative, son intervention garantit la légalité, l&apos;authenticité et la force probante de l&apos;acte de vente. Il protège à la fois le vendeur, l&apos;acquéreur et les tiers (banques, créanciers, collectivités) en veillant à la transparence et à la sécurité juridique de l&apos;opération.</p>
            <p><strong>1. L&apos;authentification des actes de vente : une signature à valeur légale renforcée</strong><br />Le notaire a le monopole de l&apos;authentification des actes de vente immobilière. L&apos;acte authentique qu&apos;il rédige présente trois avantages majeurs :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Force probante</strong> : il fait foi jusqu&apos;à inscription de faux. Les déclarations des parties, la consistance du bien, le prix et les conditions de vente sont juridiquement incontestables.</li>
              <li><strong>Date certaine</strong> : la date de l&apos;acte est opposable aux tiers (créanciers, autres acquéreurs potentiels).</li>
              <li><strong>Force exécutoire</strong> : en cas de non-respect des obligations (paiement du prix, remise des clés), l&apos;acte authentique permet d&apos;obtenir une saisie ou une exécution forcée sans jugement préalable.</li>
            </ul>
            <p>Chaque acte est signé physiquement ou électroniquement devant le notaire, qui vérifie l&apos;identité, la capacité juridique (majeur, non sous tutelle) et le consentement libre et éclairé des parties.</p>
            <p><strong>2. Vérification de la situation hypothécaire du bien : une purge des risques invisibles</strong><br />Avant toute vente, le notaire réalise une recherche hypothécaire obligatoire (fichier des formalités réelles). Cette vérification permet de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identifier d&apos;éventuelles inscriptions hypothécaires (prêts garantis par le bien) ou privilèges (privilège du vendeur, du constructeur, du fisc).</li>
              <li>Détecter des servitudes ou des droits réels (usufruit, droit d&apos;usage, bail emphytéotique) qui grèveraient la propriété.</li>
              <li>Purger ces inscriptions : le notaire veille à ce que le prix de vente soit affecté en priorité au remboursement des créanciers hypothécaires, libérant ainsi le bien de toute charge.</li>
            </ul>
            <p>Si une hypothèque subsiste après vente, l&apos;acquéreur pourrait voir saisir son bien : l&apos;intervention du notaire élimine ce risque. Cette vérification est réalisée auprès du service de la publicité foncière et date généralement de moins de trois mois.</p>
            <p><strong>3. Contrôle du respect des règles d&apos;urbanisme et de constructibilité</strong><br />Le notaire s&apos;assure que le bien vendu respecte les règles locales d&apos;urbanisme. Ses vérifications portent sur :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La conformité avec le permis de construire (surface, hauteur, aspect extérieur).</li>
              <li>La certification de la surface habitable (loi Boutin / Carrez) pour les lots en copropriété.</li>
              <li>L&apos;absence d&apos;interdiction de construire (plan de prévention des risques, zone inconstructible, protection des abords de monuments historiques).</li>
              <li>La viabilité : raccordement aux réseaux (eau, assainissement, électricité) ou solution autonome conforme.</li>
              <li>Le respect du règlement du lotissement ou du cahier des charges (clauses restrictives de construction).</li>
            </ul>
            <p><strong>4. Collecte des droits de mutation et taxes pour le compte de l&apos;État</strong><br />Le notaire est un collecteur d&apos;impôts et de taxes pour le compte de l&apos;État, des collectivités locales et des organismes sociaux. Lors d&apos;une vente, il calcule, prélève et reverse :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Les droits d&apos;enregistrement</strong> (droits de mutation) : environ 5 à 6 % pour un logement ancien, droits réduits ou TVA pour un logement neuf.</li>
              <li><strong>La taxe de publicité foncière</strong> : pour l&apos;inscription de la mutation au fichier immobilier.</li>
              <li><strong>La contribution de sécurité immobilière (CSI)</strong>.</li>
              <li><strong>L&apos;éventuelle taxe sur les plus-values immobilières</strong> (calcul et déclaration pour le vendeur si revente non-résidence principale).</li>
              <li><strong>Les honoraires du notaire</strong> (rémunération fixée par décret, proportionnelle à la valeur du bien).</li>
            </ul>
            <p><strong>5. L&apos;intervention obligatoire pour l&apos;acte définitif de vente</strong><br />En France, la signature de l&apos;acte authentique de vente doit obligatoirement avoir lieu devant notaire. Aucune autre forme juridique ne peut transmettre la propriété de manière définitive et opposable aux tiers. Même lorsque les parties sont d&apos;accord, que le prix est payé et les clés remises, la propriété n&apos;est transférée qu&apos;à la signature chez le notaire suivie de la publication à la publicité foncière.</p>
            <p><strong>6. Sécurisation globale : garantie de valeur légale et protection des parties</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Étape</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Rôle du notaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">Avant la vente</td><td className="py-1.5">Conseil aux parties, rédaction de la promesse de vente (sous conditions suspensives), dépôt des fonds séquestrés.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Pendant la vente</td><td className="py-1.5">Explication détaillée des clauses, vérification des pièces d&apos;identité, de la capacité juridique, des consentements.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Après la vente</td><td className="py-1.5">Signature de l&apos;acte, collecte des impôts, transmission à la publicité foncière, délivrance de copies authentiques, conservation de l&apos;acte (au moins 75 ans).</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>7. Évolutions récentes : dématérialisation et modernisation</strong><br />Aujourd&apos;hui, le notaire peut rédiger et signer des actes à distance (visioconférence, signature électronique qualifiée), utiliser Mon.Dossier.Notaire pour échanger des pièces en ligne, et délivrer des attestations de propriété numériques. Cependant, la signature définitive d&apos;une vente nécessite encore pour l&apos;essentiel une rencontre entre les parties et le notaire, garantissant le caractère solennel et protecteur de l&apos;acte.</p>
            <p><strong>Conclusion</strong><br />Le notaire n&apos;est pas un simple « rédacteur d&apos;actes » : c&apos;est le garant de la sécurité juridique de toute la chaîne immobilière. Ses vérifications hypothécaires, son contrôle urbanistique, sa collecte des impôts et son devoir de conseil font de la signature chez le notaire bien plus qu&apos;une formalité : un véritable acte de protection pour l&apos;acquéreur, le vendeur et leurs créanciers. Dans l&apos;univers complexe et risqué de l&apos;immobilier, le notaire incarne la valeur légale sécurisée – et cela n&apos;a pas de prix.</p>
          </div>
        ),
      },
      {
        label: "Avocat spécialisé en droit immobilier",
        icon: ScaleIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">L&apos;avocat spécialisé en droit immobilier : un conseil stratégique et une défense exclusive de vos intérêts</p>
            <p>L&apos;avocat spécialisé en droit immobilier est bien plus qu&apos;un simple technicien du droit : c&apos;est un stratège juridique qui intervient en amont, pendant et après toute opération immobilière. Contrairement au notaire – officier ministériel impartial tenu à une stricte neutralité entre les parties – l&apos;avocat est tenu à une obligation de loyauté et de confidentialité exclusive envers son client. Il ne représente qu&apos;une seule partie et défend ses intérêts jusqu&apos;en justice si nécessaire.</p>
            <p><strong>1. Rédaction et analyse des contrats complexes</strong><br />L&apos;avocat immobilier maîtrise la rédaction et la relecture critique de tous les contrats liés à l&apos;immobilier :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Promesse et compromis de vente</strong> : insertion ou vérification des clauses suspensives, conditions de rétractation, calcul des indemnités d&apos;immobilisation.</li>
              <li><strong>Contrats de construction</strong> (CCMI, marché de travaux, maîtrise d&apos;œuvre) : sécurisation des délais, pénalités de retard, garanties de parfait achèvement.</li>
              <li><strong>Baux d&apos;habitation, baux commerciaux, baux professionnels</strong> : analyse des charges récupérables, clauses d&apos;indexation, conditions de renouvellement ou résiliation.</li>
              <li><strong>Actes VEFA</strong> : protection contre les malfaçons, garanties d&apos;achèvement, livraison conforme.</li>
              <li><strong>Contrats de promotion immobilière</strong> et partages de copropriété.</li>
              <li><strong>Compromis sous conditions</strong> (urbanisme, servitude, droit de préemption de la mairie ou SAFER).</li>
            </ul>
            <p><strong>2. Conseil stratégique en amont : avant même la signature du compromis</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vérification des titres de propriété : analyse des servitudes, droits réels, clauses restrictives de lotissement, hypothèques anciennes non purgées.</li>
              <li>Évaluation des risques juridiques : constructibilité réelle, viabilité, plans de prévention des risques.</li>
              <li>Négociation des conditions : prix, modalités de paiement, répartition des frais.</li>
              <li>Vérification des diagnostics obligatoires : opportunité de contre-expertise (DPE contestable, amiante, termites).</li>
              <li>Aide à la constitution du dossier de financement : analyse des offres de prêt, vérification de l&apos;assurance emprunteur.</li>
            </ul>
            <p><strong>3. Gestion des litiges : des vices cachés aux troubles de voisinage</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Type de litige</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Intervention de l&apos;avocat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">Vices cachés</td><td className="py-1.5">Constitution de preuves, expertise judiciaire, négociation d&apos;indemnisation ou annulation de la vente, assignation en référé.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Troubles de voisinage</td><td className="py-1.5">Médiation, mise en demeure, action en cessation du trouble ou en réparation du préjudice.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Expulsion locative</td><td className="py-1.5">Commandement de payer, assignation devant le juge, obtention de la décision d&apos;expulsion, coordination avec la force publique.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Non-respect d&apos;une promesse de vente</td><td className="py-1.5">Mise en demeure, action en exécution forcée ou en dommages-intérêts.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Malfaçons / retard de travaux</td><td className="py-1.5">Expertise judiciaire, action en référé pour travaux sous astreinte, garantie décennale.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Litige entre copropriétaires</td><td className="py-1.5">Conseil au syndic ou copropriétaire, action devant le tribunal judiciaire, transaction.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Indivision et succession</td><td className="py-1.5">Négociation de protocole d&apos;accord, action en partage judiciaire, licitation.</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>4. Défense devant les tribunaux</strong><br />L&apos;avocat est le seul professionnel habilité à représenter son client et à plaider devant toutes les juridictions : tribunal judiciaire, cour d&apos;appel, Cour de cassation, juge des référés (mesures d&apos;urgence), juge de l&apos;exécution (expulsion forcée, saisie immobilière).</p>
            <p><strong>5. Différence fondamentale avec le notaire</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Critère</th>
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Notaire</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Avocat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3">Statut</td><td className="py-1.5 pr-3">Officier ministériel, délégué de l&apos;État</td><td className="py-1.5">Professionnel libéral, auxiliaire de justice</td></tr>
                  <tr><td className="py-1.5 pr-3">Impartialité</td><td className="py-1.5 pr-3">Oui – conseille toutes les parties</td><td className="py-1.5">Non – défend exclusivement son client</td></tr>
                  <tr><td className="py-1.5 pr-3">Compétence exclusive</td><td className="py-1.5 pr-3">Acte authentique, publicité foncière, collecte des impôts</td><td className="py-1.5">Plaidoirie devant les tribunaux, représentation en justice</td></tr>
                  <tr><td className="py-1.5 pr-3">Honoraires</td><td className="py-1.5 pr-3">Fixés par décret (proportionnels à la valeur du bien)</td><td className="py-1.5">Libres (forfait, horaire, résultat)</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>6. Valeur ajoutée pour les particuliers comme pour les professionnels</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Public</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Bénéfices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">Particulier acheteur</td><td className="py-1.5">Négociation des clauses suspensives, vérification des diagnostics, protection en cas de vice caché.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Particulier vendeur</td><td className="py-1.5">Rédaction sécurisée de la promesse, conseil sur la plus-value et l&apos;exonération, défense en cas d&apos;action en garantie.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Locataire</td><td className="py-1.5">Contestation de charges abusives, défense lors d&apos;une expulsion, demande de travaux, dommages-intérêts pour troubles.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Bailleur</td><td className="py-1.5">Rédaction de baux solides, récupération des loyers impayés, procédure d&apos;expulsion.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Copropriété / syndic</td><td className="py-1.5">Rédaction de règlement intérieur, action contre un copropriétaire défaillant, défense contre les malfaçons.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Promoteur / constructeur</td><td className="py-1.5">Contrats VEFA, gestion des garanties, contentieux des réceptions et levées de réserves.</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Conclusion</strong><br />L&apos;avocat spécialisé en droit immobilier est bien plus qu&apos;un simple « avocat de terrain » : c&apos;est un conseil stratégique, un rédacteur avisé, un négociateur impartial et un redoutable plaideur lorsqu&apos;il faut défendre les intérêts de son client. Faire appel à lui dès l&apos;avant-projet permet souvent d&apos;éviter des contentieux longs et coûteux. Dans l&apos;immobilier, où chaque détail juridique peut avoir des conséquences financières considérables, l&apos;avocat spécialisé n&apos;est pas un luxe : c&apos;est une assurance vie contre les risques juridiques.</p>
          </div>
        ),
      },
      {
        label: "Expert en fiscalité immobilière (IFI, plus-value, déficit foncier)",
        icon: CalculatorIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Situation Fiscale Actuelle en RDC</p>
            <p>Voici ce qu&apos;il faut retenir de l&apos;environnement fiscal pour l&apos;immobilier en RDC sur la base des informations disponibles.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Un paysage fiscal en mouvement :</strong> La RDC a récemment introduit un crédit d&apos;impôt pour l&apos;investissement, un dispositif moderne qui permet de déduire une partie des dépenses d&apos;investissement de l&apos;impôt sur les sociétés. Cela montre une volonté d&apos;actualiser et de clarifier les règles fiscales pour les entreprises, un signal important pour les investisseurs.
              </li>
              <li>
                <strong>Des mesures locales pour soutenir les contribuables :</strong> À Kinshasa, le gouvernement provincial a exceptionnellement accordé un report jusqu&apos;au 28 février 2026 pour le recouvrement forcé de l&apos;impôt foncier et de l&apos;impôt sur les revenus locatifs. Cette mesure de « sursis fiscal » est une opportunité pour les propriétaires de régulariser leur situation.
              </li>
              <li>
                <strong>Une clarification à obtenir :</strong> Les recherches n&apos;ont pas permis de trouver un équivalent de l&apos;Impôt sur la Fortune Immobilière (IFI) tel qu&apos;il existe en France. Il est donc possible que l&apos;IFI ne soit pas un dispositif en vigueur en RDC, ou qu&apos;il soit connu sous une autre dénomination et un autre mode de calcul.
              </li>
            </ul>
            <p className="font-semibold text-[var(--text-primary)]">Comment procéder pour une analyse fiable ?</p>
            <p>Pour obtenir des informations précises et personnalisées, les actions suivantes sont recommandées :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Consulter un expert local :</strong> La source la plus fiable sera un expert-comptable, un avocat fiscaliste ou un conseil en gestion de patrimoine spécialisé en droit congolais. Ces professionnels sont les seuls à pouvoir vous fournir une analyse exacte de votre situation et des stratégies d&apos;optimisation réalistes et légales.
              </li>
              <li>
                <strong>Se rapprocher de l&apos;administration fiscale :</strong> La Direction Générale des Impôts (DGI) ou la Direction Générale des Recettes de Kinshasa (DGRK) sont les autorités compétentes. Vous pouvez les solliciter directement pour obtenir les textes de loi et les décrets d&apos;application.
              </li>
              <li>
                <strong>Vérifier les textes officiels :</strong> La base de toute stratégie fiscale est la loi. Consultez les codes des impôts et des taxes en vigueur en RDC pour connaître avec certitude les obligations et les droits applicables à votre patrimoine.
              </li>
            </ul>
          </div>
        ),
      },
      {
        label: "Huissier de justice (constats, expulsions)",
        icon: DocumentTextIcon,
        description:
          "L'huissier de justice (désormais appelé commissaire de justice) dresse des constats ayant force probante devant les tribunaux : état des lieux contradictoire en cas de litige, constat de nuisances, d'infiltrations ou de malfaçons. Il peut également signifier des actes judiciaires (commandements de payer, congés) et procéder à des expulsions locatives sur décision de justice. Faire appel à lui sécurise les preuves en cas de contentieux.",
      },
    ],
  },
  {
    id: 4,
    title: "Gestion locative et syndic",
    color: "blue",
    icon: BuildingOffice2Icon,
    description: "Ces professionnels assurent la gestion quotidienne de vos biens en location ou en copropriété, vous libérant des contraintes administratives et relationnelles.",
    items: [
      {
        label: "Administrateur de biens",
        icon: UserGroupIcon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">L&apos;administrateur de biens : un gestionnaire professionnel pour une location sereine et rentable</p>
            <p>L&apos;administrateur de biens est un mandataire professionnel qui agit pour le compte d&apos;un propriétaire bailleur. Il prend en charge la gestion courante, administrative, technique et financière d&apos;un ou plusieurs biens immobiliers donnés en location. Son intervention permet au propriétaire de déléguer l&apos;intégralité des contraintes opérationnelles liées à la location, tout en bénéficiant d&apos;une sécurité juridique et financière renforcée.</p>
            <p><strong>1. Recherche et sélection rigoureuse des locataires</strong><br />L&apos;administrateur professionnalise cette étape cruciale :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Diffusion de l&apos;annonce sur les plateformes immobilières et via son réseau.</li>
              <li>Organisation des visites et réception des candidats.</li>
              <li>Analyse complète des dossiers : revenus, contrat de travail, garant, vérification de l&apos;authenticité des documents.</li>
              <li>Choix du candidat le plus fiable selon une grille objective (taux d&apos;effort, stabilité professionnelle, historique locatif).</li>
              <li>Souscription possible d&apos;une garantie contre les loyers impayés (GLI) ou du dispositif Visale.</li>
            </ul>
            <p><strong>2. Rédaction et sécurisation des baux</strong><br />Un bail mal rédigé est source fréquente de litiges. L&apos;administrateur utilise des contrats conformes aux dernières lois (Alur, Élan, Climat et Résilience) avec toutes les annexes obligatoires, les clauses personnalisées (indexation IRL, solidarité entre colocataires, clause résolutoire) et veille à la régularité de l&apos;état des lieux d&apos;entrée contradictoire.</p>
            <p><strong>3. Encaissement des loyers et suivi des charges</strong><br />L&apos;administrateur centralise toutes les opérations financières :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mise en place d&apos;un prélèvement automatique ou encaissement par virement.</li>
              <li>Émission de quittances de loyer mensuelles.</li>
              <li>Régularisation annuelle des charges récupérables avec justificatifs.</li>
              <li>Compte rendu de gestion périodique (encaissements, travaux, contentieux, taux d&apos;occupation).</li>
              <li>Déclaration fiscale simplifiée : récapitulatif annuel des loyers et charges déductibles.</li>
            </ul>
            <p>Il est légalement tenu de déposer les fonds des propriétaires sur un compte séquestre séparé de son propre compte d&apos;exploitation.</p>
            <p><strong>4. Gestion des travaux et de l&apos;entretien</strong><br />L&apos;administrateur agit comme le bras technique du propriétaire : traitement des demandes du locataire, qualification de l&apos;urgence, sélection et supervision des artisans (devis comparatifs, vérification des assurances), réfacturation des réparations locatives, planification des travaux d&apos;amélioration. Il doit obtenir votre accord pour tout devis dépassant le seuil défini dans le mandat.</p>
            <p><strong>5. Gestion des contentieux : impayés, dégradations, expulsion</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Situation</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">Loyer impayé (1 mois)</td><td className="py-1.5">Rappel, mise en demeure LRAR, proposition d&apos;échéancier, activation GLI/Visale.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Impayé persistant (2 mois)</td><td className="py-1.5">Saisine CCAPEX, commandement de payer par huissier.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Impasse totale</td><td className="py-1.5">Assignation devant le juge, jugement constatant la résiliation du bail et ordonnant l&apos;expulsion.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Expulsion</td><td className="py-1.5">Coordination avec huissier et force publique, récupération du bien et remise en état.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Dégradations locatives</td><td className="py-1.5">État des lieux de sortie contradictoire, retenue sur dépôt de garantie, poursuite pour le surplus.</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Troubles de voisinage</td><td className="py-1.5">Mise en demeure du locataire, information du syndic, résiliation du bail si faits graves et répétés.</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>6. Garantie financière et assurance : obligations légales</strong><br />Tout administrateur de biens (carte professionnelle Gestion immobilière) est soumis à deux obligations :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Garantie financière</strong> (minimum 400 000 CD) : protège les fonds des propriétaires et locataires en cas de défaillance de l&apos;administrateur.</li>
              <li><strong>Assurance</strong> : couvre les dommages causés au propriétaire ou locataire (erreur de calcul, omission, conseil erroné, non-respect d&apos;un préavis).</li>
            </ul>
            <p>Avant de confier vos biens, exigez une copie de l&apos;attestation de garantie financière et du certificat.</p>
            <p><strong>7. Valeur ajoutée pour le propriétaire</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Contrainte du propriétaire seul</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Solution apportée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3">Urgences en soirée/weekend</td><td className="py-1.5">Astreinte dédiée 24/7</td></tr>
                  <tr><td className="py-1.5 pr-3">Publication d&apos;annonces et visites</td><td className="py-1.5">Équipe dédiée, publication multi-supports</td></tr>
                  <tr><td className="py-1.5 pr-3">Rédaction du bail conforme aux lois</td><td className="py-1.5">Modèles juridiques à jour certifiés</td></tr>
                  <tr><td className="py-1.5 pr-3">Démarches au tribunal pour impayés</td><td className="py-1.5">Représentation en votre nom (mandat de gestion)</td></tr>
                  <tr><td className="py-1.5 pr-3">Comptabilité, quittances, déclarations</td><td className="py-1.5">Documents générés automatiquement</td></tr>
                  <tr><td className="py-1.5 pr-3">Déménagement ou absence prolongée</td><td className="py-1.5">Gestion à distance totale avec rapports en ligne</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>8. Coût de la prestation</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Type de prestation</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Fourchette typique (HT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3">Gestion locative complète</td><td className="py-1.5">5 % à 12 % du loyer annuel (moyenne 6–8 %)</td></tr>
                  <tr><td className="py-1.5 pr-3">Honoraires de location + bail</td><td className="py-1.5">50 % à 100 % d&apos;un mois de loyer</td></tr>
                  <tr><td className="py-1.5 pr-3">État des lieux (entrée et sortie)</td><td className="py-1.5">50 à 150 €</td></tr>
                  <tr><td className="py-1.5 pr-3">Gestion de contentieux (impayés)</td><td className="py-1.5">Forfait ou 10–15 % des sommes recouvrées</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Conclusion</strong><br />L&apos;administrateur de biens est un partenaire stratégique pour tout propriétaire bailleur. Grâce à ses compétences juridiques, comptables, techniques et relationnelles, il maximise la rentabilité locative tout en sécurisant la gestion face aux risques d&apos;impayés, de dégradations ou de litiges. La garantie financière et l&apos;assurance RC Pro protègent contre les défaillances de l&apos;administrateur lui-même. En déléguant à un professionnel qualifié, vous transformez votre bien locatif en un investissement serein, sans mobilisation de votre temps.</p>
          </div>
        ),
      },
      {
        label: "Syndic de copropriété",
        icon: BuildingOffice2Icon,
        description: (
          <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-7">
            <p className="font-semibold text-[var(--text-primary)]">Le syndic de copropriété : administrateur incontournable des parties communes et garant de la pérennité de l&apos;immeuble.</p>
            <p>Le syndic de copropriété est le mandataire désigné par l&apos;assemblée générale des copropriétaires pour assurer l&apos;administration, la conservation et la gestion courante de l&apos;immeuble. Qu&apos;il soit professionnel (agent immobilier titulaire d&apos;une carte professionnelle) ou bénévole (copropriétaire élu), son rôle est à la fois technique, financier, juridique et relationnel. Il constitue le pilier exécutif de la copropriété, tandis que l&apos;assemblée générale en est l&apos;organe délibérant.</p>
            <p><strong>1. Mandat et désignation : une mission confiée par l&apos;assemblée générale</strong><br />Le syndic est élu par l&apos;assemblée générale des copropriétaires, à la majorité (voix de tous les copropriétaires, sans condition de présence minimale – mais avec quorum). Le mandat est généralement d&apos;une durée de trois ans, renouvelable. Ses principales caractéristiques :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Mandataire de la copropriété</strong> : il agit au nom et pour le compte du syndicat des copropriétaires (personne morale distincte des copropriétaires individuels).</li>
              <li><strong>Contrat de syndic</strong> : document qui fixe les missions, la durée, la rémunération, les conditions de résiliation – approuvé par décret.</li>
              <li><strong>Séparation des fonctions</strong> : le syndic ne peut être à la fois gestionnaire et entrepreneur réalisant des travaux dans la copropriété (conflit d&apos;intérêts interdit).</li>
              <li><strong>Contrôles possibles</strong> : le conseil syndical (élu par l&apos;assemblée) contrôle l&apos;action du syndic, examine les comptes, prépare les assemblées.</li>
              <li><strong>Cas particulier</strong> : le syndic bénévole (souvent un copropriétaire non professionnel) est dispensé de garantie financière et d&apos;assurance spécifique, mais sa responsabilité civile personnelle peut être engagée en cas de faute lourde ou de négligence grave. Il est recommandé d&apos;avoir une assurance responsabilité civile adaptée.</li>
            </ul>
            <p><strong>2. Gestion budgétaire : prévoir, exécuter et contrôler les comptes</strong><br />Le syndic est le gestionnaire financier de la copropriété.</p>
            <p><em>a) Établir et proposer le budget prévisionnel</em><br />Avant le 30 novembre de chaque année, il prépare un budget prévisionnel des dépenses pour l&apos;exercice à venir (charges courantes : eau, électricité des parties communes, ascenseur, nettoyage, entretien, petits travaux, assurance, honoraires du syndic). Il doit distinguer les charges générales et les charges spéciales (ascenseur uniquement pour les étages desservis, chauffage collectif, etc.). Il inclut une provision pour travaux (fonds de travaux obligatoire).</p>
            <p><em>b) Recouvrer les charges auprès des copropriétaires</em></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Il notifie les appels de fonds trimestriels ou mensuels.</li>
              <li>Il tient un compte séparé (au nom du syndicat des copropriétaires) pour les fonds collectés.</li>
              <li>Il dispose d&apos;actions en recouvrement : relances amicales, mise en demeure, commandement de payer, saisie-attribution, voire procédure d&apos;injonction de payer.</li>
            </ul>
            <p><em>c) Établir les comptes annuels et préparer l&apos;assemblée</em><br />À la clôture de l&apos;exercice, il dresse un compte de gestion, un compte de répartition, et un état des créances. Il convoque l&apos;assemblée générale annuelle dans les 6 mois suivant la clôture, avec l&apos;ordre du jour incluant l&apos;approbation des comptes, le quitus au syndic, le vote du budget.</p>
            <p><strong>3. Conservation et entretien de l&apos;immeuble : travaux votés et non votés</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><em>Entretien courant et petites réparations (sans vote)</em> : remplacement d&apos;ampoules, réparation de serrures, entretien des espaces verts, déneigement, etc. Ces dépenses sont prévues au budget.</li>
              <li><em>Travaux d&apos;entretien et de conservation (vote en AG)</em> : tous travaux supérieurs au seuil fixé par le règlement de copropriété (souvent 50 000 CD) doivent être autorisés par l&apos;assemblée générale (ravalement, réfection de toiture, remplacement d&apos;ascenseur, mise en conformité électrique, etc.).</li>
              <li><em>Fonds de travaux obligatoire</em> : toute copropriété de plus de 10 lots doit constituer un fonds de travaux (minimum 5 % du budget prévisionnel annuel). Le syndic gère ce fonds sur un compte distinct.</li>
            </ul>
            <p><strong>4. Assurances obligatoires : protéger la copropriété et ses occupants</strong><br />Le syndic est tenu de souscrire plusieurs types d&apos;assurances :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Assurance de l&apos;immeuble (responsabilité civile du syndicat)</strong> : couvre les dommages causés par les parties communes et la responsabilité civile de la copropriété.</li>
              <li><strong>Assurance dommages-ouvrage</strong> : obligatoire pour les constructions neuves ou travaux lourds.</li>
              <li><strong>Assurance des biens communs</strong> (incendie, dégât des eaux, tempête, etc.) – fortement conseillée.</li>
            </ul>
            <p>Chaque copropriétaire reste libre d&apos;assurer ses parties privatives. Le syndic doit informer les copropriétaires des conditions d&apos;assurance et les aider à déclarer un sinistre affectant les parties communes.</p>
            <p><strong>5. Recouvrement des charges : un impératif de trésorerie</strong><br />Le syndic doit appeler les provisions trimestrielles, relancer les copropriétaires défaillants, puis en cas d&apos;impayé persistant : mise en demeure formelle, commandement de payer par huissier, assignation devant le tribunal judiciaire, obtention d&apos;un jugement puis éventuelle saisie immobilière (cas extrême). Il peut proposer des plans d&apos;apurement pour éviter les procédures. Il doit informer l&apos;assemblée du montant total des impayés et des mesures prises. Le syndic professionnel doit disposer d&apos;une garantie financière pour les fonds perçus ; en cas de défaillance, le garant indemnise la copropriété.</p>
            <p><strong>6. Administration juridique et exécution des décisions d&apos;AG</strong><br />Le syndic doit : convoquer l&apos;assemblée (ordre du jour, convocation avec projet de résolutions, documents financiers et techniques, au moins 21 jours avant la date) ; tenir le registre de copropriété ; exécuter les décisions votées dans les délais ; appliquer le règlement de copropriété ; signer les contrats de fourniture et de maintenance. Il ne peut pas décider seul de travaux exceptionnels, d&apos;une augmentation exceptionnelle des charges, ou d&apos;aliéner une partie commune.</p>
            <p><strong>7. Différence entre syndic professionnel et syndic bénévole</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Critère</th>
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Syndic professionnel</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Syndic bénévole</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">Statut</td><td className="py-1.5 pr-3">Agent immobilier ou société de gestion agréée (carte professionnelle G)</td><td className="py-1.5">Copropriétaire élu, généralement non professionnel</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Garantie financière</td><td className="py-1.5 pr-3">Obligatoire (500 000 CD minimum)</td><td className="py-1.5">Non obligatoire</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Assurance responsabilité</td><td className="py-1.5 pr-3">Obligatoire</td><td className="py-1.5">Non obligatoire, mais vivement recommandée</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Rémunération</td><td className="py-1.5 pr-3">Honoraires (forfait annuel, ou % de charges)</td><td className="py-1.5">Gratuit (sauf défraiement possible voté en AG)</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Compétence</td><td className="py-1.5 pr-3">Juridique, comptable, technique, expérimentée</td><td className="py-1.5">Variable selon les compétences du copropriétaire</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Contrôle</td><td className="py-1.5 pr-3">Par le conseil syndical et l&apos;AG</td><td className="py-1.5">Idem, mais souvent plus laxiste</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Idéal pour</td><td className="py-1.5 pr-3">Copropriétés de plus de 10 lots, avec travaux complexes ou impayés importants</td><td className="py-1.5">Petites copropriétés (moins de 5 lots), sans difficultés majeures</td></tr>
                </tbody>
              </table>
            </div>
            <p>Le syndic bénévole peut être exposé à des responsabilités civiles (erreur de calcul, omission de souscrire une assurance, absence de convocation d&apos;AG). La plupart des conseils juridiques recommandent de faire assurer sa responsabilité par une assurance personnelle.</p>
            <p><strong>8. Garanties professionnelles du syndic (cas professionnel)</strong><br />Tout syndic professionnel doit justifier de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carte professionnelle mention &quot;Gestion immobilière&quot;.</li>
              <li>Garantie financière accordée par une banque ou un assureur (montant minimum 120 000 CD).</li>
              <li>Assurance de responsabilité civile professionnelle couvrant les erreurs, omissions, conseils fautifs, mauvais recouvrement, etc.</li>
              <li>Comptes bancaires séparés : un compte de &quot;séquestre&quot; pour les fonds de la copropriété, un compte de fonctionnement pour son propre compte.</li>
            </ul>
            <p><strong>9. Rôle du conseil syndical : contrôle et contre-pouvoir</strong><br />Le conseil syndical (facultatif mais recommandé) est élu par l&apos;assemblée générale pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Contrôler l&apos;action du syndic (respect des contrats, qualité de l&apos;entretien, prix des prestations).</li>
              <li>Examiner les comptes avant présentation en AG.</li>
              <li>Assister aux opérations de recouvrement (impayés).</li>
              <li>Donner un avis sur les contrats importants.</li>
              <li>Préparer l&apos;ordre du jour de l&apos;assemblée générale et proposer des résolutions améliorant la gestion.</li>
            </ul>
            <p>Le conseil syndical n&apos;a pas de pouvoir exécutif, mais il peut recommander la révocation du syndic en cas de manquement grave.</p>
            <p><strong>10. Valeur ajoutée et limites</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Aspect</th>
                    <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Le syndic apporte…</th>
                    <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Les limites…</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr><td className="py-1.5 pr-3 font-medium">Gain de temps</td><td className="py-1.5 pr-3">Délégation des tâches lourdes (comptabilité, convocations, suivi des fournisseurs)</td><td className="py-1.5">N&apos;évite pas que les copropriétaires s&apos;impliquent dans les décisions importantes</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Sécurité juridique</td><td className="py-1.5 pr-3">Connaissance des textes, contrats sécurisés, procédures de recouvrement maîtrisées</td><td className="py-1.5">Peut commettre des erreurs (responsabilité engagée)</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Conservation</td><td className="py-1.5 pr-3">Planification des travaux, suivi technique, entretien régulier</td><td className="py-1.5">Les gros travaux peuvent être bloqués si majorité absente</td></tr>
                  <tr><td className="py-1.5 pr-3 font-medium">Transparence</td><td className="py-1.5 pr-3">Comptes clairs, convocations régulières, accès aux documents</td><td className="py-1.5">Certains syndics professionnels facturent des honoraires élevés sans qualité de service</td></tr>
                </tbody>
              </table>
            </div>
            <p><strong>Conclusion</strong><br />Le syndic de copropriété est le nerf de la guerre pour tout immeuble partagé. Son rôle, qu&apos;il soit professionnel ou bénévole, est d&apos;administrer avec rigueur les parties communes, de préserver la valeur patrimoniale de l&apos;immeuble et d&apos;assurer la paix sociale entre copropriétaires. Son action est strictement encadrée pour éviter dérives et impayés. Mais le syndic n&apos;est pas un dictateur : il est responsable devant l&apos;assemblée générale, qui peut le révoquer à tout moment pour manquement grave. Pour une copropriété sereine, il faut un syndic compétent, transparent, réactif – et des copropriétaires impliqués. Le choix du syndic doit être mûrement réfléchi en fonction de la taille de la copropriété, de sa complexité technique et du niveau d&apos;exigence des résidents.</p>
          </div>
        ),
      },
      {
        label: "Gestionnaire de locaux commerciaux",
        icon: BuildingStorefrontIcon,
        description:
          "Spécialisé dans les baux commerciaux et professionnels, ce gestionnaire accompagne propriétaires et locataires de bureaux, commerces, entrepôts et locaux d'activité. Il maîtrise les spécificités du bail 3-6-9, les conditions de renouvellement, les révisions de loyer basées sur l'indice des loyers commerciaux (ILC), et les démarches liées aux cessions de droit au bail. Son expertise protège les intérêts des investisseurs en immobilier d'entreprise.",
      },
    ],
  },
  {
    id: 5,
    title: "Évaluation et expertise",
    color: "amber",
    icon: StarIcon,
    description: "Connaître la valeur exacte d'un bien est essentiel pour vendre au juste prix, obtenir un financement ou résoudre un litige. Ces experts vous apportent une estimation objective et certifiée.",
    items: [
      {
        label: "Expert immobilier (évaluation, dommages)",
        icon: MagnifyingGlassIcon,
        description:
          "L'expert immobilier certifié détermine la valeur vénale ou locative d'un bien sur la base d'une analyse approfondie : situation géographique, état général, comparaison avec des transactions récentes similaires, et calcul de rendement locatif. Son rapport d'expertise est reconnu par les banques, les tribunaux et les administrations fiscales. Il intervient également lors de sinistres (dégât des eaux, incendie) pour évaluer les préjudices à l'attention des assureurs.",
      },
      {
        label: "Commissaire-priseur (ventes aux enchères)",
        icon: StarIcon,
        description:
          "Le commissaire-priseur judiciaire organise les ventes aux enchères de biens immobiliers saisies ou en successions complexes, sur décision de justice. Il estime les biens mis en vente, publie les annonces légales, organise les visites et conduit la vente publique. L'enchérisseur le plus offrant devient acquéreur sous réserve du prix de réserve fixé. Ce mode de vente peut permettre d'acquérir un bien sous sa valeur de marché.",
      },
      {
        label: "Géomètre-expert (bornage, division parcellaire)",
        icon: GlobeAltIcon,
        description:
          "Le géomètre-expert est le seul professionnel habilité à fixer les limites des propriétés foncières de façon légalement opposable aux tiers. Il réalise le bornage contradictoire entre voisins, découpe une parcelle en plusieurs lots (division parcellaire), établit les documents d'arpentage nécessaires aux permis de construire, et intervient en cas de conflits de limites. Son acte de bornage est déposé au cadastre et a valeur définitive.",
      },
    ],
  },
  {
    id: 6,
    title: "Transaction et conseil",
    color: "emerald",
    icon: BriefcaseIcon,
    description: "Ces professionnels vous guident dans l'achat, la vente ou l'investissement immobilier, en mettant leur réseau et leur expertise au service de votre projet.",
    items: [
      {
        label: "Agent immobilier (vente, location)",
        icon: BriefcaseIcon,
        description:
          "Titulaire de la carte professionnelle T (transaction) et/ou G (gestion), l'agent immobilier est un intermédiaire agréé qui met en relation vendeurs et acheteurs, ou bailleurs et locataires. Il réalise l'estimation du bien, constitue le dossier de vente, organise les visites, négocie les offres et accompagne jusqu'à la signature chez le notaire. Sa rémunération, sous forme d'honoraires, n'est due qu'en cas de succès de la transaction.",
      },
      {
        label: "Mandataire immobilier (sans agence physique)",
        icon: UserGroupIcon,
        description:
          "Le mandataire immobilier est un agent commercial indépendant qui exerce sous le couvert de la carte professionnelle d'un réseau de mandataires (IAD, Capifrance, OptimHome…). Sans agence physique, il opère principalement en ligne et sur le terrain. Ses honoraires sont souvent inférieurs à ceux des agences traditionnelles. Il offre flexibilité et disponibilité, avec un suivi personnalisé de chaque dossier.",
      },
      {
        label: "Conseiller en gestion de patrimoine",
        icon: CalculatorIcon,
        description:
          "Le conseiller en gestion de patrimoine (CGP) analyse votre situation financière globale pour vous orienter vers les investissements immobiliers les plus adaptés à vos objectifs : Pinel, LMNP, SCI, SCPI, démembrement de propriété… Il intègre les dimensions fiscale, successorale et financière pour construire une stratégie patrimoniale cohérente sur le long terme. Son conseil est indépendant ou lié à un établissement financier.",
      },
      {
        label: "Marchand de biens (achat-revente après travaux)",
        icon: TagIcon,
        description:
          "Le marchand de biens achète des biens immobiliers dans le but de les revendre rapidement après valorisation (rénovation, division en lots, changement d'usage). Son activité est considérée comme commerciale et bénéficie d'une fiscalité spécifique (TVA sur marge, exonération des droits de mutation sous conditions). Il est un acteur clé de la transformation du parc immobilier ancien en logements rénovés et conformes aux normes actuelles.",
      },
      {
        label: "Promoteur immobilier",
        icon: BuildingOffice2Icon,
        description:
          "Le promoteur immobilier conçoit, finance, construit et commercialise des programmes de logements neufs ou de bureaux. Il acquiert du foncier, obtient les permis de construire, choisit les entreprises de BTP et vend les biens en état futur d'achèvement (VEFA). L'acheteur sur plan bénéficie de garanties légales solides : garantie de parfait achèvement, garantie biennale et garantie décennale. Le promoteur est soumis à une garantie financière d'achèvement (GFA) protégeant les acquéreurs.",
      },
    ],
  },
  {
    id: 7,
    title: "Services numériques et accompagnement",
    color: "cyan",
    icon: ComputerDesktopIcon,
    description: "Le digital transforme l'immobilier. Ces outils et prestataires vous permettent de valoriser, diffuser et gérer votre bien plus efficacement dans un marché de plus en plus connecté.",
    items: [
      {
        label: "Plateformes d'annonces (SeLoger, Leboncoin…)",
        icon: GlobeAltIcon,
        description:
          "Les portails immobiliers en ligne (SeLoger, Leboncoin, PAP, Logic-immo, Bien'ici…) sont les vitrines incontournables pour diffuser vos annonces auprès de millions d'acheteurs ou locataires potentiels. Chaque plateforme dispose de son audience spécifique : SeLoger est prisé par les professionnels, Leboncoin touche les particuliers, PAP s'adresse aux vendeurs directs. Une bonne présence multi-portails maximise la visibilité et réduit les délais de transaction.",
      },
      {
        label: "Logiciels de gestion locative / syndic",
        icon: ComputerDesktopIcon,
        description:
          "Ces solutions SaaS permettent aux propriétaires bailleurs et aux syndics de gérer leur parc immobilier de façon automatisée : génération des quittances, suivi des paiements, gestion des travaux, convocation des assemblées générales, archivage des documents légaux, et communication avec les locataires ou copropriétaires. Parmi les leaders : Rentila, Bellman, Syndic One, Matera. Ils réduisent considérablement la charge administrative.",
      },
      {
        label: "Home-stager (préparation du bien à la vente)",
        icon: SparklesIcon,
        description:
          "Le home-staging est une technique de valorisation immobilière qui consiste à dépersonnaliser, désencombrer, réparer les petits défauts et optimiser la mise en scène d'un logement pour le rendre plus attractif lors des visites. Sans grand investissement, le home-stager peut augmenter significativement le prix de vente et réduire le délai de commercialisation. Il peut intervenir physiquement ou proposer une simulation 3D pour les biens vides.",
      },
      {
        label: "Photographe / vidéaste immobilier (visites virtuelles, drone)",
        icon: CameraIcon,
        description:
          "La qualité visuelle d'une annonce est déterminante pour attirer les acheteurs. Le photographe immobilier professionnel utilise des objectifs grand-angle, un éclairage adapté et des logiciels de retouche pour valoriser chaque pièce. Le vidéaste réalise des visites virtuelles immersives à 360°, des vidéos de présentation et des prises de vue drone pour les biens avec extérieurs ou pour les programmes neufs. Ces contenus premium augmentent le nombre de contacts qualifiés.",
      },
      {
        label: "Rédacteur SEO / copywriter immobilier",
        icon: PencilSquareIcon,
        description:
          "Le copywriter spécialisé en immobilier rédige des annonces percutantes qui mettent en valeur les atouts du bien, suscitent l'émotion et incitent à prendre rendez-vous. Pour les agences et promoteurs qui ont un site web, le rédacteur SEO optimise les contenus pour le référencement naturel (Google) : fiches de quartiers, guides d'achat, articles de blog. Un bon texte d'annonce peut doubler le nombre de vues et réduire de moitié le délai de vente.",
      },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; tag: string; light: string; badge: string }> = {
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/40", icon: "from-violet-500 to-violet-700", tag: "text-violet-400", light: "bg-violet-500/5", badge: "bg-violet-500/20 text-violet-300" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/40", icon: "from-orange-500 to-orange-700", tag: "text-orange-400", light: "bg-orange-500/5", badge: "bg-orange-500/20 text-orange-300" },
  red:    { bg: "bg-red-500/10",    border: "border-red-500/40",    icon: "from-red-500 to-red-700",    tag: "text-red-400",    light: "bg-red-500/5",    badge: "bg-red-500/20 text-red-300" },
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/40",   icon: "from-blue-500 to-blue-700",   tag: "text-blue-400",   light: "bg-blue-500/5",   badge: "bg-blue-500/20 text-blue-300" },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/40",  icon: "from-amber-500 to-amber-700",  tag: "text-amber-400",  light: "bg-amber-500/5",  badge: "bg-amber-500/20 text-amber-300" },
  emerald:{ bg: "bg-emerald-500/10",border: "border-emerald-500/40",icon: "from-emerald-500 to-emerald-700",tag: "text-emerald-400",light: "bg-emerald-500/5",badge: "bg-emerald-500/20 text-emerald-300" },
  cyan:   { bg: "bg-cyan-500/10",   border: "border-cyan-500/40",   icon: "from-cyan-500 to-cyan-700",   tag: "text-cyan-400",   light: "bg-cyan-500/5",   badge: "bg-cyan-500/20 text-cyan-300" },
};

export default function NosServicesImmobilierPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  function toggleItem(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <span>/</span>
            <Link href="/immobilier" className="hover:text-primary">Immobilier</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">Nos Services</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-white" />
                </div>
                Nos Services liés à l&apos;immobilier
              </h1>
              <p className="mt-2 text-[var(--text-secondary)] text-lg max-w-2xl">
                Tous les professionnels et outils dont vous avez besoin autour de votre projet immobilier — de l&apos;achat à la gestion, du diagnostic à la valorisation.
              </p>
            </div>
            <Link
              href="/immobilier"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-color)]
                bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all whitespace-nowrap"
            >
              ← Retour Immobilier
            </Link>
          </div>

          {/* Category anchors */}
          <div className="mt-8 flex flex-wrap gap-2">
            {services.map((cat) => {
              const c = colorMap[cat.color];
              const CatIcon = cat.icon;
              return (
                <a
                  key={cat.id}
                  href={`#cat-${cat.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${c.border} ${c.bg} ${c.tag} hover:opacity-80 transition-all`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  {cat.title}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {services.map((cat, catIdx) => {
          const c = colorMap[cat.color];
          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24">
              {/* Category header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-semibold ${c.tag} opacity-60`}>{catIdx + 1} / {services.length}</span>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{cat.title}</h2>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{cat.description}</p>
                </div>
              </div>

              {/* Sub-items */}
              <div className="space-y-0 pl-0 sm:pl-4 divide-y divide-[var(--border-color)]">
                {cat.items.map((item, itemIdx) => {
                  const key = `${cat.id}-${itemIdx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div key={key}>
                      {/* Item header — clickable */}
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center gap-4 py-4 text-left hover:opacity-80 transition-all"
                      >
                        <span className="flex-1 font-semibold text-[var(--text-primary)] text-sm sm:text-base">
                          {item.label}
                        </span>
                        {isOpen
                          ? <ChevronUpIcon className={`w-4 h-4 shrink-0 ${c.tag}`} />
                          : <ChevronDownIcon className={`w-4 h-4 shrink-0 ${c.tag}`} />
                        }
                      </button>

                      {/* Description — expandable */}
                      {isOpen && (
                        <div className="text-[var(--text-secondary)] text-sm leading-7 pb-4 pl-12">
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* CTA bottom */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Vous avez un bien à vendre ou à louer ?</h3>
            <p className="text-[var(--text-secondary)] text-sm">Publiez votre annonce et touchez des milliers d&apos;acheteurs et locataires.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/immobilier/vente" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 font-medium hover:bg-blue-500/20 transition-all text-sm">
              Voir les ventes <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link href="/immobilier/location" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all text-sm">
              Voir les locations <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
