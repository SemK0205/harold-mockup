/**
 * Harold Web Dashboard - TypeScript Type Definitions
 * Pydantic 모델을 TypeScript로 변환
 */

// ============================================
// Trading Session Types
// ============================================

// 판매자별 개별 컨텍스트 (각 판매자의 진행 단계)
export type SellerStatus = "waiting_quote" | "quote_received" | "no_offer" | "renegotiating";

export interface SellerQuoteData {
  fuel1_price?: string;
  fuel2_price?: string;
  fuel3_price?: string;
  barge_fee?: string;
}

export interface SellerContext {
  status: SellerStatus;
  quote: SellerQuoteData | null;
  earliest?: string | null;
  requested_at?: string;
  received_at?: string;
  no_offer_reason?: string;
  // 수집 필요 필드 (단계에 따라 동적으로 결정)
  required_fields?: SellerRequiredField[];
}

// 판매자에게 수집해야 하는 필드 정의
export interface SellerRequiredField {
  key: keyof SellerQuoteData | "earliest" | "no_offer_reason";
  label: string;
  label_ko: string;
  required: boolean;  // 필수 여부
  filled: boolean;    // 채워졌는지 여부
  value?: string;     // 현재 값
}

export interface TradingSession {
  session_id: string; // UUID
  customer_room_name: string;
  original_inquiry: string;
  port: string | null;
  fuel_type: string | null;
  vessel_name: string | null;
  quantity: string | null;
  fuel_type2: string | null;
  quantity2: string | null;
  delivery_date: string | null;
  requested_traders: string[]; // JSON array
  quotes: Quote[]; // JSONB array
  status: "active" | "closed";
  created_at: string; // ISO timestamp
  closed_at: string | null; // ISO timestamp
  seller_contexts?: Record<string, SellerContext>; // 판매자별 개별 컨텍스트
  stage?: string; // 현재 딜 단계
}

export interface Quote {
  trader: string;
  message: string;
  price: string;
  received_at: string; // ISO timestamp
  status?: string;
  details?: string;
  notes?: string;
}

// ============================================
// AI Suggestion Types
// ============================================

export interface AISuggestion {
  id: number;
  room_name: string;
  sender: string;
  message: string;
  category: AICategory;
  confidence: number; // 0.0 ~ 1.0
  suggestions: AIOption[];
  original_message: OriginalMessage | null;
  trading_context: TradingContext | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string; // ISO timestamp
}

export type AICategory =
  | "inquiry"
  | "quote"
  | "approval"
  | "rejection"
  | "negotiation"
  | "no_offer"
  | "greeting"
  | "acknowledgment"
  | "unknown";

export interface AIOption {
  option: number;
  action: "send_to_suppliers" | "reply_to_customer" | "ignore" | "send_multiple";
  targets: AITarget[] | string[]; // send_multiple uses AITarget[], others use string[]
  message: string;
  reason: string;
  isSelected?: boolean; // Frontend state
}

export interface AITarget {
  room: string;
  message: string;
}

export interface OriginalMessage {
  room_name: string;
  sender: string;
  message: string;
  created_at: string;
}

export interface TradingContext {
  vessel_name: string | null;
  port: string | null;
  delivery_date: string | null;
  eta: string | null;  // alias for delivery_date (API returns as eta)
  fuel_type: string | null;
  quantity: string | null;
  fuel_type2: string | null;
  quantity2: string | null;
}

// FullContext 완성도 확인을 위한 헬퍼 타입
export interface FullContextStatus {
  vessel_name: "complete" | "missing";
  port: "complete" | "missing";
  delivery_date: "complete" | "missing";
  fuel_type: "complete" | "missing";
  quantity: "complete" | "missing";
}

// ============================================
// Chat Message Types
// ============================================

