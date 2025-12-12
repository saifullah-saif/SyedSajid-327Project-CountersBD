import type React from "react";
import { SessionProviderWrapper } from "@/context/session-context";
import { CartProvider } from "@/context/cart-context";
import { InterestedProvider } from "@/context/interested-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <SessionProviderWrapper>
            <CartProvider>
              <InterestedProvider>
                {children}
                <Toaster />
              </InterestedProvider>
            </CartProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
