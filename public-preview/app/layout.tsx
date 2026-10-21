import type { Metadata } from "next";
import "./atelier.css";

export const metadata: Metadata = {
  title: "Atelier Hotel | A little more considered",
  description: "A considered workspace for exceptional stays. Hotel operations and guest experience.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
