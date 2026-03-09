import type { Metadata } from "next";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeService } from "@/services";
import "./globals.css";

export const metadata: Metadata = {
  title: "Russ Lyon Platform",
  description: "Agent Platform — Marketing Intake",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await ThemeService.getTheme('russ-lyon');

  return (
    <html lang="en">
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
