/**
 * Main Layout Component
 * 전체 페이지 레이아웃 (Header + Content)
 */

"use client";

import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
