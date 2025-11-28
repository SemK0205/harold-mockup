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
import type { TradingSession, ChatMessage, AISuggestion, SellerStatus, SellerContext, DealStage, SellerRequiredField } from "@/types";
import { getSellerRequiredFields, getFieldCompletionRatio, DEAL_STAGE_LABELS_KO } from "@/types";
import { DealModalProvider, useDealModal } from "@/contexts/DealModalContext";
import { useSSEManager } from "@/hooks/useSSEManager";
import SSEConnectionManager from "@/lib/sse/SSEConnectionManager";
import { useDealStore } from "@/stores";

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
            Deal Details - {session.vessel_name || "Vessel TBD"}
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
          <span className="text-gray-500">Vessel:</span> {session.vessel_name || "-"}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">ETA:</span> {session.delivery_date || "-"}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">Port:</span> {session.port || "-"}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">Fuel:</span> {session.fuel_type || "-"} {session.quantity || ""}
          {session.fuel_type2 && (
            <span className="text-yellow-400 ml-2">
              + {session.fuel_type2} {session.quantity2 || ""}
            </span>
          )}
        </div>
        <div className="whitespace-nowrap">
          <span className="text-gray-500">Customer:</span> {session.customer_room_name}
        </div>
        {!showAIPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAI}
            className="ml-auto text-green-400 hover:text-green-300 hover:bg-gray-800"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI Assistant
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
          // ChatMessage 형식으로 변환 - direction 필드 우선, 없으면 sender 기준
          const ourSenders = ['Harold', 
                              '씨너지파트너', 
                              'Seanergy', 
                              'seanergyAI', 
                              'SeanergyAI', 
                              '김성원', 
                              '김민석', 
                              '권우정', 
                              'Yong', 
                              'Kenn', 
                              'Me', 
                              '나',
                              '씨너지파트너 주식회사',    
                              '씨너지파트너AI',    
                              'Seanergy AI',    
                              'Harold AI',    
                              'Yong Oh',         
                              'Kenn Kwon',    
                              'Kenn Kwon (SEANERGY PARTNER)',    
                              'seanergy ai'];
          setBuyerMessages(messages.map((msg: any) => ({
            message_id: msg.id || msg.message_id,
            room_name: msg.room_name,
            sender: msg.sender,
            message: msg.message,
            timestamp: msg.created_at,
            package_name: msg.platform || 'com.kakao.talk',
            direction: msg.direction || (ourSenders.some(s => msg.sender?.includes(s)) ? 'outgoing' : 'incoming'),
            created_at: msg.created_at
          })));

          // Mark messages as read (구매측)
          try {
            const platformToInternal: Record<string, string> = {
              'com.kakao.talk': 'kakao',
              'com.kakao.yellowid': 'kakao_biz',
              'com.whatsapp': 'whatsapp',
              'com.wechat': 'wechat'
            };
            const internalPlatform = platformToInternal[platform] || 'kakao';
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/chats/${encodeURIComponent(session.customer_room_name)}/mark-read?platform=${internalPlatform}`,
              { method: 'POST' }
            );
          } catch (markReadError) {
            console.error('Failed to mark buyer messages as read:', markReadError);
          }
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
      {/* 헤더 */}
      <div className="p-3 border-b bg-white">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Buyer Chat
          <Badge variant="secondary" className="ml-auto text-xs">
            {session?.customer_room_name && session.customer_room_name.length > 15
              ? `${session.customer_room_name.slice(0, 15)}...`
              : session?.customer_room_name}
          </Badge>
        </h3>
      </div>

      {/* Required FullContext for Buyer */}
      <BuyerRequiredFullContext session={session} />

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
            placeholder="Type a message..."
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

// Buyer Required FullContext Component
// Buyer Required FullContext Component
const BuyerRequiredFullContext = memo(({ session }: { session: TradingSession | null }) => {
  // 행 기반 레이아웃: [Vessel], [Port, ETA], [Fuel1, QTY1], [Fuel2, QTY2]
  const rows = [
    [
      { key: 'vessel', label: 'Vessel', value: session?.vessel_name, filled: !!session?.vessel_name, wide: true }
    ],
    [
      { key: 'port', label: 'Port', value: session?.port, filled: !!session?.port },
      { key: 'eta', label: 'ETA', value: session?.delivery_date, filled: !!session?.delivery_date }
    ],
    [
      { key: 'fuel1', label: 'Fuel1', value: session?.fuel_type, filled: !!session?.fuel_type },
      { key: 'qty1', label: "QTY1", value: session?.quantity, filled: !!session?.quantity }
    ],
    ...(session?.fuel_type2 ? [[
      { key: 'fuel2', label: 'Fuel2', value: session?.fuel_type2, filled: !!session?.fuel_type2 },
      { key: 'qty2', label: "QTY2", value: session?.quantity2, filled: !!session?.quantity2 }
    ]] : [])
  ];

  const allFields = rows.flat();
  const filledCount = allFields.filter(f => f.filled).length;
  const totalCount = allFields.length;
  const percentage = Math.round((filledCount / totalCount) * 100);

  return (
    <div className="p-2 border-b bg-gradient-to-r from-purple-50 to-blue-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-purple-700">Required FullContext</span>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full",
          percentage === 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        )}>
          {filledCount}/{totalCount} ({percentage}%)
        </span>
      </div>
      <div className="space-y-1">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={row.length === 1 ? "" : "grid grid-cols-2 gap-1"}>
            {row.map((field) => (
              <div
                key={field.key}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-[10px]",
                  field.filled ? "bg-green-100/50 border border-green-200" : "bg-white border border-dashed border-gray-300"
                )}
              >
                {field.filled ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 text-red-400 flex-shrink-0" />
                )}
                <span className="font-medium text-gray-600">{field.label}:</span>
                <span className={cn("truncate", field.filled ? "text-green-700 font-medium" : "text-gray-400 italic")}>
                  {field.value || "—"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
BuyerRequiredFullContext.displayName = 'BuyerRequiredFullContext';
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
  // 트레이더 선택 상태 관리 (suggestionId-optionIndex -> Set of selected target indices)
  const [selectedTargets, setSelectedTargets] = useState<Map<string, Set<number>>>(new Map());

  // 선택된 타겟 키 생성 헬퍼
  const getTargetKey = (suggestionId: number, optionIndex: number) => `${suggestionId}-${optionIndex}`;

  // 타겟 선택 초기화 (모든 타겟 선택)
  const initializeTargets = (suggestionId: number, optionIndex: number, targets: any[]) => {
    const key = getTargetKey(suggestionId, optionIndex);
    if (!selectedTargets.has(key)) {
      const allSelected = new Set(targets.map((_, idx) => idx));
      setSelectedTargets(prev => new Map(prev).set(key, allSelected));
    }
  };

  // 타겟 선택 토글
  const toggleTarget = (suggestionId: number, optionIndex: number, targetIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    setSelectedTargets(prev => {
      const newMap = new Map(prev);
      const currentSet = new Set(prev.get(key) || []);
      if (currentSet.has(targetIndex)) {
        currentSet.delete(targetIndex);
      } else {
        currentSet.add(targetIndex);
      }
      newMap.set(key, currentSet);
      return newMap;
    });
  };

  // 전체 선택
  const selectAllTargets = (suggestionId: number, optionIndex: number, totalTargets: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    const allSelected = new Set(Array.from({ length: totalTargets }, (_, i) => i));
    setSelectedTargets(prev => new Map(prev).set(key, allSelected));
  };

  // 전체 해제
  const deselectAllTargets = (suggestionId: number, optionIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    setSelectedTargets(prev => new Map(prev).set(key, new Set()));
  };

  // 선택된 타겟 수 가져오기
  const getSelectedCount = (suggestionId: number, optionIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    return selectedTargets.get(key)?.size || 0;
  };

  // 타겟이 선택되었는지 확인
  const isTargetSelected = (suggestionId: number, optionIndex: number, targetIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    return selectedTargets.get(key)?.has(targetIndex) || false;
  };

  // 첫 번째 제안을 자동으로 확장
  useEffect(() => {
    if (aiSuggestions.length > 0 && expandedSuggestion === null) {
      const firstSuggestion = aiSuggestions[0];
      setExpandedSuggestion(firstSuggestion.id);
      setEditingMessage(firstSuggestion.suggestions[0]?.message || '');
      // 첫 번째 옵션의 타겟 초기화
      if (firstSuggestion.suggestions[0]?.targets) {
        initializeTargets(firstSuggestion.id, 0, firstSuggestion.suggestions[0].targets);
      }
    }
  }, [aiSuggestions, expandedSuggestion]);

  // Full Context 계산 - 세션 데이터 기반 (fuel_type2가 있으면 동적 추가)
  const baseRequirements = ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity'];
  const requirements = session?.fuel_type2
    ? [...baseRequirements, 'fuel_type2', 'quantity2']
    : baseRequirements;
  const missingFields = requirements.filter(field => {
    if (!session) return true;
    const value = session[field as keyof typeof session];
    return !value || value === '';
  });
  const completion = Math.round(((requirements.length - missingFields.length) / requirements.length) * 100);

  // Field questions
  const fieldQuestions: Record<string, string> = {
    vessel_name: 'Please provide the vessel name.',
    port: 'Please provide the port.',
    delivery_date: 'Please provide the ETA (Estimated Time of Arrival).',
    fuel_type: 'Please provide the fuel type.',
    quantity: 'Please provide the quantity.',
    fuel_type2: 'Please provide the second fuel type.',
    quantity2: 'Please provide the second fuel quantity.'
  };

  // Field labels
  const fieldLabels: Record<string, string> = {
    vessel_name: 'Vessel',
    port: 'Port',
    delivery_date: 'ETA',
    fuel_type: 'Fuel Type',
    quantity: 'Quantity',
    fuel_type2: 'Fuel Type 2',
    quantity2: 'Quantity 2'
  };

  useEffect(() => {
    setFullContextCompletion(completion);
  }, [completion, setFullContextCompletion]);

  // Fetch AI suggestions - 해당 세션의 제안만 가져옴
  useEffect(() => {
    if (!session) return;

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/session/${session.session_id}`
        );
        if (response.ok) {
          const data = await response.json();
          const sessionSuggestions = Array.isArray(data) ? data : [];
          setAiSuggestions(sessionSuggestions);
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

      // 선택된 타겟 인덱스 가져오기
      const key = getTargetKey(suggestion.id, optionIndex);
      const selectedTargetIndices = selectedTargets.get(key) || new Set(option.targets?.map((_: any, i: number) => i) || []);

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
        // 선택된 트레이더에게만 전송
        for (let i = 0; i < option.targets.length; i++) {
          if (!selectedTargetIndices.has(i)) continue; // 선택되지 않은 타겟은 스킵

          const target = option.targets[i];
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
        // 선택된 대상에게만 각각 다른 메시지 전송
        for (let i = 0; i < option.targets.length; i++) {
          if (!selectedTargetIndices.has(i)) continue; // 선택되지 않은 타겟은 스킵

          const target = option.targets[i];
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
      // 선택 상태도 클리어
      setSelectedTargets(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });

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
          AI Assistant
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAIPanel(false)}
          className="h-8 w-8 p-0 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 border-gray-300"
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
                        title={isMissing ? `Click to ask: "${fieldQuestions[field]}"` : ''}
                      >
                        {isMissing ? (
                          <Circle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )}
                        <span className="font-medium">{fieldLabels[field]}:</span>
                        <span className={isMissing ? 'italic' : ''}>
                          {isMissing ? 'Click to ask' : String(value)}
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
            <h4 className="text-sm font-medium">AI Suggestions</h4>
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
                              // 타겟 초기화
                              if (option.targets) {
                                initializeTargets(suggestion.id, idx, option.targets);
                              }
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
                                Target: {Array.isArray(option.targets)
                                  ? option.targets.slice(0, 3).map(t => typeof t === 'string' ? t : t.room).join(', ')
                                  : ''}
                                {option.targets.length > 3 && ` +${option.targets.length - 3} more`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 트레이더 선택 UI - Select All/None 및 체크박스 목록 */}
                      {suggestion.suggestions[selectedOptionIndex]?.targets &&
                        suggestion.suggestions[selectedOptionIndex].targets.length > 0 && (
                        <div className="border rounded-lg bg-white">
                          {/* 헤더: Select Recipients + All/None 버튼 */}
                          <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                            <span className="text-xs font-medium text-gray-700">Select Recipients</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => selectAllTargets(
                                  suggestion.id,
                                  selectedOptionIndex,
                                  suggestion.suggestions[selectedOptionIndex].targets.length
                                )}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                All
                              </button>
                              <button
                                onClick={() => deselectAllTargets(suggestion.id, selectedOptionIndex)}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                None
                              </button>
                            </div>
                          </div>

                          {/* 트레이더 목록 */}
                          <div className="max-h-32 overflow-y-auto p-2 space-y-1">
                            {suggestion.suggestions[selectedOptionIndex].targets.map((target: any, tIdx: number) => {
                              const targetRoom = typeof target === 'string' ? target : target.room;
                              const isSelected = isTargetSelected(suggestion.id, selectedOptionIndex, tIdx);
                              return (
                                <div
                                  key={tIdx}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors",
                                    isSelected ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-transparent hover:bg-gray-100"
                                  )}
                                  onClick={() => toggleTarget(suggestion.id, selectedOptionIndex, tIdx)}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                    isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
                                  )}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className={cn(
                                    "truncate flex-1",
                                    isSelected ? "text-blue-900 font-medium" : "text-gray-700"
                                  )}>
                                    {targetRoom}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* 선택 카운터 */}
                          <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-600">
                            {getSelectedCount(suggestion.id, selectedOptionIndex)} of {suggestion.suggestions[selectedOptionIndex].targets.length} selected
                          </div>
                        </div>
                      )}

                      {/* Edit Message */}
                      {suggestion.suggestions[selectedOptionIndex]?.message && (
                        <div>
                          <label className="text-xs font-medium text-gray-700">Edit Message</label>
                          <textarea
                            value={editingMessage}
                            onChange={(e) => setEditingMessage(e.target.value)}
                            className="w-full mt-1 p-2 text-xs border rounded resize-none bg-white"
                            rows={4}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
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
                          {isProcessing ? 'Processing...' : 'Approve & Send'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectSuggestion(suggestion, 'User rejected')}
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                AI is analyzing the conversation...
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Batch Apply Selected Suggestions */}
      {selectedSuggestions.size > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <Button
            className="w-full"
            size="sm"
            onClick={() => {
              // Batch approve selected suggestions
              aiSuggestions
                .filter(s => selectedSuggestions.has(s.id))
                .forEach(s => handleApproveSuggestion(s, 0));
            }}
            disabled={isProcessing}
          >
            Apply Selected ({selectedSuggestions.size})
          </Button>
        </div>
      )}
    </div>
  );
});
AIAssistantColumn.displayName = 'AIAssistantColumn';

