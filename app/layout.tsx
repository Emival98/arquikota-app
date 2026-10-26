import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArquiKota · Manutenção contínua",
  description:
    "Verifica dependências, APIs depreciadas e práticas desatualizadas em projetos Next.js e Vercel. Prioriza o risco, entrega comandos de correção e agenda verificações no GitHub Actions.",
  applicationName: "ArquiKota",
  keywords: [
    "manutenção de software",
    "dependências desatualizadas",
    "Vercel",
    "Supabase",
    "GitHub Actions",
    "Next.js",
  ],
};

export const viewport: Viewport = {
  themeColor: "#05080b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="font-sans">
        <div className="site-glow" aria-hidden="true" />
        <div className="site-grid" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
