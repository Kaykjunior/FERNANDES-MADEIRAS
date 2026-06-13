import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rei das Madeiras",
  description: "Qualidade em cada peça - Itamarandiba / MG",
  openGraph: {
    title: "Rei das Madeiras",
    description: "Eucalipto Tratado e In Natura",
    images: [
      {
        url: "/logo2.png", // Caminho da imagem que está na pasta public
        width: 800,
        height: 600,
        alt: "Rei das Madeiras Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID as string} />
        {children}
      </body>
    </html>
  );
}
