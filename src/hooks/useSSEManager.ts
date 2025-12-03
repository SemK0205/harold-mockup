/**
 * useSSEManager Hook
 * SSE Connection Manager를 React 컴포넌트에서 쉽게 사용하기 위한 Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import SSEConnectionManager from '@/lib/sse/SSEConnectionManager';
import type { ChatMessage } from '@/types';

interface UseSSEManagerOptions {
  roomName?: string;
  onMessage?: (message: ChatMessage) => void;
  enabled?: boolean;
}

interface UseSSEManagerReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  clearMessages: () => void;
}

export function useSSEManager({
  roomName,
  onMessage,
  enabled = true
}: UseSSEManagerOptions): UseSSEManagerReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const processedIds = useRef<Set<number>>(new Set());
  const manager = useRef<SSEConnectionManager | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    // Manager 인스턴스 가져오기
    manager.current = SSEConnectionManager.getInstance();

    // 연결 상태 구독
    const unsubscribeConnection = manager.current.subscribeConnection((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeConnection();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !roomName) return;

    const handleMessage = (message: ChatMessage) => {
      // 중복 체크 (추가 안전장치)
      if (processedIds.current.has(message.message_id)) {
        return;
      }
      processedIds.current.add(message.message_id);

      // 메시지 추가
      setMessages(prev => [...prev, message]);

      // 콜백 호출
      if (onMessage) {
        onMessage(message);
      }
    };

    // 메시지 구독
    const unsubscribe = manager.current?.subscribe(roomName, handleMessage);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled, roomName, onMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    processedIds.current.clear();
  }, []);

  return {
    messages,
    isConnected,
    clearMessages
  };
}