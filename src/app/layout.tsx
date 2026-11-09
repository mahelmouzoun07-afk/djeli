import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "djeli — Trouvez vos clients pendant que vous dormez",
    template: "%s | djeli",
  },
  description:
    "L'agent commercial IA qui trouve vos clients, leur écrit et vous apporte des rendez-vous. Email, WhatsApp, partout en Afrique de l'Ouest.",
  metadataBase: new URL("https://djeliai.com"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
