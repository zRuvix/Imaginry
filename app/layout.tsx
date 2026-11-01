import type { Metadata } from "next";
import {
  Cabin_Condensed,
  Familjen_Grotesk,
  Outfit,
  Special_Gothic_Expanded_One,
} from "next/font/google";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
});

const specialGothic = Special_Gothic_Expanded_One({
  variable: "--font-special-gothic",
  subsets: ["latin"],
  weight: "400",
});

const cabinCondensed = Cabin_Condensed({
  variable: "--font-cabin-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imaginry Studio",
  description: "Generate images with WebGL effects",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions often inject attributes into <html>/<body> before React
    // hydrates; this ignores attribute differences on these two elements only.
    <html
      suppressHydrationWarning
      lang="en"
      className={`${familjen.variable} ${specialGothic.variable} ${cabinCondensed.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
