/**
 * Chats Page (채팅 매니저)
 * 모든 채팅방 목록 및 실시간 메시지
 */

"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useChatRooms, useChatMessages, useSendMessage } from "@/lib/api/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function ChatsPage() {
  const { data: rooms, isLoading: roomsLoading } = useChatRooms();
  const sendMessageMutation = useSendMessage();

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: messagesData } = useChatMessages(
    selectedRoom || "",
    1,
    100
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRoom) return;

    try {
      await sendMessageMutation.mutateAsync({
        room_name: selectedRoom,
        message: messageText,
        package_name: "com.kakao.talk", // 기본값
      });
      setMessageText("");
    } catch (error) {
      alert("메시지 전송 실패: " + String(error));
    }
  };

  const filteredRooms = rooms?.filter((room) =>
    room.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getPlatformBadge = (roomName: string) => {
    if (roomName.toLowerCase().includes("kakao") || roomName.includes("카톡")) {
      return <Badge variant="outline" className="bg-yellow-50">카카오</Badge>;
    }
    if (roomName.toLowerCase().includes("biz") || roomName.includes("비즈")) {
      return <Badge variant="outline" className="bg-orange-50">비즈</Badge>;
    }
    if (roomName.toLowerCase().includes("whatsapp")) {
      return <Badge variant="outline" className="bg-green-50">WhatsApp</Badge>;
    }
    if (roomName.toLowerCase().includes("wechat")) {
      return <Badge variant="outline" className="bg-blue-50">WeChat</Badge>;
    }
    return <Badge variant="outline">기타</Badge>;
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-80px)] flex">
        {/* 채팅방 목록 (왼쪽) */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold mb-3">채팅방 목록</h2>
            <Input
              placeholder="채팅방 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading && (
              <div className="p-4 text-center text-gray-500">로딩 중...</div>
            )}

            {filteredRooms.length === 0 && !roomsLoading && (
              <div className="p-4 text-center text-gray-500">
                채팅방이 없습니다
              </div>
            )}

            {filteredRooms.map((room) => (
              <div
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedRoom === room
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">{room}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getPlatformBadge(room)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 채팅 메시지 (오른쪽) */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* 채팅방 헤더 */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedRoom}</h3>
                    {getPlatformBadge(selectedRoom)}
                  </div>
                  <Badge variant="secondary">
                    {messagesData?.data?.length || 0}개 메시지
                  </Badge>
                </div>
              </div>

              {/* 메시지 목록 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messagesData?.data?.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    메시지가 없습니다
                  </div>
                )}

                {messagesData?.data?.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`flex ${
                      msg.sender === "Harold" || msg.direction === "outgoing"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.sender === "Harold" || msg.direction === "outgoing"
                          ? "bg-blue-500 text-white"
                          : "bg-white border"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">{msg.sender}</span>
                        <span className="text-xs opacity-70">
                          {new Date(msg.created_at).toLocaleString("ko-KR", {
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
                ))}
              </div>

              {/* 메시지 입력 */}
              <div className="p-4 border-t bg-white">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">채팅방을 선택해주세요</p>
                <p className="text-sm">왼쪽 목록에서 채팅방을 클릭하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
