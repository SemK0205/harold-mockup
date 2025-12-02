/**
 * DealTable 컴포넌트
 * 테이블 형식의 딜 전광판 (첨부 이미지 스타일)
 */

"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Trash2, Ship, Fuel } from "lucide-react";
import { DealScoreboard } from "@/types";
import { useNotificationStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";

interface DealTableProps {
  deals: DealScoreboard[];
  onDealClick: (deal: DealScoreboard) => void;
  onStatusChange?: (sessionId: string, newStatus: DealScoreboard["status"]) => void;
  onDelete?: (sessionId: string, vesselName: string) => void;
}

type SortField = "created_at" | "updated_at" | "vessel_name" | "port" | "delivery_date" | "status";
type SortDirection = "asc" | "desc";

// Status 설정
const STATUS_OPTIONS: { value: DealScoreboard["status"]; label: string; color: string }[] = [
  { value: "active", label: "In Progress", color: "bg-blue-500" },
  { value: "quoted", label: "Quote Received", color: "bg-purple-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-yellow-500" },
  { value: "closed_success", label: "Completed", color: "bg-green-500" },
  { value: "closed_failed", label: "Failed", color: "bg-red-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-500" },
];

export function DealTable({ deals, onDealClick, onStatusChange, onDelete }: DealTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  // 알림 스토어에서 New 뱃지 관련 상태와 함수 가져오기
  const { viewedDeals, knownDealIds, viewedVersion, markAsViewed } = useNotificationStore(
    useShallow((state) => ({
      viewedDeals: state.viewedDeals,
      knownDealIds: state.knownDealIds,
      viewedVersion: state.viewedVersion,
      markAsViewed: state.markAsViewed,
    }))
  );

  // NEW 뱃지 표시 여부 (knownDealIds에 있으면서 viewedDeals에 없으면 NEW)
  // viewedVersion을 의존성에 넣어 리렌더링 트리거
  const isNewDeal = useMemo(() => {
    return (sessionId: string) => {
      return knownDealIds.has(sessionId) && !viewedDeals.has(sessionId);
    };
  }, [knownDealIds, viewedDeals, viewedVersion]);

  // 딜 클릭 핸들러 (New 뱃지 제거 + 기존 onDealClick 실행)
  const handleDealClick = (deal: DealScoreboard) => {
    markAsViewed(deal.session_id);
    onDealClick(deal);
  };

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
      active: <Badge className="bg-blue-500 text-white">In Progress</Badge>,
      quoted: <Badge className="bg-purple-500 text-white">Quote Received</Badge>,
      negotiating: <Badge className="bg-yellow-500 text-black">Negotiating</Badge>,
      closed_success: <Badge className="bg-green-500 text-white">Completed</Badge>,
      closed_failed: <Badge className="bg-red-500 text-white">Failed</Badge>,
      cancelled: <Badge className="bg-gray-500 text-white">Cancelled</Badge>,
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
                  Vessel <SortIcon field="vessel_name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("port")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Port <SortIcon field="port" />
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
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Fuel</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Quotes</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("created_at")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Created <SortIcon field="created_at" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <button
                  onClick={() => handleSort("updated_at")}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Updated <SortIcon field="updated_at" />
                </button>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDeals.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  No deals found
                </td>
              </tr>
            )}

            {sortedDeals.map((deal) => (
              <tr
                key={deal.id}
                onClick={() => handleDealClick(deal)}
                className={`border-b cursor-pointer transition-colors ${getStatusRowClass(deal.status)}`}
              >
                {/* 선박명 */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {deal.vessel_name || "-"}
                    {isNewDeal(deal.session_id) && (
                      <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                        NEW
                      </Badge>
                    )}
                    {/* 선주측(구매측) 읽지 않은 메시지 - 배 아이콘 */}
                    {(deal.buyer_unread_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-green-600" title="선주측 읽지 않은 메시지">
                        <Ship className="w-4 h-4" />
                        <span className="text-xs font-medium">{deal.buyer_unread_count}</span>
                      </span>
                    )}
                    {/* 판매측 읽지 않은 메시지 - 연료 아이콘 */}
                    {(deal.seller_unread_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-blue-600" title="판매측 읽지 않은 메시지">
                        <Fuel className="w-4 h-4" />
                        <span className="text-xs font-medium">{deal.seller_unread_count}</span>
                      </span>
                    )}
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
                        {deal.fuel_type} {deal.quantity && `${deal.quantity}MT`}
                      </div>
                    )}
                    {deal.fuel_type2 && (
                      <div className="text-gray-700">
                        {deal.fuel_type2} {deal.quantity2 && `${deal.quantity2}MT`}
                      </div>
                    )}
                    {!deal.fuel_type && !deal.fuel_type2 && "-"}
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
                          {deal.total_quotes_received} received
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
                      <div className="text-xs text-gray-400">Waiting</div>
                    )}
                  </div>
                </td>

                {/* 상태 - 클릭하여 변경 가능 */}
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusDropdownOpen(statusDropdownOpen === deal.session_id ? null : deal.session_id);
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {getStatusBadge(deal.status)}
                    </button>
                    {statusDropdownOpen === deal.session_id && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[140px]">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onStatusChange) {
                                onStatusChange(deal.session_id, option.value);
                              }
                              setStatusDropdownOpen(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2 ${
                              deal.status === option.value ? "bg-gray-50 font-medium" : ""
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${option.color}`} />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Created */}
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500">
                    {new Date(deal.created_at).toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                  {deal.duration_minutes > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.floor(deal.duration_minutes / 60)}h {Math.floor(deal.duration_minutes % 60)}m
                    </div>
                  )}
                </td>

                {/* Updated */}
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500">
                    {deal.updated_at ? new Date(deal.updated_at).toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }) : "-"}
                  </div>
                </td>

                {/* Delete */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDelete) {
                        onDelete(deal.session_id, deal.vessel_name || "Unknown");
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete deal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 요약 */}
      <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
        <div>
          Total: <span className="font-bold text-gray-900">{deals.length}</span>
        </div>
        <div className="flex gap-4">
          <span>
            In Progress: <span className="font-medium text-blue-600">
              {deals.filter(d => d.status === "active").length}
            </span>
          </span>
          <span>
            Quoted: <span className="font-medium text-purple-600">
              {deals.filter(d => d.status === "quoted").length}
            </span>
          </span>
          <span>
            Negotiating: <span className="font-medium text-yellow-600">
              {deals.filter(d => d.status === "negotiating").length}
            </span>
          </span>
          <span>
            Completed: <span className="font-medium text-green-600">
              {deals.filter(d => d.status === "closed_success").length}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
