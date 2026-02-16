import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/client-providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Yoonjaespace — Studio Management",
  description: "Sistem manajemen studio foto Yoonjaespace. Kelola booking, keuangan, dan klien dengan mudah.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
