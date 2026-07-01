"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-xl flex items-center justify-center" aria-label="Toggle theme">
        <div className="w-5 h-5 rounded-full bg-[var(--text-muted)]" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center
        bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]
        border border-[var(--border-color)] hover:border-[var(--border-hover)]
        shadow-sm transition-all duration-300 group"
      aria-label={`Passer en mode ${theme === "dark" ? "clair" : "sombre"}`}
    >
      {theme === "dark" ? (
        <SunIcon className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <MoonIcon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
