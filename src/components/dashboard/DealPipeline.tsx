/**
 * DealPipeline 컴포넌트
 * 칸반 보드 형식의 딜 파이프라인
 */

"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DealScoreboard } from "@/types";

interface DealPipelineProps {
  deals: DealScoreboard[];
  onDealClick: (deal: DealScoreboard) => void;
}

export function DealPipeline({ deals, onDealClick }: DealPipelineProps) {
  // 상태별로 딜 분류
  const dealsByStatus = useMemo(() => {
    return {
      active: deals.filter((d) => d.status === "active"),
      quoted: deals.filter((d) => d.status === "quoted"),
      negotiating: deals.filter((d) => d.status === "negotiating"),
      closed_success: deals.filter((d) => d.status === "closed_success"),
      closed_failed: deals.filter((d) => d.status === "closed_failed"),
      cancelled: deals.filter((d) => d.status === "cancelled"),
    };
  }, [deals]);

  const columns = [
    { id: "active", title: "활성 (인쿼리)", color: "bg-blue-50", borderColor: "border-blue-200" },
    { id: "quoted", title: "견적 수신", color: "bg-purple-50", borderColor: "border-purple-200" },
    { id: "negotiating", title: "협상 중", color: "bg-yellow-50", borderColor: "border-yellow-200" },
    { id: "closed_success", title: "딜 성사", color: "bg-green-50", borderColor: "border-green-200" },
    { id: "closed_failed", title: "딜 실패", color: "bg-red-50", borderColor: "border-red-200" },
    { id: "cancelled", title: "취소", color: "bg-gray-50", borderColor: "border-gray-200" },
  ];

  const getStatusBadge = (status: DealScoreboard["status"]) => {
    const badges = {
      active: <Badge className="bg-blue-500">활성</Badge>,
      quoted: <Badge className="bg-purple-500">견적</Badge>,
      negotiating: <Badge className="bg-yellow-500 text-black">협상</Badge>,
      closed_success: <Badge className="bg-green-500">성공</Badge>,
      closed_failed: <Badge className="bg-red-500">실패</Badge>,
      cancelled: <Badge className="bg-gray-500">취소</Badge>,
    };
    return badges[status];
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.floor(minutes)}분`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}시간 ${mins}분`;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnDeals = dealsByStatus[column.id as keyof typeof dealsByStatus];

        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* 컬럼 헤더 */}
            <div className={`${column.color} ${column.borderColor} border rounded-t-lg p-3`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">{column.title}</h3>
                <Badge variant="outline" className="bg-white">
                  {columnDeals.length}
                </Badge>
              </div>
            </div>

            {/* 딜 카드 목록 */}
            <div className="bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg p-2 min-h-[500px] max-h-[700px] overflow-y-auto space-y-2">
              {columnDeals.length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">
                  딜 없음
                </div>
              )}

              {columnDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => onDealClick(deal)}
                  className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* 고객사 + 상태 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate">
                      {deal.customer_room_name}
                    </span>
                    {getStatusBadge(deal.status)}
                  </div>

                  {/* 선박명 */}
                  {deal.vessel_name && (
                    <div className="text-xs text-gray-600 mb-1">
                      🚢 {deal.vessel_name}
                    </div>
                  )}

                  {/* 포트 + 유종 */}
                  <div className="text-xs text-gray-600 mb-2">
                    📍 {deal.port || "포트 미정"} • {deal.fuel_type || "유종 미정"}
                  </div>

                  {/* 수량 + 납기일 */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    {deal.quantity && <span>⛽ {deal.quantity}</span>}
                    {deal.delivery_date && <span>📅 {deal.delivery_date}</span>}
                  </div>

                  {/* 견적 개수 */}
                  {deal.total_quotes_received > 0 && (
                    <div className="text-xs text-gray-600 mb-1">
                      💬 견적 {deal.total_quotes_received}개 수신
                    </div>
                  )}

                  {/* 선택된 트레이더 + 최종 가격 */}
                  {deal.selected_trader && (
                    <div className="text-xs text-green-700 font-medium mb-1">
                      ✅ {deal.selected_trader}
                      {deal.final_price && ` • $${deal.final_price.toLocaleString()}`}
                    </div>
                  )}

                  {/* 진행 시간 */}
                  <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
                    ⏱️ {formatDuration(deal.duration_minutes)}
                    {deal.response_time_minutes && (
                      <span className="ml-2">
                        �� 응답 {formatDuration(deal.response_time_minutes)}
                      </span>
                    )}
                  </div>

                  {/* 생성 시간 */}
                  <div className="text-xs text-gray-400 mt-1">
                    🕐 {new Date(deal.created_at).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
