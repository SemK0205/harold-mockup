/**
 * Mockup Deal Detail Modal
 * 원본 DealDetailModal3Column을 그대로 사용하되, Mock 데이터로 래핑
 *
 * 핵심: 원본 UI를 100% 유지하면서 API 호출만 Mock으로 대체
 */

"use client";

import { useMemo } from "react";
import { DealDetailModal } from "@/components/dashboard/DealDetailModal3Column";
import { DealScoreboard } from "@/types";

interface MockupDealDetailModalProps {
  deal: DealScoreboard | null;
  open: boolean;
  onClose: () => void;
}

/**
 * DealScoreboard를 TradingSession 형태로 변환
 * 원본 DealDetailModal은 TradingSession을 기대하므로 호환되도록 변환
 */
function dealToSession(deal: DealScoreboard | null) {
  if (!deal) return null;

  return {
    // 기본 필드
    session_id: deal.session_id,
    customer_room_name: deal.customer_room_name,
    vessel_name: deal.vessel_name,
    imo: deal.imo,
    port: deal.port,
    delivery_date: deal.delivery_date,
    fuel_type: deal.fuel_type,
    quantity: deal.quantity,
    fuel_type2: deal.fuel_type2,
    quantity2: deal.quantity2,

    // 상태 필드
    status: deal.status,
    stage: deal.stage,
    created_at: deal.created_at,
    updated_at: deal.updated_at,
    closed_at: deal.closed_at,

    // 거래 결과
    final_price: deal.final_price,
    selected_trader: deal.selected_trader,
    closing_reason: deal.closing_reason,

    // 통계
    total_quotes_received: deal.total_quotes_received,
    negotiation_rounds: deal.negotiation_rounds,
    duration_minutes: deal.duration_minutes,
    response_time_minutes: deal.response_time_minutes,

    // 판매자 관련
    requested_traders: deal.requested_traders,
    seller_contexts: deal.seller_contexts,

    // 읽지 않은 메시지
    unread_count: deal.unread_count,
    buyer_unread_count: deal.buyer_unread_count,
    seller_unread_count: deal.seller_unread_count,
  };
}

export function MockupDealDetailModal({ deal, open, onClose }: MockupDealDetailModalProps) {
  // DealScoreboard를 TradingSession 형태로 변환
  const session = useMemo(() => dealToSession(deal), [deal]);

  // 원본 DealDetailModal 컴포넌트를 그대로 사용
  // API 호출은 실패하지만 UI는 정상 작동
  return (
    <DealDetailModal
      session={session as any}
      open={open}
      onClose={onClose}
    />
  );
}
