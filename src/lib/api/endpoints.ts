/**
 * API 엔드포인트 함수들
 * TanStack Query에서 사용
 */

import { apiClient } from "./client";
import type {
  AISuggestion,
  ChatMessage,
  ApproveAISuggestionRequest,
  ApproveAISuggestionResponse,
  RejectAISuggestionRequest,
  RejectAISuggestionResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  PaginatedResponse,
  RoomInfo,
} from "@/types";

// ============================================
// AI Suggestions API
// ============================================

export const aiSuggestionsAPI = {
  // 특정 세션의 AI 제안 조회
  getSuggestionsBySession: async (sessionId: string): Promise<AISuggestion[]> => {
    const response = await apiClient.get(`/ai-suggestions/session/${sessionId}`);
    return response.data;
  },

  // AI 제안 승인
  approveSuggestion: async (
    data: ApproveAISuggestionRequest
  ): Promise<ApproveAISuggestionResponse> => {
    const response = await apiClient.post("/ai-suggestions/approve", data);
    return response.data;
  },

  // AI 제안 거부
  rejectSuggestion: async (
    data: RejectAISuggestionRequest
  ): Promise<RejectAISuggestionResponse> => {
    const response = await apiClient.post("/ai-suggestions/reject", data);
    return response.data;
  },
};

// ============================================
// Room Category API
// ============================================

export const roomCategoryAPI = {
  // 채팅방 카테고리 설정
  setCategory: async (roomName: string, platform: string, category: "buy" | "sell" | "other") => {
    const response = await apiClient.post("/rooms/category", {
      room_name: roomName,
      platform,
      category,
    });
    return response.data;
  },
};

// ============================================
// Chat Messages API
// ============================================

export const chatMessagesAPI = {
  // 특정 채팅방 메시지 조회 (페이지네이션)
  getMessagesByRoom: async (
    roomName: string,
    platform: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<ChatMessage>> => {
    const response = await apiClient.get(`/chats/${encodeURIComponent(roomName)}/messages`, {
      params: { platform, page, limit },
    });
    return response.data;
  },

  // 특정 세션의 모든 메시지 조회
  getMessagesBySession: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/messages/session/${sessionId}`);
    return response.data;
  },

  // 메시지 전송
  sendMessage: async (data: SendChatMessageRequest): Promise<SendChatMessageResponse> => {
    const response = await apiClient.post("/messages/send", data);
    return response.data;
  },

  // 모든 채팅방 목록 조회
  getAllRooms: async (): Promise<RoomInfo[]> => {
    const response = await apiClient.get("/messages/rooms");
    return response.data;
  },
};

// ============================================
// Config API
// ============================================

export const configAPI = {
  // 우리 회사 발신자 목록 조회
  getOurCompanySenders: async (): Promise<string[]> => {
    const response = await apiClient.get("/config/our-company-senders");
    return response.data.senders;
  },
};

// ============================================
// Deal Scoreboard API
// ============================================

// ============================================
// Quick Reply API
// ============================================

export interface QuickReplyTemplate {
  id: number;
  template_text: string;
  category: string;
  sort_order: number;
}

export const quickReplyAPI = {
  // 빠른 응답 템플릿 목록 조회
  getTemplates: async (category?: string): Promise<QuickReplyTemplate[]> => {
    const response = await apiClient.get("/api/quick-replies", {
      params: category ? { category } : {},
    });
    return response.data.templates;
  },

  // 빠른 응답 전송
  send: async (roomName: string, templateText: string): Promise<{ success: boolean; message_id?: number }> => {
    const response = await apiClient.post("/api/quick-replies/send", {
      room_name: roomName,
      template_text: templateText,
    });
    return response.data;
  },

  // 사용자 정의 템플릿 추가
  addTemplate: async (templateText: string, category: string = "default"): Promise<{ success: boolean; id: number }> => {
    const response = await apiClient.post("/api/quick-replies", {
      template_text: templateText,
      category,
    });
    return response.data;
  },

  // 템플릿 삭제
  deleteTemplate: async (templateId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/api/quick-replies/${templateId}`);
    return response.data;
  },
};

