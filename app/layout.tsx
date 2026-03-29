import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "内容监控工具原型",
  description: "用于管理多平台内容监控、AI 报告与选题洞察的前端原型页面"
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

