/**
 * Dashboard Page (Deal Scoreboard)
 * Deal pipeline in table/timeline format + statistics
 */

"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DealTable } from "@/components/dashboard/DealTable";
import { DealStatistics } from "@/components/dashboard/DealStatistics";
import { DealTimeline } from "@/components/dashboard/DealTimeline";
import { DealDetailModal } from "@/components/dashboard/DealDetailModal3Column";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { useQuery } from "@tanstack/react-query";
import { dealScoreboardAPI } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealScoreboard as DealScoreboardType, TradingSession } from "@/types";
import { useDealsSSE } from "@/hooks/useDealsSSE";
import { useNotificationStore } from "@/stores";

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"table" | "timeline" | "statistics">("table");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [portFilter, setPortFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SSE 연결
  const { deals: sseDeals, isConnected } = useDealsSSE({
    port: portFilter || undefined,
    status: statusFilter || undefined,
    customer: customerFilter || undefined,
  });

  // 알림 권한 상태 (클라이언트에서만 렌더링)
  const [isMounted, setIsMounted] = useState(false);
  const { notificationPermission, requestNotificationPermission } = useNotificationStore();

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 통계 데이터 조회
  const { data: statisticsData, isLoading: statisticsLoading } = useQuery({
    queryKey: ["deals", "statistics"],
    queryFn: () => dealScoreboardAPI.getStatistics(),
    refetchInterval: 30000,
  });

  const deals = sseDeals;

  // selectedDealId로 최신 deals에서 실제 deal 찾기
  const selectedDeal = selectedDealId
    ? deals.find(d => d.session_id === selectedDealId) || null
    : null;

  const handleDealClick = (deal: DealScoreboardType) => {
    setSelectedDealId(deal.session_id);
    setIsModalOpen(true);
  };

  // Status 변경 핸들러
  const handleStatusChange = async (sessionId: string, newStatus: DealScoreboardType["status"]) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (response.ok) {
        console.log(`Status changed to ${newStatus} for session ${sessionId}`);
        // SSE가 자동으로 업데이트하므로 추가 작업 불필요
      } else {
        console.error("Failed to update status:", await response.text());
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Delete 핸들러
  const handleDelete = async (sessionId: string, vesselName: string) => {
    if (!confirm(`정말로 "${vesselName}" 딜을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/${sessionId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        console.log(`Deal ${sessionId} deleted successfully`);
        // SSE가 자동으로 목록을 업데이트하므로 추가 작업 불필요
      } else {
        console.error("Failed to delete deal:", await response.text());
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
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
      fuel_type2: deal.fuel_type2,
      quantity2: deal.quantity2,
      delivery_date: deal.delivery_date,
      requested_traders: deal.requested_traders || [],
      quotes: (deal as any).quotes || [],
      status: deal.status === "active" ? "active" : "closed",
      created_at: deal.created_at,
      closed_at: deal.closed_at,
      seller_contexts: deal.seller_contexts,
      stage: deal.stage,
    };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Deal Scoreboard</h1>

            {/* Real-time connection status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-600">
                {isConnected ? "Live" : "Connecting..."}
              </span>
            </div>

            {/* 브라우저 알림 권한 버튼 (클라이언트에서만 렌더링) */}
            {isMounted && notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestNotificationPermission}
                className="flex items-center gap-1.5"
              >
                <span>🔔</span>
                <span>Enable Notifications</span>
              </Button>
            )}
            {isMounted && notificationPermission === 'granted' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-xs text-green-700">
                <span>🔔</span>
                <span>Notifications On</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 내보내기 버튼 - 테이블 뷰에서만 표시 (왼쪽) */}
            {viewMode === "table" && (
              <ExportButtons
                filters={{
                  status: statusFilter,
                  port: portFilter,
                  customer: customerFilter,
                }}
              />
            )}

            <div className="text-sm text-gray-500">
              Total {deals.length} deals
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                Timeline
              </Button>
              <Button
                variant={viewMode === "statistics" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("statistics")}
              >
                Statistics
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {(viewMode === "table" || viewMode === "timeline") && (
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Port</label>
                <Input
                  placeholder="Filter by port (e.g. Busan)"
                  value={portFilter}
                  onChange={(e) => setPortFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Customer</label>
                <Input
                  placeholder="Filter by customer (e.g. ORION)"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <select
                  className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="quoted">Quoted</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="closed_success">Success</option>
                  <option value="closed_failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
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
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {!isConnected && deals.length === 0 && (viewMode === "table" || viewMode === "timeline") && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}

        {/* 테이블 뷰 */}
        {viewMode === "table" && (isConnected || deals.length > 0) && (
          <DealTable deals={deals} onDealClick={handleDealClick} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        )}

        {/* 타임라인 뷰 */}
        {viewMode === "timeline" && (isConnected || deals.length > 0) && (
          <DealTimeline deals={deals} onDealClick={handleDealClick} />
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
