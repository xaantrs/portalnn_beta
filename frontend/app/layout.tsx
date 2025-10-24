import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./global.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Portal de Novos Negócios - Metrocasa Landbank",
  description: "Sistema interno para análise de terrenos e gestão de novos negócios.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans antialiased ${montserrat.variable}`}>
        {children}
      </body>
    </html>
  );
}