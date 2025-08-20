import { Inter } from "next/font/google";

// Configure default font only to avoid module resolution issues
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Export font class mapping for use in components
export const FONT_CLASS_MAP = {
  Inter: inter.className,
  Arial: "font-sans",
  Helvetica: "font-sans",
  "Times New Roman": "font-serif",
  Georgia: "font-serif",
  "Open Sans": "font-sans",
  Roboto: "font-sans",
  "Playfair Display": "font-serif",
  "Comic Neue": "font-sans",
} as const;

// Export individual fonts for use in layout
export const fonts = {
  inter,
};

// Default font for the body
export const defaultFont = inter;
