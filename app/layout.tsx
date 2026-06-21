import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContractIQ — Post-signature contract intelligence",
  description:
    "Reads a contract and its amendments, then answers what governs right now — with sources.",
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
