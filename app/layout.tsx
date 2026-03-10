import type { Metadata } from "next";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeService } from "@/services";
import { TENANT_ID } from "@/lib/constants";
import "./globals.css";
import { Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geistMono = Geist_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
  title: "RLSIR Platform",
  description: "Russ Lyon Sotheby's — Marketing Intake Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await ThemeService.getTheme(TENANT_ID);

  return (
    <html lang="en" className={cn(geistMono.variable)}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <ThemeProvider tokens={theme?.tokens ?? null}>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
