/**
 * Mockup Header Component
 * 목업용 상단 네비게이션 바
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MockupHeader() {
  const pathname = usePathname();

  const navItems = [
    { name: "Deal Board", href: "/mockup/dashboard" },
    { name: "Chat Manager", href: "/mockup/chats" },
    { name: "Statistics", href: "/mockup/statistics" },
  ];

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/mockup" className="flex items-center gap-3">
            <img
              src="/harold-mockup/SP_logo.png"
              alt="Seanergy Partner"
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-xl font-bold">Harold Trading</span>
            <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-semibold">
              MOCKUP
            </span>
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
