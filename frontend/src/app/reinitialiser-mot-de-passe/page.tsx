"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mot-de-passe-oublie");
  }, [router]);
  return null;
}
