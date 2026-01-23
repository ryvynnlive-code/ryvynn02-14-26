import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RYVYNN | Privacy-First Mental Wellness",
  description: "Your privacy-first mental wellness companion. The Flame provides straightforward support when things feel hard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
