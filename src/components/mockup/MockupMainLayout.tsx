/**
 * Mockup Main Layout Component
 * 목업용 페이지 레이아웃 (Header + Content)
 */

"use client";

import { Suspense } from "react";
import { MockupHeader } from "./MockupHeader";

interface MockupMainLayoutProps {
  children: React.ReactNode;
}

export function MockupMainLayout({ children }: MockupMainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<HeaderFallback />}>
        <MockupHeader />
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
            {["Deal Board", "Chat Manager", "Customers", "Statistics"].map((name) => (
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
