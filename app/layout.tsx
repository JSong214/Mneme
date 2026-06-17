import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mneme",
  description: "保存并查询结构化项目上下文。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
