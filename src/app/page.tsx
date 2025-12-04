"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 루트 페이지는 대시보드로 리다이렉트 (쿼리 파라미터 유지)
    const queryString = searchParams.toString();
    router.replace(queryString ? `/dashboard?${queryString}` : "/dashboard");
  }, [router, searchParams]);

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
