import type { Metadata } from "next";
import Script from "next/script";
import { Anek_Bangla, Inter } from "next/font/google";
import "./globals.css";

const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anek-bangla",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pawtro — হারানো পোষ্য ও দত্তক | বাংলাদেশ",
  description:
    "হারানো ও কুড়িয়ে পাওয়া পোষা প্রাণীর খোঁজ এক জায়গায়। ছবি, দূরত্ব ও সময় মিলিয়ে Pawtro নিজে থেকেই সম্ভাব্য মিল খুঁজে বের করে।",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Pawtro — হারানো পোষ্য ঘরে ফিরুক",
    description:
      "বাংলাদেশে হারানো ও কুড়িয়ে পাওয়া পোষ্যের পোস্ট এক জায়গায়। ছবি দিয়ে স্বয়ংক্রিয় মিল, এলাকাভিত্তিক খোঁজ, দত্তক তালিকা।",
    type: "website",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${anekBangla.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t=null;
              try{ t=localStorage.getItem('pawtro:theme'); }catch(e){}
              if(!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', t);
            })();`,
          }}
        />
      </head>
      <body>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
          strategy="beforeInteractive"
        />
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="afterInteractive"
          />
        )}
        <AuthProvider>
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
