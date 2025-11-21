/**
 * Chat Tab
 * 고객/트레이더 채팅 인터페이스
 */

"use client";

import { useSendMessage } from "@/lib/api/queries";
import { useSessionMessagesSSE } from "@/hooks/useSessionMessagesSSE";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";

interface ChatTabProps {
  sessionId: string;
  customerRoom: string;
  traderRooms: string[];
}

// 우리 회사 발신자 목록 (오른쪽에 표시)
const OUR_COMPANY_SENDERS = [
  "씨너지파트너 주식회사",
  "씨너지파트너",
  "씨너지파트너AI",
  "Seanergy AI",
  "Harold AI",
  "Harold",
  "Yong Oh",
  "나",
  "김성원",
  "Kenn Kwon",
  "Kenn Kwon (SEANERGY PARTNER)",
  "Yong",
  "seanergyAI",
  "Me"  // 발신 메시지
];

export function ChatTab({ sessionId, customerRoom, traderRooms }: ChatTabProps) {
  const { messages, isLoading } = useSessionMessagesSSE({ sessionId });
  const sendMessageMutation = useSendMessage();

  // 우리 회사 발신자인지 확인
  const isOurCompanySender = (sender: string): boolean => {
    return OUR_COMPANY_SENDERS.includes(sender);
  };

  const [selectedRoom, setSelectedRoom] = useState<string>(customerRoom);
  const [messageText, setMessageText] = useState("");

  // 스크롤 관련 refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const isUserScrolledUpRef = useRef<boolean>(false);

  // 맨 아래로 스크롤
  const scrollToBottom = (smooth = false) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // 사용자가 스크롤을 위로 올렸는지 확인
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isUserScrolledUpRef.current = !isAtBottom;
    }
  };

  // 메시지 변경 시 스크롤 처리
  const currentMessages = messages?.filter((msg) => msg.room_name === selectedRoom) || [];

  useEffect(() => {
    const currentCount = currentMessages.length;
    const prevCount = prevMessageCountRef.current;

    // 처음 로드시 또는 방 변경시 맨 아래로
    if (prevCount === 0 && currentCount > 0) {
      scrollToBottom();
    }
    // 새 메시지 도착시 (맨 아래에 있을 때만 자동 스크롤)
    else if (currentCount > prevCount && !isUserScrolledUpRef.current) {
      scrollToBottom(true);
    }

    prevMessageCountRef.current = currentCount;
  }, [currentMessages.length, selectedRoom]);

  // 방 변경시 스크롤 초기화
  useEffect(() => {
    prevMessageCountRef.current = 0;
    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(), 0);
  }, [selectedRoom]);

  const getRoomMessages = (roomName: string): ChatMessage[] => {
    if (!messages) return [];
    return messages.filter((msg) => msg.room_name === roomName);
  };

  // 선택된 방의 플랫폼 가져오기 (메시지에서 추출)
  const getRoomPlatform = (roomName: string): "kakao" | "kakao_biz" | "whatsapp" | "wechat" => {
    const roomMessages = getRoomMessages(roomName);
    if (roomMessages.length > 0) {
      const packageName = roomMessages[0].package_name;
      const platformMap: Record<string, "kakao" | "kakao_biz" | "whatsapp" | "wechat"> = {
        "com.kakao.talk": "kakao",
        "com.kakao.yellowid": "kakao_biz",
        "com.whatsapp": "whatsapp",
        "com.wechat": "wechat",
      };
      return platformMap[packageName] || "kakao";
    }
    return "kakao";
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        room_name: selectedRoom,
        message: messageText,
        platform: getRoomPlatform(selectedRoom),
      });
      setMessageText("");
      alert("메시지 전송 완료");
    } catch (error) {
      alert("메시지 전송 실패: " + String(error));
    }
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div className="space-y-4">
      {/* 채팅방 선택 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">채팅방 선택:</span>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedRoom === customerRoom ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedRoom(customerRoom)}
          >
            고객: {customerRoom}
          </Badge>
          {traderRooms.map((room) => (
            <Badge
              key={room}
              variant={selectedRoom === room ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedRoom(room)}
            >
              트레이더: {room}
            </Badge>
          ))}
        </div>
      </div>

      {/* 채팅 메시지 목록 */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="border rounded-lg p-4 h-96 overflow-y-auto space-y-3 bg-gray-50"
      >
        {currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            메시지가 없습니다
          </div>
        ) : (
          currentMessages.map((msg) => {
            const isOurMessage = isOurCompanySender(msg.sender);
            return (
              <div
                key={msg.message_id}
                className={`flex items-end gap-2 ${
                  isOurMessage ? "justify-end" : "justify-start"
                }`}
              >
                {/* 우리 회사 로고 (왼쪽) */}
                {isOurMessage && (
                  <img
                    src="/SP_logo.png"
                    alt="Seanergy Partner"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOurMessage
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-medium ${isOurMessage ? "text-blue-700" : "text-gray-700"}`}>
                      {msg.sender}
                    </span>
                    <span className="text-xs opacity-60">
                      {new Date(msg.timestamp).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 메시지 전송 */}
      <div className="space-y-2">
        <Textarea
          placeholder="메시지를 입력하세요..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Shift+Enter로 줄바꿈, Enter로 전송
          </span>
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !messageText.trim()}
          >
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}
