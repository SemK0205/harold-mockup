/**
 * DealTable 컴포넌트
 * 테이블 형식의 딜 전광판 (첨부 이미지 스타일)
 */

"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DealScoreboard } from "@/types";

interface DealTableProps {
  deals: DealScoreboard[];
  onDealClick: (deal: DealScoreboard) => void;
}

type SortField = "created_at" | "vessel_name" | "port" | "delivery_date" | "status";
type SortDirection = "asc" | "desc";

export function DealTable({ deals, onDealClick }: DealTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 정렬된 딜 목록
  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // null 값 처리
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // 문자열 비교
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [deals, sortField, sortDirection]);

  // 상태별 배경색
  const getStatusRowClass = (status: DealScoreboard["status"]) => {
    const classes = {
      active: "bg-blue-50 hover:bg-blue-100",
      quoted: "bg-purple-50 hover:bg-purple-100",
      negotiating: "bg-yellow-50 hover:bg-yellow-100",
      closed_success: "bg-green-50 hover:bg-green-100",
      closed_failed: "bg-red-50 hover:bg-red-100",
      cancelled: "bg-gray-50 hover:bg-gray-100",
    };
    return classes[status];
  };

  // 상태 배지
  const getStatusBadge = (status: DealScoreboard["status"]) => {
    const badges = {
      active: <Badge className="bg-blue-500 text-white">진행중</Badge>,
      quoted: <Badge className="bg-purple-500 text-white">견적수신</Badge>,
      negotiating: <Badge className="bg-yellow-500 text-black">협상중</Badge>,
      closed_success: <Badge className="bg-green-500 text-white">성사</Badge>,
      closed_failed: <Badge className="bg-red-500 text-white">실패</Badge>,
      cancelled: <Badge className="bg-gray-500 text-white">취소</Badge>,
    };
    return badges[status];
  };

  // 정렬 아이콘
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300">⬍</span>;
    return sortDirection === "asc" ? <span>▲</span> : <span>▼</span>;
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("vessel_name")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  선박명 <SortIcon field="vessel_name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("port")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  항구 <SortIcon field="port" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("delivery_date")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  ETA <SortIcon field="delivery_date" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">연료</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">고객사</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">견적 현황</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  상태 <SortIcon field="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("created_at")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  생성일시 <SortIcon field="created_at" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDeals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  딜 데이터가 없습니다
                </td>
              </tr>
            )}

            {sortedDeals.map((deal) => (
              <tr
                key={deal.id}
                onClick={() => onDealClick(deal)}
                className={`border-b cursor-pointer transition-colors ${getStatusRowClass(deal.status)}`}
              >
                {/* 선박명 */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {deal.vessel_name || "-"}
                  </div>
                </td>

                {/* 항구 */}
                <td className="px-4 py-3">
                  <div className="text-gray-700">{deal.port || "-"}</div>
                </td>

                {/* ETA */}
                <td className="px-4 py-3">
                  <div className="text-gray-700">{deal.delivery_date || "-"}</div>
                </td>

                {/* 연료 */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {deal.fuel_type && (
                      <div className="text-gray-700">
                        {deal.fuel_type} {deal.quantity && `${deal.quantity}`}
                      </div>
                    )}
                    {!deal.fuel_type && "-"}
                  </div>
                </td>

                {/* 고객사 */}
                <td className="px-4 py-3">
                  <div className="text-gray-700 truncate max-w-[150px]">
                    {deal.customer_room_name}
                  </div>
                </td>

                {/* 견적 현황 */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {deal.total_quotes_received > 0 ? (
                      <>
                        <div className="text-xs text-gray-600">
                          {deal.total_quotes_received}개 수신
                        </div>
                        {deal.selected_trader && (
                          <div className="text-xs font-medium text-green-700">
                            ✓ {deal.selected_trader}
                          </div>
                        )}
                        {deal.final_price && (
                          <div className="text-xs font-bold text-green-600">
                            ${deal.final_price.toLocaleString()}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">대기중</div>
                    )}
                  </div>
                </td>

                {/* 상태 */}
                <td className="px-4 py-3">
                  {getStatusBadge(deal.status)}
                </td>

                {/* 생성일시 */}
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500">
                    {new Date(deal.created_at).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {deal.duration_minutes > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.floor(deal.duration_minutes / 60)}h {Math.floor(deal.duration_minutes % 60)}m
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 요약 */}
      <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
        <div>
          총 <span className="font-bold text-gray-900">{deals.length}</span>건
        </div>
        <div className="flex gap-4">
          <span>
            진행중: <span className="font-medium text-blue-600">
              {deals.filter(d => d.status === "active").length}
            </span>
          </span>
          <span>
            견적수신: <span className="font-medium text-purple-600">
              {deals.filter(d => d.status === "quoted").length}
            </span>
          </span>
          <span>
            협상중: <span className="font-medium text-yellow-600">
              {deals.filter(d => d.status === "negotiating").length}
            </span>
          </span>
          <span>
            성사: <span className="font-medium text-green-600">
              {deals.filter(d => d.status === "closed_success").length}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
