/**
 * Header Component
 * 상단 네비게이션 바
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: "Deal Dashboard", href: "/dashboard" },
    { name: "Chat Manager", href: "/chats" },
    { name: "Analytics", href: "/analytics" },
  ];

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/SP_logo.png"
              alt="Seanergy Partner"
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-xl font-bold">Harold Trading</span>
          </Link>

          <nav className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
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
