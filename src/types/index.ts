/**
 * Harold Web Dashboard - TypeScript Type Definitions
 * Pydantic 모델을 TypeScript로 변환
 */

// ============================================
// Trading Session Types
// ============================================

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

// Analytics Data
export interface AnalyticsData {
  total_trades: number;
  completed_trades: number;
  total_revenue: number;
  revenue_by_country: Record<string, number>;
  revenue_by_port: Record<string, number>;
  revenue_by_trader: Record<string, number>;
  trades_by_month: { month: string; count: number; revenue: number }[];
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
