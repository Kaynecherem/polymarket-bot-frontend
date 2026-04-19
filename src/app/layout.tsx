import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { Toaster } from "sonner";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Polymarket Bot",
  description: "Automated trading bot for Polymarket prediction markets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.variable} font-mono`}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
            <WebSocketProvider>
              <TooltipProvider delayDuration={200}>
                <NavigationProgress />
                <AppShell>{children}</AppShell>
                <Toaster
                  theme="dark"
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "hsl(0 0% 5.1%)",
                      border: "1px solid hsl(0 0% 12%)",
                      color: "hsl(0 0% 98%)",
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: "11px",
                    },
                  }}
                />
              </TooltipProvider>
            </WebSocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
