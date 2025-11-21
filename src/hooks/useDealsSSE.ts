/**
 * Deals SSE Hook
 * 딜 업데이트 실시간 스트리밍
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { DealScoreboard } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:59234";

interface UseDealsSSEOptions {
  port?: string;
  status?: string;
  customer?: string;
  enabled?: boolean;
}

interface UseDealsSSEReturn {
  deals: DealScoreboard[];
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useDealsSSE(options: UseDealsSSEOptions = {}): UseDealsSSEReturn {
  const { port, status, customer, enabled = true } = options;

  const [deals, setDeals] = useState<DealScoreboard[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // URL 생성
    const params = new URLSearchParams();
    if (port) params.append("port", port);
    if (status) params.append("status", status);
    if (customer) params.append("customer", customer);

    const url = `${API_BASE_URL}/api/deals/stream${params.toString() ? `?${params.toString()}` : ""}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener("initial_data", (event) => {
      try {
        const data = JSON.parse(event.data);
        setDeals(data.deals || []);
      } catch (e) {
        console.error("Failed to parse initial_data:", e);
      }
    });

    eventSource.addEventListener("deal_update", (event) => {
      try {
        const data = JSON.parse(event.data);
        setDeals(data.deals || []);
      } catch (e) {
        console.error("Failed to parse deal_update:", e);
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
  }, [enabled, port, status, customer]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

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
    deals,
    isConnected,
    error,
    reconnect,
  };
}
