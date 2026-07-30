import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://photogo.com.br"),
  title: {
    default: "PhotoGo — O marketplace dos fotógrafos",
    template: "%s · PhotoGo",
  },
  description:
    "Plataforma para fotógrafos venderem fotos digitais, impressas e licenciadas. Repasses automáticos, painel profissional, exposição global.",
  keywords: [
    "fotografia",
    "marketplace",
    "fotógrafos",
    "vender fotos",
    "stock photography",
    "licenciamento fotográfico",
  ],
  authors: [{ name: "PhotoGo" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://photogo.com.br",
    title: "PhotoGo — O marketplace dos fotógrafos",
    description:
      "Venda suas fotos digitais, impressas e licenciadas. Repasses automáticos via Stripe Connect.",
    siteName: "PhotoGo",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhotoGo — O marketplace dos fotógrafos",
    description:
      "Venda suas fotos digitais, impressas e licenciadas. Repasses automáticos via Stripe Connect.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Theme bootstrap — avoid FOUC. Mirrors the dashboard-starter pattern.
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem('photogo-theme');const m=t==='light'||t==='dark'?t:'system';const d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=d?'dark':'light';}catch(_){}})();`,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
