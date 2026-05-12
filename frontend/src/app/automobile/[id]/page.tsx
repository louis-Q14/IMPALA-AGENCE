"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  HeartIcon,
  ShareIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  StarIcon,
  CalendarIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  VideoCameraIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, PlayIcon as PlaySolidIcon } from "@heroicons/react/24/solid";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const allCars: Record<string, {
  id: string; brand: string; model: string; year: number; mileage: number; fuel: string;
  transmission: string; price: number | null; rentPriceDay: number | null; type: "sale" | "rent";
  status: string; location: string; rating: number; reviews: number; description: string;
  features: string[]; power: string; doors: number; seats: number; color: string;
  co2: string; firstReg: string; warranty: string; seller: { name: string; phone: string; email: string; avatar: string; type: string };
  images: string[]; video: string;
}> = {
  "1": {
    id: "1", brand: "Tesla", model: "Model 3", year: 2023, mileage: 15000, fuel: "Électrique",
    transmission: "Automatique", price: 35900, rentPriceDay: null, type: "sale", status: "available",
    location: "Paris, 75", rating: 4.8, reviews: 24,
    description: "Tesla Model 3 Long Range en excellent état. Autopilot de série, intérieur cuir vegan noir. Batterie 75 kWh offrant une autonomie de 580 km WLTP. Supercharge gratuit à vie. Toit panoramique en verre, sono premium 15 HP, écran tactile 15 pouces. Jantes Aero 18 pouces avec pneus neufs. Entretien à jour chez Tesla. Premier propriétaire, jamais accidenté.",
    features: ["Autopilot", "Toit panoramique", "Sono premium", "Supercharge gratuit", "Caméra 360°", "Sièges chauffants", "Jantes Aero 18\"", "Pneus neufs"],
    power: "351 ch", doors: 4, seats: 5, color: "Blanc nacré", co2: "0 g/km", firstReg: "03/2023", warranty: "Garantie constructeur 2027",
    seller: { name: "Auto Premium Paris", phone: "+33 1 42 68 90 12", email: "contact@autopremium.fr", avatar: "AP", type: "pro" },
    images: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&h=800&fit=crop",
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  "2": {
    id: "2", brand: "BMW", model: "Série 3 320d", year: 2022, mileage: 32000, fuel: "Diesel",
    transmission: "Automatique", price: null, rentPriceDay: 65, type: "rent", status: "available",
    location: "Lyon, 69", rating: 4.6, reviews: 18,
    description: "BMW Série 3 320d disponible en location courte et longue durée. Finition Sport Line avec pack M intérieur. Moteur 190 ch couplé à la boîte automatique ZF 8 rapports. Équipée navigation professionnelle, affichage tête haute, sellerie cuir Dakota. Idéale pour déplacements professionnels ou week-ends premium.",
    features: ["Pack M Sport", "Navigation pro", "Affichage tête haute", "Cuir Dakota", "LED Matrix", "Régulateur adaptatif", "Aide au stationnement", "Apple CarPlay"],
    power: "190 ch", doors: 4, seats: 5, color: "Noir saphir métallisé", co2: "120 g/km", firstReg: "06/2022", warranty: "Assurance tous risques incluse",
    seller: { name: "Lyon Auto Location", phone: "+33 4 72 56 78 90", email: "contact@lyonautoloc.fr", avatar: "LA", type: "pro" },
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1520050206-6543c42ab340?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=800&fit=crop",
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  "3": {
    id: "3", brand: "Mercedes", model: "Classe A 200", year: 2024, mileage: 5000, fuel: "Essence",
    transmission: "Automatique", price: 38500, rentPriceDay: null, type: "sale", status: "available",
    location: "Marseille, 13", rating: 4.9, reviews: 12,
    description: "Mercedes Classe A 200 quasi neuve, finition AMG Line. Intérieur MBUX avec double écran 10,25 pouces, éclairage d'ambiance 64 couleurs. Moteur 1.3L turbo 163 ch, boîte DCT 7 rapports. Pack Premium avec Burmester, toit ouvrant panoramique, caméra de recul. État irréprochable, toujours entretenue en concession Mercedes.",
    features: ["AMG Line", "MBUX", "Burmester", "Toit ouvrant", "Caméra recul", "Éclairage 64 couleurs", "Keyless Go", "Sièges sport"],
    power: "163 ch", doors: 5, seats: 5, color: "Gris montagne", co2: "135 g/km", firstReg: "01/2024", warranty: "Garantie Mercedes 2026",
    seller: { name: "Jean-Pierre Rossi", phone: "+33 6 45 67 89 01", email: "jp.rossi@email.com", avatar: "JR", type: "particulier" },
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1525609004556-c46c6c5104b8?w=1200&h=800&fit=crop",
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  "4": {
    id: "4", brand: "Renault", model: "Clio V", year: 2023, mileage: 18000, fuel: "Essence",
    transmission: "Manuelle", price: null, rentPriceDay: 35, type: "rent", status: "available",
    location: "Toulouse, 31", rating: 4.3, reviews: 45,
    description: "Renault Clio V en location, idéale pour la ville et les petits trajets. Finition Intens avec écran tactile 9,3 pouces, climatisation automatique, radar de recul. Consommation maîtrisée (5,5L/100km). Kilométrage illimité. Assurance et assistance 24/7 incluses.",
    features: ["Écran 9,3\"", "Clim auto", "Radar de recul", "Bluetooth", "Android Auto", "Régulateur", "Feux LED", "Km illimité"],
    power: "100 ch", doors: 5, seats: 5, color: "Rouge flamme", co2: "128 g/km", firstReg: "05/2023", warranty: "Assurance tous risques incluse",
    seller: { name: "Toulouse City Cars", phone: "+33 5 61 23 45 67", email: "reservation@tlscitycars.fr", avatar: "TC", type: "pro" },
    images: [
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1469285994282-454ceb49dc23?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1580274455191-1c62238ce53c?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&h=800&fit=crop",
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  "5": {
    id: "5", brand: "Audi", model: "A4 Avant", year: 2022, mileage: 42000, fuel: "Diesel",
    transmission: "Automatique", price: 29800, rentPriceDay: null, type: "sale", status: "available",
    location: "Bordeaux, 33", rating: 4.7, reviews: 31,
    description: "Audi A4 Avant 2.0 TDI 150 ch S-Tronic, finition S Line. Break familial spacieux avec coffre de 495L. Quattro pour une tenue de route exemplaire. Virtual Cockpit, MMI Navigation Plus, sièges sport en cuir/alcantara. Attelage amovible, barres de toit. Carnet d'entretien complet en concession Audi.",
    features: ["S Line", "Quattro", "Virtual Cockpit", "MMI Nav+", "Attelage", "Sièges sport", "Bang & Olufsen", "Matrix LED"],
    power: "150 ch", doors: 5, seats: 5, color: "Bleu Navarre", co2: "118 g/km", firstReg: "09/2022", warranty: "Garantie Audi Occasion Plus",
    seller: { name: "Audi Bordeaux", phone: "+33 5 56 89 01 23", email: "occasion@audibordeaux.fr", avatar: "AB", type: "pro" },
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=1200&h=800&fit=crop",
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  "6": {
    id: "6", brand: "Peugeot", model: "3008 GT", year: 2024, mileage: 8000, fuel: "Hybride",
    transmission: "Automatique", price: null, rentPriceDay: 55, type: "rent", status: "available",
    location: "Nantes, 44", rating: 4.5, reviews: 22,
    description: "Peugeot 3008 GT Hybrid 225 ch, le SUV familial par excellence. i-Cockpit avec écran 3D, Night Vision, grip control. Batterie permettant 60 km en tout électrique. Coffre de 395L, hayon motorisé. Intérieur cuir Nappa, sièges massants. Location avec kilométrage illimité, assurance et assistance incluses.",
    features: ["Hybrid 225", "i-Cockpit 3D", "Night Vision", "Grip Control", "Hayon motorisé", "Cuir Nappa", "Sièges massants", "Android Auto"],
    power: "225 ch", doors: 5, seats: 5, color: "Vert Olivine", co2: "29 g/km", firstReg: "02/2024", warranty: "Assurance tous risques incluse",
    seller: { name: "Nantes Mobility", phone: "+33 2 40 12 34 56", email: "loc@nantesmobility.fr", avatar: "NM", type: "pro" },
    images: [
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1570294646112-27ce4f174e08?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1504620776737-8965fde5c421?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&h=800&fit=crop",
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
};

function formatPrice(car: typeof allCars[string]) {
  return car.type === "sale"
    ? `${car.price?.toLocaleString("fr-FR")} FC`
    : `${car.rentPriceDay} FC/jour`;
}

export default function AutomobileDetailPage() {
  const params = useParams();
  const [apiCar, setApiCar] = useState<Record<string, unknown> | null | undefined>(undefined);
  const [carLoading, setCarLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setCarLoading(true);
    fetch(`${API}/auto/ads/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          // Check ownership
          try {
            const token = localStorage.getItem("token");
            if (token) {
              const payload = JSON.parse(atob(token.split(".")[1]));
              if (d.user_id === payload.userId || payload.role === "admin" || payload.role === "super_admin") {
                setIsOwner(true);
              }
            }
          } catch { /* ignore */ }
          setApiCar({
            ...d,
            type: d.ad_type,
            images: Array.isArray(d.photos) && d.photos.length > 0 ? d.photos : [],
            video: null,
            location: d.location_text ?? "",
            rentPriceDay: d.rent_price_day,
            co2: d.co2_emissions ?? "0",
            firstReg: d.circulation_date
              ? new Date(d.circulation_date).toLocaleDateString("fr-FR")
              : "—",
            warranty: "",
            features: [],
            rating: null,
            reviews: null,
            seats: 5,
            seller: {
              name: d.owner_name || d.author_name || "Vendeur",
              phone: d.owner_phone || d.author_phone || "",
              email: d.owner_email || d.author_email || "",
              adresse: d.author_adresse || "",
              avatar: (d.owner_name || d.author_name || "V").charAt(0).toUpperCase(),
              type: (d.owner_type || "particulier").toLowerCase(),
            },
          });
        } else {
          setApiCar(null);
        }
      })
      .catch(() => setApiCar(null))
      .finally(() => setCarLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const sendContactMessage = async () => {
    if (!car) return;
    if (!contactForm.message.trim()) {
      setContactFeedback({ type: "err", text: "Veuillez saisir un message." });
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setContactFeedback({ type: "err", text: "Connectez-vous pour envoyer un message." });
      return;
    }
    setContactSending(true);
    setContactFeedback(null);
    try {
      const prefix = contactForm.name || contactForm.email || contactForm.phone
        ? `Nom: ${contactForm.name || "—"}\nEmail: ${contactForm.email || "—"}\nTéléphone: ${contactForm.phone || "—"}\n\n`
        : "";
      const res = await fetch(
        `${API}/messages/contact-seller`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ adId: car.id, adType: "auto", content: prefix + contactForm.message.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");
      setContactFeedback({ type: "ok", text: "Message envoyé au vendeur. Suivez la conversation dans votre Messagerie." });
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (e) {
      setContactFeedback({ type: "err", text: e instanceof Error ? e.message : "Erreur lors de l'envoi" });
    } finally {
      setContactSending(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const car = apiCar as any;

  if (carLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Chargement...</div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Véhicule introuvable</h1>
          <p className="text-[var(--text-muted)] mb-6">Ce véhicule n&apos;existe pas ou a été retiré.</p>
          <Link href="/automobile" className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-all">
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  const totalSlides = car.images.length + (car.video ? 1 : 0);
  const isVideoSlide = car.video && currentSlide === car.images.length;

  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  const nextSlide = () => setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back + Modifier */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/automobile" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> Retour
          </Link>
          {isOwner && (
            <Link
              href={`/automobile/${params.id}/modifier`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-sm font-medium"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Modifier l&apos;annonce
            </Link>
          )}
        </div>

        {/* Media Carousel */}
        <div className="relative rounded-2xl overflow-hidden bg-[var(--bg-tertiary)] mb-8">
          <div className="relative aspect-[16/9] sm:aspect-[2/1]">
            {isVideoSlide ? (
              <video
                src={car.video}
                controls
                className="w-full h-full object-cover"
                poster={car.images[0]}
              />
            ) : (
              <img
                src={car.images[currentSlide]}
                alt={`${car.brand} ${car.model} - Photo ${currentSlide + 1}`}
                className="w-full h-full object-cover transition-all duration-500"
              />
            )}

            {/* Left Arrow */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm
                flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm
                flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2">
              {isVideoSlide && <VideoCameraIcon className="w-4 h-4" />}
              {currentSlide + 1} / {totalSlides}
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-1 p-2 bg-[var(--bg-card)] overflow-x-auto">
            {(car.images as string[]).map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                  i === currentSlide ? "ring-2 ring-primary opacity-100" : "opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {car.video && (
              <button
                onClick={() => setCurrentSlide(car.images.length)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all relative ${
                  isVideoSlide ? "ring-2 ring-primary opacity-100" : "opacity-50 hover:opacity-80"
                }`}
              >
                <img src={car.images[0]} alt="Vidéo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <PlaySolidIcon className="w-6 h-6 text-white" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges + Title */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  car.type === "sale" ? "bg-blue-600" : "bg-emerald-600"
                }`}>
                  {car.type === "sale" ? "Vente" : "Location"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  Disponible
                </span>
                <div className="flex items-center gap-1 ml-auto text-sm">
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-[var(--text-primary)] font-medium">{car.rating}</span>
                  <span className="text-[var(--text-muted)]">({car.reviews} avis)</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">{car.brand} {car.model}</h1>
              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <MapPinIcon className="w-5 h-5" />
                <span>{car.location}</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-primary">
              {formatPrice(car)}
            </div>

            {/* Key Specs */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: CalendarIcon, value: car.year.toString(), label: "Année" },
                { icon: Cog6ToothIcon, value: `${car.mileage.toLocaleString("fr-FR")} km`, label: "Kilométrage" },
                { icon: BoltIcon, value: car.fuel, label: "Carburant" },
                { icon: WrenchScrewdriverIcon, value: car.transmission, label: "Boîte" },
                { icon: BoltIcon, value: car.power, label: "Puissance" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] min-w-[100px]">
                  <stat.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">{stat.value}</span>
                  <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Description</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">{car.description}</p>
            </div>

            {/* Features */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Équipements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(car.features as string[]).map((feat: string) => (
                  <div key={feat} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-tertiary)]">
                    <ShieldCheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-[var(--text-secondary)]">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Details */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Fiche technique</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
                {[
                  { label: "Marque", value: car.brand },
                  { label: "Modèle", value: car.model },
                  { label: "Année", value: car.year.toString() },
                  { label: "Kilométrage", value: `${car.mileage.toLocaleString("fr-FR")} km` },
                  { label: "Carburant", value: car.fuel },
                  { label: "Boîte", value: car.transmission },
                  { label: "Puissance", value: car.power },
                  { label: "Portes", value: car.doors.toString() },
                  { label: "Places", value: car.seats.toString() },
                  { label: "Couleur", value: car.color },
                  { label: "CO₂", value: car.co2 },
                  { label: "1ère immat.", value: car.firstReg },
                ].map((detail) => (
                  <div key={detail.label} className="flex justify-between">
                    <span className="text-sm text-[var(--text-muted)]">{detail.label}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emissions */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Émissions CO₂</h2>
              <div className="flex gap-1">
                {[
                  { label: "A", max: 100, color: "bg-green-500" },
                  { label: "B", max: 120, color: "bg-lime-500" },
                  { label: "C", max: 140, color: "bg-yellow-500" },
                  { label: "D", max: 160, color: "bg-amber-500" },
                  { label: "E", max: 200, color: "bg-orange-500" },
                  { label: "F", max: 250, color: "bg-red-400" },
                  { label: "G", max: 999, color: "bg-red-600" },
                ].map((grade) => {
                  const co2Val = parseInt(car.co2);
                  const prevMax = grade.label === "A" ? 0 : [0, 100, 120, 140, 160, 200, 250][["A","B","C","D","E","F","G"].indexOf(grade.label)];
                  const isActive = co2Val <= grade.max && co2Val > prevMax;
                  return (
                    <div key={grade.label} className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-bold text-white ${grade.color} ${isActive ? "ring-2 ring-[var(--text-primary)] scale-110" : "opacity-40"}`}>
                      {grade.label}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-3">{car.co2} · {car.warranty}</p>
            </div>
          </div>

          {/* Right: Contact + Actions */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                {isFavorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
                Favoris
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                <ShareIcon className="w-5 h-5" /> Partager
              </button>
            </div>

            {/* Rent CTA */}
            {car.type === "rent" && (
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-base">
                <CalendarIcon className="w-5 h-5" /> Réserver ce véhicule
              </button>
            )}

            {/* Contact Card — unified form + seller coords */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 sticky top-24">
              <h2 className="text-[20px] font-bold leading-none text-[var(--text-primary)] mb-4">Contacter le vendeur</h2>
              <div className={`gap-5 ${(car.seller.phone || car.seller.email || car.seller.adresse) ? 'grid grid-cols-1 sm:grid-cols-2' : ''}`}>
                {/* Formulaire */}
                <div className="space-y-3">
                  <input
                    type="text" placeholder="Votre nom"
                    value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                  />
                  <input
                    type="email" placeholder="Votre email"
                    value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                  />
                  <input
                    type="tel" placeholder="Téléphone (optionnel)"
                    value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                  />
                  <textarea
                    rows={4} placeholder="Votre message..."
                    value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value.slice(0, 5000) })}
                    className="w-full resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-primary"
                  />
                  {contactFeedback && (
                    <p className={`text-[11px] ${contactFeedback.type === "ok" ? "text-emerald-500" : "text-red-500"}`}>
                      {contactFeedback.text}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={sendContactMessage}
                    disabled={contactSending}
                    className="w-full rounded-full bg-primary px-4 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {contactSending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>

                {/* Coordonnées du vendeur */}
                {(car.seller.phone || car.seller.email || car.seller.adresse) && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[16px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Coordonnées du vendeur</p>
                    {car.seller.name && (
                      <div className="flex items-center gap-2.5">
                        <img src="/UserIcon.png" alt="Vendeur" className="w-6 h-6 object-contain shrink-0" />
                        <span className="text-[18px] text-primary font-medium break-all">{car.seller.name}</span>
                      </div>
                    )}
                    {car.seller.phone && (
                      <>
                        <div className="flex items-center gap-2.5">
                          <img src="/PhoneIcon.png" alt="Téléphone" className="w-6 h-6 object-contain shrink-0" />
                          <a href={`tel:${car.seller.phone}`} className="text-[18px] text-primary hover:underline break-all">
                            {car.seller.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <img src="/ChatBubbleLeftEllipsisIcon.png" alt="WhatsApp" className="w-6 h-6 object-contain shrink-0" />
                          <a
                            href={`https://wa.me/${car.seller.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[18px] text-emerald-500 hover:underline break-all"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </>
                    )}
                    {car.seller.email && (
                      <div className="flex items-center gap-2.5">
                        <img src="/EnvelopeIcon.png" alt="Email" className="w-6 h-6 object-contain shrink-0" />
                        <a href={`mailto:${car.seller.email}`} className="text-[18px] text-primary hover:underline break-all">
                          {car.seller.email}
                        </a>
                      </div>
                    )}
                    {car.seller.adresse && (
                      <div className="flex items-start gap-2.5">
                        <img src="/MapPinIcon.png" alt="Adresse" className="w-6 h-6 object-contain shrink-0 mt-0.5" />
                        <span className="text-[18px] text-[var(--text-primary)] break-words">{car.seller.adresse}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
