import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { DataSeal } from "@/components/layout/DataSeal";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE } from "@/data/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: SITE.title, template: `%s · ${SITE.title}` },
  description: SITE.description,
  authors: [{ name: SITE.author }],
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6EFE6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen">
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <DataSeal />
      </body>
    </html>
  );
}
