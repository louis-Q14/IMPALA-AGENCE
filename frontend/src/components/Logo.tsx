import Image from "next/image";

export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/IMPALA_logo.png"
      alt="IMPALA"
      width={200}
      height={50}
      className={`${className} dark:invert object-contain`}
      priority
    />
  );
}

export function LogoFull({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/IMPALA_logo.png"
      alt="IMPALA"
      width={400}
      height={83}
      className={`${className} dark:invert object-contain`}
      priority
    />
  );
}