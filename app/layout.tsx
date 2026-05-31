import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Memory Assistant",
  description: "Preserve and query structured project context."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
