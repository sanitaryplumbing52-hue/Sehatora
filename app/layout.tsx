import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { absoluteUrl } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "STYLEAI — AI Personal Stylist & Virtual Try-On",
    template: "%s | STYLEAI",
  },
  description:
    "Upload your photo and let AI create personalized outfits, colors, and styling recommendations made for you.",
  openGraph: {
    title: "STYLEAI — AI Personal Stylist & Virtual Try-On",
    description: "Discover what looks best on you with AI-powered styling and virtual try-on.",
    url: absoluteUrl("/"),
    siteName: "STYLEAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STYLEAI — AI Personal Stylist & Virtual Try-On",
    description: "Discover what looks best on you with AI-powered styling and virtual try-on.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "STYLEAI",
              url: absoluteUrl("/"),
              description: "AI Personal Stylist & Virtual Try-On Platform",
            }),
          }}
        />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
