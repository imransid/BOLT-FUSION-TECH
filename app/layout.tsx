import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Bolt Fusion Tech – Custom Software & Product Engineering",
  description:
    "We design, build, and ship reliable web and mobile products—clear roadmaps, senior engineers, and delivery you can plan around.",
  openGraph: {
    title: "Bolt Fusion Tech – Custom Software & Product Engineering",
    description:
      "Partner with a product-minded engineering team to launch faster, reduce risk, and scale with confidence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-20 md:scroll-pt-24">
      <body className={`${inter.variable} antialiased bg-black text-white`}>
        {/* Grain noise overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
