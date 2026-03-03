import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Separator } from "@/components/ui/separator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leilão Online",
  description: "Plataforma de Leilões Online",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Leilão",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      // Principal — iPhone Retina moderno (iOS ≥ 7)
      {
        url: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      // Fallback — iPhone Retina mais antigo
      {
        url: "/icons/apple-touch-icon-120.png",
        sizes: "120x120",
        type: "image/png",
      },
      // iPad Retina
      {
        url: "/icons/apple-touch-icon-152.png",
        sizes: "152x152",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-svh overflow-hidden">
            <header className="flex flex-row items-center gap-2 px-5 py-3  md:text-left border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="" />
              <Separator orientation="vertical" className="mr-2" />
              <div className="flex flex-col justify-start">
                <h1 className="text-2xl font-bold tracking-tight">
                  Leilões Abertos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Lista de leilões e acesso rápido aos detalhes
                </p>
              </div>
            </header>
            <div className="flex-1 overflow-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
