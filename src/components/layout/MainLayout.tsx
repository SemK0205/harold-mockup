/**
 * Main Layout Component
 * 전체 페이지 레이아웃 (Header + Content)
 */

"use client";

import { Suspense } from "react";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function HeaderFallback() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <span className="text-xl font-bold">Harold Trading</span>
          </div>
          <nav className="flex space-x-6">
            {["Deal Board", "Chat Manager", "Aggregation", "Statistics", "Settlement"].map((name) => (
              <span key={name} className="text-sm font-medium text-gray-400">
                {name}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
