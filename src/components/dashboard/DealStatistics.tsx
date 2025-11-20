/**
 * DealStatistics 컴포넌트
 * 딜 통계 대시보드
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { DealStatistics as DealStatisticsType } from "@/types";

interface DealStatisticsProps {
  statistics: DealStatisticsType | null;
  isLoading: boolean;
}

export function DealStatistics({ statistics, isLoading }: DealStatisticsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-gray-500">통계 로딩 중...</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-gray-500">통계 데이터 없음</div>
      </div>
    );
  }

  const { overall, by_port, by_trader } = statistics;

  return (
    <div className="space-y-6">
      {/* 전체 통계 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">전체 통계</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 총 딜 수 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-xs text-blue-600 font-medium mb-1">총 딜</div>
            <div className="text-2xl font-bold text-blue-700">{overall.total_deals}</div>
          </div>

          {/* 성공률 */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-xs text-green-600 font-medium mb-1">성공률</div>
            <div className="text-2xl font-bold text-green-700">{overall.success_rate?.toFixed(1)}%</div>
          </div>

          {/* 총 거래액 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-xs text-purple-600 font-medium mb-1">총 거래액</div>
            <div className="text-2xl font-bold text-purple-700">
              ${overall.total_revenue?.toLocaleString() || 0}
            </div>
          </div>

          {/* 오늘 거래액 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-xs text-yellow-600 font-medium mb-1">오늘 거래액</div>
            <div className="text-2xl font-bold text-yellow-700">
              ${overall.today_revenue?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* 상태별 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">활성 딜</div>
            <div className="text-xl font-bold text-blue-600">{overall.active_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">견적 수신</div>
            <div className="text-xl font-bold text-purple-600">{overall.quoted_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">협상 중</div>
            <div className="text-xl font-bold text-yellow-600">{overall.negotiating_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">성공</div>
            <div className="text-xl font-bold text-green-600">{overall.successful_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">실패</div>
            <div className="text-xl font-bold text-red-600">{overall.failed_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">취소</div>
            <div className="text-xl font-bold text-gray-600">{overall.cancelled_deals}</div>
          </div>
        </div>

        {/* 평균 시간 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">평균 응답 시간</div>
            <div className="text-lg font-bold text-blue-600">
              {overall.avg_response_time_minutes?.toFixed(1) || 0}분
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">평균 거래 시간</div>
            <div className="text-lg font-bold text-purple-600">
              {overall.avg_deal_duration_minutes?.toFixed(1) || 0}분
            </div>
          </div>
        </div>
      </div>

      {/* 포트별 통계 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">포트별 통계 (Top 5)</h3>

        {by_port && by_port.length > 0 ? (
          <div className="space-y-3">
            {by_port.slice(0, 5).map((port, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <div className="font-medium">{port.port}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    총 {port.total_deals}건 • 성공 {port.successful_deals}건
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${port.total_revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    평균 ${port.avg_deal_value?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">데이터 없음</div>
        )}
      </div>

      {/* 트레이더별 통계 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">트레이더별 통계 (Top 5)</h3>

        {by_trader && by_trader.length > 0 ? (
          <div className="space-y-3">
            {by_trader.slice(0, 5).map((trader, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <div className="font-medium">{trader.trader}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    총 {trader.total_deals}건 • 평균 협상 {trader.avg_negotiation_rounds?.toFixed(1)}회
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${trader.total_revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    평균 응답 {trader.avg_response_minutes?.toFixed(1)}분
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">데이터 없음</div>
        )}
      </div>
    </div>
  );
}
