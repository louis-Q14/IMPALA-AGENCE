"use client";

import { BoutiqueCartProvider } from "@/context/BoutiqueCartContext";

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoutiqueCartProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </BoutiqueCartProvider>
  );
}
