/**
 * Global Providers
 * TanStack Query Provider 설정
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000, // 5초간 fresh 상태 유지
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 새로고침 비활성화
            retry: 1, // 실패 시 1회 재시도
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
