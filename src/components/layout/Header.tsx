/**
 * Header Component
 * 상단 네비게이션 바
 */

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isDemoMode } from "@/lib/api/client";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 쿼리 파라미터 유지 (demo=true 등)
  const getHrefWithParams = (href: string) => {
    const params = new URLSearchParams(searchParams.toString());
    return params.toString() ? `${href}?${params.toString()}` : href;
  };

  const navItems = [
    { name: "Deal Board", href: "/dashboard" },
    { name: "Chat Manager", href: "/chats" },
    { name: "Aggregation", href: "/aggregation" },
    { name: "Statistics", href: "/statistics" },
    { name: "Settlement", href: "/settlement" },
  ];

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={getHrefWithParams("/dashboard")} className="flex items-center gap-3">
            <img
              src="/SP_logo.png"
              alt="Seanergy Partner"
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-xl font-bold">Harold Trading</span>
            {isDemoMode() && (
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-semibold">
                DEMO
              </span>
            )}
          </Link>

          <nav className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={getHrefWithParams(item.href)}
                className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                  pathname === item.href
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
