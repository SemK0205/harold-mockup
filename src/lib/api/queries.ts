/**
 * TanStack Query Hooks
 * React Query를 사용한 데이터 페칭 훅
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tradingSessionsAPI,
  aiSuggestionsAPI,
  chatMessagesAPI,
  analyticsAPI,
} from "./endpoints";
import type {
  ApproveAISuggestionRequest,
  RejectAISuggestionRequest,
  SendChatMessageRequest,
} from "@/types";

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  tradingSessions: {
    all: ["trading-sessions"] as const,
    active: () => [...queryKeys.tradingSessions.all, "active"] as const,
  },
  aiSuggestions: {
    all: ["ai-suggestions"] as const,
    bySession: (sessionId: string) =>
      [...queryKeys.aiSuggestions.all, "session", sessionId] as const,
  },
  chatMessages: {
    all: ["chat-messages"] as const,
    byRoom: (roomName: string, page: number, limit: number) =>
      [...queryKeys.chatMessages.all, roomName, page, limit] as const,
    bySession: (sessionId: string) =>
      [...queryKeys.chatMessages.all, "session", sessionId] as const,
    rooms: () => [...queryKeys.chatMessages.all, "rooms"] as const,
  },
  outgoingMessages: {
    all: ["outgoing-messages"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
  },
};

// ============================================
// Trading Sessions Queries
// ============================================

export const useTradingSessions = () => {
  return useQuery({
    queryKey: queryKeys.tradingSessions.active(),
    queryFn: tradingSessionsAPI.getActiveSessions,
    refetchInterval: 3000, // 3초마다 자동 새로고침
  });
};

// ============================================
// AI Suggestions Queries
// ============================================

export const useSessionSuggestions = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.aiSuggestions.bySession(sessionId),
    queryFn: () => aiSuggestionsAPI.getSuggestionsBySession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 3000, // 3초마다 자동 새로고침
  });
};

export const useApproveSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveAISuggestionRequest) =>
      aiSuggestionsAPI.approveSuggestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiSuggestions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.outgoingMessages.all });
    },
  });
};

export const useRejectSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RejectAISuggestionRequest) =>
      aiSuggestionsAPI.rejectSuggestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiSuggestions.all });
    },
  });
};

// ============================================
// Chat Messages Queries
// ============================================

export const useSessionMessages = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.chatMessages.bySession(sessionId),
    queryFn: () => chatMessagesAPI.getMessagesBySession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 3000, // 3초마다 자동 새로고침
  });
};

export const useChatRooms = () => {
  return useQuery({
    queryKey: queryKeys.chatMessages.rooms(),
    queryFn: chatMessagesAPI.getAllRooms,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendChatMessageRequest) => chatMessagesAPI.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.outgoingMessages.all });
    },
  });
};

// ============================================
// Analytics Queries
// ============================================

export const useAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.analytics.all,
    queryFn: analyticsAPI.getAnalytics,
    staleTime: 60000, // 1분간 캐싱
  });
};
