import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jafferi Clinic",
  description: "Modern Clinic Management Software",
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