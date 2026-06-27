import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { appFontClassName } from "@/lib/fonts";
import { Providers } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Manage locations, territories, and your sales pipeline",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${appFontClassName} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
