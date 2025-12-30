import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "万濮云 - 毛衣开发管理",
  description: "针织毛衣开发流程管理系统",
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

