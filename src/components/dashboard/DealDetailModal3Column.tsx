/**
 * Deal Detail Modal - 3-Column Layout
 * 거래 상세 정보 모달 (3열 레이아웃)
 * Buyer Chat | AI Assistant | Seller Chats
 */

"use client";

import React, { useState, useCallback, useEffect, memo, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  User,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Circle,
  AlertCircle,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale/ko";
import type { TradingSession, ChatMessage, AISuggestion } from "@/types";
import { DealModalProvider, useDealModal } from "@/contexts/DealModalContext";
import { useSSEManager } from "@/hooks/useSSEManager";
import SSEConnectionManager from "@/lib/sse/SSEConnectionManager";

interface DealDetailModalProps {
  session: TradingSession | null;
  open: boolean;
  onClose: () => void;
}

// Main Modal Component - Wraps with Provider
export function DealDetailModal({ session, open, onClose }: DealDetailModalProps) {
  if (!session) return null;

  return (
    <DealModalProvider session={session}>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] p-0">
          <DialogTitle className="sr-only">
            거래 상세 - {session.vessel_name || "선박명 미정"}
          </DialogTitle>
          <DealDetailModalContent onClose={onClose} />
        </DialogContent>
      </Dialog>
    </DealModalProvider>
  );
}

// Inner Content Component
function DealDetailModalContent({ onClose }: { onClose: () => void }) {
  const {
    session,
    columns,
    resizeColumn,
    isResizing,
    setIsResizing,
    showAIPanel,
    setShowAIPanel,
    setRoomPlatforms
  } = useDealModal();

  const [resizingColumn, setResizingColumn] = useState<'buyer' | 'ai' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load room platforms from /chats/rooms API
  useEffect(() => {
    const fetchRoomPlatforms = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/rooms`);
        if (response.ok) {
          const data = await response.json();
          const platformMap = new Map<string, string>();
          (data.rooms || []).forEach((room: { room_name: string; platform: string }) => {
            platformMap.set(room.room_name, room.platform);
          });
          setRoomPlatforms(platformMap);
        }
      } catch (error) {
        console.error('Failed to fetch room platforms:', error);
      }
    };

    fetchRoomPlatforms();
  }, [setRoomPlatforms]);

  // Handle column resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const percentage = (mouseX / containerRect.width) * 100;

    resizeColumn(resizingColumn, percentage);
  }, [resizingColumn, resizeColumn]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
  }, [setIsResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!session) return null;

  return (
    <div className="flex flex-col h-[90vh]">
      {/* Header */}
      <DealHeader
        session={session}
        showAIPanel={showAIPanel}
        onToggleAI={() => setShowAIPanel(true)}
      />

      {/* 3-Column Layout */}
      <div ref={containerRef} className="flex flex-1 relative overflow-hidden">
        {/* Buyer Chat Column */}
        <div
          className="flex-shrink-0 border-r h-full"
          style={{ width: `${columns.buyer.width}%` }}
        >
          <BuyerChatColumn />
        </div>

        {/* Resize Handle 1 */}
        <ResizeHandle
          onMouseDown={() => {
            setResizingColumn('buyer');
            setIsResizing(true);
          }}
        />

        {/* AI Assistant Column */}
        {showAIPanel && (
          <>
            <div
              className="flex-shrink-0 border-r bg-gray-50 h-full"
              style={{ width: `${columns.ai.width}%` }}
            >
              <AIAssistantColumn />
            </div>

            {/* Resize Handle 2 */}
            <ResizeHandle
              onMouseDown={() => {
                setResizingColumn('ai');
                setIsResizing(true);
              }}
            />
          </>
        )}

        {/* Seller Chats Column */}
        <div
          className="flex-grow h-full"
          style={{
            width: showAIPanel
              ? `${columns.seller.width}%`
              : `${columns.seller.width + columns.ai.width}%`
          }}
        >
          <SellerChatsColumn />
        </div>
      </div>
    </div>
  );
}

// Header Component
const DealHeader = memo(({ session, showAIPanel, onToggleAI }: {
  session: TradingSession;
  showAIPanel: boolean;
  onToggleAI: () => void;
}) => {
  return (
    <div className="bg-gray-900 text-green-400 font-mono p-3 border-b">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="whitespace-nowrap">
          <span className="text-gray-500">선박:</span> {session.vessel_name || "-"}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">ETA:</span> {session.delivery_date || "-"}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">항구:</span> {session.port || "-"}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">연료:</span> {session.fuel_type || "-"} {session.quantity || ""}
          {session.fuel_type2 && (
            <span className="text-yellow-400 ml-2">
              + {session.fuel_type2} {session.quantity2 || ""}
            </span>
          )}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">고객:</span> {session.customer_room_name}
        </div>
        {!showAIPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAI}
            className="ml-auto text-green-400 hover:text-green-300 hover:bg-gray-800"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI 어시스턴트
          </Button>
        )}
      </div>
    </div>
  );
});
DealHeader.displayName = 'DealHeader';

// Buyer Chat Column
const BuyerChatColumn = memo(() => {
  const { session, buyerMessages, addBuyerMessage, setBuyerMessages, getRoomPlatform, roomPlatforms } = useDealModal();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const isFirstLoadRef = useRef(true);

  // Load initial messages - wait for roomPlatforms to be loaded
  useEffect(() => {
    if (!session?.customer_room_name || roomPlatforms.size === 0 || initializedRef.current) return;

    initializedRef.current = true;
    const platform = getRoomPlatform(session.customer_room_name);
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chats/${encodeURIComponent(session.customer_room_name)}/messages?platform=${platform}`
        );
        if (response.ok) {
          const data = await response.json();
          // 백엔드 응답: { data: [...], total, page, limit }
          const messages = Array.isArray(data) ? data : (data.data || []);
          // ChatMessage 형식으로 변환 - sender 기준으로 direction 결정
          const ourSenders = ['Harold', '씨너지파트너', 'Seanergy', '김성원', '김민석', '권예정'];
          setBuyerMessages(messages.map((msg: any) => ({
            message_id: msg.id || msg.message_id,
            room_name: msg.room_name,
            sender: msg.sender,
            message: msg.message,
            timestamp: msg.created_at,
            package_name: msg.platform || 'com.kakao.talk',
            direction: ourSenders.some(s => msg.sender?.includes(s)) ? 'outgoing' : 'incoming',
            created_at: msg.created_at
          })));
        }
      } catch (error) {
        console.error('Failed to fetch buyer messages:', error);
      }
    };

    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.customer_room_name, roomPlatforms.size]);

  // SSE Hook for buyer messages
  useSSEManager({
    roomName: session?.customer_room_name,
    sessionId: session?.session_id,
    onMessage: addBuyerMessage,
    enabled: true
  });

  // Auto scroll to bottom - instant on first load, smooth on updates
  useEffect(() => {
    if (buyerMessages.length > 0) {
      if (isFirstLoadRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        isFirstLoadRef.current = false;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [buyerMessages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !session) return;

    const platform = getRoomPlatform(session.customer_room_name);
    // 표준 platform -> 내부 platform 변환
    const platformToInternal: Record<string, string> = {
      'com.kakao.talk': 'kakao',
      'com.kakao.yellowid': 'kakao_biz',
      'com.whatsapp': 'whatsapp',
      'com.wechat': 'wechat'
    };
    const internalPlatform = platformToInternal[platform] || 'kakao';

    const message: ChatMessage = {
      message_id: Date.now(),
      room_name: session.customer_room_name,
      sender: 'Harold',
      message: inputValue,
      timestamp: new Date().toISOString(),
      package_name: platform as ChatMessage['package_name'],
      direction: 'outgoing',
      created_at: new Date().toISOString()
    };

    // Add to local state
    addBuyerMessage(message);
    setInputValue('');

    // Send to backend - /messages/send 엔드포인트 사용
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: session.customer_room_name,
          message: inputValue,
          platform: internalPlatform
        })
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-white">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          구매자 채팅
          <Badge variant="secondary" className="ml-auto">
            {session?.customer_room_name}
          </Badge>
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {buyerMessages.map((msg) => (
            <MessageBubble key={msg.message_id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지 입력..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
BuyerChatColumn.displayName = 'BuyerChatColumn';

// AI Assistant Column
const AIAssistantColumn = memo(() => {
  const {
    session,
    aiSuggestions,
    setAiSuggestions,
    selectedSuggestions,
    toggleSuggestion,
    setFullContextCompletion,
    setShowAIPanel,
    getRoomPlatform,
    addBuyerMessage
  } = useDealModal();

  const [showFullContext, setShowFullContext] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // 첫 번째 제안을 자동으로 확장
  useEffect(() => {
    if (aiSuggestions.length > 0 && expandedSuggestion === null) {
      const firstSuggestion = aiSuggestions[0];
      setExpandedSuggestion(firstSuggestion.id);
      setEditingMessage(firstSuggestion.suggestions[0]?.message || '');
    }
  }, [aiSuggestions, expandedSuggestion]);

  // Full Context 계산 - 세션 데이터 기반
  const requirements = ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity'];
  const missingFields = requirements.filter(field => {
    if (!session) return true;
    const value = session[field as keyof typeof session];
    return !value || value === '';
  });
  const completion = Math.round(((requirements.length - missingFields.length) / requirements.length) * 100);

  // 필드별 질문 메시지
  const fieldQuestions: Record<string, string> = {
    vessel_name: '선박명을 알려주세요.',
    port: '항구를 알려주세요.',
    delivery_date: 'ETA (예상 도착일)를 알려주세요.',
    fuel_type: '연료 종류를 알려주세요.',
    quantity: '수량을 알려주세요.'
  };

  // 필드 한글명
  const fieldLabels: Record<string, string> = {
    vessel_name: '선박명',
    port: '항구',
    delivery_date: 'ETA',
    fuel_type: '연료종류',
    quantity: '수량'
  };

  useEffect(() => {
    setFullContextCompletion(completion);
  }, [completion, setFullContextCompletion]);

  // Fetch AI suggestions
  useEffect(() => {
    if (!session) return;

    const fetchSuggestions = async () => {
      try {
        let response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/session/${session.session_id}`
        );
        if (response.ok) {
          const data = await response.json();
          const sessionSuggestions = Array.isArray(data) ? data : [];
          if (sessionSuggestions.length > 0) {
            setAiSuggestions(sessionSuggestions);
            return;
          }
        }

        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/pending`
        );
        if (response.ok) {
          const data = await response.json();
          const allSuggestions = data.suggestions || [];
          setAiSuggestions(allSuggestions.slice(0, 10));
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      }
    };

    fetchSuggestions();
    const interval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(interval);
  }, [session, setAiSuggestions]);

  // 누락 필드 클릭 - 고객에게 질문 전송
  const handleMissingFieldClick = async (field: string) => {
    if (!session) return;

    const question = fieldQuestions[field];
    const platform = getRoomPlatform(session.customer_room_name);
    const platformToInternal: Record<string, string> = {
      'com.kakao.talk': 'kakao',
      'com.kakao.yellowid': 'kakao_biz',
      'com.whatsapp': 'whatsapp',
      'com.wechat': 'wechat'
    };
    const internalPlatform = platformToInternal[platform] || 'kakao';

    // 로컬 상태에 추가
    const message: ChatMessage = {
      message_id: Date.now(),
      room_name: session.customer_room_name,
      sender: 'Harold',
      message: question,
      timestamp: new Date().toISOString(),
      package_name: platform as ChatMessage['package_name'],
      direction: 'outgoing',
      created_at: new Date().toISOString()
    };
    addBuyerMessage(message);

    // 백엔드로 전송
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: session.customer_room_name,
          message: question,
          platform: internalPlatform
        })
      });
    } catch (error) {
      console.error('Failed to send question:', error);
    }
  };

  // 제안 승인 및 전송
  const handleApproveSuggestion = async (suggestion: AISuggestion, optionIndex: number, customMessage?: string) => {
    if (!session || isProcessing) return;
    setIsProcessing(true);

    try {
      const option = suggestion.suggestions[optionIndex];
      if (!option) return;

      const messageToSend = customMessage || option.message;

      // 1. 백엔드에 승인 요청
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/approve?suggestion_id=${suggestion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_option: optionIndex + 1,
          modified_message: customMessage || null
        })
      });

      // 2. 실제 메시지 전송 (action 타입에 따라)
      if (option.action === 'send_to_suppliers' && Array.isArray(option.targets)) {
        // 여러 트레이더에게 전송
        for (const target of option.targets) {
          const targetRoom = typeof target === 'string' ? target : target.room;
          const targetMessage = typeof target === 'string' ? messageToSend : target.message;
          const platform = getRoomPlatform(targetRoom);
          const platformToInternal: Record<string, string> = {
            'com.kakao.talk': 'kakao',
            'com.kakao.yellowid': 'kakao_biz',
            'com.whatsapp': 'whatsapp',
            'com.wechat': 'wechat'
          };

          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room_name: targetRoom,
              message: targetMessage,
              platform: platformToInternal[platform] || 'kakao'
            })
          });
        }
      } else if (option.action === 'reply_to_customer' && messageToSend) {
        // 고객에게 답장
        const platform = getRoomPlatform(session.customer_room_name);
        const platformToInternal: Record<string, string> = {
          'com.kakao.talk': 'kakao',
          'com.kakao.yellowid': 'kakao_biz',
          'com.whatsapp': 'whatsapp',
          'com.wechat': 'wechat'
        };

        const chatMessage: ChatMessage = {
          message_id: Date.now(),
          room_name: session.customer_room_name,
          sender: 'Harold',
          message: messageToSend,
          timestamp: new Date().toISOString(),
          package_name: platform as ChatMessage['package_name'],
          direction: 'outgoing',
          created_at: new Date().toISOString()
        };
        addBuyerMessage(chatMessage);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_name: session.customer_room_name,
            message: messageToSend,
            platform: platformToInternal[platform] || 'kakao'
          })
        });
      } else if (option.action === 'send_multiple' && Array.isArray(option.targets)) {
        // 여러 대상에게 각각 다른 메시지 전송
        for (const target of option.targets) {
          if (typeof target === 'object' && 'room' in target) {
            const platform = getRoomPlatform(target.room);
            const platformToInternal: Record<string, string> = {
              'com.kakao.talk': 'kakao',
              'com.kakao.yellowid': 'kakao_biz',
              'com.whatsapp': 'whatsapp',
              'com.wechat': 'wechat'
            };

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                room_name: target.room,
                message: target.message,
                platform: platformToInternal[platform] || 'kakao'
              })
            });
          }
        }
      }

      // 3. 목록에서 제거
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setExpandedSuggestion(null);
      setEditingMessage('');

    } catch (error) {
      console.error('Failed to approve suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 제안 거부
  const handleRejectSuggestion = async (suggestion: AISuggestion, reason: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/reject?suggestion_id=${suggestion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setExpandedSuggestion(null);
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI 어시스턴트
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAIPanel(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Full Context Section */}
          <div className="bg-white p-3 rounded-lg border">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowFullContext(!showFullContext)}
            >
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Full Context</div>
                <Badge variant={completion === 100 ? "default" : "secondary"}>
                  {completion}%
                </Badge>
              </div>
              {showFullContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {showFullContext && (
              <div className="mt-3 space-y-1">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {requirements.map((field) => {
                    const isMissing = missingFields.includes(field);
                    const value = session?.[field as keyof typeof session];
                    return (
                      <div
                        key={field}
                        className={cn(
                          "flex items-center gap-2 text-xs p-1 rounded cursor-pointer hover:bg-gray-50",
                          isMissing && "text-red-600 hover:bg-red-50"
                        )}
                        onClick={() => isMissing && handleMissingFieldClick(field)}
                        title={isMissing ? `클릭하여 "${fieldQuestions[field]}" 질문 전송` : ''}
                      >
                        {isMissing ? (
                          <Circle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )}
                        <span className="font-medium">{fieldLabels[field]}:</span>
                        <span className={isMissing ? 'italic' : ''}>
                          {isMissing ? '클릭하여 질문' : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">AI 제안</h4>
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg overflow-hidden">
                  {/* 제안 헤더 */}
                  <div
                    className={cn(
                      "p-3 cursor-pointer transition-all",
                      expandedSuggestion === suggestion.id ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                    )}
                    onClick={() => {
                      setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id);
                      setSelectedOptionIndex(0);
                      setEditingMessage(suggestion.suggestions[0]?.message || '');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{suggestion.category}</Badge>
                      <Badge variant={suggestion.confidence > 0.8 ? 'default' : 'secondary'}>
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                    {suggestion.original_message && (
                      <div className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded">
                        <span className="font-medium">{suggestion.original_message.sender}:</span>{' '}
                        {suggestion.original_message.message.length > 100
                          ? suggestion.original_message.message.substring(0, 100) + '...'
                          : suggestion.original_message.message}
                      </div>
                    )}
                  </div>

                  {/* 확장된 옵션 선택 UI */}
                  {expandedSuggestion === suggestion.id && (
                    <div className="border-t p-3 bg-gray-50 space-y-3">
                      {/* 옵션 목록 */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {suggestion.suggestions.map((option, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-2 rounded border cursor-pointer text-xs",
                              selectedOptionIndex === idx
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            )}
                            onClick={() => {
                              setSelectedOptionIndex(idx);
                              setEditingMessage(option.message || '');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {selectedOptionIndex === idx ? (
                                <CheckCircle2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              )}
                              <span className="font-medium">{option.action}</span>
                            </div>
                            <div className="mt-1 text-gray-600 line-clamp-2">{option.reason}</div>
                            {option.targets && option.targets.length > 0 && (
                              <div className="mt-1 text-gray-500 truncate">
                                대상: {Array.isArray(option.targets)
                                  ? option.targets.slice(0, 3).map(t => typeof t === 'string' ? t : t.room).join(', ')
                                  : ''}
                                {option.targets.length > 3 && ` 외 ${option.targets.length - 3}개`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 메시지 수정 */}
                      {suggestion.suggestions[selectedOptionIndex]?.message && (
                        <div>
                          <label className="text-xs font-medium text-gray-700">메시지 수정</label>
                          <textarea
                            value={editingMessage}
                            onChange={(e) => setEditingMessage(e.target.value)}
                            className="w-full mt-1 p-2 text-xs border rounded resize-none bg-white"
                            rows={4}
                          />
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApproveSuggestion(
                            suggestion,
                            selectedOptionIndex,
                            editingMessage !== suggestion.suggestions[selectedOptionIndex]?.message
                              ? editingMessage
                              : undefined
                          )}
                          disabled={isProcessing}
                        >
                          {isProcessing ? '처리중...' : '승인 및 전송'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectSuggestion(suggestion, '사용자 거부')}
                          disabled={isProcessing}
                        >
                          거부
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                AI가 대화를 분석중입니다...
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 선택된 제안 일괄 적용 */}
      {selectedSuggestions.size > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <Button
            className="w-full"
            size="sm"
            onClick={() => {
              // 선택된 제안들 일괄 승인
              aiSuggestions
                .filter(s => selectedSuggestions.has(s.id))
                .forEach(s => handleApproveSuggestion(s, 0));
            }}
            disabled={isProcessing}
          >
            선택한 제안 일괄 적용 ({selectedSuggestions.size})
          </Button>
        </div>
      )}
    </div>
  );
});
AIAssistantColumn.displayName = 'AIAssistantColumn';

// Seller Chats Column
const SellerChatsColumn = memo(() => {
  const {
    session,
    activeSellerTab,
    setActiveSellerTab,
    sellerTabs,
    addSellerTab,
    removeSellerTab,
    sellerMessages,
    setSellerMessagesForTrader,
    addSellerMessage,
    getRoomPlatform,
    roomPlatforms
  } = useDealModal();

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);

  // Initialize tabs from session and load initial messages
  useEffect(() => {
    if (!session?.requested_traders || roomPlatforms.size === 0 || initializedRef.current) return;

    initializedRef.current = true;

    session.requested_traders.forEach(trader => {
      addSellerTab(trader);

      const platform = getRoomPlatform(trader);
      // Load initial messages for each trader
      const fetchMessages = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/chats/${encodeURIComponent(trader)}/messages?platform=${platform}`
          );
          if (response.ok) {
            const data = await response.json();
            // 백엔드 응답: { data: [...], total, page, limit }
            const messages = Array.isArray(data) ? data : (data.data || []);
            // ChatMessage 형식으로 변환 - sender 기준으로 direction 결정
            const ourSenders = ['Harold', '씨너지파트너', 'Seanergy', '김성원', '김민석', '권예정'];
            const formattedMessages: ChatMessage[] = messages.map((msg: any) => ({
              message_id: msg.id || msg.message_id,
              room_name: msg.room_name,
              sender: msg.sender,
              message: msg.message,
              timestamp: msg.created_at,
              package_name: msg.platform || platform,
              direction: ourSenders.some(s => msg.sender?.includes(s)) ? 'outgoing' as const : 'incoming' as const,
              created_at: msg.created_at
            }));
            setSellerMessagesForTrader(trader, formattedMessages);
          }
        } catch (error) {
          console.error(`Failed to fetch messages for ${trader}:`, error);
        }
      };

      fetchMessages();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.session_id, roomPlatforms.size]);

  // SSE subscription for seller messages - use manager directly
  useEffect(() => {
    if (!sellerTabs.length || !session) return;

    const manager = SSEConnectionManager.getInstance();
    const unsubscribes: (() => void)[] = [];

    sellerTabs.forEach(trader => {
      const unsubscribe = manager.subscribe(trader, (message) => {
        addSellerMessage(trader, message);
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [sellerTabs, session, addSellerMessage]);

  const handleSend = async (trader: string) => {
    const inputValue = inputValues[trader] || '';
    if (!inputValue.trim() || !session) return;

    const platform = getRoomPlatform(trader);
    // 표준 platform -> 내부 platform 변환
    const platformToInternal: Record<string, string> = {
      'com.kakao.talk': 'kakao',
      'com.kakao.yellowid': 'kakao_biz',
      'com.whatsapp': 'whatsapp',
      'com.wechat': 'wechat'
    };
    const internalPlatform = platformToInternal[platform] || 'kakao';

    const message: ChatMessage = {
      message_id: Date.now(),
      room_name: trader,
      sender: 'Harold',
      message: inputValue,
      timestamp: new Date().toISOString(),
      package_name: platform as ChatMessage['package_name'],
      direction: 'outgoing',
      created_at: new Date().toISOString()
    };

    // Add to local state
    addSellerMessage(trader, message);
    setInputValues(prev => ({ ...prev, [trader]: '' }));

    // Send to backend - /messages/send 엔드포인트 사용
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: trader,
          message: inputValue,
          platform: internalPlatform
        })
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-white">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          판매자 채팅
          {sellerTabs.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {sellerTabs.length}명
            </Badge>
          )}
        </h3>
      </div>

      {sellerTabs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          연결된 판매자가 없습니다
        </div>
      ) : (
        <Tabs
          value={activeSellerTab || ''}
          onValueChange={setActiveSellerTab}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <TabsList className="w-full justify-start rounded-none border-b px-2 flex-shrink-0">
            {sellerTabs.map(trader => (
              <TabsTrigger
                key={trader}
                value={trader}
                className="relative group"
              >
                {trader}
                <span
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSellerTab(trader);
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sellerTabs.map(trader => (
            <TabsContent
              key={trader}
              value={trader}
              className="flex-1 m-0 min-h-0 overflow-hidden"
            >
              <SellerChatRoom
                trader={trader}
                messages={sellerMessages.get(trader) || []}
                inputValue={inputValues[trader] || ''}
                onInputChange={(value) => setInputValues(prev => ({ ...prev, [trader]: value }))}
                onSend={() => handleSend(trader)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
});
SellerChatsColumn.displayName = 'SellerChatsColumn';

// Helper Components
const MessageBubble = memo(({ message }: { message: ChatMessage }) => {
  const isOutgoing = message.direction === 'outgoing' || message.sender === 'Harold';

  return (
    <div className={cn("flex gap-2", isOutgoing && "justify-end")}>
      {!isOutgoing && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2",
          isOutgoing
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-900"
        )}
      >
        <div className="text-sm">{message.message}</div>
        <div className={cn(
          "text-xs mt-1",
          isOutgoing ? "text-blue-100" : "text-gray-500"
        )}>
          {formatDistanceToNow(new Date(message.timestamp), {
            addSuffix: true,
            locale: ko
          })}
        </div>
      </div>
      {isOutgoing && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
          <img src="/SP_logo.png" alt="Seanergy" className="w-8 h-8 object-cover" />
        </div>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

const SuggestionCard = memo(({
  suggestion,
  isSelected,
  onToggle
}: {
  suggestion: AISuggestion;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  // 첫 번째 옵션의 메시지를 표시 (주요 제안)
  const primaryOption = suggestion.suggestions?.[0];

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1">
          {isSelected ? (
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          ) : (
            <Circle className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{suggestion.category}</div>
          {suggestion.original_message && (
            <div className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded">
              <span className="font-medium">{suggestion.original_message.sender}:</span> {suggestion.original_message.message}
            </div>
          )}
          {primaryOption && (
            <div className="text-xs text-gray-600 mt-2">
              <span className="font-medium">{primaryOption.action}:</span> {primaryOption.reason}
              {primaryOption.message && (
                <div className="mt-1 text-blue-600">&quot;{primaryOption.message}&quot;</div>
              )}
            </div>
          )}
          {suggestion.confidence && (
            <Badge
              variant={suggestion.confidence > 0.8 ? 'default' : 'secondary'}
              className="mt-2"
            >
              신뢰도: {Math.round(suggestion.confidence * 100)}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});
SuggestionCard.displayName = 'SuggestionCard';

const SellerChatRoom = memo(({
  trader,
  messages,
  inputValue,
  onInputChange,
  onSend
}: {
  trader: string;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);

  // Auto scroll to bottom - instant on first load, smooth on updates
  useEffect(() => {
    if (messages.length > 0) {
      if (isFirstLoadRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        isFirstLoadRef.current = false;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {messages.map((msg) => (
            <MessageBubble key={msg.message_id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
            placeholder={`${trader}에게 메시지...`}
            className="flex-1"
          />
          <Button onClick={onSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
SellerChatRoom.displayName = 'SellerChatRoom';

const ResizeHandle = memo(({ onMouseDown }: { onMouseDown: () => void }) => {
  return (
    <div
      className="w-1 hover:w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-all"
      onMouseDown={onMouseDown}
    />
  );
});
ResizeHandle.displayName = 'ResizeHandle';