// Seller status labels and styles
const SELLER_STATUS_CONFIG: Record<SellerStatus, { label: string; color: string }> = {
  waiting_quote: { label: "Waiting", color: "bg-yellow-100 text-yellow-800" },
  quote_received: { label: "Quoted", color: "bg-green-100 text-green-800" },
  no_offer: { label: "No Offer", color: "bg-gray-100 text-gray-600" },
  renegotiating: { label: "Renegotiating", color: "bg-blue-100 text-blue-800" }
};

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

  // 전역 store에서 seller_contexts 가져오기
  const sessionId = session?.session_id || '';

  // store에서 전체 Map을 가져온 후 외부에서 sessionId로 접근
  const sellerContextsMap = useDealStore((state) => state.sellerContextsBySession);
  const unreadCountsMap = useDealStore((state) => state.unreadCountsBySession);
  const updateStoreSellerContext = useDealStore((state) => state.updateSellerContext);
  const clearUnread = useDealStore((state) => state.clearUnread);

  // sessionId로 해당 세션의 데이터 접근
  const storeSellerContexts = sessionId ? sellerContextsMap.get(sessionId) : undefined;
  const storeUnreadCounts = sessionId ? (unreadCountsMap.get(sessionId) || {}) : {};

  // 판매자 상태 가져오기 (store 우선, 없으면 session)
  const getSellerStatus = (trader: string): SellerStatus => {
    return storeSellerContexts?.[trader]?.status || session?.seller_contexts?.[trader]?.status || "waiting_quote";
  };

  // 현재 seller context 가져오기
  const getSellerContext = (trader: string): SellerContext | undefined => {
    return storeSellerContexts?.[trader] || session?.seller_contexts?.[trader];
  };

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  // activeSellerTab과 sessionId를 ref로 추적 (SSE 콜백에서 최신 값 참조)
  const activeTabRef = useRef(activeSellerTab);
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    activeTabRef.current = activeSellerTab;
  }, [activeSellerTab]);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Clear unread count when tab becomes active
  useEffect(() => {
    if (activeSellerTab && sessionId && storeUnreadCounts[activeSellerTab] > 0) {
      clearUnread(sessionId, activeSellerTab);
    }
  }, [activeSellerTab, sessionId, storeUnreadCounts, clearUnread]);

  // seller_contexts 업데이트 API 호출
  const updateSellerContext = async (
    trader: string,
    field: string,
    value: string
  ) => {
    if (!session?.session_id) return;

    try {
      // 필드에 따라 적절한 업데이트 구성
      let updatePayload: {
        status?: string;
        quote?: Record<string, string>;
        no_offer_reason?: string;
        earliest?: string;
      } = {};

      // 가격 관련 필드는 quote 객체에 넣기
      if (field.includes('price') || field === 'barge_fee') {
        const currentQuote = session.seller_contexts?.[trader]?.quote || {};
        updatePayload.quote = { ...currentQuote, [field]: value };
        // 견적이 수신되면 상태도 업데이트
        if (value) {
          updatePayload.status = 'quote_received';
        }
      } else if (field === 'earliest') {
        updatePayload.earliest = value;
      } else if (field === 'no_offer_reason') {
        updatePayload.no_offer_reason = value;
        updatePayload.status = 'no_offer';
      } else if (field === 'status') {
        updatePayload.status = value;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${session.session_id}/seller-context/${encodeURIComponent(trader)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        }
      );

      if (response.ok) {
        console.log(`seller_context 업데이트 성공: ${trader}.${field} = ${value}`);
        // 전역 store 즉시 업데이트
        const current = storeSellerContexts?.[trader] || session?.seller_contexts?.[trader] || { status: 'waiting_quote' as SellerStatus, quote: null };
        const updated = { ...current };

        if (field === 'status') {
          updated.status = value as SellerStatus;
        } else if (field.includes('price') || field === 'barge_fee') {
          updated.quote = { ...(updated.quote || {}), [field]: value };
          if (value) updated.status = 'quote_received';
        } else if (field === 'earliest') {
          updated.earliest = value;
        } else if (field === 'no_offer_reason') {
          updated.no_offer_reason = value;
          updated.status = 'no_offer';
        }

        if (sessionId) {
          updateStoreSellerContext(sessionId, trader, updated);
        }
      } else {
        console.error('seller_context 업데이트 실패:', await response.text());
      }
    } catch (error) {
      console.error('seller_context 업데이트 오류:', error);
    }
  };

  // Initialize tabs from session and load initial messages
  // seller_contexts에 있는 판매처만 탭 생성 (실제 메시지를 보낸 판매처)
  useEffect(() => {
    // seller_contexts가 있으면 그걸 사용, 없으면 requested_traders 사용
    const tradersToShow = session?.seller_contexts
      ? Object.keys(session.seller_contexts)
      : (session?.requested_traders || []);

    if (!tradersToShow.length || roomPlatforms.size === 0 || initializedRef.current) return;

    initializedRef.current = true;

    tradersToShow.forEach(trader => {
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
            // ChatMessage 형식으로 변환 - direction 필드 우선, 없으면 sender 기준
            const ourSenders = ['Harold', '씨너지파트너', 'Seanergy', 'seanergyAI', 'SeanergyAI', '김성원', '김민석', '권예정', 'Yong', 'Kenn', 'Me', '나'];
            const formattedMessages: ChatMessage[] = messages.map((msg: any) => ({
              message_id: msg.id || msg.message_id,
              room_name: msg.room_name,
              sender: msg.sender,
              message: msg.message,
              timestamp: msg.created_at,
              package_name: msg.platform || platform,
              direction: (msg.direction || (ourSenders.some(s => msg.sender?.includes(s)) ? 'outgoing' : 'incoming')) as 'incoming' | 'outgoing',
              created_at: msg.created_at
            }));
            setSellerMessagesForTrader(trader, formattedMessages);

            // Mark messages as read (판매측)
            try {
              const platformToInternal: Record<string, string> = {
                'com.kakao.talk': 'kakao',
                'com.kakao.yellowid': 'kakao_biz',
                'com.whatsapp': 'whatsapp',
                'com.wechat': 'wechat'
              };
              const internalPlatform = platformToInternal[platform] || 'kakao';
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/chats/${encodeURIComponent(trader)}/mark-read?platform=${internalPlatform}`,
                { method: 'POST' }
              );
            } catch (markReadError) {
              console.error(`Failed to mark seller messages as read for ${trader}:`, markReadError);
            }
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
        // Increment unread count if this tab is not active and message is incoming
        // ref 사용하여 closure 문제 해결
        if (trader !== activeTabRef.current && message.direction !== 'outgoing' && sessionIdRef.current) {
          useDealStore.getState().incrementUnread(sessionIdRef.current, trader);
        }
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
      {/* 헤더 */}
      <div className="p-2 border-b bg-white flex-shrink-0">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4" />
          Seller Chats
          {sellerTabs.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {sellerTabs.length}
            </Badge>
          )}
        </h3>
      </div>

      {sellerTabs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No connected sellers
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 상단 탭 영역 (30%) */}
          <div className="h-[30%] flex-shrink-0 border-b bg-gray-50 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 p-2">
              {sellerTabs.map((trader) => {
                const status = getSellerStatus(trader);
                const statusConfig = SELLER_STATUS_CONFIG[status];
                const isActive = activeSellerTab === trader;
                const sellerCtx = getSellerContext(trader);

                // FullContext 진행률 계산
                const traderRequiredFields = getSellerRequiredFields(
                  (session?.stage as DealStage) || "quote_collecting",
                  session?.fuel_type2 ? 2 : 1,
                  sellerCtx
                );
                const traderCompletion = getFieldCompletionRatio(traderRequiredFields);

                return (
                  <div
                    key={trader}
                    onClick={() => setActiveSellerTab(trader)}
                    className={cn(
                      "relative cursor-pointer rounded-lg p-2 transition-all",
                      "border-2",
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >

                    <div>
                      {/* 판매자 이름 + 상태 */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-medium text-gray-800 truncate"
                          title={trader}
                        >
                          {trader.length > 10 ? `${trader.slice(0, 10)}..` : trader}
                        </span>
                        {/* Unread message badge */}
                        {storeUnreadCounts[trader] > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full animate-pulse min-w-[18px] text-center">
                            {storeUnreadCounts[trader] > 99 ? '99+' : storeUnreadCounts[trader]}
                          </span>
                        )}
                        {/* FullContext 진행률 + Status dropdown 묶음 */}
                        <div className="flex items-center gap-1">
                          {/* FullContext 진행률 - no_offer가 아닐 때만 표시 */}
                          {status !== "no_offer" && (
                            <span className={cn(
                              "text-[9px] px-1 py-0.5 rounded",
                              traderCompletion.percentage === 100
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            )}>
                              {traderCompletion.filled}/{traderCompletion.total}
                            </span>
                          )}
                          {/* Status dropdown */}
                          <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusDropdownOpen(statusDropdownOpen === trader ? null : trader);
                            }}
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity",
                              statusConfig.color
                            )}
                          >
                            {statusConfig.label} ▾
                          </button>
                          {statusDropdownOpen === trader && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[120px]">
                              {(Object.entries(SELLER_STATUS_CONFIG) as [SellerStatus, { label: string; color: string }][]).map(([statusKey, config]) => (
                                <button
                                  key={statusKey}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSellerContext(trader, 'status', statusKey);
                                    setStatusDropdownOpen(null);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 text-[10px] hover:bg-gray-100 flex items-center gap-2",
                                    status === statusKey && "bg-gray-50 font-medium"
                                  )}
                                >
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    statusKey === "waiting_quote" && "bg-yellow-400",
                                    statusKey === "quote_received" && "bg-green-400",
                                    statusKey === "no_offer" && "bg-gray-400",
                                    statusKey === "renegotiating" && "bg-blue-400"
                                  )} />
                                  {config.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>

                      {/* 견적 정보 (있는 경우) */}
                      {sellerCtx?.quote && (
                        <div className="mt-1 text-[10px] text-gray-600 truncate">
                          {sellerCtx.quote.fuel1_price && <span className="text-green-700">{sellerCtx.quote.fuel1_price}</span>}
                          {sellerCtx.quote.barge_fee && <span className="text-blue-600 ml-1">+{sellerCtx.quote.barge_fee}</span>}
                        </div>
                      )}

                      {/* 노오퍼 사유 (있는 경우) */}
                      {sellerCtx?.no_offer_reason && (
                        <div className="mt-1 text-[10px] text-red-500 truncate">
                          {sellerCtx.no_offer_reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 채팅 영역 (70%) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeSellerTab && (
              <SellerChatRoom
                key={`${activeSellerTab}-${getSellerContext(activeSellerTab)?.status || 'unknown'}`}
                trader={activeSellerTab}
                messages={sellerMessages.get(activeSellerTab) || []}
                inputValue={inputValues[activeSellerTab] || ''}
                onInputChange={(value) => setInputValues(prev => ({ ...prev, [activeSellerTab]: value }))}
                onSend={() => handleSend(activeSellerTab)}
                sellerContext={getSellerContext(activeSellerTab)}
                dealStage={(session?.stage as DealStage) || "quote_collecting"}
                fuelCount={session?.fuel_type2 ? 2 : 1}
                onFieldUpdate={(field, value) => {
                  updateSellerContext(activeSellerTab, field, value);
                }}
              />
            )}
          </div>
        </div>
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
            addSuffix: true
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
              Confidence: {Math.round(suggestion.confidence * 100)}%
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
  onSend,
  sellerContext,
  dealStage,
  fuelCount,
  onFieldUpdate
}: {
  trader: string;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sellerContext?: SellerContext;
  dealStage?: DealStage;
  fuelCount?: number;
  onFieldUpdate?: (field: string, value: string) => void;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // 수집 필요 필드 계산
  const requiredFields = getSellerRequiredFields(
    dealStage || "quote_collecting",
    fuelCount || 1,
    sellerContext
  );
  const completion = getFieldCompletionRatio(requiredFields);

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

  const handleFieldEdit = (field: SellerRequiredField) => {
    setEditingField(field.key);
    setEditValue(field.value || "");
  };

  const handleFieldSave = () => {
    if (editingField && onFieldUpdate) {
      onFieldUpdate(editingField, editValue);
    }
    setEditingField(null);
    setEditValue("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Required Info Panel - waiting_quote, quote_received, renegotiating 상태에서 표시 (no_offer 제외) */}
      {sellerContext?.status !== "no_offer" && (sellerContext?.status === "waiting_quote" || sellerContext?.status === "quote_received" || sellerContext?.status === "renegotiating" || dealStage === "quote_collecting" || dealStage === "deal_started") && (
        <div className="p-2 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700">
              📋 Required FullContext
            </span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full",
              completion.percentage === 100
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            )}>
              {completion.filled}/{completion.total} ({completion.percentage}%)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {requiredFields.map((field) => (
              <div
                key={field.key}
                className={cn(
                  "flex items-center gap-1 p-1.5 rounded text-[10px]",
                  field.filled
                    ? "bg-green-100/50 border border-green-200"
                    : "bg-white border border-dashed border-gray-300"
                )}
              >
                {field.filled ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 truncate">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </div>
                  {editingField === field.key ? (
                    <div className="flex gap-1 mt-0.5">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-1 py-0.5 text-[10px] border rounded"
                        placeholder="Enter value..."
                        autoFocus
                        onKeyPress={(e) => e.key === "Enter" && handleFieldSave()}
                      />
                      <button
                        onClick={handleFieldSave}
                        className="px-1 text-[9px] bg-blue-500 text-white rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "truncate cursor-pointer hover:bg-gray-100 rounded px-0.5",
                        field.filled ? "text-green-700" : "text-gray-400 italic"
                      )}
                      onClick={() => handleFieldEdit(field)}
                      title={field.value || "Click to enter"}
                    >
                      {field.value || "—"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Margin Calculation Panel (+$2) - Only show when quote exists */}
      {sellerContext?.quote && sellerContext.quote.fuel1_price && (
        <div className="p-2 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-green-700">
              💰 Margin Calc (+$2)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Customer Price
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Fuel 1 */}
            {sellerContext.quote.fuel1_price && (
              <div className="bg-white rounded-lg p-2 border border-green-200">
                <div className="text-[10px] text-gray-500 mb-0.5">Fuel 1</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-green-700">
                    ${(() => {
                      const price = parseFloat(sellerContext.quote?.fuel1_price || "0");
                      return isNaN(price) ? "—" : (price + 2).toFixed(0);
                    })()}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    (cost ${sellerContext.quote.fuel1_price})
                  </span>
                </div>
              </div>
            )}
            {/* Fuel 2 */}
            {sellerContext.quote.fuel2_price && (
              <div className="bg-white rounded-lg p-2 border border-green-200">
                <div className="text-[10px] text-gray-500 mb-0.5">Fuel 2</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-green-700">
                    ${(() => {
                      const price = parseFloat(sellerContext.quote?.fuel2_price || "0");
                      return isNaN(price) ? "—" : (price + 2).toFixed(0);
                    })()}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    (cost ${sellerContext.quote.fuel2_price})
                  </span>
                </div>
              </div>
            )}
            {/* Fuel 3 */}
            {sellerContext.quote.fuel3_price && (
              <div className="bg-white rounded-lg p-2 border border-green-200">
                <div className="text-[10px] text-gray-500 mb-0.5">Fuel 3</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-green-700">
                    ${(() => {
                      const price = parseFloat(sellerContext.quote?.fuel3_price || "0");
                      return isNaN(price) ? "—" : (price + 2).toFixed(0);
                    })()}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    (cost ${sellerContext.quote.fuel3_price})
                  </span>
                </div>
              </div>
            )}
            {/* Barge Fee */}
            {sellerContext.quote.barge_fee && (
              <div className="bg-white rounded-lg p-2 border border-blue-200">
                <div className="text-[10px] text-gray-500 mb-0.5">Barge</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-blue-700">
                    +${sellerContext.quote.barge_fee}
                  </span>
                  <span className="text-[9px] text-gray-400">(no margin)</span>
                </div>
              </div>
            )}
          </div>
          {/* Customer Message Preview */}
          <div className="mt-2 p-1.5 bg-white rounded border border-dashed border-gray-300">
            <div className="text-[10px] text-gray-500 mb-0.5">📨 Customer Message Preview:</div>
            <div className="text-[11px] font-mono text-gray-800">
              {(() => {
                const quote = sellerContext.quote;
                const price1 = quote?.fuel1_price;
                const price2 = quote?.fuel2_price;
                const price3 = quote?.fuel3_price;
                const barge = quote?.barge_fee;

                let prices: string[] = [];
                if (price1) prices.push((parseFloat(price1) + 2).toFixed(0));
                if (price2) prices.push((parseFloat(price2) + 2).toFixed(0));
                if (price3) prices.push((parseFloat(price3) + 2).toFixed(0));

                let msg = prices.join("/");
                if (barge) msg += `+${barge}`;
                return msg || "—";
              })()}
            </div>
          </div>
        </div>
      )}

      {/* No Offer Reason Display */}
      {sellerContext?.no_offer_reason && (
        <div className="p-2 border-b bg-red-50 text-xs">
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">No Offer:</span>
            <span>{sellerContext.no_offer_reason}</span>
          </div>
        </div>
      )}

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
            placeholder={`Message to ${trader}...`}
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