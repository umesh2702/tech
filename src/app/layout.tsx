import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pulse AI — Founder Intelligence on WhatsApp",
    template: "%s | Pulse AI",
  },
  description:
    "AI-powered founder intelligence delivered on WhatsApp. Stop reading news. Start getting intelligence. Pulse AI monitors AI, startups, and funding — then delivers actionable opportunities.",
  keywords: [
    "AI intelligence",
    "startup news",
    "founder tools",
    "WhatsApp alerts",
    "funding intelligence",
    "opportunity analysis",
    "developer tools",
  ],
  authors: [{ name: "Pulse AI" }],
  openGraph: {
    title: "Pulse AI — Founder Intelligence on WhatsApp",
    description:
      "AI-powered founder intelligence delivered on WhatsApp. Stop reading news. Start getting intelligence.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse AI — Founder Intelligence on WhatsApp",
    description:
      "AI-powered founder intelligence delivered on WhatsApp. Stop reading news. Start getting intelligence.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={200}>
            {children}
          </TooltipProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
