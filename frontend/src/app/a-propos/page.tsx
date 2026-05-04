export default function AProposPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
        À propos d&apos;Impala-Agence
      </h1>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-10">
        Impala-Agence est une plateforme centralisée proposant une gamme complète de services destinés aussi bien aux
        particuliers qu&apos;aux professionnels. Notre mission est de simplifier le quotidien de nos clients en réunissant
        sous un même toit des prestations de qualité dans les domaines de l&apos;immobilier, de l&apos;automobile et des
        services aux entreprises et aux ménages.
      </p>

      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Nos services principaux</h2>
      <ul className="space-y-3 text-[var(--text-secondary)] mb-10">
        <li>
          <span className="font-medium text-[var(--text-primary)]">Immobilier :</span> Accompagnement sur mesure pour
          tous les aspects liés à l&apos;immobilier (recherche, location, vente, gestion, etc.).
        </li>
        <li>
          <span className="font-medium text-[var(--text-primary)]">Automobile :</span> Mise en relation et services
          autour de l&apos;achat, la vente et la gestion automobile.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Nos services complémentaires</h2>
      <p className="text-[var(--text-secondary)] mb-3">
        Afin de répondre à l&apos;ensemble des besoins du quotidien et professionnels, Impala-Agence propose également :
      </p>
      <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] mb-10">
        <li>Service d&apos;après-déménagement</li>
        <li>Ramassage des poubelles / encombrants</li>
        <li>Repassage à domicile</li>
        <li>Nettoyage de bureaux</li>
      </ul>

      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        Une plateforme de vente en ligne dédiée
      </h2>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-10">
        Impala-Agence met à disposition de ses clients une plateforme de vente en ligne spécialisée dans les biens
        immobiliers et les véhicules automobiles. Cet outil permet une mise en relation directe, rapide et sécurisée
        entre acheteurs et vendeurs.
      </p>

      <p className="text-[var(--text-secondary)] leading-relaxed italic border-l-4 border-[var(--border-color)] pl-4">
        Chez Impala-Agence, nous faisons le lien entre vos projets et les solutions adaptées, tout en vous offrant un
        accompagnement professionnel et humain.
      </p>
    </main>
  );
}
