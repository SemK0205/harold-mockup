/**
 * Dashboard Page (딜 전광판)
 * 칸반 보드 형식의 딜 파이프라인 + 통계
 */

"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DealTable } from "@/components/dashboard/DealTable";
import { DealStatistics } from "@/components/dashboard/DealStatistics";
import { DealDetailModal } from "@/components/dashboard/DealDetailModal";
import { useQuery } from "@tanstack/react-query";
import { dealScoreboardAPI } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealScoreboard as DealScoreboardType, TradingSession } from "@/types";

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"pipeline" | "statistics">("pipeline");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [portFilter, setPortFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<DealScoreboardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 딜 데이터 조회
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["deals", "scoreboard", statusFilter, portFilter, customerFilter],
    queryFn: () =>
      dealScoreboardAPI.getDeals({
        status: statusFilter || undefined,
        port: portFilter || undefined,
        customer: customerFilter || undefined,
        limit: 500,
      }),
    refetchInterval: 5000, // 5초마다 자동 새로고침
  });

  // 통계 데이터 조회
  const { data: statisticsData, isLoading: statisticsLoading } = useQuery({
    queryKey: ["deals", "statistics"],
    queryFn: () => dealScoreboardAPI.getStatistics(),
    refetchInterval: 10000, // 10초마다 자동 새로고침
  });

  const deals = dealsData?.data || [];

  const handleDealClick = (deal: DealScoreboardType) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  // DealScoreboardType을 TradingSession으로 변환 (모달용)
  const convertToSession = (deal: DealScoreboardType | null): TradingSession | null => {
    if (!deal) return null;
    return {
      session_id: deal.session_id,
      customer_room_name: deal.customer_room_name,
      original_inquiry: "",
      port: deal.port,
      fuel_type: deal.fuel_type,
      vessel_name: deal.vessel_name,
      quantity: deal.quantity,
      delivery_date: deal.delivery_date,
      requested_traders: [],
      quotes: [],
      status: deal.status === "active" ? "active" : "closed",
      created_at: deal.created_at,
      closed_at: deal.closed_at,
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">딜 전광판</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              총 {deals.length}건
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "pipeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("pipeline")}
              >
                파이프라인
              </Button>
              <Button
                variant={viewMode === "statistics" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("statistics")}
              >
                통계
              </Button>
            </div>
          </div>
        </div>

        {/* 필터 */}
        {viewMode === "pipeline" && (
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">포트</label>
                <Input
                  placeholder="포트 필터 (예: 부산)"
                  value={portFilter}
                  onChange={(e) => setPortFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">고객사</label>
                <Input
                  placeholder="고객사 필터 (예: ORION)"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">상태</label>
                <select
                  className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="active">활성</option>
                  <option value="quoted">견적 수신</option>
                  <option value="negotiating">협상 중</option>
                  <option value="closed_success">성공</option>
                  <option value="closed_failed">실패</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>
            </div>
            {(portFilter || customerFilter || statusFilter) && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPortFilter("");
                    setCustomerFilter("");
                    setStatusFilter("");
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 로딩 */}
        {dealsLoading && viewMode === "pipeline" && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        )}

        {/* 테이블 뷰 */}
        {viewMode === "pipeline" && !dealsLoading && (
          <DealTable deals={deals} onDealClick={handleDealClick} />
        )}

        {/* 통계 뷰 */}
        {viewMode === "statistics" && (
          <DealStatistics statistics={statisticsData} isLoading={statisticsLoading} />
        )}
      </div>

      {/* 상세 모달 */}
      <DealDetailModal
        session={convertToSession(selectedDeal)}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </MainLayout>
  );
}