export interface ChatMessage {
  message_id: number;
  room_name: string;
  sender: string;
  message: string;
  package_name: "com.kakao.talk" | "com.kakao.yellowid" | "com.whatsapp" | "com.wechat";
  direction: "incoming" | "outgoing";
  timestamp: string; // ISO timestamp
  created_at: string; // ISO timestamp
}

// ============================================
// Outgoing Message Types
// ============================================

export interface OutgoingMessage {
  id: number;
  target_room_name: string;
  message_content: string;
  package_name: "com.kakao.talk" | "com.kakao.yellowid" | "com.whatsapp" | "com.wechat";
  status: "pending" | "sent" | "failed";
  created_at: string; // ISO timestamp
  sent_at: string | null; // ISO timestamp
}

// ============================================
// Room Classification Types
// ============================================

export type RoomType = "trader" | "customer" | "unknown";

export interface RoomInfo {
  room_name: string;
  room_type?: RoomType;
  platform: "com.kakao.talk" | "com.kakao.yellowid" | "com.whatsapp" | "com.wechat";
  category?: "buy" | "sell" | "other" | null;
}

// ============================================
// API Request/Response Types
// ============================================

// AI Suggestion Approval
export interface ApproveAISuggestionRequest {
  suggestion_id: number;
  selected_options: number[]; // 선택된 옵션 번호 배열
  selected_targets?: Record<string, string[]>; // "옵션번호" -> 선택된 타겟 목록
}

export interface ApproveAISuggestionResponse {
  success: boolean;
  message: string;
  outgoing_message_ids?: number[];
}

// AI Suggestion Rejection
export interface RejectAISuggestionRequest {
  suggestion_id: number;
  rejection_reason: string | null;
}

export interface RejectAISuggestionResponse {
  success: boolean;
  message: string;
}

// Send Chat Message
export interface SendChatMessageRequest {
  room_name: string;
  message: string;
  platform: "kakao" | "kakao_biz" | "whatsapp" | "wechat";
}

export interface SendChatMessageResponse {
  success: boolean;
  message: string;
  outgoing_message_id?: number;
}

// Custom AI Option
export interface CustomAIOptionRequest {
  session_id: string;
  custom_message: string;
  target_rooms: string[];
  package_name: "com.kakao.talk" | "com.kakao.yellowid" | "com.whatsapp" | "com.wechat";
}

export interface CustomAIOptionResponse {
  success: boolean;
  message: string;
  outgoing_message_ids?: number[];
}

// ============================================
// Dashboard Data Types
// ============================================

// Deal Scoreboard Row
export interface DealScoreboardRow {
  session_id: string;
  vessel_name: string | null;
  eta: string | null; // delivery_date
  port: string | null;
  fuel1: string | null; // Primary fuel type
  fuel2: string | null; // Secondary fuel type (if multiple)
  customer_room_name: string;
  platform: "kakao" | "kakao_biz" | "whatsapp" | "wechat";
  status: "active" | "closed";
  created_at: string;
}

// ============================================
// Utility Types
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}

// ============================================
// Deal Stage Types (New Deal Flow)
// ============================================

/**
 * 딜 단계 정의
 * inquiry → deal_started → quote_collecting → customer_feedback/seller_feedback → deal_done/lost/no_offer
 */
export type DealStage =
  | "inquiry"           // 인쿼리 단계 (FullContext 수집 중)
  | "deal_started"      // 딜 시작 단계 (판매처에 인쿼리 송신)
  | "quote_collecting"  // 오퍼가격 취합 단계
  | "renegotiating"     // 조건 재협상 단계
  | "customer_feedback" // 선주 피드백 대기 단계
  | "seller_feedback"   // 판매측 피드백 대기 단계
  | "no_offer"          // 노오퍼 (종료)
  | "lost"              // 로스트 (종료)
  | "deal_done";        // 딜던 (종료)

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  inquiry: "Inquiry",
  deal_started: "Deal Started",
  quote_collecting: "Collecting Quotes",
  renegotiating: "Renegotiating",
  customer_feedback: "Awaiting Customer Feedback",
  seller_feedback: "Awaiting Seller Feedback",
  no_offer: "No Offer",
  lost: "Lost",
  deal_done: "Deal Done"
};

