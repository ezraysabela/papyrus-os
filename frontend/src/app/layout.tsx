import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papyrus OS",
  description: "The Operating System for Research Commercialization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
