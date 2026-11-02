import type { Metadata, Viewport } from "next";
import {
  Cabin_Condensed,
  Familjen_Grotesk,
  Outfit,
  Special_Gothic_Expanded_One,
} from "next/font/google";
import { CREATOR, DEFAULT_DESCRIPTION, KEYWORDS, SITE_NAME, SITE_URL, pageMeta } from "@/lib/seo";
import NoImageDrag from "@/components/NoImageDrag";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
});

const specialGothic = Special_Gothic_Expanded_One({
  variable: "--font-special-gothic",
  subsets: ["latin"],
  weight: "400",
  // Next has no metrics for this font, so it can't size a fallback; skip it.
  adjustFontFallback: false,
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
  ...pageMeta({
    description: DEFAULT_DESCRIPTION,
    path: "/",
    image: "/og/home.png",
    imageAlt: "Imaginry — backgrounds that move",
  }),
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — generative backgrounds, live in your browser`,
    template: `%s · ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  authors: [{ name: "zRuvix", url: "https://x.com/zRuvix1" }],
  creator: CREATOR,
  publisher: SITE_NAME,
  category: "design",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
  colorScheme: "dark",
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
      <head>
        {/* Umami analytics */}
        <script
          defer
          src="https://umi.bhaskarsaikia.dev/script.js"
          data-website-id="39f68bbc-bfe7-4ceb-bec9-74defe2dffb4"
        />
      </head>
      <body className="h-full" suppressHydrationWarning><NoImageDrag />
        {children}
      </body>
    </html>
  );
}