export const DEAL_STAGE_LABELS_KO: Record<DealStage, string> = {
  inquiry: "인쿼리",
  deal_started: "딜 시작",
  quote_collecting: "오퍼가격 취합",
  renegotiating: "조건 재협상",
  customer_feedback: "선주 피드백",
  seller_feedback: "판매측 피드백",
  no_offer: "노오퍼",
  lost: "로스트",
  deal_done: "딜던"
};

export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  inquiry: "bg-blue-100 text-blue-800",
  deal_started: "bg-indigo-100 text-indigo-800",
  quote_collecting: "bg-purple-100 text-purple-800",
  renegotiating: "bg-yellow-100 text-yellow-800",
  customer_feedback: "bg-orange-100 text-orange-800",
  seller_feedback: "bg-cyan-100 text-cyan-800",
  no_offer: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
  deal_done: "bg-green-100 text-green-800"
};

// ============================================
// Seller Required Fields by Stage
// ============================================

/**
 * 딜 단계와 유종 개수에 따라 판매자에게 수집해야 할 필드 목록 생성
 * @param stage 현재 딜 단계
 * @param fuelCount 유종 개수 (1, 2, 또는 3)
 * @param sellerContext 현재 판매자 컨텍스트 (기존 값 확인용)
 */
export function getSellerRequiredFields(
  stage: DealStage,
  fuelCount: number,
  sellerContext?: SellerContext | null
): SellerRequiredField[] {
  const fields: SellerRequiredField[] = [];
  const quote = sellerContext?.quote;

  // 셀러 개별 상태 확인
  const sellerStatus = sellerContext?.status;

  // waiting_quote, quote_received → 가격 수집 필요
  // renegotiating → 재협상 필드 필요
  // no_offer → 필드 없음
  const needsQuoteCollection = sellerStatus === "waiting_quote" || sellerStatus === "quote_received";
  const isRenegotiating = sellerStatus === "renegotiating";
  const isNoOffer = sellerStatus === "no_offer";

  // 오퍼가격취합: waiting_quote, quote_received 상태이거나 딜 단계가 quote_collecting/deal_started일 때
  // 단, no_offer 상태면 제외
  if (!isNoOffer && !isRenegotiating && (needsQuoteCollection || stage === "quote_collecting" || stage === "deal_started")) {
    // Fuel1 Price (항상 필요)
    fields.push({
      key: "fuel1_price",
      label: "Fuel1 Price",
      label_ko: "유종1 가격",
      required: true,
      filled: !!quote?.fuel1_price,
      value: quote?.fuel1_price
    });

    // Fuel2 Price (이종 유종인 경우)
    if (fuelCount >= 2) {
      fields.push({
        key: "fuel2_price",
        label: "Fuel2 Price",
        label_ko: "유종2 가격",
        required: true,
        filled: !!quote?.fuel2_price,
        value: quote?.fuel2_price
      });
    }

    // Fuel3 Price (3종 유종인 경우)
    if (fuelCount >= 3) {
      fields.push({
        key: "fuel3_price",
        label: "Fuel3 Price",
        label_ko: "유종3 가격",
        required: true,
        filled: !!quote?.fuel3_price,
        value: quote?.fuel3_price
      });
    }

    // Barge Fee (선택사항 - 판매자가 제공하면 추가됨)
    fields.push({
      key: "barge_fee",
      label: "Barge Fee",
      label_ko: "바지선 비용",
      required: false,
      filled: !!quote?.barge_fee,
      value: quote?.barge_fee
    });

    // Earliest Available (최단 공급 가능일) - 필수
    fields.push({
      key: "earliest",
      label: "Earliest",
      label_ko: "얼리",
      required: true,
      filled: !!sellerContext?.earliest,
      value: sellerContext?.earliest || undefined
    });
  }

  // 재협상 단계에서 추가 필드
  if (isRenegotiating) {
    // 가격 필드도 포함 (재협상이므로)
    fields.push({
      key: "fuel1_price",
      label: "Fuel1 Price",
      label_ko: "유종1 가격",
      required: true,
      filled: !!quote?.fuel1_price,
      value: quote?.fuel1_price
    });
    if (fuelCount >= 2) {
      fields.push({
        key: "fuel2_price",
        label: "Fuel2 Price",
        label_ko: "유종2 가격",
        required: true,
        filled: !!quote?.fuel2_price,
        value: quote?.fuel2_price
      });
    }
    fields.push({
      key: "barge_fee",
      label: "Barge Fee",
      label_ko: "바지선 비용",
      required: false,
      filled: !!quote?.barge_fee,
      value: quote?.barge_fee
    });
    fields.push({
      key: "earliest",
      label: "Earliest",
      label_ko: "얼리",
      required: true,
      filled: !!sellerContext?.earliest,
      value: sellerContext?.earliest || undefined
    });
  }

  // 판매측 피드백 단계 - 가격 재협상 응답 대기
  if (stage === "seller_feedback") {
    fields.push({
      key: "fuel1_price",
      label: "New Fuel1 Price",
      label_ko: "새 유종1 가격",
      required: false,
      filled: !!quote?.fuel1_price,
      value: quote?.fuel1_price
    });
    if (fuelCount >= 2) {
      fields.push({
        key: "fuel2_price",
        label: "New Fuel2 Price",
        label_ko: "새 유종2 가격",
        required: false,
        filled: !!quote?.fuel2_price,
        value: quote?.fuel2_price
      });
    }
    fields.push({
      key: "barge_fee",
      label: "Barge Fee",
      label_ko: "바지선 비용",
      required: false,
      filled: !!quote?.barge_fee,
      value: quote?.barge_fee
    });
  }

  return fields;
}

