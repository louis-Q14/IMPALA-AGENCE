"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const REDIRECT: Record<string, string> = {
  real_estate: "/immobilier/paiement",
  auto: "/automobile/paiement",
  trash: "/multi-impala/poubelles/paiement",
  poubelles: "/multi-impala/poubelles/paiement",
  nettoyage: "/multi-impala/nettoyage/paiement",
  repassage: "/multi-impala/repassage/paiement",
  demenagement: "/multi-impala/demenagement/paiement",
};

const PLAN_ALIAS: Record<string, string[]> = {
  real_estate: ["real_estate_pro", "immobilier", "complet"],
  auto: ["auto_pro", "automobile", "complet"],
};

export function useServiceGuard(service: string | string[]) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/connexion");
      return;
    }

    const services = Array.isArray(service) ? service : [service];
    const primaryService = services[0];

    Promise.all([
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API}/subscriptions/mine`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([me, subs]) => {
      // Si les deux appels ont echoue (réseau), on ne redirige pas
      if (me === null && subs === null) return;

      const userServices: { service: string; status: string }[] = Array.isArray(me?.services) ? me.services : [];
      const hasService = services.some((svc) =>
        userServices.some((us) => us.service === svc && us.status === "active")
      );
      if (hasService) return;

      const aliases = services.flatMap((svc) => PLAN_ALIAS[svc] ?? []);
      const hasSub = Array.isArray(subs) && subs.some((s: { plan_type: string }) =>
        aliases.includes(s.plan_type)
      );
      if (hasSub) return;

      // Rediriger seulement si on a une reponse confirmee sans abonnement
      if (me !== null || subs !== null) {
        router.push(REDIRECT[primaryService] ?? "/tarifs");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}