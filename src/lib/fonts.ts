import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

export const appSans = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const appFontClassName = `${appSans.variable} ${appMono.variable}`;
