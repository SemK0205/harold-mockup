/**
 * Chats Page (채팅 매니저)
 * 모든 채팅방 목록 및 실시간 메시지
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useChatRooms, useSendMessage } from "@/lib/api/queries";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { chatMessagesAPI, roomCategoryAPI, configAPI } from "@/lib/api/endpoints";
import { getApiUrl } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChatMessage, RoomInfo } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CategoryFilter = "all" | "buy" | "sell" | "other";

export default function ChatsPage() {
  const { data: rooms, isLoading: roomsLoading } = useChatRooms();
  const sendMessageMutation = useSendMessage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [messageSearchQuery, setMessageSearchQuery] = useState(""); // 채팅방 내 메시지 검색
  const [newMessageBadges, setNewMessageBadges] = useState<Record<string, number>>({}); // 새 메시지 배지
  const selectedRoomRef = useRef<RoomInfo | null>(null); // SSE에서 사용할 ref

  // 우리 회사 발신자 목록 조회
  const { data: ourCompanySenders } = useQuery({
    queryKey: ["config", "our-company-senders"],
    queryFn: configAPI.getOurCompanySenders,
    staleTime: Infinity, // 한 번만 가져오면 됨
  });

  // 카테고리 설정 mutation
  const setCategoryMutation = useMutation({
    mutationFn: ({ roomName, platform, category }: { roomName: string; platform: string; category: "buy" | "sell" | "other" }) =>
      roomCategoryAPI.setCategory(roomName, platform, category),
    onSuccess: () => {
      // 채팅방 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["chat-messages", "rooms"] });
    },
  });

  // 채팅방별 메시지 조회 (플랫폼 포함, 실시간 새로고침)
  // page=1: 최신 100개만
  const { data: messagesData } = useQuery({
    queryKey: ["chat-messages", selectedRoom?.room_name, selectedRoom?.platform],
    queryFn: () => chatMessagesAPI.getMessagesByRoom(selectedRoom!.room_name, selectedRoom!.platform, 1, 100),
    enabled: !!selectedRoom,
    refetchInterval: 3000, // 3초마다 자동 새로고침
  });

  // 메시지 검색 필터링
  const filteredMessages = messagesData?.data?.filter((msg: ChatMessage) => {
    if (!messageSearchQuery.trim()) return true;
    return (
      msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.sender.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );
  }) || [];

  // 채팅방 변경 시 검색어 초기화 & 배지 제거 & ref 업데이트 & mark-read 호출
  useEffect(() => {
    setMessageSearchQuery("");
    selectedRoomRef.current = selectedRoom; // ref 업데이트

    // 선택된 채팅방의 배지 제거 & mark-read API 호출
    if (selectedRoom) {
      const key = `${selectedRoom.room_name}-${selectedRoom.platform}`;
      setNewMessageBadges((prev) => {
        const newBadges = { ...prev };
        delete newBadges[key];
        return newBadges;
      });

      // Mark messages as read
      const markAsRead = async () => {
        try {
          const platformToInternal: Record<string, string> = {
            'com.kakao.talk': 'kakao',
            'com.kakao.yellowid': 'kakao_biz',
            'com.whatsapp': 'whatsapp',
            'com.wechat': 'wechat'
          };
          const internalPlatform = platformToInternal[selectedRoom.platform] || 'kakao';
          await fetch(
            `${getApiUrl()}/chats/${encodeURIComponent(selectedRoom.room_name)}/mark-read?platform=${internalPlatform}`,
            { method: 'POST' }
          );
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };
      markAsRead();
    }
  }, [selectedRoom]);

  // SSE 실시간 메시지 구독 (마운트 시 1회만 연결)
  useEffect(() => {
    console.log("🔌 SSE 연결 시작...");
    const eventSource = new EventSource(`${getApiUrl()}/sse/messages`);

    eventSource.addEventListener("connected", (event) => {
      console.log("✅ SSE 연결 성공:", event.data);
    });

    eventSource.addEventListener("new_message", (event) => {
      const messageData = JSON.parse(event.data);
      console.log("📩 새 메시지 수신:", messageData);

      // 배지 업데이트 (현재 선택된 채팅방이 아닌 경우에만)
      const roomKey = `${messageData.room_name}-${messageData.package_name}`;
      const currentRoom = selectedRoomRef.current; // ref에서 가져오기 (클로저 문제 해결)
      const isCurrentRoom =
        currentRoom?.room_name === messageData.room_name &&
        currentRoom?.platform === messageData.package_name;

      if (!isCurrentRoom) {
        setNewMessageBadges((prevBadges) => ({
          ...prevBadges,
          [roomKey]: (prevBadges[roomKey] || 0) + 1,
        }));
      }

      // 채팅방 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["chat-messages", "rooms"] });

      // 현재 선택된 채팅방이면 메시지 목록 새로고침
      if (isCurrentRoom) {
        queryClient.invalidateQueries({
          queryKey: ["chat-messages", messageData.room_name, messageData.package_name],
        });

        // SSE로 새 메시지가 왔을 때 자동 스크롤 (사용자가 맨 아래에 있을 때만)
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isAtBottom) {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 200); // 데이터가 업데이트될 시간을 위한 딜레이
      }
    });

    eventSource.addEventListener("heartbeat", () => {
      // 연결 유지 (로그 제거하여 콘솔 깔끔하게)
    });

    eventSource.onerror = (error) => {
      console.error("❌ SSE 에러:", error);
      console.error("SSE readyState:", eventSource.readyState);
      console.error("SSE url:", eventSource.url);

      // 연결 실패 시 재연결하지 않음 (무한 루프 방지)
      // 페이지 새로고침 대신 로그만 출력
    };

    eventSource.onopen = () => {
      console.log("🟢 SSE onopen 이벤트 발생 (연결 열림)");
    };

    return () => {
      console.log("🔴 SSE 연결 종료 (컴포넌트 언마운트)");
      eventSource.close();
    };
  }, []); // 빈 배열: 마운트 시 1회만 연결, selectedRoom 변경 시 재연결하지 않음

  // 이전 메시지 개수 추적 (Android 방식)
  const prevMessageCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // 채팅방 변경 시 초기화
  useEffect(() => {
    if (selectedRoom) {
      isInitialLoadRef.current = true;
      prevMessageCountRef.current = 0;
    }
  }, [selectedRoom]);

  // 사용자가 맨 아래에 있는지 확인 (카카오톡 방식)
  const isUserAtBottom = () => {
    if (!messagesContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // 맨 아래에서 100px 이내면 "맨 아래"로 간주
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // 스크롤 동작 (카카오톡 방식)
  useEffect(() => {
    // 원본 메시지 개수로 추적 (검색 필터링과 무관하게)
    const allMessages = messagesData?.data || [];
    if (allMessages.length === 0) return;

    const currentCount = allMessages.length;
    const previousCount = prevMessageCountRef.current;

    // 첫 로드 or 채팅방 변경: 즉시 맨 아래로 이동
    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialLoadRef.current = false;
    }
    // 새 메시지 도착 && 사용자가 맨 아래에 있을 때만: 부드럽게 스크롤
    else if (currentCount > previousCount && isUserAtBottom()) {
      // SSE로 인한 업데이트일 때도 확실히 스크롤되도록 setTimeout 추가
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }

    prevMessageCountRef.current = currentCount;
  }, [messagesData?.data]);

  // 우리 회사 발신자인지 확인
  const isOurCompanySender = (sender: string) => {
    if (!ourCompanySenders || !Array.isArray(ourCompanySenders)) return false;
    return ourCompanySenders.some((companySender: string) => sender.includes(companySender));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRoom) return;

    try {
      // platform 매핑: com.kakao.talk → kakao
      const platformMap: Record<string, "kakao" | "kakao_biz" | "whatsapp" | "wechat"> = {
        "com.kakao.talk": "kakao",
        "com.kakao.yellowid": "kakao_biz",
        "com.whatsapp": "whatsapp",
        "com.wechat": "wechat",
      };

      await sendMessageMutation.mutateAsync({
        room_name: selectedRoom.room_name,
        message: messageText,
        platform: platformMap[selectedRoom.platform] || "kakao",
      });
      setMessageText("");
    } catch (error) {
      alert("메시지 전송 실패: " + String(error));
    }
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = async (room: RoomInfo, category: "buy" | "sell" | "other") => {
    try {
      await setCategoryMutation.mutateAsync({
        roomName: room.room_name,
        platform: room.platform,
        category,
      });
    } catch (error) {
      alert("카테고리 설정 실패: " + String(error));
    }
  };

  // 필터링된 채팅방
  const filteredRooms = rooms?.filter((room) => {
    // null/undefined 체크
    const roomName = room.room_name || "";
    const matchesSearch = roomName.toLowerCase().includes(searchQuery.toLowerCase());
    // 카테고리가 설정된 경우만 필터링
    const matchesCategory = categoryFilter === "all" || room.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const getPlatformBadge = (platform: string) => {
    if (platform === "kakao" || platform === "kakao_talk" || platform === "com.kakao.talk") {
      return <Badge variant="outline" className="bg-yellow-50">카카오톡</Badge>;
    }
    if (platform === "kakao_biz" || platform === "com.kakao.yellowid") {
      return <Badge variant="outline" className="bg-orange-50">카카오비즈</Badge>;
    }
    if (platform === "whatsapp" || platform === "com.whatsapp") {
      return <Badge variant="outline" className="bg-green-50">WhatsApp</Badge>;
    }
    if (platform === "wechat" || platform === "com.wechat") {
      return <Badge variant="outline" className="bg-blue-50">WeChat</Badge>;
    }
    return <Badge variant="outline">기타</Badge>;
  };

  const getCategoryBadge = (room: RoomInfo) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-pointer ${
              room.category === "buy" ? "bg-blue-50 text-blue-700" :
              room.category === "sell" ? "bg-green-50 text-green-700" :
              room.category === "other" ? "bg-gray-50" :
              "bg-gray-200 text-gray-400"
            }`}
          >
            {room.category === "buy" ? "구매" :
             room.category === "sell" ? "판매" :
             room.category === "other" ? "기타" : "미설정"}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleCategoryChange(room, "buy")}>
            구매
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCategoryChange(room, "sell")}>
            판매
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCategoryChange(room, "other")}>
            기타
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-80px)] flex">
        {/* 채팅방 목록 (왼쪽) */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b space-y-3">
            <h2 className="text-lg font-bold">채팅방 목록</h2>

            {/* 카테고리 필터 */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={categoryFilter === "all" ? "default" : "outline"}
                onClick={() => setCategoryFilter("all")}
              >
                전체
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === "buy" ? "default" : "outline"}
                onClick={() => setCategoryFilter("buy")}
              >
                구매
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === "sell" ? "default" : "outline"}
                onClick={() => setCategoryFilter("sell")}
              >
                판매
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === "other" ? "default" : "outline"}
                onClick={() => setCategoryFilter("other")}
              >
                기타
              </Button>
            </div>

            {/* 검색 */}
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

            {filteredRooms.map((room, index) => {
              const roomKey = room.room_name && room.platform
                ? `${room.room_name}-${room.platform}`
                : `room-${index}`;
              const newMessageCount = newMessageBadges[roomKey] || 0;

              return (
                <div
                  key={roomKey}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedRoom?.room_name === room.room_name && selectedRoom?.platform === room.platform
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium truncate text-sm">{room.room_name}</span>
                    {newMessageCount > 0 && (
                      <Badge className="bg-red-500 text-white ml-2">
                        {newMessageCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getPlatformBadge(room.platform)}
                    {getCategoryBadge(room)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 채팅 메시지 (오른쪽) */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* 채팅방 헤더 */}
              <div className="p-4 border-b bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedRoom.room_name}</h3>
                    <div className="flex gap-2 mt-2">
                      {getPlatformBadge(selectedRoom.platform)}
                      {getCategoryBadge(selectedRoom)}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {messagesData?.total || 0}개 메시지
                  </Badge>
                </div>

                {/* 메시지 검색 */}
                <Input
                  placeholder="메시지 또는 발신자 검색..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* 메시지 목록 */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {filteredMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    {messageSearchQuery.trim() ? "검색 결과가 없습니다" : "메시지가 없습니다"}
                  </div>
                )}

                {filteredMessages.map((msg: ChatMessage, index: number) => {
                  const isOurMessage = isOurCompanySender(msg.sender) || msg.direction === "outgoing";
                  return (
                    <div
                      key={msg.message_id || `msg-${index}`}
                      className={`flex items-end gap-2 ${
                        isOurMessage
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {/* 우리 회사 로고 (왼쪽) */}
                      {isOurMessage && (
                        <img
                          src="/harold-mockup/SP_logo.png"
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
                            {new Date(msg.created_at).toLocaleString("ko-KR", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {/* 답장 원본 메시지 표시 */}
                        {msg.reply_to_message && (
                          <div className="mb-2 pl-2 border-l-2 border-gray-300 text-xs text-gray-500">
                            <span className="font-medium">{msg.reply_to_author || "알 수 없음"}</span>
                            <p className="whitespace-pre-wrap break-words">{msg.reply_to_message}</p>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
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