// ============================================
// Statistics API
// ============================================

export interface StatsOverview {
  overview: {
    active_sessions: number;
    completed_sessions: number;
    deal_success_sessions: number;
    deal_failed_sessions: number;
    total_sessions: number;
    deal_success_rate: number;
  };
  period: {
    today: number;
    this_week: number;
    this_month: number;
  };
}

export interface DailyStats {
  date: string;
  created: number;
  closed: number;
  deal_success: number;
}

export interface TraderStats {
  trader_room_name: string;
  quote_count: number;
  session_count: number;
  selected_count: number;
  select_rate: number;
}

export interface CustomerStats {
  customer_room_name: string;
  inquiry_count: number;
  deal_success_count: number;
  closed_count: number;
  deal_rate: number;
}

export interface PortStats {
  port: string;
  inquiry_count: number;
  deal_success_count: number;
}

export const statsAPI = {
  // 전체 현황 요약
  getOverview: async (): Promise<StatsOverview> => {
    const response = await apiClient.get("/api/stats/overview");
    return response.data;
  },

  // 일별 통계
  getDaily: async (days: number = 7): Promise<{ data: DailyStats[] }> => {
    const response = await apiClient.get("/api/stats/daily", { params: { days } });
    return response.data;
  },

  // 트레이더별 통계
  getTraders: async (days: number = 30): Promise<{ traders: TraderStats[] }> => {
    const response = await apiClient.get("/api/stats/traders", { params: { days } });
    return response.data;
  },

  // 고객별 통계
  getCustomers: async (days: number = 30): Promise<{ customers: CustomerStats[] }> => {
    const response = await apiClient.get("/api/stats/customers", { params: { days } });
    return response.data;
  },

  // 포트별 통계
  getPorts: async (days: number = 30): Promise<{ ports: PortStats[] }> => {
    const response = await apiClient.get("/api/stats/ports", { params: { days } });
    return response.data;
  },
};

// ============================================
// Quote Comparison API
// ============================================

export interface QuoteComparison {
  session_id: string;
  vessel_name: string;
  port: string;
  customer_room_name: string;
  quotes: Array<{
    trader: string;
    fuel_type: string;
    quantity: number | null;
    price: number | null;
    price_unit: string;
    barge_fee: number | null;
    earliest: string;
    term: string;
    quoted_at: string;
  }>;
  comparison: Record<string, {
    min_price: number;
    max_price: number;
    avg_price: number;
    quote_count: number;
    best_trader: string;
  }>;
  markdown_table: string;
}

export const quoteComparisonAPI = {
  // 견적 비교표 조회
  getComparison: async (sessionId: string): Promise<QuoteComparison> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/quote-comparison`);
    return response.data;
  },

  // 텍스트 형식 견적 비교표
  getComparisonText: async (sessionId: string): Promise<{ text: string }> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/quote-comparison/text`);
    return response.data;
  },
};

// ============================================
// Margin Calculator API
// ============================================

export interface MarginCalculateRequest {
  buy_price: number;
  sell_price: number;
  quantity: number;
  barge_fee?: number;
  additional_cost?: number;
}

export interface MarginCalculateResult {
  input: MarginCalculateRequest;
  result: {
    buy_total: number;
    sell_total: number;
    barge_total: number;
    gross_margin: number;
    net_margin: number;
    margin_per_mt: number;
    margin_rate: number;
  };
}

export interface MarginEstimate {
  session_id: string;
  estimates: Array<{
    fuel_type: string;
    buy_price: number;
    sell_price: number;
    quantity: number;
    gross_margin: number;
    margin_per_mt: number;
  }>;
  total_estimated_margin: number;
}

