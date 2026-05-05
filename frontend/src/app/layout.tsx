import type { Metadata } from "next";
import "./globals.css";
import { Cinzel, Josefin_Sans } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-josefin",
  display: "swap",
});
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "IMPALA",
  description: "Plateforme multiservices : annonces immobilières, vente et location automobiles, ramassage poubelles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`h-full antialiased ${cinzel.variable} ${josefinSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