/**
 * 필수 필드가 모두 채워졌는지 확인
 */
export function areRequiredFieldsFilled(fields: SellerRequiredField[]): boolean {
  return fields.filter(f => f.required).every(f => f.filled);
}

/**
 * 채워진 필드 개수 / 전체 필드 개수 계산
 */
export function getFieldCompletionRatio(fields: SellerRequiredField[]): { filled: number; total: number; percentage: number } {
  const requiredFields = fields.filter(f => f.required);
  const filledCount = requiredFields.filter(f => f.filled).length;
  return {
    filled: filledCount,
    total: requiredFields.length,
    percentage: requiredFields.length > 0 ? Math.round((filledCount / requiredFields.length) * 100) : 100
  };
}

// ============================================
// Inquiry FullContext Types
// ============================================

export type InquiryType =
  | "inquiry_single_fuel_single_port"
  | "inquiry_single_fuel_multi_port"
  | "inquiry_dual_fuel_single_port"
  | "inquiry_dual_fuel_multi_port"
  | "inquiry_triple_fuel_single_port"
  | "inquiry_triple_fuel_multi_port";

export interface InquiryFullContext {
  VesselName?: string;
  IMO?: string;
  Port?: string;
  Port1?: string;
  Port2?: string;
  ETA?: string;
  Fuel?: string;
  FuelQuantity?: string;
  Fuel1?: string;
  Fuel1Quantity?: string;
  Fuel2?: string;
  Fuel2Quantity?: string;
  Fuel3?: string;
  Fuel3Quantity?: string;
}

// 인쿼리 수집 필드 정의
export interface InquiryRequiredField {
  key: keyof InquiryFullContext;
  label: string;
  label_ko: string;
  required: boolean;
  filled: boolean;
  value?: string;
  question_ko?: string; // 미완성 시 물어볼 질문
}

