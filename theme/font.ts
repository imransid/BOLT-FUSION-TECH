import { Inter, Syne } from "next/font/google";

export const InterFont = Inter({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["100", "300", "400", "500", "600", "700", "900"],
  variable: "--font-sans",
});

export const SyneFont = Syne({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});
