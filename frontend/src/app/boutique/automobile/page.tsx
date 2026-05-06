import { Suspense } from "react";
import CataloguePage from "../components/CataloguePage";
import { CATEGORIES_AUTO } from "../data";

export default function AutomobilePage() {
  return (
    <Suspense>
      <CataloguePage
        categorie="automobile"
        titre="Auto & Pièces Détachées"
        emoji="🚗"
        sousCats={CATEGORIES_AUTO}
        accentColor="#0ea5e9"
        bgClass="bg-gradient-to-br from-slate-700 to-blue-900"
      />
    </Suspense>
  );
}
