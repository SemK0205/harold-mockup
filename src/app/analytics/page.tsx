/**
 * Analytics Page (통계 대시보드)
 * 거래 통계 및 분석
 */

"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useAnalytics, useTradingSessions } from "@/lib/api/queries";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();
  const { data: sessions } = useTradingSessions();

  const activeSessions = sessions?.filter((s) => s.status === "active").length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">통계 대시보드</h1>
          <Badge variant="outline">실시간 업데이트</Badge>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">에러 발생: {String(error)}</p>
          </div>
        )}

        {analytics && (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">총 거래 건수</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.total_trades}
                </p>
                <p className="text-xs text-gray-500 mt-2">전체 기간</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">활성 거래</h3>
                <p className="text-3xl font-bold text-green-600">{activeSessions}</p>
                <p className="text-xs text-gray-500 mt-2">진행 중</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">완료 거래</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.completed_trades}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  완료율{" "}
                  {analytics.total_trades > 0
                    ? ((analytics.completed_trades / analytics.total_trades) * 100).toFixed(
                        1
                      )
                    : 0}
                  %
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">총 매출</h3>
                <p className="text-3xl font-bold text-orange-600">
                  ${analytics.total_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">USD 기준</p>
              </Card>
            </div>

            {/* 포트별 거래 건수 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">포트별 거래 건수</h2>
              {Object.keys(analytics.revenue_by_port).length === 0 ? (
                <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.revenue_by_port)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([port, count]) => (
                      <div key={port} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{port}</Badge>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-48 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (Number(count) /
                                    Math.max(
                                      ...Object.values(analytics.revenue_by_port).map(Number)
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="font-medium w-12 text-right">{count}건</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* 나라별 매출 */}
            {Object.keys(analytics.revenue_by_country).length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">나라별 매출</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analytics.revenue_by_country)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([country, revenue]) => (
                      <div
                        key={country}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <span className="font-medium">{country}</span>
                        <span className="text-lg font-bold text-green-600">
                          ${Number(revenue).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* 트레이더별 매출 */}
            {Object.keys(analytics.revenue_by_trader).length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">트레이더별 매출</h2>
                <div className="space-y-2">
                  {Object.entries(analytics.revenue_by_trader)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([trader, revenue]) => (
                      <div
                        key={trader}
                        className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                      >
                        <span className="font-medium">{trader}</span>
                        <span className="text-lg font-bold">
                          ${Number(revenue).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* 월별 거래 추이 */}
            {analytics.trades_by_month && analytics.trades_by_month.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">월별 거래 추이</h2>
                <div className="space-y-3">
                  {analytics.trades_by_month.map((item) => (
                    <div key={item.month} className="flex items-center space-x-4">
                      <span className="w-20 text-sm text-gray-600">{item.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (item.count /
                                Math.max(...analytics.trades_by_month.map((t) => t.count))) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="w-16 text-sm font-medium">{item.count}건</span>
                      <span className="w-32 text-sm text-gray-600">
                        ${item.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
