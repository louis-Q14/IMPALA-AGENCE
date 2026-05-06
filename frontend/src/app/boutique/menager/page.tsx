import { Suspense } from "react";
import CataloguePage from "../components/CataloguePage";
import { CATEGORIES_MENAGER } from "../data";

export default function MenagerPage() {
  return (
    <Suspense>
      <CataloguePage
        categorie="menager"
        titre="Électroménager & Cuisine"
        emoji="🏠"
        sousCats={CATEGORIES_MENAGER}
        accentColor="#e63900"
        bgClass="bg-gradient-to-br from-orange-500 to-red-700"
      />
    </Suspense>
  );
}
