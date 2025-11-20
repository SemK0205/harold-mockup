/**
 * API 엔드포인트 함수들
 * TanStack Query에서 사용
 */

import { apiClient } from "./client";
import type {
  TradingSession,
  AISuggestion,
  ChatMessage,
  OutgoingMessage,
  ApproveAISuggestionRequest,
  ApproveAISuggestionResponse,
  RejectAISuggestionRequest,
  RejectAISuggestionResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  CustomAIOptionRequest,
  CustomAIOptionResponse,
  AnalyticsData,
  PaginatedResponse,
  RoomInfo,
} from "@/types";

// ============================================
// Trading Sessions API
// ============================================

export const tradingSessionsAPI = {
  // 모든 활성 세션 조회
  getActiveSessions: async (): Promise<TradingSession[]> => {
    const response = await apiClient.get("/sessions/active");
    return response.data;
  },

  // 특정 세션 조회
  getSessionById: async (sessionId: string): Promise<TradingSession> => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // 세션 종료
  closeSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/sessions/${sessionId}/close`);
    return response.data;
  },
};

// ============================================
// AI Suggestions API
// ============================================

export const aiSuggestionsAPI = {
  // 모든 대기중인 AI 제안 조회
  getPendingSuggestions: async (): Promise<AISuggestion[]> => {
    const response = await apiClient.get("/ai-suggestions/pending");
    return response.data;
  },

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

  // 커스텀 옵션 전송
  sendCustomOption: async (
    data: CustomAIOptionRequest
  ): Promise<CustomAIOptionResponse> => {
    const response = await apiClient.post("/ai-suggestions/custom", data);
    return response.data;
  },
};

// ============================================
// Chat Messages API
// ============================================

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
// Outgoing Messages API
// ============================================

export const outgoingMessagesAPI = {
  // 대기중인 발신 메시지 조회
  getPendingMessages: async (): Promise<OutgoingMessage[]> => {
    const response = await apiClient.get("/outgoing-messages/pending");
    return response.data;
  },

  // 발신 메시지 상태 조회
  getMessageStatus: async (messageId: number): Promise<OutgoingMessage> => {
    const response = await apiClient.get(`/outgoing-messages/${messageId}`);
    return response.data;
  },
};

// ============================================
// Analytics API
// ============================================

export const analyticsAPI = {
  // 통계 데이터 조회
  getAnalytics: async (): Promise<AnalyticsData> => {
    const response = await apiClient.get("/analytics");
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