export const marginAPI = {
  // 마진 계산
  calculate: async (data: MarginCalculateRequest): Promise<MarginCalculateResult> => {
    const response = await apiClient.post("/api/margin/calculate", data);
    return response.data;
  },

  // 세션 예상 마진
  getSessionEstimate: async (sessionId: string, sellPrice?: number): Promise<MarginEstimate> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/margin-estimate`, {
      params: sellPrice ? { sell_price: sellPrice } : {},
    });
    return response.data;
  },
};

// ============================================
// Customer History API
// ============================================

export interface CustomerInfo {
  customer_room_name: string;
  inquiry_count: number;
  deal_success_count: number;
  deal_rate: number;
  last_inquiry_at: string;
}

export interface CustomerHistory {
  customer_room_name: string;
  summary: {
    total_inquiries: number;
    deal_success: number;
    deal_failed: number;
    active_sessions: number;
    deal_rate: number;
  };
  preferred_traders: Array<{ trader: string; deal_count: number }>;
  frequent_ports: Array<{ port: string; count: number }>;
  sessions: Array<{
    session_id: string;
    vessel_name: string;
    port: string;
    fuel_types: string;
    status: string;
    selected_trader: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface CustomerVessel {
  vessel_name: string;
  imo: string | null;
  inquiry_count: number;
  deal_success_count: number;
  last_inquiry_at: string;
}

export const customerAPI = {
  // 고객 목록 조회
  getList: async (days: number = 90, limit: number = 50): Promise<{ customers: CustomerInfo[] }> => {
    const response = await apiClient.get("/api/customers", { params: { days, limit } });
    return response.data;
  },

  // 고객 상세 히스토리
  getHistory: async (customerRoomName: string, days: number = 180): Promise<CustomerHistory> => {
    const response = await apiClient.get(`/api/customers/${encodeURIComponent(customerRoomName)}/history`, {
      params: { days },
    });
    return response.data;
  },

  // 고객의 선박 목록
  getVessels: async (customerRoomName: string, days: number = 365): Promise<{ vessels: CustomerVessel[] }> => {
    const response = await apiClient.get(`/api/customers/${encodeURIComponent(customerRoomName)}/vessels`, {
      params: { days },
    });
    return response.data;
  },
};

// ============================================
// Order History API (SEANERGY_PARTNER)
// ============================================

export interface OrderHistoryItem {
  order_id: number;
  vessel_name: string;
  imo: string;
  port: string;
  eta: string;
  order_date: string;
  order_state: number;
  buyer_name: string;
  supplier_name: string;
  fuel_info: string;
  total_amount: number | null;
}

export const orderHistoryAPI = {
  // 선박(IMO) 과거 주문 이력
  getByVessel: async (imo: string, limit: number = 5): Promise<{ orders: OrderHistoryItem[] }> => {
    const response = await apiClient.get(`/api/order-history/vessel/${imo}`, { params: { limit } });
    return response.data;
  },

  // 고객 과거 주문 이력
  getByCustomer: async (customerName: string, limit: number = 10): Promise<{ orders: OrderHistoryItem[] }> => {
    const response = await apiClient.get(`/api/order-history/customer/${encodeURIComponent(customerName)}`, {
      params: { limit },
    });
    return response.data;
  },

  // 세션 기반 자동 조회
  getBySession: async (sessionId: string): Promise<{
    vessel_history: OrderHistoryItem[];
    customer_history: OrderHistoryItem[];
  }> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/order-history`);
    return response.data;
  },
};

// ============================================
// Deal Scoreboard API
// ============================================

export const dealScoreboardAPI = {
  // 전광판 데이터 조회
  getDeals: async (params?: {
    status?: string;
    port?: string;
    customer?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: any[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const response = await apiClient.get("/deals/scoreboard", { params });
    return response.data;
  },

  // 통계 데이터 조회
  getStatistics: async (): Promise<any> => {
    const response = await apiClient.get("/deals/statistics");
    return response.data;
  },

  // 세션 상태 업데이트
  updateSessionStatus: async (
    sessionId: string,
    status: string,
    params?: {
      closing_reason?: string;
      selected_trader?: string;
      final_price?: number;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/sessions/${sessionId}/status`, {
      status,
      ...params,
    });
    return response.data;
  },

  // 견적 상태 업데이트
  updateQuoteStatus: async (
    sessionId: string,
    quoteIndex: number,
    status: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(
      `/sessions/${sessionId}/quotes/${quoteIndex}/status`,
      { status }
    );
    return response.data;
  },
};
