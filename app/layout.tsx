import type { Metadata } from "next";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeService } from "@/services";
import { TENANT_ID } from "@/lib/constants";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
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
