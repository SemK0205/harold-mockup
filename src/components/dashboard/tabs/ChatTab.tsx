/**
 * Chat Tab
 * 고객/트레이더 채팅 인터페이스
 */

"use client";

import { useSessionMessages, useSendMessage } from "@/lib/api/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { ChatMessage } from "@/types";

interface ChatTabProps {
  sessionId: string;
  customerRoom: string;
  traderRooms: string[];
}

export function ChatTab({ sessionId, customerRoom, traderRooms }: ChatTabProps) {
  const { data: messages, isLoading } = useSessionMessages(sessionId);
  const sendMessageMutation = useSendMessage();

  const [selectedRoom, setSelectedRoom] = useState<string>(customerRoom);
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        room_name: selectedRoom,
        message: messageText,
      });
      setMessageText("");
      alert("메시지 전송 완료");
    } catch (error) {
      alert("메시지 전송 실패: " + String(error));
    }
  };

  const getRoomMessages = (roomName: string): ChatMessage[] => {
    if (!messages) return [];
    return messages.filter((msg) => msg.room_name === roomName);
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
      <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-3 bg-gray-50">
        {getRoomMessages(selectedRoom).length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            메시지가 없습니다
          </div>
        ) : (
          getRoomMessages(selectedRoom).map((msg) => (
            <div
              key={msg.message_id}
              className={`flex ${
                msg.sender === "Harold" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender === "Harold"
                    ? "bg-blue-500 text-white"
                    : "bg-white border"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">{msg.sender}</span>
                  <span className="text-xs opacity-70">
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
          ))
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
