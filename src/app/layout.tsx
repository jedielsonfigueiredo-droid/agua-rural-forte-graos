import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Água Rural | Gestão de Outorgas",
  description: "Controle diário de hidrômetros, horímetros e outorgas.",
  icons: {
    icon: "/agua-rural-logo.png",
    shortcut: "/agua-rural-logo.png",
    apple: "/agua-rural-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
