/**
 * TanStack Query Hooks
 * React Query를 사용한 데이터 페칭 훅
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatMessagesAPI } from "./endpoints";
import type { SendChatMessageRequest } from "@/types";

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
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
};

// ============================================
// Chat Messages Queries
// ============================================

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
