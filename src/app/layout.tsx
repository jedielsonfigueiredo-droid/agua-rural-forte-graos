import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Água Rural | Gestão de Outorgas",
  description: "Controle diário de hidrômetros, horímetros e outorgas.",
  applicationName: "Água Rural",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/app-icon.png", type: "image/png", sizes: "1536x1536" }],
    shortcut: "/app-icon.png",
    apple: [{ url: "/app-icon.png", sizes: "1536x1536", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
