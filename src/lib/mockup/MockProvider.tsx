/**
 * Mock Provider for Investor Demo
 * 투자자 시연용 목업 상태 관리 및 시뮬레이션
 */

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  DealScoreboard,
  DealStatistics,
  ChatMessage,
  RoomInfo,
  AISuggestion,
  DealStage,
} from "@/types";
import {
  MOCK_DEALS,
  MOCK_CHAT_ROOMS,
  MOCK_MESSAGES,
  MOCK_AI_SUGGESTIONS,
  MOCK_STATISTICS,
  generateNewInquiryDeal,
  generateNewMessage,
} from "./mockData";

// ============================================
// Context Types
// ============================================

interface MockContextType {
  // State
  deals: DealScoreboard[];
  chatRooms: RoomInfo[];
  messages: Record<string, ChatMessage[]>;
  aiSuggestions: Record<string, AISuggestion[]>;
  statistics: DealStatistics;
  isConnected: boolean;
  isMockupMode: boolean;

  // Deal Actions
  updateDealStatus: (sessionId: string, status: DealScoreboard["status"]) => void;
  updateDealStage: (sessionId: string, stage: DealStage) => void;
  deleteDeal: (sessionId: string) => Promise<boolean>;
  getDealById: (sessionId: string) => DealScoreboard | undefined;

  // Message Actions
  sendMessage: (roomName: string, message: string, platform?: string) => Promise<void>;
  getMessagesForRoom: (roomName: string) => ChatMessage[];
  markRoomAsRead: (roomName: string) => void;

  // AI Suggestion Actions
  approveSuggestion: (suggestionId: number, selectedOptions: number[]) => Promise<void>;
  rejectSuggestion: (suggestionId: number, reason?: string) => Promise<void>;
  getSuggestionsForSession: (sessionId: string) => AISuggestion[];

  // Demo Control Actions (DemoControlBar용)
  triggerNewInquiry: () => void;
  triggerNewMessage: (roomName: string) => void;
  triggerQuoteReceived: (sessionId: string, trader: string) => void;
  resetToInitial: () => void;

  // Notification
  showNotification: (title: string, body: string) => void;
}

const MockContext = createContext<MockContextType | null>(null);

// ============================================
// Hook
// ============================================

export function useMockContext() {
  const context = useContext(MockContext);
  if (!context) {
    throw new Error("useMockContext must be used within MockProvider");
  }
  return context;
}

// ============================================
// Provider Component
// ============================================

interface MockProviderProps {
  children: React.ReactNode;
}

