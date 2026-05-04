export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 104 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} dark:invert`}
      aria-label="IMPALA-AGENCE"
    >
      {/* Left black square */}
      <rect x="0" y="0" width="64" height="64" fill="black" />
      {/* White "I" — thin vertical bar centered in left square */}
      <rect x="28" y="10" width="8" height="44" fill="white" />
      {/* Right white square with black border */}
      <rect x="40" y="0" width="64" height="64" fill="white" stroke="black" strokeWidth="2.5" />
      {/* Bold "A" centered in right square (center x=72) */}
      <path
        d="M72 12 L88 52 M72 12 L56 52 M60.5 40 H83.5"
        stroke="black"
        strokeWidth="7"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
  );
}

export function LogoFull({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <LogoMark className={className} />
  );
}