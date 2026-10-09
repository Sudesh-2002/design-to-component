import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Design to Component Playground",
  description:
    "Turn a screenshot or a description into a live, editable React + Tailwind component.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} flex min-h-screen flex-col bg-neutral-950 text-neutral-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}