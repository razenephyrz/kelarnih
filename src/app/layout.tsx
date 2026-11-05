import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CivicProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "CivicFlow — Every document. Every step. Clear progress.",
  description:
    "CivicFlow helps citizens track administrative document requests, understand procedures, and monitor progress with transparency.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CivicProvider>{children}</CivicProvider>
      </body>
    </html>
  );
}