/**
 * 인쿼리 단계에서 선주측으로부터 수집해야 할 필드 목록 생성
 * @param fuelCount 유종 개수 (1, 2, 또는 3)
 * @param isMultiPort 다중 포트 여부
 * @param context 현재 인쿼리 컨텍스트
 */
export function getInquiryRequiredFields(
  fuelCount: number,
  isMultiPort: boolean,
  context?: InquiryFullContext | null
): InquiryRequiredField[] {
  const fields: InquiryRequiredField[] = [];

  // 선박명 (필수)
  fields.push({
    key: "VesselName",
    label: "Vessel Name",
    label_ko: "선박명",
    required: true,
    filled: !!context?.VesselName,
    value: context?.VesselName,
    question_ko: "배 이름이 어떻게 되나요?"
  });

  // IMO (선택 - 직접 조회해서 추가)
  fields.push({
    key: "IMO",
    label: "IMO Number",
    label_ko: "IMO 번호",
    required: false,
    filled: !!context?.IMO,
    value: context?.IMO
  });

  // 포트
  if (isMultiPort) {
    fields.push({
      key: "Port1",
      label: "Port 1",
      label_ko: "포트1",
      required: true,
      filled: !!context?.Port1,
      value: context?.Port1,
      question_ko: "포트가 어떻게 되나요?"
    });
    fields.push({
      key: "Port2",
      label: "Port 2",
      label_ko: "포트2",
      required: true,
      filled: !!context?.Port2,
      value: context?.Port2
    });
  } else {
    fields.push({
      key: "Port",
      label: "Port",
      label_ko: "포트",
      required: true,
      filled: !!context?.Port,
      value: context?.Port,
      question_ko: "포트가 어떻게 되나요?"
    });
  }

  // ETA (필수)
  fields.push({
    key: "ETA",
    label: "ETA",
    label_ko: "ETA",
    required: true,
    filled: !!context?.ETA,
    value: context?.ETA,
    question_ko: "ETA가 어떻게 되나요?"
  });

  // 유종별 필드
  if (fuelCount === 1) {
    fields.push({
      key: "Fuel",
      label: "Fuel Type",
      label_ko: "유종",
      required: true,
      filled: !!context?.Fuel,
      value: context?.Fuel
    });
    fields.push({
      key: "FuelQuantity",
      label: "Quantity",
      label_ko: "수량",
      required: true,
      filled: !!context?.FuelQuantity,
      value: context?.FuelQuantity,
      question_ko: "양이 어떻게 되나요?"
    });
  } else {
    // Fuel1
    fields.push({
      key: "Fuel1",
      label: "Fuel1 Type",
      label_ko: "유종1",
      required: true,
      filled: !!context?.Fuel1,
      value: context?.Fuel1
    });
    fields.push({
      key: "Fuel1Quantity",
      label: "Fuel1 Quantity",
      label_ko: "유종1 수량",
      required: true,
      filled: !!context?.Fuel1Quantity,
      value: context?.Fuel1Quantity,
      question_ko: "양이 어떻게 되나요?"
    });

    // Fuel2
    fields.push({
      key: "Fuel2",
      label: "Fuel2 Type",
      label_ko: "유종2",
      required: true,
      filled: !!context?.Fuel2,
      value: context?.Fuel2
    });
    fields.push({
      key: "Fuel2Quantity",
      label: "Fuel2 Quantity",
      label_ko: "유종2 수량",
      required: true,
      filled: !!context?.Fuel2Quantity,
      value: context?.Fuel2Quantity
    });

    // Fuel3 (3종인 경우)
    if (fuelCount >= 3) {
      fields.push({
        key: "Fuel3",
        label: "Fuel3 Type",
        label_ko: "유종3",
        required: true,
        filled: !!context?.Fuel3,
        value: context?.Fuel3
      });
      fields.push({
        key: "Fuel3Quantity",
        label: "Fuel3 Quantity",
        label_ko: "유종3 수량",
        required: true,
        filled: !!context?.Fuel3Quantity,
        value: context?.Fuel3Quantity
      });
    }
  }

  return fields;
}

