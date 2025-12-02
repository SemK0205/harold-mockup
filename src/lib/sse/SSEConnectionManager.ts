/**
 * SSE Connection Manager
 * 단일 SSE 연결을 통해 모든 실시간 메시지를 관리
 * 중복 연결 방지 및 메시지 중복 제거
 */

import type { ChatMessage } from '@/types';
import { getApiUrl } from '@/lib/api/client';

type MessageListener = (message: ChatMessage) => void;
type ConnectionListener = (connected: boolean) => void;

class SSEConnectionManager {
  private static instance: SSEConnectionManager;
  private eventSource: EventSource | null = null;
  private messageListeners: Map<string, Set<MessageListener>> = new Map();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private processedMessages: Set<number> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000;
  private isConnected = false;
  private apiUrl: string;

  private constructor() {
    // getApiUrl()은 동적으로 데모 모드를 감지하므로 connect() 시점에 호출
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:59234';
  }

  static getInstance(): SSEConnectionManager {
    if (!SSEConnectionManager.instance) {
      SSEConnectionManager.instance = new SSEConnectionManager();
    }
    return SSEConnectionManager.instance;
  }

  // 연결 시작
  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('[SSE Manager] Already connected');
      return;
    }

    this.cleanup();
    console.log('[SSE Manager] Connecting to SSE...');

    try {
      // 데모 모드 감지하여 적절한 API URL 사용
      const currentApiUrl = getApiUrl();
      this.eventSource = new EventSource(`${currentApiUrl}/sse/messages`);

      this.eventSource.addEventListener('connected', () => {
        console.log('[SSE Manager] Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
      });

      this.eventSource.addEventListener('new_message', (event) => {
        try {
          const data = JSON.parse(event.data);

          // 중복 메시지 체크
          if (this.processedMessages.has(data.id || data.message_id)) {
            return;
          }

          this.processedMessages.add(data.id || data.message_id);

          // ChatMessage 형식으로 변환
          const message: ChatMessage = {
            message_id: data.id || data.message_id,
            room_name: data.room_name,
            sender: data.sender,
            message: data.message,
            timestamp: data.created_at,
            package_name: data.platform || 'com.kakao.talk',
            direction: 'incoming',
            created_at: data.created_at,
          };

          // 해당 room의 리스너들에게 전달
          this.notifyMessageListeners(data.room_name, message);
        } catch (error) {
          console.error('[SSE Manager] Failed to parse message:', error);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // Keep-alive signal
      });

      this.eventSource.onerror = (error) => {
        console.error('[SSE Manager] Connection error:', error);
        this.handleError();
      };

    } catch (error) {
      console.error('[SSE Manager] Failed to create EventSource:', error);
      this.handleError();
    }
  }

  // 에러 처리 및 재연결
  private handleError(): void {
    this.isConnected = false;
    this.notifyConnectionListeners(false);

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`[SSE Manager] Reconnecting... (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.RECONNECT_DELAY);
    } else {
      console.error('[SSE Manager] Max reconnect attempts reached');
    }
  }

  // 메시지 구독
  subscribe(key: string, listener: MessageListener): () => void {
    if (!this.messageListeners.has(key)) {
      this.messageListeners.set(key, new Set());
    }

    this.messageListeners.get(key)!.add(listener);

    // 아직 연결되지 않았으면 연결 시작
    if (!this.eventSource) {
      this.connect();
    }

    // 구독 해제 함수 반환
    return () => {
      this.unsubscribe(key, listener);
    };
  }

  // 구독 해제
  private unsubscribe(key: string, listener: MessageListener): void {
    const listeners = this.messageListeners.get(key);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.messageListeners.delete(key);
      }
    }

    // 모든 구독이 해제되면 연결 종료
    if (this.messageListeners.size === 0) {
      this.disconnect();
    }
  }

  // 연결 상태 구독
  subscribeConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);

    // 현재 상태 즉시 알림
    listener(this.isConnected);

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  // 메시지 리스너 알림
  private notifyMessageListeners(roomName: string, message: ChatMessage): void {
    // 특정 room 리스너
    const roomListeners = this.messageListeners.get(roomName);
    if (roomListeners) {
      roomListeners.forEach(listener => listener(message));
    }

    // 전체 메시지 리스너 (room_name = '*')
    const allListeners = this.messageListeners.get('*');
    if (allListeners) {
      allListeners.forEach(listener => listener(message));
    }
  }

  // 연결 상태 리스너 알림
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // 연결 종료
  disconnect(): void {
    console.log('[SSE Manager] Disconnecting...');
    this.cleanup();
  }

  // 정리
  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
  }

  // 처리된 메시지 캐시 정리 (메모리 관리)
  clearProcessedMessages(): void {
    // 최근 1000개만 유지
    if (this.processedMessages.size > 1000) {
      const messagesToKeep = Array.from(this.processedMessages).slice(-1000);
      this.processedMessages = new Set(messagesToKeep);
    }
  }

  // 디버깅용 상태 확인
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      listenerCount: this.messageListeners.size,
      processedMessageCount: this.processedMessages.size,
      readyState: this.eventSource?.readyState
    };
  }
}

export default SSEConnectionManager;