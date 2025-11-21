/**
 * Session Messages SSE Hook
 * 세션별 채팅 메시지 실시간 스트리밍
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:59234";

interface UseSessionMessagesSSEOptions {
  sessionId: string;
  enabled?: boolean;
}

interface UseSessionMessagesSSEReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
}

export function useSessionMessagesSSE(options: UseSessionMessagesSSEOptions): UseSessionMessagesSSEReturn {
  const { sessionId, enabled = true } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRoomsRef = useRef<string[]>([]);

  // 세션의 채팅방 목록 조회
  const fetchSessionRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        const rooms = [session.customer_room_name, ...(session.requested_traders || [])];
        sessionRoomsRef.current = rooms;
        return rooms;
      }
    } catch (e) {
      console.error("Failed to fetch session rooms:", e);
    }
    return [];
  }, [sessionId]);

  // 초기 메시지 로드
  const fetchInitialMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Failed to fetch initial messages:", e);
      setIsLoading(false);
    }
  }, [sessionId]);

  const connect = useCallback(async () => {
    if (!enabled || !sessionId) return;

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setIsLoading(true);

    // 세션 정보와 초기 메시지 로드
    await fetchSessionRooms();
    await fetchInitialMessages();

    // ChatManager와 동일한 SSE 엔드포인트 사용
    const url = `${API_BASE_URL}/sse/messages`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", () => {
      setIsConnected(true);
      setError(null);
    });

    eventSource.addEventListener("new_message", (event) => {
      try {
        const messageData = JSON.parse(event.data);
        const roomName = messageData.room_name;

        // 이 세션의 채팅방인지 확인
        if (sessionRoomsRef.current.includes(roomName)) {
          // 메시지 추가
          const newMessage: ChatMessage = {
            message_id: messageData.id,
            room_name: messageData.room_name,
            sender: messageData.sender,
            message: messageData.message,
            timestamp: messageData.created_at,
            package_name: messageData.platform || "chat_kakao",
            direction: "incoming",
            created_at: messageData.created_at,
          };

          setMessages(prev => {
            // 중복 체크
            if (prev.some(m => m.message_id === newMessage.message_id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      } catch (e) {
        console.error("Failed to parse new_message:", e);
      }
    });

    eventSource.addEventListener("heartbeat", () => {
      // Heartbeat received - connection is alive
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("Connection lost");
      eventSource.close();

      // 자동 재연결 (5초 후)
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [enabled, sessionId, fetchSessionRooms, fetchInitialMessages]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    messages,
    isConnected,
    error,
    isLoading,
  };
}
