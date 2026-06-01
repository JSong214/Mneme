import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "项目记忆助手",
  description: "保存并查询结构化项目上下文。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