export function MockProvider({ children }: MockProviderProps) {
  // State
  const [deals, setDeals] = useState<DealScoreboard[]>(
    // 최신 순으로 정렬 (created_at 내림차순)
    [...MOCK_DEALS].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  );
  const [chatRooms] = useState<RoomInfo[]>(MOCK_CHAT_ROOMS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(MOCK_MESSAGES);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion[]>>(MOCK_AI_SUGGESTIONS);
  const [statistics] = useState<DealStatistics>(MOCK_STATISTICS);
  const [isConnected, setIsConnected] = useState(false);

  // Notification permission
  const notificationPermissionRef = useRef<NotificationPermission>("default");

  // Simulate connection on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ============================================
  // Mock Fetch Interceptor
  // 원본 DealDetailModal의 API 호출을 가로채서 Mock 데이터 반환
  // ============================================
  useEffect(() => {
    const originalFetch = window.fetch;

    // Mock fetch function
    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      // Next.js 내부 요청은 가로채지 않고 원본 fetch 사용
      if (url.includes('_rsc=') || url.includes('__next') || url.includes('.txt?')) {
        return originalFetch(input, init);
      }

      console.log('[MockProvider] Fetch intercepted:', url, 'method:', init?.method);

      // /chats/rooms API - 채팅방 목록
      if (url.includes('/chats/rooms')) {
        const rooms = chatRooms.map(room => ({
          room_name: room.room_name,
          platform: room.platform,
        }));
        return new Response(JSON.stringify({ rooms }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /chats/{roomName}/messages API - 채팅 메시지
      const messagesMatch = url.match(/\/chats\/([^/]+)\/messages/);
      if (messagesMatch) {
        const roomName = decodeURIComponent(messagesMatch[1]);
        const roomMessages = messages[roomName] || [];
        return new Response(JSON.stringify({ data: roomMessages, total: roomMessages.length, page: 1, limit: 100 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /chats/{roomName}/mark-read API
      if (url.includes('/mark-read')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /messages/send API - 메시지 전송
      if (url.includes('/messages/send') && init?.method === 'POST') {
        try {
          const body = JSON.parse(init.body as string);
          const { room_name, message: msgText, platform } = body;

          // 메시지 추가
          const newMessage: ChatMessage = {
            message_id: Date.now(),
            room_name: room_name,
            sender: "Harold AI",
            message: msgText,
            package_name: platform === 'kakao' ? 'com.kakao.talk' : platform === 'kakao_biz' ? 'com.kakao.yellowid' : 'com.kakao.talk',
            direction: "outgoing",
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          setMessages(prev => ({
            ...prev,
            [room_name]: [newMessage, ...(prev[room_name] || [])], // 맨 위에 추가
          }));

          return new Response(JSON.stringify({ success: true, message_id: newMessage.message_id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
        }
      }

      // /sessions/{sessionId}/fields API - 세션 필드 업데이트
      if (url.includes('/sessions/') && url.includes('/fields') && init?.method === 'PATCH') {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /sessions/{sessionId}/seller-context API
      if (url.includes('/seller-context')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /api/traders/all API - 트레이더 목록
      if (url.includes('/api/traders/all')) {
        // Mock 트레이더 목록 (chatRooms에서 sell 카테고리인 것들)
        const traders = chatRooms
          .filter(room => room.category === 'sell')
          .map((room, idx) => ({
            id: `trader-${idx}`,
            name: room.room_name,
            room_name: room.room_name,
            platform: room.platform,
            language: 'ko',
          }));
        return new Response(JSON.stringify(traders), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /api/price-trends API - 가격 추세
      if (url.includes('/api/price-trends')) {
        // Mock 가격 추세 데이터
        const mockTrends = [
          {
            fuel_type: 'VLSFO',
            trends: [
              { date: '2025-09', avg_price: 565, min_price: 555, max_price: 575, count: 10 },
              { date: '2025-10', avg_price: 572, min_price: 560, max_price: 585, count: 12 },
              { date: '2025-11', avg_price: 578, min_price: 565, max_price: 590, count: 15 },
              { date: '2025-12', avg_price: 575, min_price: 560, max_price: 588, count: 8 },
            ],
          },
        ];
        return new Response(JSON.stringify({ fuel_types: mockTrends }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /sessions/{sessionId}/quote-history API
      if (url.includes('/quote-history')) {
        const sessionMatch = url.match(/\/sessions\/([^/]+)\/quote-history/);
        if (sessionMatch) {
          const sessionId = sessionMatch[1];
          const deal = deals.find(d => d.session_id === sessionId);

          if (deal && deal.seller_contexts) {
            // 각 판매자당 최신 견적 1개만 히스토리에 추가
            const history: any[] = [];
            let idCounter = 1;

            Object.entries(deal.seller_contexts)
              .filter(([_, ctx]) => ctx.quote?.fuel1_price)
              .forEach(([trader, ctx]) => {
                const basePrice = parseFloat(ctx.quote?.fuel1_price?.replace(/[^\d.]/g, '') || '0');
                const baseFuel2Price = ctx.quote?.fuel2_price ? parseFloat(ctx.quote.fuel2_price.replace(/[^\d.]/g, '') || '0') : null;

                // 각 판매자당 1개의 견적만 생성
                history.push({
                  id: idCounter++,
                  session_id: sessionId,
                  trader_room_name: trader,
                  fuel_type: deal.fuel_type || '',
                  quantity: parseFloat(deal.quantity?.replace(/[^\d.]/g, '') || '0') || null,
                  price: basePrice,
                  fuel2_price: baseFuel2Price,
                  price_unit: 'USD/MT',
                  barge_fee: parseFloat(ctx.quote?.barge_fee?.replace(/[^\d.]/g, '') || '0') || null,
                  earliest: ctx.earliest || null,
                  term: ctx.quote?.term || null,
                  message: null,
                  port: deal.port || null,
                  customer_room_name: deal.customer_room_name || null,
                  quoted_at: ctx.received_at || new Date().toISOString(),
                  round: 1, // 항상 1st round
                });
              });

            // quoted_at 기준으로 정렬 (오래된 것부터)
            history.sort((a, b) => new Date(a.quoted_at).getTime() - new Date(b.quoted_at).getTime());

            return new Response(JSON.stringify({ history }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({ history: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /customers/{customerRoom}/vessels API - 구매자 배 목록
      if (url.includes('/customers/') && url.includes('/vessels') && !url.includes('/history')) {
        const customerMatch = url.match(/\/customers\/([^/]+)\/vessels/);
        if (customerMatch) {
          const customerRoom = decodeURIComponent(customerMatch[1]);
          // 해당 고객의 딜에서 배 이름 추출
          const customerDeals = deals.filter(d => d.customer_room_name === customerRoom);
          const vessels = [...new Set(customerDeals.map(d => d.vessel_name).filter(Boolean))].map(name => ({
            vessel_name: name,
            imo: customerDeals.find(d => d.vessel_name === name)?.imo || null,
            inquiry_count: customerDeals.filter(d => d.vessel_name === name).length,
            last_inquiry_date: customerDeals.find(d => d.vessel_name === name)?.created_at || null,
          }));
          return new Response(JSON.stringify({ vessels }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // /customers/{customerRoom}/vessels/{vesselName}/history API
      if (url.includes('/vessels/') && url.includes('/history')) {
        const historyMatch = url.match(/\/customers\/([^/]+)\/vessels\/([^/]+)\/history/);
        if (historyMatch) {
          const customerRoom = decodeURIComponent(historyMatch[1]);
          const vesselName = decodeURIComponent(historyMatch[2]);
          // 해당 배의 인쿼리 히스토리
          const vesselDeals = deals.filter(d => d.customer_room_name === customerRoom && d.vessel_name === vesselName);
          const history = vesselDeals.map(d => ({
            session_id: d.session_id,
            inquiry_date: d.created_at,
            port: d.port,
            eta: d.delivery_date,
            fuel1: d.fuel_type,
            fuel1_qty: d.quantity,
            fuel2: d.fuel_type2,
            fuel2_qty: d.quantity2,
            status: d.status,
            offers: Object.entries(d.seller_contexts || {}).filter(([_, ctx]) => ctx.quote?.fuel1_price).map(([trader, ctx]) => ({
              trader,
              price: ctx.quote?.fuel1_price || '',
              fuel1_price: ctx.quote?.fuel1_price || null,
              fuel2_price: ctx.quote?.fuel2_price || null,
              barge_fee: ctx.quote?.barge_fee || null,
              fuel1_margin: ctx.quote?.fuel1_margin || null,
              fuel2_margin: ctx.quote?.fuel2_margin || null,
            })),
            purchase_prices: [],
            deal_done_price: d.final_price,
            selected_trader: d.selected_trader,
            margin_per_ton: Object.entries(d.seller_contexts || {}).filter(([_, ctx]) => ctx.quote?.fuel1_margin).map(([trader, ctx]) => ({
              trader,
              fuel1_margin: ctx.quote?.fuel1_margin,
              fuel2_margin: ctx.quote?.fuel2_margin,
            })),
          }));
          return new Response(JSON.stringify({ history }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // /ai-suggestions/approve API - Inquiry Sender에서 Send 버튼
      if (url.includes('/ai-suggestions/approve') && init?.method === 'POST') {
        try {
          const body = JSON.parse(init.body as string);
          const { selected_targets, modified_message } = body;

          // suggestion_id는 URL 쿼리 파라미터에서 추출
          const urlObj = new URL(url);
          const suggestionIdStr = urlObj.searchParams.get('suggestion_id');
          const suggestion_id = suggestionIdStr ? parseInt(suggestionIdStr) : null;

          // selected_targets 형식: { "1": ["SunPetro Energy", "SeaFuel Korea"] }
          const targetRooms = Object.values(selected_targets || {}).flat() as string[];

          console.log('[MockProvider] AI Approve:', { suggestion_id, targetRooms, modified_message });

          // Suggestion에서 room_name 찾기, 그 room_name으로 deal 찾기
          const allSuggestions = Object.values(aiSuggestions).flat();
          const suggestion = suggestion_id ? allSuggestions.find(s => s.id === suggestion_id) : null;
          const roomName = suggestion?.room_name;
          const deal = roomName ? deals.find(d => d.customer_room_name === roomName) : null;
          const sessionId = deal?.session_id;

          console.log('[MockProvider] Found:', { suggestion, roomName, deal, sessionId });

          // 즉시 성공 응답
          const response = new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

          // Deal의 seller_contexts 업데이트 (Seller Matrix에 추가)
          if (sessionId) {
            setDeals(prev => prev.map(deal => {
              if (deal.session_id === sessionId) {
                const newSellerContexts = { ...deal.seller_contexts };
                targetRooms.forEach(traderRoom => {
                  if (!newSellerContexts[traderRoom]) {
                    newSellerContexts[traderRoom] = {
                      status: "waiting_quote",
                      quote: null,
                      requested_at: new Date().toISOString(),
                      contacted_at: new Date().toISOString(),
                    };
                  }
                });
                return {
                  ...deal,
                  seller_contexts: newSellerContexts,
                  requested_traders: [...new Set([...(deal.requested_traders || []), ...targetRooms])],
                  stage: 'deal_started',
                };
              }
              return deal;
            }));
          }

          // 각 판매자에게 인쿼리 메시지 전송 (시뮬레이션)
          targetRooms.forEach((traderRoom, idx) => {
            setTimeout(() => {
              // 인쿼리 메시지 추가
              const inquiryMsg: ChatMessage = {
                message_id: Date.now() + idx,
                room_name: traderRoom,
                sender: "Harold AI",
                message: modified_message || "[Inquiry Request] Please provide your best quote.",
                package_name: 'com.kakao.yellowid',
                direction: "outgoing",
                timestamp: new Date().toISOString(),
                created_at: new Date().toISOString(),
              };

              setMessages(prev => ({
                ...prev,
                [traderRoom]: [inquiryMsg, ...(prev[traderRoom] || [])], // 맨 위에 추가
              }));

              // 5-10초 후 판매자가 견적 응답 (랜덤)
              setTimeout(() => {
                const quoteMsg: ChatMessage = {
                  message_id: Date.now() + idx + 1000,
                  room_name: traderRoom,
                  sender: traderRoom,
                  message: "Received. Let me check availability and get back to you shortly.",
                  package_name: 'com.kakao.yellowid',
                  direction: "incoming",
                  timestamp: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                };

                setMessages(prev => {
                  const existing = prev[traderRoom] || [];
                  // 인쿼리 메시지 바로 다음에 추가 (두 번째 위치)
                  return {
                    ...prev,
                    [traderRoom]: [existing[0], quoteMsg, ...existing.slice(1)],
                  };
                });
              }, 5000 + Math.random() * 5000);
            }, idx * 500); // 각 판매자에게 0.5초 간격으로 전송
          });

          return response;
        } catch {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // /api/outgoing/send API - Inquiry Sender에서 직접 전송
      if (url.includes('/api/outgoing/send') && init?.method === 'POST') {
        try {
          const body = JSON.parse(init.body as string);
          const { room_name, message: msgText, package_name, session_id } = body;

          console.log('[MockProvider] Outgoing send:', { room_name, session_id, msgText });

          // Deal의 seller_contexts 업데이트 (Seller Matrix에 추가)
          if (session_id) {
            setDeals(prev => {
              const updated = prev.map(deal => {
                if (deal.session_id === session_id) {
                  const newSellerContexts = { ...deal.seller_contexts };
                  if (!newSellerContexts[room_name]) {
                    newSellerContexts[room_name] = {
                      status: "waiting_quote",
                      quote: null,
                      requested_at: new Date().toISOString(),
                      contacted_at: new Date().toISOString(),
                    };
                  } else if (!newSellerContexts[room_name].contacted_at) {
                    newSellerContexts[room_name].contacted_at = new Date().toISOString();
                  }
                  const updatedDeal = {
                    ...deal,
                    seller_contexts: newSellerContexts,
                    requested_traders: [...new Set([...(deal.requested_traders || []), room_name])],
                    stage: 'deal_started' as const,
                  };
                  console.log('[MockProvider] Updated deal:', updatedDeal.session_id, 'new seller_contexts keys:', Object.keys(updatedDeal.seller_contexts));
                  return updatedDeal;
                }
                return deal;
              });
              return updated;
            });
          }

          // 메시지 추가
          const outgoingMsg: ChatMessage = {
            message_id: Date.now(),
            room_name: room_name,
            sender: "Harold AI",
            message: msgText,
            package_name: package_name || 'com.kakao.talk',
            direction: "outgoing",
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          setMessages(prev => ({
            ...prev,
            [room_name]: [outgoingMsg, ...(prev[room_name] || [])], // 맨 위에 추가
          }));

          // 즉시 성공 응답
          const response = new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

          // 5-10초 후 판매자가 확인 메시지 보내기 (시뮬레이션)
          setTimeout(() => {
            const replyMsg: ChatMessage = {
              message_id: Date.now() + 1,
              room_name: room_name,
              sender: room_name,
              message: "Received. Let me check and get back to you shortly.",
              package_name: package_name || 'com.kakao.talk',
              direction: "incoming",
              timestamp: new Date().toISOString(),
              created_at: new Date().toISOString(),
            };

            setMessages(prev => {
              const existing = prev[room_name] || [];
              // outgoing 메시지 바로 다음에 추가
              return {
                ...prev,
                [room_name]: [existing[0], replyMsg, ...existing.slice(1)],
              };
            });
          }, 5000 + Math.random() * 5000);

          return response;
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
        }
      }

      // /api/reminder/send API
      if (url.includes('/api/reminder/send') && init?.method === 'POST') {
        try {
          const body = JSON.parse(init.body as string);
          const { session_id, trader_room_name, language } = body;

          // 즉시 성공 응답
          const response = new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

          // 2-3초 후 판매자가 확인 메시지 보내기 (시뮬레이션)
          setTimeout(() => {
            const confirmMsg: ChatMessage = {
              message_id: Date.now(),
              room_name: trader_room_name,
              sender: trader_room_name,
              message: language === 'en' ? "Received. Let me check availability." : "확인했습니다. 가용성 확인해보겠습니다.",
              package_name: 'com.kakao.talk',
              direction: "incoming",
              timestamp: new Date().toISOString(),
              created_at: new Date().toISOString(),
            };

            setMessages(prev => ({
              ...prev,
              [trader_room_name]: [confirmMsg, ...(prev[trader_room_name] || [])], // 맨 위에 추가
            }));
          }, 2000 + Math.random() * 1000);

          return response;
        } catch {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // /api/quick-replies API - 빠른 응답 템플릿
      if (url.includes('/api/quick-replies') && !url.includes('/send')) {
        const mockTemplates = [
          { id: 1, template_text: "잠깐만요", category: "default", sort_order: 1 },
          { id: 2, template_text: "네 감사합니다", category: "default", sort_order: 2 },
          { id: 3, template_text: "Rvt", category: "default", sort_order: 3 },
          { id: 4, template_text: "Rvt Shortly", category: "default", sort_order: 4 },
        ];
        return new Response(JSON.stringify({ templates: mockTemplates }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // /api/quick-replies/send API - 빠른 응답 전송
      if (url.includes('/api/quick-replies/send') && init?.method === 'POST') {
        try {
          const body = JSON.parse(init.body as string);
          const { room_name, template_text } = body;

          const newMessage: ChatMessage = {
            message_id: Date.now(),
            room_name: room_name,
            sender: "Harold AI",
            message: template_text,
            package_name: 'com.kakao.yellowid',
            direction: "outgoing",
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          setMessages(prev => ({
            ...prev,
            [room_name]: [newMessage, ...(prev[room_name] || [])], // 맨 위에 추가
          }));

          return new Response(JSON.stringify({ success: true, message_id: newMessage.message_id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 그 외 API는 원본 fetch 호출 (또는 빈 응답)
      // 목업 모드에서는 대부분의 API가 실패해도 괜찮음
      try {
        return await originalFetch(input, init);
      } catch {
        // 네트워크 에러 시 빈 응답
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    };

    // Override global fetch
    window.fetch = mockFetch as typeof fetch;

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [chatRooms, messages, deals, aiSuggestions, statistics]);

  // ============================================
  // Mock EventSource for SSE (useDealsSSE)
  // ============================================
  const eventSourceListenersRef = useRef<Set<(deals: DealScoreboard[]) => void>>(new Set());

  useEffect(() => {
    const OriginalEventSource = window.EventSource;

    // Mock EventSource class
    class MockEventSource {
      url: string;
      readyState: number = 0;
      onopen: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      private listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();

      constructor(url: string) {
        this.url = url;
        console.log('[MockProvider] EventSource created for:', url);

        // Simulate connection opening
        setTimeout(() => {
          this.readyState = 1;
          if (this.onopen) {
            this.onopen(new Event('open'));
          }

          // Send initial_data event
          this.dispatchEvent('initial_data', { deals });
          console.log('[MockProvider] SSE initial_data sent with', deals.length, 'deals');

          // Register listener for future updates
          const listener = (updatedDeals: DealScoreboard[]) => {
            this.dispatchEvent('deal_update', { deals: updatedDeals });
            console.log('[MockProvider] SSE deal_update sent with', updatedDeals.length, 'deals');
          };
          eventSourceListenersRef.current.add(listener);
        }, 100);
      }

      addEventListener(type: string, listener: (event: MessageEvent) => void) {
        if (!this.listeners.has(type)) {
          this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);
      }

      removeEventListener(type: string, listener: (event: MessageEvent) => void) {
        this.listeners.get(type)?.delete(listener);
      }

      dispatchEvent(type: string, data: any): boolean {
        const event = new MessageEvent(type, {
          data: JSON.stringify(data),
        });

        const listeners = this.listeners.get(type);
        if (listeners) {
          listeners.forEach(listener => listener(event));
        }

        return true;
      }

      close() {
        this.readyState = 2;
        console.log('[MockProvider] EventSource closed');
      }
    }

    // Override global EventSource
    (window as any).EventSource = MockEventSource;

    return () => {
      window.EventSource = OriginalEventSource;
      eventSourceListenersRef.current.clear();
    };
  }, []);

  // Emit deal_update events when deals change
  useEffect(() => {
    if (eventSourceListenersRef.current.size > 0) {
      console.log('[MockProvider] Deals changed, notifying', eventSourceListenersRef.current.size, 'SSE listeners');
      eventSourceListenersRef.current.forEach(listener => {
        listener(deals);
      });
    }
  }, [deals]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  // ============================================
  // Deal Actions
  // ============================================

  const updateDealStatus = useCallback((sessionId: string, status: DealScoreboard["status"]) => {
    setDeals(prev => prev.map(deal => {
      if (deal.session_id === sessionId) {
        return { ...deal, status, updated_at: new Date().toISOString() };
      }
      return deal;
    }));
  }, []);

  const updateDealStage = useCallback((sessionId: string, stage: DealStage) => {
    setDeals(prev => prev.map(deal => {
      if (deal.session_id === sessionId) {
        return { ...deal, stage, updated_at: new Date().toISOString() };
      }
      return deal;
    }));
  }, []);

  const deleteDeal = useCallback(async (sessionId: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setDeals(prev => prev.filter(deal => deal.session_id !== sessionId));
    return true;
  }, []);

  const getDealById = useCallback((sessionId: string) => {
    return deals.find(deal => deal.session_id === sessionId);
  }, [deals]);

  // ============================================
  // Message Actions
  // ============================================

  const sendMessage = useCallback(async (roomName: string, message: string, platform?: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMessage: ChatMessage = {
      message_id: Date.now(),
      room_name: roomName,
      sender: "Harold AI",
      message: message,
      package_name: (platform as ChatMessage["package_name"]) || "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [roomName]: [...(prev[roomName] || []), newMessage],
    }));
  }, []);

  const getMessagesForRoom = useCallback((roomName: string) => {
    return messages[roomName] || [];
  }, [messages]);

  const markRoomAsRead = useCallback((roomName: string) => {
    // 딜 클릭 시 해당 딜의 buyer_unread_count와 seller_unread_count를 0으로 설정
    setDeals(prev => prev.map(deal => {
      if (deal.customer_room_name === roomName) {
        return {
          ...deal,
          buyer_unread_count: 0,
          seller_unread_count: 0,
          unread_count: 0,
        };
      }
      // 판매자 채팅방인 경우에도 처리
      if (deal.seller_contexts && deal.seller_contexts[roomName]) {
        return {
          ...deal,
          seller_unread_count: Math.max(0, (deal.seller_unread_count || 0) - 1),
          unread_count: Math.max(0, (deal.unread_count || 0) - 1),
        };
      }
      return deal;
    }));
  }, []);

  // ============================================
  // AI Suggestion Actions
  // ============================================

  const approveSuggestion = useCallback(async (suggestionId: number, selectedOptions: number[]) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and update the suggestion
    setAiSuggestions(prev => {
      const updated = { ...prev };
      for (const sessionId in updated) {
        updated[sessionId] = updated[sessionId].map(suggestion => {
          if (suggestion.id === suggestionId) {
            // Add messages for selected options
            selectedOptions.forEach(optionNum => {
              const option = suggestion.suggestions.find(s => s.option === optionNum);
              if (option) {
                if (option.action === "send_to_suppliers" && Array.isArray(option.targets)) {
                  (option.targets as string[]).forEach(target => {
                    const newMsg: ChatMessage = {
                      message_id: Date.now() + Math.random(),
                      room_name: target,
                      sender: "Harold AI",
                      message: option.message,
                      package_name: "com.kakao.yellowid",
                      direction: "outgoing",
                      timestamp: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                    };
                    setMessages(prevMsgs => ({
                      ...prevMsgs,
                      [target]: [...(prevMsgs[target] || []), newMsg],
                    }));
                  });
                } else if (option.action === "reply_to_customer" && Array.isArray(option.targets)) {
                  (option.targets as string[]).forEach(target => {
                    const newMsg: ChatMessage = {
                      message_id: Date.now() + Math.random(),
                      room_name: target,
                      sender: "Harold AI",
                      message: option.message,
                      package_name: "com.kakao.talk",
                      direction: "outgoing",
                      timestamp: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                    };
                    setMessages(prevMsgs => ({
                      ...prevMsgs,
                      [target]: [...(prevMsgs[target] || []), newMsg],
                    }));
                  });
                } else if (option.action === "send_multiple") {
                  const targets = option.targets as Array<{ room: string; message: string }>;
                  targets.forEach(t => {
                    const newMsg: ChatMessage = {
                      message_id: Date.now() + Math.random(),
                      room_name: t.room,
                      sender: "Harold AI",
                      message: t.message,
                      package_name: "com.kakao.yellowid",
                      direction: "outgoing",
                      timestamp: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                    };
                    setMessages(prevMsgs => ({
                      ...prevMsgs,
                      [t.room]: [...(prevMsgs[t.room] || []), newMsg],
                    }));
                  });
                }
              }
            });

            return { ...suggestion, status: "approved" as const };
          }
          return suggestion;
        });
      }
      return updated;
    });

    // Update deal stage based on the approval
    // This is a simplified simulation
  }, []);

  const rejectSuggestion = useCallback(async (suggestionId: number, reason?: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setAiSuggestions(prev => {
      const updated = { ...prev };
      for (const sessionId in updated) {
        updated[sessionId] = updated[sessionId].map(suggestion => {
          if (suggestion.id === suggestionId) {
            return { ...suggestion, status: "rejected" as const, rejection_reason: reason || null };
          }
          return suggestion;
        });
      }
      return updated;
    });
  }, []);

  const getSuggestionsForSession = useCallback((sessionId: string) => {
    return aiSuggestions[sessionId] || [];
  }, [aiSuggestions]);

  // ============================================
  // Demo Control Actions
  // ============================================

  const showNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/harold-mockup/SP_logo.png",
        tag: "harold-demo",
      });
    }
  }, []);

  const triggerNewInquiry = useCallback(() => {
    const newDeal = generateNewInquiryDeal();
    setDeals(prev => [newDeal, ...prev]);

    // Add initial message to customer room
    const customerRoom = newDeal.customer_room_name;
    const newMessage: ChatMessage = {
      message_id: Date.now(),
      room_name: customerRoom,
      sender: "Customer",
      message: `안녕하세요, ${newDeal.vessel_name} 선박 급유 문의드립니다.\n${newDeal.port}에서 ${newDeal.fuel_type} ${newDeal.quantity} 필요합니다.`,
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [customerRoom]: [...(prev[customerRoom] || []), newMessage],
    }));

    // Show notification
    showNotification("New Inquiry", `${newDeal.vessel_name} - ${newDeal.port}`);
  }, [showNotification]);

  const triggerNewMessage = useCallback((roomName: string) => {
    const newMessage = generateNewMessage(roomName, true);

    setMessages(prev => ({
      ...prev,
      [roomName]: [...(prev[roomName] || []), newMessage],
    }));

    // Update unread count for related deal
    setDeals(prev => prev.map(deal => {
      if (deal.customer_room_name === roomName) {
        return {
          ...deal,
          buyer_unread_count: (deal.buyer_unread_count || 0) + 1,
          unread_count: (deal.unread_count || 0) + 1,
        };
      }
      return deal;
    }));

    // Show notification
    showNotification("New Message", `${roomName}: ${newMessage.message}`);
  }, [showNotification]);

  const triggerQuoteReceived = useCallback((sessionId: string, trader: string) => {
    const deal = deals.find(d => d.session_id === sessionId);
    if (!deal) return;

    // Generate a random quote
    const basePrice = 560 + Math.floor(Math.random() * 30);
    const bargeFee = 12000 + Math.floor(Math.random() * 5000);
    const quoteMessage = `[견적서]\nVLSFO: $${basePrice}/MT\nBarge Fee: $${bargeFee}\nEarliest: ${deal.delivery_date}\nTerm: 30 days\n\n정유사: ${trader}`;

    // Add message to trader room
    const newMessage: ChatMessage = {
      message_id: Date.now(),
      room_name: trader,
      sender: `${trader} Trader`,
      message: quoteMessage,
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [trader]: [...(prev[trader] || []), newMessage],
    }));

    // Update deal with new quote
    setDeals(prev => prev.map(d => {
      if (d.session_id === sessionId) {
        const existingSeller = d.seller_contexts?.[trader];
        const isNewQuote = !existingSeller || !existingSeller.quote;

        const newSellerContexts = {
          ...d.seller_contexts,
          [trader]: {
            status: "quote_received" as const,
            quote: {
              fuel1_price: `$${basePrice}/MT`,
              barge_fee: `$${bargeFee}`,
              term: "30 days",
              supplier: trader,
            },
            earliest: deal.delivery_date,
            received_at: new Date().toISOString(),
          },
        };

        return {
          ...d,
          seller_contexts: newSellerContexts,
          total_quotes_received: isNewQuote ? d.total_quotes_received + 1 : d.total_quotes_received,
          quote_count: (d.quote_count || 0) + 1,
          negotiation_rounds: (d.negotiation_rounds || 0) + 1, // 중요: 라운드 증가
          last_quote_time: new Date().toISOString(),
          seller_unread_count: (d.seller_unread_count || 0) + 1,
          unread_count: (d.unread_count || 0) + 1,
        };
      }
      return d;
    }));

    // Show notification
    showNotification("Quote Received", `${trader}: $${basePrice}/MT`);
  }, [deals, showNotification]);

  const resetToInitial = useCallback(() => {
    setDeals(MOCK_DEALS);
    setMessages(MOCK_MESSAGES);
    setAiSuggestions(MOCK_AI_SUGGESTIONS);
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const value: MockContextType = {
    // State
    deals,
    chatRooms,
    messages,
    aiSuggestions,
    statistics,
    isConnected,
    isMockupMode: true,

    // Deal Actions
    updateDealStatus,
    updateDealStage,
    deleteDeal,
    getDealById,

    // Message Actions
    sendMessage,
    getMessagesForRoom,
    markRoomAsRead,

    // AI Suggestion Actions
    approveSuggestion,
    rejectSuggestion,
    getSuggestionsForSession,

    // Demo Control Actions
    triggerNewInquiry,
    triggerNewMessage,
    triggerQuoteReceived,
    resetToInitial,

    // Notification
    showNotification,
  };

  return <MockContext.Provider value={value}>{children}</MockContext.Provider>;
}