/**
 * 인쿼리 FullContext 완성도 계산
 */
export function getInquiryCompletionRatio(fields: InquiryRequiredField[]): { filled: number; total: number; percentage: number } {
  const requiredFields = fields.filter(f => f.required);
  const filledCount = requiredFields.filter(f => f.filled).length;
  return {
    filled: filledCount,
    total: requiredFields.length,
    percentage: requiredFields.length > 0 ? Math.round((filledCount / requiredFields.length) * 100) : 100
  };
}

/**
 * 미완성 필드에 대한 질문 목록 생성
 */
export function getMissingFieldQuestions(fields: InquiryRequiredField[]): string[] {
  return fields
    .filter(f => f.required && !f.filled && f.question_ko)
    .map(f => f.question_ko!);
}

// ============================================
// Quote FullContext Types
// ============================================

export type QuoteType =
  | "quote_single_no_barge"
  | "quote_single_with_barge"
  | "quote_dual_no_barge"
  | "quote_dual_with_barge"
  | "quote_triple_no_barge"
  | "quote_triple_with_barge";

export interface QuoteFullContext {
  FuelPrice?: string;
  Fuel1Price?: string;
  Fuel2Price?: string;
  Fuel3Price?: string;
  BargeFee?: string;
}

// ============================================
// Renegotiation Types
// ============================================

export type RenegotiationIssue =
  | "schedule_issue"
  | "credit_issue"
  | "stock_issue"
  | "price_issue";

export type CustomerFeedbackType =
  | "earliest_request"
  | "price_negotiation"
  | "lost";

// ============================================
// Deal Scoreboard Types
// ============================================

export interface DealScoreboard {
  id: number;
  session_id: string;
  customer_room_name: string;
  vessel_name: string | null;
  port: string | null;
  fuel_type: string | null;
  quantity: string | null;
  fuel_type2: string | null;
  quantity2: string | null;
  delivery_date: string | null;
  status: "active" | "quoted" | "negotiating" | "closed_success" | "closed_failed" | "cancelled";
  stage?: DealStage; // 새로운 딜 단계
  created_at: string;
  updated_at: string | null;
  closed_at: string | null;
  final_price: number | null;
  selected_trader: string | null;
  closing_reason: string | null;
  total_quotes_received: number;
  negotiation_rounds: number;
  duration_minutes: number;
  response_time_minutes: number | null;
  quote_count: number;
  last_quote_time: string | null;
  requested_traders?: string[]; // 요청된 판매자 목록
  seller_contexts?: Record<string, SellerContext>; // 판매자별 컨텍스트
  unread_count?: number; // 읽지 않은 메시지 수 (고객방 + 판매자방 합계)
}

export interface DealStatistics {
  overall: {
    total_deals: number;
    active_deals: number;
    quoted_deals: number;
    negotiating_deals: number;
    successful_deals: number;
    failed_deals: number;
    cancelled_deals: number;
    success_rate: number;
    avg_response_time_minutes: number;
    avg_deal_duration_minutes: number;
    total_revenue: number;
    today_revenue: number;
  };
  by_port: Array<{
    port: string;
    total_deals: number;
    successful_deals: number;
    total_revenue: number;
    avg_deal_value: number;
    avg_duration_minutes: number;
  }>;
  by_trader: Array<{
    trader: string;
    total_deals: number;
    total_revenue: number;
    avg_deal_value: number;
    avg_negotiation_rounds: number;
    fastest_response: string;
    avg_response_minutes: number;
  }>;
  daily_trend: Array<{
    date: string;
    total_deals: number;
    successful_deals: number;
    failed_deals: number;
    revenue: number;
  }>;
}
