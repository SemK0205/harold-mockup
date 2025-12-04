/**
 * Deal Detail Modal - 3-Column Layout
 * 거래 상세 정보 모달 (3열 레이아웃)
 * Buyer Chat | AI Assistant | Seller Chats
 */

"use client";

import { useState, useEffect, memo, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Sparkles,
  Plus,
  Pencil,
  Check,
  TrendingUp,
  Bell,
  Ship
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { TradingSession, ChatMessage, AISuggestion, SellerStatus, SellerContext, DealStage } from "@/types";
import { getSellerRequiredFields, getFieldCompletionRatio } from "@/types";
import { DealModalProvider, useDealModal } from "@/contexts/DealModalContext";
import { useSSEManager } from "@/hooks/useSSEManager";
import SSEConnectionManager from "@/lib/sse/SSEConnectionManager";
import { useDealStore } from "@/stores";
import { getApiUrl } from "@/lib/api/client";
import { QuickReplyButtons } from "@/components/chat/QuickReplyButtons";

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
          <DealDetailModalContent />
        </DialogContent>
      </Dialog>
    </DealModalProvider>
  );
}

// Inner Content Component
function DealDetailModalContent() {
  const {
    session,
    showAIPanel,
    setShowAIPanel,
    setRoomPlatforms
  } = useDealModal();

  const containerRef = useRef<HTMLDivElement>(null);

  // Load room platforms from /chats/rooms API
  useEffect(() => {
    const fetchRoomPlatforms = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/chats/rooms`);
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

  if (!session) return null;

  return (
    <div className="flex flex-col h-[90vh]">
      {/* Header */}
      <DealHeader
        session={session}
        showAIPanel={showAIPanel}
        onToggleAI={() => setShowAIPanel(true)}
      />

      {/* 3-Column Layout - 고정 비율 24:52:24 */}
      <div ref={containerRef} className="flex flex-1 relative overflow-hidden">
        {/* Buyer Chat Column - 24% */}
        <div className="border-r h-full" style={{ width: '24%' }}>
          <BuyerChatColumn />
        </div>

        {/* AI Assistant Column - 52% */}
        {showAIPanel && (
          <div className="border-r bg-gray-50 h-full" style={{ width: '52%' }}>
            <AIAssistantColumn />
          </div>
        )}

        {/* Seller Chats Column - 24% (or 76% when AI hidden) */}
        <div className="h-full" style={{ width: showAIPanel ? '24%' : '76%' }}>
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const prevMessagesLengthRef = useRef<number>(0);

  // Load initial messages - wait for roomPlatforms to be loaded
  useEffect(() => {
    if (!session?.customer_room_name || roomPlatforms.size === 0 || initializedRef.current) return;

    initializedRef.current = true;
    const platform = getRoomPlatform(session.customer_room_name);
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${getApiUrl()}/chats/${encodeURIComponent(session.customer_room_name)}/messages?platform=${platform}`
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
            created_at: msg.created_at,
            reply_to_message: msg.reply_to_message,
            reply_to_author: msg.reply_to_author
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
              `${getApiUrl()}/chats/${encodeURIComponent(session.customer_room_name)}/mark-read?platform=${internalPlatform}`,
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
    onMessage: addBuyerMessage,
    enabled: true
  });

  // Auto scroll to bottom on messages loaded
  useEffect(() => {
    if (buyerMessages.length > 0) {
      // 메시지가 로드되었을 때 (0 -> N) 또는 새 메시지가 추가되었을 때
      const isInitialLoad = prevMessagesLengthRef.current === 0 && buyerMessages.length > 0;
      const isNewMessage = buyerMessages.length > prevMessagesLengthRef.current;

      if (isInitialLoad || isNewMessage) {
        // 여러 번 스크롤 시도 (렌더링 타이밍 문제 해결)
        const scrollToBottom = () => {
          const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        };

        // 즉시 + 지연 스크롤 (여러 타이밍에 시도)
        scrollToBottom();
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 150);
      }

      prevMessagesLengthRef.current = buyerMessages.length;
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
      await fetch(`${getApiUrl()}/messages/send`, {
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

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-3">
          {buyerMessages.map((msg) => (
            <MessageBubble key={msg.message_id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-white space-y-2">
        {/* Quick Reply Buttons */}
        {session?.customer_room_name && (
          <QuickReplyButtons
            roomName={session.customer_room_name}
            onSend={(text) => {
              // 메시지 목록에 즉시 추가 (옵티미스틱 업데이트)
              addBuyerMessage({
                message_id: Date.now(),
                room_name: session.customer_room_name,
                sender: "나",
                message: text,
                package_name: "com.kakao.talk",
                direction: "outgoing",
                timestamp: new Date().toISOString(),
                created_at: new Date().toISOString(),
              });
            }}
            className="pb-1"
          />
        )}
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
const BuyerRequiredFullContext = memo(({ session }: { session: TradingSession | null }) => {
  const { addBuyerMessage, getRoomPlatform, updateSession } = useDealModal();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 편집 모드 시작 시 현재 값 로드
  const startEditing = () => {
    setEditValues({
      vessel: session?.vessel_name || '',
      imo: session?.imo || '',
      port: session?.port || '',
      eta: session?.delivery_date || '',
      fuel1: session?.fuel_type || '',
      qty1: session?.quantity?.toString() || '',
      fuel2: session?.fuel_type2 || '',
      qty2: session?.quantity2?.toString() || '',
    });
    setIsEditing(true);
  };

  // 저장 처리
  const handleSave = async () => {
    if (!session) return;
    setIsSaving(true);

    try {
      const response = await fetch(`${getApiUrl()}/sessions/${session.session_id}/fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vessel_name: editValues.vessel || null,
          imo: editValues.imo || null,
          port: editValues.port || null,
          delivery_date: editValues.eta || null,
          fuel_type: editValues.fuel1 || null,
          quantity: editValues.qty1 ? parseFloat(editValues.qty1) : null,
          fuel_type2: editValues.fuel2 || null,
          quantity2: editValues.qty2 ? parseFloat(editValues.qty2) : null,
        })
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        if (updateSession) {
          updateSession({
            vessel_name: editValues.vessel || undefined,
            imo: editValues.imo || undefined,
            port: editValues.port || undefined,
            delivery_date: editValues.eta || undefined,
            fuel_type: editValues.fuel1 || undefined,
            quantity: editValues.qty1 || undefined,
            fuel_type2: editValues.fuel2 || undefined,
            quantity2: editValues.qty2 || undefined,
          });
        }
        setIsEditing(false);
      } else {
        console.error('Failed to update session fields');
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 필드별 질문 메시지 생성 (Buyer 측 - 인쿼리 단계)
  const getFieldQuestion = (fieldKey: string, lang: 'ko' | 'en' = 'ko'): string => {
    const questions: Record<string, Record<string, string>> = {
      vessel: { ko: '배 이름이 어떻게 되나요?', en: 'What is the vessel name?' },
      port: { ko: '포트가 어떻게 되나요?', en: 'What is the port?' },
      eta: { ko: 'ETA가 어떻게 되나요?', en: 'What is the ETA?' },
      fuel1: { ko: '유종이 어떻게 되나요?', en: 'What is the fuel type?' }
    };

    if (fieldKey === 'fuel2') {
      if (lang === 'en') {
        return session?.fuel_type2
          ? `What is the ${session.fuel_type2} type?`
          : 'What is the second fuel type?';
      }
      return session?.fuel_type2
        ? `${session.fuel_type2} 유종이 어떻게 되나요?`
        : '유종이 어떻게 되나요?';
    }

    if (fieldKey === 'qty1') {
      if (lang === 'en') {
        return session?.fuel_type
          ? `What is the quantity for ${session.fuel_type}?`
          : 'What is the quantity?';
      }
      return session?.fuel_type
        ? `${session.fuel_type} 수량은 어떻게 되나요?`
        : '수량은 어떻게 되나요?';
    }
    if (fieldKey === 'qty2') {
      if (lang === 'en') {
        return session?.fuel_type2
          ? `What is the quantity for ${session.fuel_type2}?`
          : 'What is the second fuel quantity?';
      }
      return session?.fuel_type2
        ? `${session.fuel_type2} 수량은 어떻게 되나요?`
        : '수량은 어떻게 되나요?';
    }

    return questions[fieldKey]?.[lang] || questions[fieldKey]?.['ko'] || '';
  };

  // 빈 필드 클릭 시 질문 전송
  const handleMissingFieldClick = async (fieldKey: string) => {
    if (!session || isEditing) return;

    const question = getFieldQuestion(fieldKey);
    if (!question) return;

    const platform = getRoomPlatform(session.customer_room_name);
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
      message: question,
      timestamp: new Date().toISOString(),
      package_name: platform as ChatMessage['package_name'],
      direction: 'outgoing',
      created_at: new Date().toISOString()
    };
    addBuyerMessage(message);

    try {
      await fetch(`${getApiUrl()}/messages/send`, {
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

  // 행 기반 레이아웃
  const rows = [
    [
      { key: 'vessel', label: 'Vessel', value: session?.vessel_name, filled: !!session?.vessel_name, required: true },
      { key: 'imo', label: 'IMO', value: session?.imo, filled: !!session?.imo, required: false }
    ],
    [
      { key: 'port', label: 'Port', value: session?.port, filled: !!session?.port, required: true },
      { key: 'eta', label: 'ETA', value: session?.delivery_date, filled: !!session?.delivery_date, required: true }
    ],
    [
      { key: 'fuel1', label: 'Fuel1', value: session?.fuel_type, filled: !!session?.fuel_type, required: true },
      { key: 'qty1', label: "QTY1", value: session?.quantity, filled: !!session?.quantity, required: true }
    ],
    ...(session?.fuel_type2 || isEditing ? [[
      { key: 'fuel2', label: 'Fuel2', value: session?.fuel_type2, filled: !!session?.fuel_type2, required: true },
      { key: 'qty2', label: "QTY2", value: session?.quantity2, filled: !!session?.quantity2, required: true }
    ]] : [])
  ];

  const allFields = rows.flat();
  const requiredFields = allFields.filter(f => f.required);
  const filledCount = requiredFields.filter(f => f.filled).length;
  const totalCount = requiredFields.length;
  const percentage = Math.round((filledCount / totalCount) * 100);

  return (
    <div className="p-2 border-b bg-gradient-to-r from-purple-50 to-blue-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-purple-700">Required FullContext</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            percentage === 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          )}>
            {filledCount}/{totalCount} ({percentage}%)
          </span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded hover:bg-red-100 text-red-600"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="p-1 rounded hover:bg-purple-100 text-purple-600"
              title="Edit fields"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={row.length === 1 ? "" : "grid grid-cols-2 gap-1"}>
            {row.map((field) => (
              <div
                key={field.key}
                onClick={() => !isEditing && !field.filled && handleMissingFieldClick(field.key)}
                title={!isEditing && !field.filled ? `Click to ask: "${getFieldQuestion(field.key)}"` : ''}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-[10px]",
                  isEditing
                    ? "bg-white border border-purple-200"
                    : field.filled
                      ? "bg-green-100/50 border border-green-200"
                      : "bg-white border border-dashed border-gray-300 cursor-pointer hover:bg-red-50 hover:border-red-300"
                )}
              >
                {!isEditing && (
                  field.filled ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  )
                )}
                <span className="font-medium text-gray-600 flex-shrink-0">{field.label}:</span>
                {isEditing ? (
                  <input
                    type={field.key.includes('qty') ? 'number' : 'text'}
                    value={editValues[field.key] || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[10px] text-purple-700 font-medium"
                    placeholder={field.label}
                  />
                ) : (
                  <span className={cn("truncate", field.filled ? "text-green-700 font-medium" : "text-gray-400 italic")}>
                    {field.value || "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
BuyerRequiredFullContext.displayName = 'BuyerRequiredFullContext';

// Buyer Vessel History 컴포넌트 (각 배별 인쿼리 히스토리)
const BuyerVesselHistory = memo(({ customerRoom, vesselName, currentSessionId }: {
  customerRoom: string;
  vesselName: string;
  currentSessionId?: string;
}) => {
  const [history, setHistory] = useState<Array<{
    session_id: string;
    inquiry_date: string | null;
    port: string | null;
    eta: string | null;
    fuel1: string | null;
    fuel1_qty: string | null;
    fuel2: string | null;
    fuel2_qty: string | null;
    status: string | null;
    offers: Array<{ trader: string; price: string }>;
    purchase_prices: Array<{ trader: string; price: string }>;
    deal_done_price: string | null;
    margin_per_ton: Array<{ trader: string; fuel1_margin?: string; fuel2_margin?: string }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!customerRoom || !vesselName) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${getApiUrl()}/customers/${encodeURIComponent(customerRoom)}/vessels/${encodeURIComponent(vesselName)}/history`
        );
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch vessel history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customerRoom, vesselName]);

  if (loading) {
    return (
      <div className="px-3 py-4 text-center text-gray-400 text-xs">
        Loading...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-gray-400 text-xs">
        No inquiry history
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-2 py-1.5 text-left font-medium text-gray-600 min-w-[70px]">Date</th>
            <th className="px-2 py-1.5 text-left font-medium text-gray-600 min-w-[60px]">Port</th>
            <th className="px-2 py-1.5 text-left font-medium text-gray-600 min-w-[70px]">ETA</th>
            <th className="px-2 py-1.5 text-left font-medium text-gray-600 min-w-[90px]">Fuel1</th>
            <th className="px-2 py-1.5 text-left font-medium text-gray-600 min-w-[90px]">Fuel2</th>
            <th className="px-2 py-1.5 text-center font-medium text-green-700 bg-green-50 min-w-[70px]">Offer</th>
            <th className="px-2 py-1.5 text-center font-medium text-blue-700 bg-blue-50 min-w-[70px]">Customer</th>
            <th className="px-2 py-1.5 text-center font-medium text-purple-700 bg-purple-50 min-w-[70px]">Deal Done</th>
            <th className="px-2 py-1.5 text-center font-medium text-gray-600 min-w-[70px]">Margin</th>
            <th className="px-2 py-1.5 text-center font-medium text-gray-600 min-w-[55px]">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((inquiry) => {
            const isCurrentSession = inquiry.session_id === currentSessionId;
            const bestOffer = inquiry.offers[0];
            const bestPurchase = inquiry.purchase_prices[0];
            const bestMargin = inquiry.margin_per_ton[0];

            return (
              <tr
                key={inquiry.session_id}
                className={cn(
                  "border-b hover:bg-gray-50",
                  isCurrentSession && "bg-orange-50"
                )}
              >
                <td className="px-2 py-1.5 text-gray-700">
                  {inquiry.inquiry_date
                    ? new Date(inquiry.inquiry_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                    : '—'}
                  {isCurrentSession && <span className="ml-1 text-orange-500">●</span>}
                </td>
                <td className="px-2 py-1.5 text-gray-700">{inquiry.port || '—'}</td>
                <td className="px-2 py-1.5 text-gray-700">{inquiry.eta || '—'}</td>
                <td className="px-2 py-1.5">
                  <div className="text-gray-700">{inquiry.fuel1 || '—'}</div>
                  {inquiry.fuel1_qty && <div className="text-[9px] text-gray-400">{inquiry.fuel1_qty}</div>}
                </td>
                <td className="px-2 py-1.5">
                  {inquiry.fuel2 ? (
                    <>
                      <div className="text-gray-700">{inquiry.fuel2}</div>
                      {inquiry.fuel2_qty && <div className="text-[9px] text-gray-400">{inquiry.fuel2_qty}</div>}
                    </>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center bg-green-50/50">
                  {bestOffer ? (
                    <span className="font-medium text-green-700">{bestOffer.price}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center bg-blue-50/50">
                  {bestPurchase ? (
                    <span className="font-medium text-blue-700">{bestPurchase.price}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center bg-purple-50/50">
                  {inquiry.deal_done_price ? (
                    <span className="font-bold text-purple-700">{inquiry.deal_done_price}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {bestMargin ? (
                    <div className="text-gray-700 text-[9px]">
                      {bestMargin.fuel1_margin && <div>{bestMargin.fuel1_margin}</div>}
                      {bestMargin.fuel2_margin && <div>{bestMargin.fuel2_margin}</div>}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px]",
                    inquiry.status === 'closed_success' ? "bg-green-100 text-green-700" :
                    inquiry.status === 'closed_lost' ? "bg-red-100 text-red-700" :
                    inquiry.status === 'closed_failed' ? "bg-red-100 text-red-700" :
                    inquiry.status === 'active' ? "bg-blue-100 text-blue-700" :
                    inquiry.status === 'no_offer' ? "bg-gray-100 text-gray-600" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    {inquiry.status === 'closed_success' ? 'Won' :
                     inquiry.status === 'closed_lost' ? 'Lost' :
                     inquiry.status === 'closed_failed' ? 'Failed' :
                     inquiry.status === 'active' ? 'Active' :
                     inquiry.status === 'no_offer' ? 'N/O' :
                     inquiry.status || '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
BuyerVesselHistory.displayName = 'BuyerVesselHistory';

// Seller Quote Comparison Table (Excel-style)
const SellerQuoteComparisonTable = memo(() => {
  const { session, getRoomPlatform, addSellerMessage, addSellerTab } = useDealModal();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [allTraders, setAllTraders] = useState<Array<{id: string; name: string; room_name: string; platform: string}>>([]);
  const setSellerContexts = useDealStore((state) => state.setSellerContexts);

  // 인라인 마진 편집 상태: { seller: string, field: string } | null
  const [inlineEditingMargin, setInlineEditingMargin] = useState<{ seller: string; field: string } | null>(null);
  const [inlineMarginValue, setInlineMarginValue] = useState('');

  // 전체 트레이더 목록 로드
  useEffect(() => {
    const fetchAllTraders = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/traders/all`);
        if (response.ok) {
          const data = await response.json();
          setAllTraders(data);
        }
      } catch (error) {
        console.error('Failed to fetch all traders:', error);
      }
    };
    fetchAllTraders();
  }, []);

  // 전역 store에서 seller_contexts 가져오기
  const sessionId = session?.session_id || '';
  const sellerContextsMap = useDealStore((state) => state.sellerContextsBySession);
  const storeSellerContexts = sessionId ? sellerContextsMap.get(sessionId) : undefined;

  // 판매자 목록 (seller_contexts 우선, 없으면 requested_traders)
  const sellers = storeSellerContexts
    ? Object.keys(storeSellerContexts)
    : session?.seller_contexts
      ? Object.keys(session.seller_contexts)
      : session?.requested_traders || [];

  // 유종 개수에 따른 필드 결정
  const fuelCount = session?.fuel_type2 ? 2 : 1;
  const fields = [
    { key: 'deal_total', label: 'TOTAL', isCalculated: true },
    { key: 'fuel1_price', label: `${session?.fuel_type || 'Fuel1'} Price` },
    ...(fuelCount >= 2 ? [{ key: 'fuel2_price', label: `${session?.fuel_type2 || 'Fuel2'} Price` }] : []),
    { key: 'barge_fee', label: 'Barge Fee' },
    { key: 'earliest', label: 'Earliest' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'term', label: 'Term' },
    { key: 'fuel1_margin', label: `${session?.fuel_type || 'Fuel1'} Margin`, isMargin: true },
    ...(fuelCount >= 2 ? [{ key: 'fuel2_margin', label: `${session?.fuel_type2 || 'Fuel2'} Margin`, isMargin: true }] : []),
    { key: 'total', label: 'Profit', isCalculated: true }
  ];

  // 판매자 컨텍스트 가져오기 (store 우선, 없으면 session)
  const getSellerContext = (trader: string): SellerContext | undefined => {
    return storeSellerContexts?.[trader] || session?.seller_contexts?.[trader];
  };

  // 편집 모드 시작
  const startEditing = () => {
    const values: Record<string, Record<string, string>> = {};
    sellers.forEach(seller => {
      const context = getSellerContext(seller);
      values[seller] = {
        fuel1_price: context?.quote?.fuel1_price || '',
        fuel2_price: context?.quote?.fuel2_price || '',
        barge_fee: context?.quote?.barge_fee || '',
        earliest: context?.earliest || '',
        supplier: context?.quote?.supplier || '',
        term: context?.quote?.term || '',
        fuel1_margin: context?.quote?.fuel1_margin || '',
        fuel2_margin: context?.quote?.fuel2_margin || '',
      };
    });
    setEditValues(values);
    setIsEditing(true);
  };

  // 저장 처리
  const handleSave = async () => {
    if (!session) return;
    setIsSaving(true);

    try {
      for (const seller of sellers) {
        const values = editValues[seller];
        if (!values) continue;

        const response = await fetch(`${getApiUrl()}/sessions/${session.session_id}/seller-context/${encodeURIComponent(seller)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote: {
              fuel1_price: values.fuel1_price || null,
              fuel2_price: values.fuel2_price || null,
              barge_fee: values.barge_fee || null,
              term: values.term || null,
              supplier: values.supplier || null,
              fuel1_margin: values.fuel1_margin || null,
              fuel2_margin: values.fuel2_margin || null,
            },
            earliest: values.earliest || null,
          })
        });

        if (response.ok) {
          const currentContexts = storeSellerContexts || {};
          const updatedContexts = {
            ...currentContexts,
            [seller]: {
              ...currentContexts[seller],
              quote: {
                ...currentContexts[seller]?.quote,
                fuel1_price: values.fuel1_price || undefined,
                fuel2_price: values.fuel2_price || undefined,
                barge_fee: values.barge_fee || undefined,
                term: values.term || undefined,
                supplier: values.supplier || undefined,
                fuel1_margin: values.fuel1_margin || undefined,
                fuel2_margin: values.fuel2_margin || undefined,
              },
              earliest: values.earliest || undefined,
            }
          };
          setSellerContexts(session.session_id, updatedContexts);
        }
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update seller contexts:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 새 셀러 추가
  const handleAddSeller = async () => {
    if (!session || !newSellerName.trim()) return;

    try {
      const response = await fetch(`${getApiUrl()}/sessions/${session.session_id}/seller-context/${encodeURIComponent(newSellerName.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'waiting_quote' })
      });

      if (response.ok) {
        const currentContexts = storeSellerContexts || {};
        const updatedContexts: Record<string, SellerContext> = {
          ...currentContexts,
          [newSellerName.trim()]: { status: 'waiting_quote' as SellerStatus, quote: {} }
        };
        setSellerContexts(session.session_id, updatedContexts);
        addSellerTab(newSellerName.trim());
        setNewSellerName('');
        setShowAddSeller(false);
      }
    } catch (error) {
      console.error('Failed to add seller:', error);
    }
  };

  // 인라인 마진 저장
  const saveInlineMargin = async (seller: string, field: string, value: string) => {
    if (!session) return;

    try {
      const context = getSellerContext(seller);
      const currentQuote = context?.quote || {};

      const response = await fetch(`${getApiUrl()}/sessions/${session.session_id}/seller-context/${encodeURIComponent(seller)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: {
            ...currentQuote,
            [field]: value || null,
          },
        })
      });

      if (response.ok) {
        const currentContexts = storeSellerContexts || {};
        const updatedContexts = {
          ...currentContexts,
          [seller]: {
            ...currentContexts[seller],
            status: currentContexts[seller]?.status || 'waiting_quote' as SellerStatus,
            quote: {
              ...currentContexts[seller]?.quote,
              [field]: value || undefined,
            },
          }
        };
        setSellerContexts(session.session_id, updatedContexts);
      }
    } catch (error) {
      console.error('Failed to save margin:', error);
    }

    setInlineEditingMargin(null);
    setInlineMarginValue('');
  };

  // 필드 값 가져오기
  const getFieldValue = (trader: string, fieldKey: string): string | null => {
    const context = getSellerContext(trader);

    // 마진 필드는 DB에서 읽기
    if (fieldKey === 'fuel1_margin') {
      return context?.quote?.fuel1_margin || null;
    }
    if (fieldKey === 'fuel2_margin') {
      return context?.quote?.fuel2_margin || null;
    }

    if (!context) return null;

    if (fieldKey === 'earliest') {
      return context.earliest || null;
    }
    if (fieldKey === 'term') {
      return context.quote?.term || null;
    }
    if (fieldKey === 'supplier') {
      return context.quote?.supplier || null;
    }

    // 수량 파싱 헬퍼 함수: "1000-1200MT" → 중간값 1100 사용
    const parseQuantity = (qty: string | null | undefined): number => {
      if (!qty) return 0;
      const parts = qty.split('-');
      if (parts.length >= 2) {
        // 범위인 경우 중간값 사용
        const min = parseFloat(parts[0].replace(/[^0-9.]/g, '') || '0');
        const max = parseFloat(parts[1].replace(/[^0-9.]/g, '') || '0');
        return isNaN(min) || isNaN(max) ? 0 : (min + max) / 2;
      }
      // 단일 값인 경우
      const num = parseFloat(qty.replace(/[^0-9.]/g, '') || '0');
      return isNaN(num) ? 0 : num;
    };

    if (fieldKey === 'deal_total') {
      // TOTAL = (fuel1_price × quantity1) + (fuel2_price × quantity2) + barge_fee
      const fuel1Price = parseFloat(context.quote?.fuel1_price?.replace(/[,$]/g, '') || '0');
      const fuel2Price = parseFloat(context.quote?.fuel2_price?.replace(/[,$]/g, '') || '0');
      const bargeFee = parseFloat(context.quote?.barge_fee?.replace(/[,$]/g, '') || '0');

      // 가격이 없으면 표시 안함
      if (fuel1Price === 0 && fuel2Price === 0) return null;

      const quantity1 = parseQuantity(session?.quantity);
      const quantity2 = parseQuantity(session?.quantity2);

      const dealTotal = (fuel1Price * quantity1) + (fuel2Price * quantity2) + bargeFee;
      if (dealTotal === 0) return null;

      // 천 단위 콤마 포맷
      return '$' + dealTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    if (fieldKey === 'total') {
      // Profit = (fuel1_margin * quantity1) + (fuel2_margin * quantity2)
      // 마진 기반 예상 수익 계산 (DB에서 읽은 값 사용)
      const fuel1Margin = parseFloat(context.quote?.fuel1_margin?.replace(/[,$]/g, '') || '0');
      const fuel2Margin = parseFloat(context.quote?.fuel2_margin?.replace(/[,$]/g, '') || '0');

      // 마진이 없으면 표시 안함
      if (fuel1Margin === 0 && fuel2Margin === 0) return null;

      const quantity1 = parseQuantity(session?.quantity);
      const quantity2 = parseQuantity(session?.quantity2);

      const profit = (fuel1Margin * quantity1) + (fuel2Margin * quantity2);
      if (profit === 0) return null;

      // 천 단위 콤마 포맷
      return '$' + profit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return context.quote?.[fieldKey as keyof typeof context.quote] || null;
  };

  // 질문 메시지 생성
  const getFieldQuestion = (fieldKey: string, lang: 'ko' | 'en' = 'ko'): string => {
    // fuel1_price: 유종명 동적 사용
    if (fieldKey === 'fuel1_price') {
      if (lang === 'en') {
        return session?.fuel_type
          ? `What is the price for ${session.fuel_type}?`
          : 'What is the price?';
      }
      return session?.fuel_type
        ? `${session.fuel_type} 가격이 어떻게 되나요?`
        : '가격이 어떻게 되나요?';
    }
    // fuel2_price: 유종명 동적 사용
    if (fieldKey === 'fuel2_price') {
      if (lang === 'en') {
        return session?.fuel_type2
          ? `What is the price for ${session.fuel_type2}?`
          : 'What is the price for the second fuel?';
      }
      return session?.fuel_type2
        ? `${session.fuel_type2} 가격이 어떻게 되나요?`
        : '가격이 어떻게 되나요?';
    }
    const questions: Record<string, Record<string, string>> = {
      barge_fee: { ko: '바지피가 어떻게 되나요?', en: 'What is the barge fee?' },
      earliest: { ko: '얼리 언제인가요?', en: 'When is the earliest?' },
      supplier: { ko: '서플 어디인가요?', en: 'Who is the supplier?' },
      term: { ko: '페이먼트 텀이 어떻게 되나요?', en: 'What are the payment terms?' }
    };
    return questions[fieldKey]?.[lang] || questions[fieldKey]?.['ko'] || '';
  };

  // 빈 셀 클릭 시 해당 판매자에게 질문 전송
  const handleCellClick = async (trader: string, fieldKey: string) => {
    if (isEditing) return;

    const question = getFieldQuestion(fieldKey);
    if (!question) return;

    const platform = getRoomPlatform(trader);
    const platformToInternal: Record<string, string> = {
      'com.kakao.talk': 'kakao',
      'com.kakao.yellowid': 'kakao_biz',
      'com.whatsapp': 'whatsapp',
      'com.wechat': 'wechat'
    };
    const internalPlatform = platformToInternal[platform] || 'kakao';

    // 로컬 상태에 메시지 추가
    const message: ChatMessage = {
      message_id: Date.now(),
      room_name: trader,
      sender: 'Harold',
      message: question,
      timestamp: new Date().toISOString(),
      package_name: platform as ChatMessage['package_name'],
      direction: 'outgoing',
      created_at: new Date().toISOString()
    };
    addSellerMessage(trader, message);

    // 백엔드로 전송
    try {
      await fetch(`${getApiUrl()}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: trader,
          message: question,
          platform: internalPlatform
        })
      });
    } catch (error) {
      console.error('Failed to send question:', error);
    }
  };

  // 판매자 이름 축약 (긴 이름 처리)
  const shortenTraderName = (name: string): string => {
    if (name.length <= 10) return name;
    return name.slice(0, 8) + '..';
  };

  // 판매처가 없어도 테이블 헤더는 유지
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-700">Seller Quote Matrix</span>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded hover:bg-red-100 text-red-600"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAddSeller(true)}
                className="p-1 rounded hover:bg-indigo-100 text-indigo-600"
                title="Add Seller"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={startEditing}
                className="p-1 rounded hover:bg-indigo-100 text-indigo-600"
                title="Edit quotes"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 셀러 추가 드롭다운 */}
      {showAddSeller && (
        <div className="px-3 py-2 bg-indigo-50 border-b flex items-center gap-2">
          <select
            value={newSellerName}
            onChange={(e) => setNewSellerName(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select seller...</option>
            {allTraders
              .filter(trader => !sellers.includes(trader.room_name))
              .map(trader => (
                <option key={trader.id} value={trader.room_name}>
                  {trader.name} ({trader.room_name})
                </option>
              ))}
          </select>
          <button
            onClick={handleAddSeller}
            disabled={!newSellerName}
            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddSeller(false); setNewSellerName(''); }}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              {/* x축: Seller 열 헤더 + 필드 열들 */}
              <th className="px-2 py-1.5 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 min-w-[100px]">
                Seller
              </th>
              {fields.map((field) => {
                const isMargin = (field as { isMargin?: boolean }).isMargin;
                const isDealTotal = field.key === 'deal_total';
                const isProfit = field.key === 'total';
                return (
                  <th
                    key={field.key}
                    className={cn(
                      "px-2 py-1.5 text-center font-medium min-w-[80px]",
                      isMargin ? "text-purple-700 bg-purple-50" :
                      isDealTotal ? "text-blue-700 bg-blue-50" :
                      isProfit ? "text-green-700 bg-green-50" :
                      "text-gray-700"
                    )}
                  >
                    {field.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sellers.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 1} className="px-2 py-4 text-center text-gray-500">
                  No sellers requested yet
                </td>
              </tr>
            ) : (
              sellers.map((seller, rowIdx) => (
                <tr key={seller} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {/* y축: 판매처 이름 */}
                  <td
                    className="px-2 py-1.5 font-medium text-gray-700 sticky left-0 bg-inherit border-r min-w-[100px]"
                    title={seller}
                  >
                    {shortenTraderName(seller)}
                  </td>
                  {/* 각 필드 값 */}
                  {fields.map((field) => {
                    const value = getFieldValue(seller, field.key);
                    const hasValue = !!value;
                    const isCalculated = (field as { isCalculated?: boolean }).isCalculated;
                    const isMargin = (field as { isMargin?: boolean }).isMargin;

                    // 편집 모드에서 마진 필드
                    if (isEditing && isMargin) {
                      return (
                        <td key={`${seller}-${field.key}`} className="px-1 py-0.5 bg-purple-50">
                          <input
                            type="text"
                            value={editValues[seller]?.[field.key] || ''}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [seller]: {
                                ...prev[seller],
                                [field.key]: e.target.value
                              }
                            }))}
                            className="w-full px-1 py-0.5 text-[10px] text-center border border-purple-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                            placeholder="$0"
                          />
                        </td>
                      );
                    }

                    // 마진 필드 표시 모드 (편집 아닐 때) - 클릭 시 인라인 편집
                    if (isMargin) {
                      const isInlineEditing = inlineEditingMargin?.seller === seller && inlineEditingMargin?.field === field.key;

                      if (isInlineEditing) {
                        return (
                          <td key={`${seller}-${field.key}`} className="px-2 py-1.5 text-center bg-purple-50">
                            <input
                              type="text"
                              autoFocus
                              value={inlineMarginValue}
                              onChange={(e) => setInlineMarginValue(e.target.value)}
                              onBlur={() => saveInlineMargin(seller, field.key, inlineMarginValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveInlineMargin(seller, field.key, inlineMarginValue);
                                } else if (e.key === 'Escape') {
                                  setInlineEditingMargin(null);
                                  setInlineMarginValue('');
                                }
                              }}
                              className="w-16 px-1 py-0.5 text-[11px] text-center border border-purple-300 rounded bg-white text-purple-700 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400"
                              placeholder="$0"
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={`${seller}-${field.key}`}
                          onClick={() => {
                            setInlineEditingMargin({ seller, field: field.key });
                            setInlineMarginValue(value || '');
                          }}
                          className={cn(
                            "px-2 py-1.5 text-center bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors",
                            hasValue ? "text-purple-700 font-medium" : "text-gray-400"
                          )}
                          title="Click to edit margin"
                        >
                          {hasValue ? value : '—'}
                        </td>
                      );
                    }

                    if (isEditing && !isCalculated) {
                      return (
                        <td key={`${seller}-${field.key}`} className="px-1 py-0.5">
                          <input
                            type="text"
                            value={editValues[seller]?.[field.key] || ''}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [seller]: {
                                ...prev[seller],
                                [field.key]: e.target.value
                              }
                            }))}
                            className="w-full px-1 py-0.5 text-[10px] text-center border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="—"
                          />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${seller}-${field.key}`}
                        onClick={() => !hasValue && !isCalculated && handleCellClick(seller, field.key)}
                        title={!hasValue && !isCalculated ? `Click to ask: "${getFieldQuestion(field.key)}"` : value || ''}
                        className={cn(
                          "px-2 py-1.5 text-center",
                          hasValue
                            ? field.key === 'deal_total' ? "text-blue-700 font-bold bg-blue-50" :
                              field.key === 'total' ? "text-green-700 font-bold bg-green-50" :
                              "text-green-700 font-medium"
                            : isCalculated
                              ? "text-gray-300"
                              : "text-gray-400 cursor-pointer hover:bg-red-50"
                        )}
                      >
                        {hasValue ? value : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
SellerQuoteComparisonTable.displayName = 'SellerQuoteComparisonTable';

// AI Assistant Column
const AIAssistantColumn = memo(() => {
  const {
    session,
    aiSuggestions,
    setAiSuggestions,
    selectedSuggestions,
    setFullContextCompletion,
    setShowAIPanel,
    getRoomPlatform,
    addBuyerMessage
  } = useDealModal();

  // seller_contexts 접근을 위한 store 연결
  const sessionId = session?.session_id || '';
  const sellerContextsMap = useDealStore((state) => state.sellerContextsBySession);
  const storeSellerContexts = sessionId ? sellerContextsMap.get(sessionId) : undefined;

  // 특정 트레이더의 seller_context 가져오기
  const getSellerContext = (traderRoomName: string) => {
    return storeSellerContexts?.[traderRoomName] || session?.seller_contexts?.[traderRoomName];
  };

  // 경과 시간 계산 헬퍼
  const getElapsedTime = (isoTimestamp: string | undefined): string | null => {
    if (!isoTimestamp) return null;
    try {
      return formatDistanceToNow(new Date(isoTimestamp), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const [showFullContext, setShowFullContext] = useState(false); // 임시로 숨김 - Seller Quote Matrix로 대체됨
  // 탭 상태: 'inquiry' | 'price-trends' | 'quote-history' | 'buyer-info'
  const [activeTab, setActiveTab] = useState<'inquiry' | 'price-trends' | 'quote-history' | 'buyer-info'>('quote-history');
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  // 트레이더 선택 상태 관리 (suggestionId-optionIndex -> Set of selected room_names)
  const [selectedTraderRooms, setSelectedTraderRooms] = useState<Map<string, Set<string>>>(new Map());
  // 전체 트레이더 목록
  const [allTraders, setAllTraders] = useState<Array<{id: string; name: string; room_name: string; platform: string; language?: string}>>([]);
  // 커스텀 트레이더 (추가된 트레이더)
  const [customTraders, setCustomTraders] = useState<Array<{id: string; name: string; room_name: string; platform: string; language?: string}>>([]);

  // Price Trends 관련 상태
  const [priceTrendPeriod, setPriceTrendPeriod] = useState<"3m" | "6m" | "1y">("3m");
  const [priceTrendData, setPriceTrendData] = useState<Array<{
    fuel_type: string;
    trends: Array<{date: string; avg_price: number | null; min_price: number | null; max_price: number | null; count: number}>;
  }>>([]);
  const [priceTrendLoading, setPriceTrendLoading] = useState(false);

  // Quote History 관련 상태
  interface QuoteHistoryItem {
    id: number;
    session_id: string;
    trader_room_name: string;
    fuel_type: string;
    quantity: number | null;
    price: number | null;
    price_unit: string;
    barge_fee: number | null;
    earliest: string | null;
    term: string | null;
    message: string | null;
    port: string | null;
    customer_room_name: string | null;
    quoted_at: string;
  }
  const [quoteHistory, setQuoteHistory] = useState<QuoteHistoryItem[]>([]);
  const [quoteHistoryLoading, setQuoteHistoryLoading] = useState(false);

  // Buyer Info 관련 상태
  interface BuyerVessel {
    vessel_name: string;
    imo: string | null;
    inquiry_count: number;
    last_inquiry_date: string | null;
  }
  interface InquiryHistoryItem {
    session_id: string;
    inquiry_date: string | null;
    port: string | null;
    eta: string | null;
    fuel1: string | null;
    fuel1_qty: string | null;
    fuel2: string | null;
    fuel2_qty: string | null;
    status: string | null;
    offers: Array<{
      trader: string;
      price: string;
      fuel1_price: string | null;
      fuel2_price: string | null;
      barge_fee: string | null;
      fuel1_margin: string | null;
      fuel2_margin: string | null;
    }>;
    purchase_prices: Array<{
      trader: string;
      price: string;
    }>;
    deal_done_price: string | null;
    selected_trader: string | null;
    margin_per_ton: Array<{
      trader: string;
      fuel1_margin?: string;
      fuel2_margin?: string;
    }>;
  }
  const [buyerVessels, setBuyerVessels] = useState<BuyerVessel[]>([]);
  const [buyerVesselsLoading, setBuyerVesselsLoading] = useState(false);
  const [selectedBuyerVessel, setSelectedBuyerVessel] = useState<string | null>(null);
  const [inquiryHistory, setInquiryHistory] = useState<InquiryHistoryItem[]>([]);
  const [inquiryHistoryLoading, setInquiryHistoryLoading] = useState(false);

  // 수동 리마인더 발송 상태 (트레이더별 로딩 상태)
  const [reminderSending, setReminderSending] = useState<Set<string>>(new Set());

  // 선택된 타겟 키 생성 헬퍼
  const getTargetKey = (suggestionId: number, optionIndex: number) => `${suggestionId}-${optionIndex}`;

  // 전체 트레이더 목록 가져오기
  useEffect(() => {
    const fetchAllTraders = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/traders/all`);
        if (response.ok) {
          const data = await response.json();
          setAllTraders(data);
        }
      } catch (error) {
        console.error('Failed to fetch all traders:', error);
      }
    };
    fetchAllTraders();
  }, []);

  // 인쿼리 메시지 자동 생성 함수
  const generateInquiryMessage = (lang: 'ko' | 'en' = 'ko'): string => {
    if (!session) return '';

    const { vessel_name, port, delivery_date, fuel_type, quantity, fuel_type2, quantity2, imo } = session;

    // 수량 포맷팅 (MT 추가)
    const formatQty = (qty: string | null) => {
      if (!qty) return '';
      // 이미 MT가 포함되어 있으면 그대로, 아니면 MT 추가
      if (qty.toUpperCase().includes('MT')) return qty;
      return `${qty}MT`;
    };

    if (lang === 'en') {
      let message = `${vessel_name || 'TBD'}${imo ? ` (IMO: ${imo})` : ''}\n`;
      message += `${port || 'TBD'}\n`;
      message += `${delivery_date || 'TBD'}\n`;
      message += `${fuel_type || 'TBD'} ${formatQty(quantity)}\n`;
      if (fuel_type2) {
        message += `${fuel_type2} ${formatQty(quantity2)}\n`;
      }
      message += `\nPlease advise earliest and price. Thank you!`;
      return message;
    } else {
      let message = `${vessel_name || 'TBD'}${imo ? ` (IMO: ${imo})` : ''}\n`;
      message += `${port || 'TBD'}\n`;
      message += `${delivery_date || 'TBD'}\n`;
      message += `${fuel_type || 'TBD'} ${formatQty(quantity)}\n`;
      if (fuel_type2) {
        message += `${fuel_type2} ${formatQty(quantity2)}\n`;
      }
      message += `\n상기 건 얼리 및 가격 확인 부탁드립니다. 감사합니다!`;
      return message;
    }
  };

  // 세션 데이터 변경 시 기본 인쿼리 메시지 생성 (aiSuggestions가 없을 때)
  useEffect(() => {
    if (!session) return;
    // aiSuggestions가 없고, editingMessage가 비어있으면 기본 메시지 생성
    if (aiSuggestions.length === 0 && !editingMessage) {
      const defaultMessage = generateInquiryMessage('ko');
      setEditingMessage(defaultMessage);
    }
  }, [session, aiSuggestions.length]);

  // Price Trends 데이터 가져오기 (fuel_type2도 함께 조회)
  const fetchPriceTrends = async (period: "3m" | "6m" | "1y") => {
    if (!session?.port || !session?.fuel_type) return;

    setPriceTrendLoading(true);
    try {
      let url = `${getApiUrl()}/api/price-trends?port=${encodeURIComponent(session.port)}&fuel_type=${encodeURIComponent(session.fuel_type)}&period=${period}`;

      // fuel_type2가 있으면 함께 조회
      if (session.fuel_type2) {
        url += `&fuel_type2=${encodeURIComponent(session.fuel_type2)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // 새로운 형식 (fuel_types 배열) 사용
        setPriceTrendData(data.fuel_types || []);
      }
    } catch (error) {
      console.error('Failed to fetch price trends:', error);
      setPriceTrendData([]);
    } finally {
      setPriceTrendLoading(false);
    }
  };

  // Price Trends 탭이 선택되면 데이터 로드
  useEffect(() => {
    if (activeTab === 'price-trends' && session?.port && session?.fuel_type) {
      fetchPriceTrends(priceTrendPeriod);
    }
  }, [activeTab, priceTrendPeriod, session?.port, session?.fuel_type, session?.fuel_type2]);

  // Quote History 데이터 가져오기
  const fetchQuoteHistory = async () => {
    if (!session?.session_id) return;

    setQuoteHistoryLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/sessions/${session.session_id}/quote-history`);
      if (response.ok) {
        const data = await response.json();
        setQuoteHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch quote history:', error);
      setQuoteHistory([]);
    } finally {
      setQuoteHistoryLoading(false);
    }
  };

  // Quote History 탭이 선택되면 데이터 로드
  useEffect(() => {
    if (activeTab === 'quote-history' && session?.session_id) {
      fetchQuoteHistory();
    }
  }, [activeTab, session?.session_id]);

  // Buyer Info - 구매자의 배 목록 가져오기
  const fetchBuyerVessels = async () => {
    if (!session?.customer_room_name) return;

    setBuyerVesselsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/customers/${encodeURIComponent(session.customer_room_name)}/vessels`);
      if (response.ok) {
        const data = await response.json();
        setBuyerVessels(data.vessels || []);
        // 현재 세션의 배가 있으면 자동 선택
        if (session.vessel_name && data.vessels?.some((v: BuyerVessel) => v.vessel_name === session.vessel_name)) {
          setSelectedBuyerVessel(session.vessel_name);
        } else if (data.vessels?.length > 0) {
          setSelectedBuyerVessel(data.vessels[0].vessel_name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch buyer vessels:', error);
      setBuyerVessels([]);
    } finally {
      setBuyerVesselsLoading(false);
    }
  };

  // Buyer Info - 선택된 배의 인쿼리 히스토리 가져오기
  const fetchInquiryHistory = async (vesselName: string) => {
    if (!session?.customer_room_name || !vesselName) return;

    setInquiryHistoryLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/customers/${encodeURIComponent(session.customer_room_name)}/vessels/${encodeURIComponent(vesselName)}/history`
      );
      if (response.ok) {
        const data = await response.json();
        setInquiryHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch inquiry history:', error);
      setInquiryHistory([]);
    } finally {
      setInquiryHistoryLoading(false);
    }
  };

  // Buyer Info 탭이 선택되면 데이터 로드
  useEffect(() => {
    if (activeTab === 'buyer-info' && session?.customer_room_name) {
      fetchBuyerVessels();
    }
  }, [activeTab, session?.customer_room_name]);

  // 선택된 배가 변경되면 인쿼리 히스토리 로드
  useEffect(() => {
    if (activeTab === 'buyer-info' && selectedBuyerVessel) {
      fetchInquiryHistory(selectedBuyerVessel);
    }
  }, [activeTab, selectedBuyerVessel]);

  // 수동 리마인더 발송
  const sendReminder = async (traderRoomName: string, language: string = "ko") => {
    if (!session?.session_id) return;

    // 이미 발송 중이면 무시
    if (reminderSending.has(traderRoomName)) return;

    setReminderSending(prev => new Set(prev).add(traderRoomName));
    try {
      const response = await fetch(`${getApiUrl()}/api/reminder/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          trader_room_name: traderRoomName,
          language: language
        })
      });
      if (response.ok) {
        // 성공 - last_reminder_at은 SSE를 통해 자동 업데이트됨
        console.log('[Reminder] Sent successfully to', traderRoomName);
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
    } finally {
      setReminderSending(prev => {
        const next = new Set(prev);
        next.delete(traderRoomName);
        return next;
      });
    }
  };

  // 트레이더 언어 조회 헬퍼
  const getTraderLanguage = (roomName: string): string => {
    const trader = allTraders.find(t => t.room_name === roomName);
    return trader?.language || "ko";
  };

  // 타겟 선택 초기화 (AI 추천 트레이더만 선택)
  const initializeTargets = (suggestionId: number, optionIndex: number, targets: any[]) => {
    const key = getTargetKey(suggestionId, optionIndex);
    if (!selectedTraderRooms.has(key)) {
      // AI가 추천한 트레이더의 room_name들로 초기화
      const recommendedRooms = new Set(targets.map((t: any) => typeof t === 'string' ? t : t.room));
      setSelectedTraderRooms(prev => new Map(prev).set(key, recommendedRooms));
    }
  };

  // 트레이더 선택 토글 (room_name 기반)
  const toggleTraderRoom = (suggestionId: number, optionIndex: number, roomName: string) => {
    const key = getTargetKey(suggestionId, optionIndex);
    setSelectedTraderRooms(prev => {
      const newMap = new Map(prev);
      const currentSet = new Set(prev.get(key) || []);
      if (currentSet.has(roomName)) {
        currentSet.delete(roomName);
      } else {
        currentSet.add(roomName);
      }
      newMap.set(key, currentSet);
      return newMap;
    });
  };

  // 전체 선택 (전체 트레이더)
  const selectAllTraders = (suggestionId: number, optionIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    const allRooms = new Set(allTraders.map(t => t.room_name));
    setSelectedTraderRooms(prev => new Map(prev).set(key, allRooms));
  };

  // 전체 해제
  const deselectAllTraders = (suggestionId: number, optionIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    setSelectedTraderRooms(prev => new Map(prev).set(key, new Set()));
  };

  // 트레이더 추가 (드롭다운에서 선택)
  const addTraderFromDropdown = (suggestionId: number, optionIndex: number, selectedTrader: { room_name: string; platform: string }) => {
    if (!selectedTrader.room_name) return;

    // 이미 customTraders에 있는지 확인
    const existsInCustom = customTraders.some(t => t.room_name === selectedTrader.room_name);

    if (!existsInCustom) {
      // 커스텀 트레이더 목록에 추가
      const newCustomTrader = {
        id: `custom_${Date.now()}`,
        name: selectedTrader.room_name,
        room_name: selectedTrader.room_name,
        platform: selectedTrader.platform
      };
      setCustomTraders(prev => [...prev, newCustomTrader]);
    }

    // 선택 목록에 추가
    const key = getTargetKey(suggestionId, optionIndex);
    setSelectedTraderRooms(prev => {
      const newMap = new Map(prev);
      const currentSet = new Set(newMap.get(key) || []);
      currentSet.add(selectedTrader.room_name);
      newMap.set(key, currentSet);
      return newMap;
    });
  };

  // 커스텀 트레이더 삭제
  const removeCustomTrader = (roomName: string) => {
    setCustomTraders(prev => prev.filter(t => t.room_name !== roomName));
    // 선택 목록에서도 제거
    setSelectedTraderRooms(prev => {
      const newMap = new Map(prev);
      newMap.forEach((set, key) => {
        if (set.has(roomName)) {
          const newSet = new Set(set);
          newSet.delete(roomName);
          newMap.set(key, newSet);
        }
      });
      return newMap;
    });
  };

  // 선택된 트레이더 수 가져오기
  const getSelectedTraderCount = (suggestionId: number, optionIndex: number) => {
    const key = getTargetKey(suggestionId, optionIndex);
    return selectedTraderRooms.get(key)?.size || 0;
  };

  // 트레이더가 선택되었는지 확인 (room_name 기반)
  const isTraderSelected = (suggestionId: number, optionIndex: number, roomName: string) => {
    const key = getTargetKey(suggestionId, optionIndex);
    return selectedTraderRooms.get(key)?.has(roomName) || false;
  };

  // AI 추천 트레이더인지 확인
  const isRecommendedTrader = (targets: any[], roomName: string) => {
    return targets.some((t: any) => (typeof t === 'string' ? t : t.room) === roomName);
  };

  // 선택된 트레이더 room_names 가져오기 (승인 시 사용)
  const getSelectedRoomNames = (suggestionId: number, optionIndex: number): string[] => {
    const key = getTargetKey(suggestionId, optionIndex);
    return Array.from(selectedTraderRooms.get(key) || []);
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
          `${getApiUrl()}/ai-suggestions/session/${session.session_id}`
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
      await fetch(`${getApiUrl()}/messages/send`, {
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

      // 선택된 트레이더 room_names 가져오기 (새로운 로직)
      const selectedRooms = getSelectedRoomNames(suggestion.id, optionIndex);
      console.log('[AI Approve] selectedRooms:', selectedRooms, 'optionIndex:', optionIndex);

      // 1. 백엔드에 승인 요청 (선택된 트레이더 정보 포함)
      const approvePayload = {
        selected_options: [optionIndex + 1],
        modified_message: customMessage || null,
        selected_targets: {
          [String(optionIndex + 1)]: selectedRooms  // 선택된 트레이더 room_names (키를 문자열로)
        }
      };
      console.log('[AI Approve] Sending payload:', JSON.stringify(approvePayload, null, 2));

      await fetch(`${getApiUrl()}/ai-suggestions/approve?suggestion_id=${suggestion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvePayload)
      });

      // 백엔드에서 메시지 전송을 처리하므로 프론트엔드에서는 UI 업데이트만 수행
      // reply_to_customer인 경우 UI에 메시지 추가
      if (option.action === 'reply_to_customer' && messageToSend) {
        const platform = getRoomPlatform(session.customer_room_name);
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
      }

      // Inquiry Sender UI는 전송 후에도 유지 (사라지지 않음)
      // 선택된 트레이더만 클리어하여 추가 전송 가능하게 함
      const key = getTargetKey(suggestion.id, optionIndex);
      setSelectedTraderRooms(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });

      // 메시지 전송 성공 알림 (선택사항)
      console.log(`[Inquiry Sender] Message sent to ${selectedRooms.length} traders`);

    } catch (error) {
      console.error('Failed to approve suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 제안 거부 - Inquiry Sender로 변경되면서 더 이상 사용하지 않음
  // const handleRejectSuggestion = async (suggestion: AISuggestion, reason: string) => { ... };

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
          {/* Seller Quote Comparison Table (Excel-style) */}
          <SellerQuoteComparisonTable />

          {/* Full Context Section - 임시로 숨김 (Seller Quote Matrix로 대체됨) */}
          {false && (
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
                  <div className="space-y-1">
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
          )}

          {/* Inquiry Sender & Price Trends 탭 */}
          <div className="space-y-3">
            {/* 탭 헤더 */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('quote-history')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-1",
                  activeTab === 'quote-history'
                    ? "text-purple-600 border-purple-500 bg-purple-50"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Quote History
              </button>
              {session?.port && session?.fuel_type && (
                <button
                  onClick={() => setActiveTab('price-trends')}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-1",
                    activeTab === 'price-trends'
                      ? "text-green-600 border-green-500 bg-green-50"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Price Trends
                </button>
              )}
              <button
                onClick={() => setActiveTab('inquiry')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2",
                  activeTab === 'inquiry'
                    ? "text-blue-600 border-blue-500 bg-blue-50"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                Inquiry Sender
              </button>
              <button
                onClick={() => setActiveTab('buyer-info')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-1",
                  activeTab === 'buyer-info'
                    ? "text-orange-600 border-orange-500 bg-orange-50"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                <Ship className="w-4 h-4" />
                Buyer Info
              </button>
            </div>

            {/* Inquiry Sender 탭 내용 */}
            {activeTab === 'inquiry' && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Inquiry Sender 내용 */}
                  <div className="p-3 bg-gray-50 space-y-3">
                      {/* 트레이더 선택 UI - 전체 트레이더 목록 */}
                      {allTraders.length > 0 && (
                        <div className="border rounded-lg bg-white">
                          {/* 헤더: Select Recipients + All/None 버튼 */}
                          <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                            <span className="text-xs font-medium text-gray-700">Select Recipients</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const allRooms = new Set(allTraders.map(t => t.room_name));
                                  setSelectedTraderRooms(new Map([['inquiry', allRooms]]));
                                }}
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                All
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTraderRooms(new Map([['inquiry', new Set()]]));
                                }}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                None
                              </button>
                            </div>
                          </div>

                          {/* 전체 트레이더 목록 - AI 추천 트레이더가 상단에 오도록 정렬 */}
                          <div className="p-2 space-y-1">
                            {(() => {
                              // AI 추천 트레이더 목록 (최신 suggestion에서)
                              const latestSuggestion = aiSuggestions[aiSuggestions.length - 1];
                              const recommendedTargets = latestSuggestion?.suggestions?.[0]?.targets || [];

                              // 추천 트레이더가 상단에 오도록 정렬
                              const sortedTraders = [...allTraders].sort((a, b) => {
                                const aRecommended = isRecommendedTrader(recommendedTargets, a.room_name);
                                const bRecommended = isRecommendedTrader(recommendedTargets, b.room_name);
                                if (aRecommended && !bRecommended) return -1;
                                if (!aRecommended && bRecommended) return 1;
                                return 0;
                              });

                              return sortedTraders.map((trader) => {
                                const selectedSet = selectedTraderRooms.get('inquiry') || new Set();
                                const isSelected = selectedSet.has(trader.room_name);
                                const isRecommended = isRecommendedTrader(recommendedTargets, trader.room_name);
                                // seller_contexts에서 해당 트레이더 정보 조회
                                const sellerContext = getSellerContext(trader.room_name);
                                const isSent = !!sellerContext?.contacted_at;
                                const elapsedTime = getElapsedTime(sellerContext?.contacted_at);

                                return (
                                  <div
                                    key={trader.id}
                                    className={cn(
                                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors",
                                      isSent
                                        ? "bg-gray-100 border border-gray-200"
                                        : isSelected
                                          ? "bg-blue-50 border border-blue-200"
                                          : "bg-gray-50 border border-transparent hover:bg-gray-100"
                                    )}
                                    onClick={() => {
                                      const currentSet = selectedTraderRooms.get('inquiry') || new Set();
                                      const newSet = new Set(currentSet);
                                      if (newSet.has(trader.room_name)) {
                                        newSet.delete(trader.room_name);
                                      } else {
                                        newSet.add(trader.room_name);
                                      }
                                      setSelectedTraderRooms(new Map([['inquiry', newSet]]));
                                    }}
                                  >
                                    <div className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                      isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
                                    )}>
                                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={cn(
                                      "truncate flex-1",
                                      isSent
                                        ? "text-gray-500"
                                        : isSelected
                                          ? "text-blue-900 font-medium"
                                          : "text-gray-700"
                                    )}>
                                      {trader.room_name}
                                    </span>
                                    {/* Sent 뱃지 + 경과 시간 + 리마인더 버튼 */}
                                    {isSent && (
                                      <div className="flex items-center gap-1">
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-blue-200">
                                          Sent
                                        </Badge>
                                        {elapsedTime && (
                                          <span className="text-[9px] text-gray-400">{elapsedTime}</span>
                                        )}
                                        {/* 리마인더 버튼 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            sendReminder(trader.room_name, getTraderLanguage(trader.room_name));
                                          }}
                                          disabled={reminderSending.has(trader.room_name)}
                                          className={cn(
                                            "p-0.5 rounded hover:bg-orange-100 transition-colors",
                                            reminderSending.has(trader.room_name) && "opacity-50 cursor-not-allowed"
                                          )}
                                          title="리마인더 발송"
                                        >
                                          <Bell className={cn(
                                            "w-3 h-3",
                                            reminderSending.has(trader.room_name) ? "text-gray-400 animate-pulse" : "text-orange-500"
                                          )} />
                                        </button>
                                      </div>
                                    )}
                                    {/* AI 추천 뱃지 (Sent가 아닌 경우만) */}
                                    {isRecommended && !isSent && (
                                      <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-green-100 text-green-700 border-green-200">
                                        추천
                                      </Badge>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* 선택 카운터 */}
                          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                            {selectedTraderRooms.get('inquiry')?.size || 0} of {allTraders.length} selected
                          </div>
                        </div>
                      )}

                      {/* Edit Message */}
                      <div>
                        <label className="text-xs font-medium text-gray-700">Edit Message</label>
                        <textarea
                          value={editingMessage}
                          onChange={(e) => setEditingMessage(e.target.value)}
                          className="w-full mt-1 p-2 text-xs border rounded resize-none bg-white"
                          rows={4}
                          placeholder="메시지를 입력하세요..."
                        />
                      </div>

                      {/* Send Button */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            const selectedRooms = selectedTraderRooms.get('inquiry') || new Set();
                            if (selectedRooms.size === 0 || !editingMessage.trim()) return;

                            setIsProcessing(true);
                            try {
                              // 선택된 트레이더들에게 메시지 전송
                              for (const roomName of selectedRooms) {
                                const trader = allTraders.find(t => t.room_name === roomName);
                                if (trader) {
                                  await fetch(`${getApiUrl()}/api/outgoing/send`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      room_name: roomName,
                                      message: editingMessage,
                                      package_name: trader.platform || 'com.kakao.talk',
                                      session_id: session?.session_id
                                    })
                                  });
                                }
                              }
                              // 전송 후 선택 초기화
                              setSelectedTraderRooms(new Map([['inquiry', new Set()]]));
                              setEditingMessage('');
                            } catch (error) {
                              console.error('Failed to send inquiry:', error);
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing || !editingMessage.trim() || (selectedTraderRooms.get('inquiry')?.size || 0) === 0}
                        >
                          {isProcessing ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                </div>
            )}

            {/* Price Trends 탭 내용 */}
            {activeTab === 'price-trends' && session?.port && session?.fuel_type && (
              <div className="space-y-3 border rounded-lg p-3">
                {/* Period Selection */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Period:</span>
                  <div className="flex gap-1">
                    {(["3m", "6m", "1y"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setPriceTrendPeriod(period)}
                        className={cn(
                          "px-2 py-1 text-xs rounded transition-colors",
                          priceTrendPeriod === period
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {period.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {session.port} / {session.fuel_type}{session.fuel_type2 ? ` + ${session.fuel_type2}` : ''}
                  </span>
                </div>

                {/* Charts - 유종별로 표시 */}
                {priceTrendLoading ? (
                  <div className="h-48 flex items-center justify-center text-gray-500 text-sm border rounded-lg">
                    Loading...
                  </div>
                ) : priceTrendData.length > 0 ? (
                  <div className="space-y-4">
                    {priceTrendData.map((fuelData, idx) => (
                      <div key={fuelData.fuel_type} className="border rounded-lg p-3 bg-white">
                        <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                          {fuelData.fuel_type}
                          <span className="text-gray-400">({fuelData.trends.length} months)</span>
                        </div>
                        {fuelData.trends.length > 0 ? (
                          <>
                            <div className="h-36">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={fuelData.trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) => value.substring(5)}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10 }}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(value) => `$${value}`}
                                  />
                                  <Tooltip
                                    formatter={(value: number) => [`$${value?.toFixed(2)}`, 'Avg Price']}
                                    labelFormatter={(label) => `Month: ${label}`}
                                    contentStyle={{ fontSize: 12 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="avg_price"
                                    stroke={idx === 0 ? "#22c55e" : "#3b82f6"}
                                    strokeWidth={2}
                                    dot={{ fill: idx === 0 ? '#22c55e' : '#3b82f6', r: 3 }}
                                    activeDot={{ r: 5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                              <div className="bg-gray-50 rounded p-1.5 text-center">
                                <div className="text-gray-500">Latest</div>
                                <div className="font-medium">
                                  ${fuelData.trends[fuelData.trends.length - 1]?.avg_price?.toFixed(2) || '-'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded p-1.5 text-center">
                                <div className="text-gray-500">Min</div>
                                <div className="font-medium">
                                  ${Math.min(...fuelData.trends.filter(d => d.avg_price).map(d => d.avg_price!)).toFixed(2) || '-'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded p-1.5 text-center">
                                <div className="text-gray-500">Max</div>
                                <div className="font-medium">
                                  ${Math.max(...fuelData.trends.filter(d => d.avg_price).map(d => d.avg_price!)).toFixed(2) || '-'}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-20 flex items-center justify-center text-gray-400 text-xs">
                            No data for {fuelData.fuel_type}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-500 text-sm border rounded-lg">
                    No price data available for this port/fuel combination
                  </div>
                )}
              </div>
            )}

            {/* Quote History 탭 내용 - 횡 테이블 (협상 라운드별) */}
            {activeTab === 'quote-history' && (
              <div className="space-y-3 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    Price Negotiation History
                  </span>
                  <button
                    onClick={fetchQuoteHistory}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Refresh
                  </button>
                </div>

                {quoteHistoryLoading ? (
                  <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                    Loading...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {(() => {
                      // 요청한 모든 셀러 목록 가져오기
                      const allSellers = storeSellerContexts
                        ? Object.keys(storeSellerContexts)
                        : session?.seller_contexts
                          ? Object.keys(session.seller_contexts)
                          : session?.requested_traders || [];

                      // 견적 데이터를 트레이더별로 그룹화하고 시간순 정렬
                      const groupedByTrader = quoteHistory.reduce((acc, quote) => {
                        const trader = quote.trader_room_name;
                        if (!acc[trader]) acc[trader] = [];
                        acc[trader].push(quote);
                        return acc;
                      }, {} as Record<string, typeof quoteHistory>);

                      // 각 트레이더별 견적을 시간순 정렬 (오래된 것 먼저 = 1차, 2차, 3차...)
                      Object.keys(groupedByTrader).forEach(trader => {
                        groupedByTrader[trader].sort((a, b) =>
                          new Date(a.quoted_at).getTime() - new Date(b.quoted_at).getTime()
                        );
                      });

                      // 최대 라운드 수 계산
                      const maxRounds = Math.max(
                        ...Object.values(groupedByTrader).map(quotes => quotes.length),
                        1
                      );

                      // 셀러 목록이 없으면 안내 메시지
                      if (allSellers.length === 0) {
                        return (
                          <div className="h-32 flex items-center justify-center text-gray-500 text-sm border rounded-lg">
                            No sellers requested yet
                          </div>
                        );
                      }

                      // 가격 포맷팅 함수: 476/722+12 형식
                      const formatPrice = (quote: typeof quoteHistory[0] | undefined) => {
                        if (!quote || !quote.price) return '—';

                        // 기본 가격
                        let priceStr = quote.price.toFixed(0);

                        // fuel_type2 가격이 있으면 슬래시로 추가 (quote_history에는 단일 price만 있으므로 seller_contexts에서 확인)
                        const sellerContext = getSellerContext(quote.trader_room_name);
                        const fuel2Price = sellerContext?.quote?.fuel2_price;
                        if (fuel2Price) {
                          const fuel2Num = parseFloat(fuel2Price.replace(/[^\d.]/g, ''));
                          if (!isNaN(fuel2Num)) {
                            priceStr += `/${fuel2Num.toFixed(0)}`;
                          }
                        }

                        // 바지피가 있으면 +로 추가
                        if (quote.barge_fee) {
                          priceStr += `+${quote.barge_fee.toFixed(0)}`;
                        }

                        return priceStr;
                      };

                      // 셀러 이름 축약
                      const shortenName = (name: string): string => {
                        if (name.length <= 12) return name;
                        // 괄호 안 내용이 있으면 그것 사용
                        const match = name.match(/\(([^)]+)\)/);
                        if (match) return match[1];
                        return name.slice(0, 10) + '..';
                      };

                      return (
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-purple-50 border-b">
                              <th className="px-2 py-1.5 text-left font-medium text-purple-700 sticky left-0 bg-purple-50 min-w-[100px]">
                                Seller
                              </th>
                              {Array.from({ length: maxRounds }, (_, i) => (
                                <th key={i} className="px-2 py-1.5 text-center font-medium text-purple-700 min-w-[70px]">
                                  {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
                                </th>
                              ))}
                              <th className="px-2 py-1.5 text-center font-medium text-green-700 bg-green-50 min-w-[70px]">
                                Final
                              </th>
                              <th className="px-2 py-1.5 text-center font-medium text-gray-600 min-w-[50px]">
                                Δ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allSellers.map((traderRoom) => {
                              const quotes = groupedByTrader[traderRoom] || [];
                              const hasQuotes = quotes.length > 0;
                              const sellerContext = getSellerContext(traderRoom);
                              const status = sellerContext?.status || 'waiting_quote';

                              // 가격 변화 계산 (첫 견적 vs 마지막 견적)
                              const firstPrice = quotes[0]?.price;
                              const lastPrice = quotes[quotes.length - 1]?.price;
                              const priceChange = hasQuotes && firstPrice && lastPrice
                                ? lastPrice - firstPrice
                                : null;

                              return (
                                <tr key={traderRoom} className="border-b hover:bg-gray-50">
                                  <td
                                    className="px-2 py-1.5 text-left font-medium text-gray-700 sticky left-0 bg-white truncate"
                                    title={traderRoom}
                                  >
                                    {shortenName(traderRoom)}
                                  </td>
                                  {/* 각 라운드 가격 (판매측/고객측) */}
                                  {Array.from({ length: maxRounds }, (_, i) => {
                                    const quote = quotes[i];

                                    // 고객 가격 계산 (마진 포함)
                                    const getCustomerPrice = () => {
                                      if (!quote || !sellerContext?.quote) return null;
                                      const ctx = sellerContext.quote;
                                      const fuel1Margin = ctx.fuel1_margin;
                                      const fuel2Margin = ctx.fuel2_margin;

                                      if (!fuel1Margin && !fuel2Margin) return null;

                                      try {
                                        const fuel1Price = quote.price || 0;
                                        const margin1 = parseFloat((fuel1Margin || '0').replace(/[^\d.]/g, ''));
                                        let customerPrice = (fuel1Price + margin1).toFixed(0);

                                        // Fuel2
                                        const fuel2Price = ctx.fuel2_price;
                                        if (fuel2Price && fuel2Margin) {
                                          const fuel2Base = parseFloat(fuel2Price.replace(/[^\d.]/g, ''));
                                          const margin2 = parseFloat(fuel2Margin.replace(/[^\d.]/g, ''));
                                          customerPrice += `/${(fuel2Base + margin2).toFixed(0)}`;
                                        }

                                        if (quote.barge_fee) {
                                          customerPrice += `+${quote.barge_fee.toFixed(0)}`;
                                        }

                                        return customerPrice;
                                      } catch {
                                        return null;
                                      }
                                    };

                                    const customerPrice = getCustomerPrice();

                                    return (
                                      <td key={i} className="px-2 py-1.5 text-center">
                                        {quote ? (
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-green-700 text-[10px]">
                                              {formatPrice(quote)}
                                            </span>
                                            {customerPrice && (
                                              <span className="text-blue-600 text-[9px]">
                                                → {customerPrice}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  {/* Final (마지막 가격) */}
                                  <td className="px-2 py-1.5 text-center bg-green-50">
                                    {hasQuotes ? (
                                      <span className="font-bold text-green-700">
                                        {formatPrice(quotes[quotes.length - 1])}
                                      </span>
                                    ) : (
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded",
                                        status === 'waiting_quote' ? "bg-yellow-100 text-yellow-700" :
                                        status === 'no_offer' ? "bg-red-100 text-red-700" :
                                        "bg-gray-100 text-gray-500"
                                      )}>
                                        {status === 'waiting_quote' ? 'Waiting' :
                                         status === 'no_offer' ? 'No Offer' :
                                         '—'}
                                      </span>
                                    )}
                                  </td>
                                  {/* 변화량 (Δ) */}
                                  <td className="px-2 py-1.5 text-center">
                                    {priceChange !== null && priceChange !== 0 ? (
                                      <span className={cn(
                                        "text-[9px] font-medium",
                                        priceChange < 0 ? "text-green-600" : "text-red-600"
                                      )}>
                                        {priceChange < 0 ? '↓' : '↑'}{Math.abs(priceChange).toFixed(0)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Buyer Info 탭 내용 - 배별 세로 리스트 */}
            {activeTab === 'buyer-info' && (
              <div className="space-y-4 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    {session?.customer_room_name || 'Buyer'} - Vessels & Inquiry History
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {buyerVessels.length} vessels
                  </span>
                </div>

                {buyerVesselsLoading ? (
                  <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                    Loading vessels...
                  </div>
                ) : buyerVessels.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                    No vessel data found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 각 배별로 세로 리스트 */}
                    {buyerVessels.map((vessel) => {
                      const isCurrentVessel = vessel.vessel_name === session?.vessel_name;

                      return (
                        <div
                          key={vessel.vessel_name}
                          className={cn(
                            "border rounded-lg overflow-hidden",
                            isCurrentVessel && "ring-2 ring-orange-400"
                          )}
                        >
                          {/* 배 헤더 */}
                          <div className={cn(
                            "px-3 py-2 flex items-center justify-between",
                            isCurrentVessel ? "bg-orange-100" : "bg-gray-50"
                          )}>
                            <div className="flex items-center gap-2">
                              <Ship className={cn(
                                "w-4 h-4",
                                isCurrentVessel ? "text-orange-600" : "text-gray-500"
                              )} />
                              <div>
                                <span className={cn(
                                  "font-medium text-sm",
                                  isCurrentVessel ? "text-orange-800" : "text-gray-700"
                                )}>
                                  {vessel.vessel_name}
                                </span>
                                {isCurrentVessel && (
                                  <span className="ml-2 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded">
                                    Current
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {vessel.imo && <span className="mr-2">IMO: {vessel.imo}</span>}
                              <span>{vessel.inquiry_count} inquiries</span>
                            </div>
                          </div>

                          {/* 인쿼리 히스토리 테이블 */}
                          <BuyerVesselHistory
                            customerRoom={session?.customer_room_name || ''}
                            vesselName={vessel.vessel_name}
                            currentSessionId={session?.session_id}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
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
  renegotiating: { label: "Renegotiating", color: "bg-blue-100 text-blue-800" },
  negotiating: { label: "Negotiating", color: "bg-purple-100 text-purple-800" }
};

// Seller Chats Column
const SellerChatsColumn = memo(() => {
  const {
    session,
    activeSellerTab,
    setActiveSellerTab,
    sellerTabs,
    addSellerTab,
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
      const updatePayload: {
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
        `${getApiUrl()}/sessions/${session.session_id}/seller-context/${encodeURIComponent(trader)}`,
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
            `${getApiUrl()}/chats/${encodeURIComponent(trader)}/messages?platform=${platform}`
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
              created_at: msg.created_at,
              reply_to_message: msg.reply_to_message,
              reply_to_author: msg.reply_to_author
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
                `${getApiUrl()}/chats/${encodeURIComponent(trader)}/mark-read?platform=${internalPlatform}`,
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
      await fetch(`${getApiUrl()}/messages/send`, {
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
        <div className="flex flex-col flex-1 min-h-0">
          {/* 상단 탭 영역 (30%) */}
          <div className="flex-shrink-0 border-b bg-gray-50 overflow-y-auto" style={{ height: '30%' }}>
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
                                    statusKey === "renegotiating" && "bg-blue-400",
                                    statusKey === "negotiating" && "bg-purple-400"
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
          <div className="flex-1 flex flex-col overflow-hidden" style={{ height: '70%' }}>
            {activeSellerTab && (
              <SellerChatRoom
                key={`${activeSellerTab}-${getSellerContext(activeSellerTab)?.status || 'unknown'}`}
                trader={activeSellerTab}
                messages={sellerMessages.get(activeSellerTab) || []}
                inputValue={inputValues[activeSellerTab] || ''}
                onInputChange={(value: string) => setInputValues(prev => ({ ...prev, [activeSellerTab]: value }))}
                onSend={() => handleSend(activeSellerTab)}
                sellerContext={getSellerContext(activeSellerTab)}
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
        {/* 답장 원본 메시지 표시 */}
        {message.reply_to_message && (
          <div className={cn(
            "mb-2 pl-2 border-l-2 text-xs",
            isOutgoing ? "border-blue-300 text-blue-100" : "border-gray-300 text-gray-500"
          )}>
            <span className="font-medium">{message.reply_to_author || "알 수 없음"}</span>
            <p className="whitespace-pre-wrap break-words">{message.reply_to_message}</p>
          </div>
        )}
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
  sellerContext
}: {
  trader: string;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sellerContext?: SellerContext;
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // 스크롤 함수
  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  // Auto scroll to bottom on new messages loaded
  useEffect(() => {
    if (messages.length > 0) {
      // 메시지가 로드되었을 때 (0 -> N) 또는 새 메시지가 추가되었을 때
      const isInitialLoad = prevMessagesLengthRef.current === 0 && messages.length > 0;
      const isNewMessage = messages.length > prevMessagesLengthRef.current;

      if (isInitialLoad || isNewMessage) {
        // 여러 번 스크롤 시도 (렌더링 타이밍 문제 해결)
        scrollToBottom();
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 150);
      }

      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // 탭 전환 시 ref 리셋 및 스크롤
  useEffect(() => {
    prevMessagesLengthRef.current = 0;

    if (messages.length > 0) {
      // 여러 번 스크롤 시도
      scrollToBottom();
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 150);
    }
  }, [trader]);

  return (
    <div className="flex flex-col h-full">
      {/* Required FullContext는 AI Assistant의 Seller Quote Matrix로 이동됨 */}

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

                const prices: string[] = [];
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

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {messages.map((msg) => (
            <MessageBubble key={msg.message_id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-white flex-shrink-0 space-y-2">
        {/* Quick Reply Buttons for Seller */}
        <QuickReplyButtons
          roomName={trader}
          className="pb-1"
        />
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