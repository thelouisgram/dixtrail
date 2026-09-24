import { Geist, JetBrains_Mono } from "next/font/google";

export const appSans = Geist({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

export const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const appFontClassName = `${appSans.variable} ${appMono.variable}`;
