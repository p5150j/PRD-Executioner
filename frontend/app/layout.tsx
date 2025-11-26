import type { Metadata } from "next";
import { Karla, Bebas_Neue, Metal_Mania } from "next/font/google";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-karla",
  weight: ["400", "500", "600", "700", "800"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

const metalMania = Metal_Mania({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-metal",
});

export const metadata: Metadata = {
  title: "PRD EXECUTIONER - Murder Your Bad Ideas",
  description: "Brutally honest PRD feedback from synthetic personas. Where bad ideas come to die.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${karla.variable} ${bebasNeue.variable} ${metalMania.variable} antialiased bg-black text-white`}
        style={{ fontFamily: 'var(--font-karla)' }}
      >
        {children}
      </body>
    </html>
  );
}
