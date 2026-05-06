"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

export interface Product {
  id: number;
  nom: string;
  prix_cdf: number;
  prix_usd?: number;
  image: string;
  categorie: "menager" | "automobile";
  sous_categorie: string;
  marque: string;
  disponible: boolean;
  stock: number;
  description: string;
  images?: string[];
  specifications?: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantite: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; product: Product; quantite?: number }
  | { type: "REMOVE"; productId: number }
  | { type: "UPDATE_QTY"; productId: number; quantite: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const qty = action.quantite ?? 1;
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantite: i.quantite + qty }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantite: qty }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.product.id !== action.productId) };
    case "UPDATE_QTY":
      if (action.quantite <= 0) {
        return { items: state.items.filter((i) => i.product.id !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantite: action.quantite } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    case "HYDRATE":
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalCDF: number;
  totalUSD: number;
  addToCart: (product: Product, quantite?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantite: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function BoutiqueCartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("impala_boutique_cart");
      if (stored) {
        dispatch({ type: "HYDRATE", items: JSON.parse(stored) });
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage + notify Navbar badge
  useEffect(() => {
    localStorage.setItem("impala_boutique_cart", JSON.stringify(state.items));
    window.dispatchEvent(new Event("cart-change"));
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantite, 0);
  const totalCDF = state.items.reduce((sum, i) => sum + i.product.prix_cdf * i.quantite, 0);
  const totalUSD = state.items.reduce(
    (sum, i) => sum + (i.product.prix_usd ?? i.product.prix_cdf / 2800) * i.quantite,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalCDF,
        totalUSD,
        addToCart: (p, q) => dispatch({ type: "ADD", product: p, quantite: q }),
        removeFromCart: (id) => dispatch({ type: "REMOVE", productId: id }),
        updateQuantity: (id, q) => dispatch({ type: "UPDATE_QTY", productId: id, quantite: q }),
        clearCart: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside BoutiqueCartProvider");
  return ctx;
}
