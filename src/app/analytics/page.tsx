/**
 * Analytics Page (통계)
 * 거래 완료 건에 대한 통계
 */

"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useAnalytics } from "@/lib/api/queries";

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">통계</h1>

        {isLoading && <div>로딩 중...</div>}

        {error && <div className="text-red-500">에러 발생: {String(error)}</div>}

        {analytics && (
          <div className="grid gap-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">총 거래 건수</h3>
                <p className="text-3xl font-bold mt-2">{analytics.total_trades}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">완료 거래</h3>
                <p className="text-3xl font-bold mt-2">{analytics.completed_trades}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">총 매출</h3>
                <p className="text-3xl font-bold mt-2">
                  ${analytics.total_revenue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 나라별 매출 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">나라별 매출</h2>
              <div className="space-y-2">
                {Object.entries(analytics.revenue_by_country).map(([country, revenue]) => (
                  <div key={country} className="flex justify-between items-center">
                    <span>{country}</span>
                    <span className="font-medium">${Number(revenue).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
