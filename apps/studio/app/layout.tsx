import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "IXO Studio",
  description: "Intent compiler and governance simulator for AI-native organizations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
