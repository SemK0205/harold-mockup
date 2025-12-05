/**
 * Mockup Chats Page
 * 투자자 시연용 채팅 매니저
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { MockupMainLayout } from "@/components/mockup/MockupMainLayout";
import { useMockContext } from "@/lib/mockup/MockProvider";
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
import { Loader2 } from "lucide-react";

type CategoryFilter = "all" | "buy" | "sell" | "other";

export default function MockupChatsPage() {
  const {
    chatRooms,
    messages,
    sendMessage,
    getMessagesForRoom,
    triggerNewMessage,
  } = useMockContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [newMessageBadges, setNewMessageBadges] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);
  const [roomCategories, setRoomCategories] = useState<Record<string, "buy" | "sell" | "other">>({});

  // Initialize room categories from chatRooms
  useEffect(() => {
    const categories: Record<string, "buy" | "sell" | "other"> = {};
    chatRooms.forEach(room => {
      if (room.category) {
        categories[`${room.room_name}-${room.platform}`] = room.category;
      }
    });
    setRoomCategories(categories);
  }, [chatRooms]);

  // Our company senders for message display
  const ourCompanySenders = ["Harold AI", "Harold", "Seanergy"];

  // Check if sender is our company
  const isOurCompanySender = (sender: string) => {
    return ourCompanySenders.some(companySender => sender.includes(companySender));
  };

  // Get messages for selected room
  const roomMessages = selectedRoom ? getMessagesForRoom(selectedRoom.room_name) : [];

  // Filter messages by search
  const filteredMessages = roomMessages.filter((msg: ChatMessage) => {
    if (!messageSearchQuery.trim()) return true;
    return (
      msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.sender.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );
  });

  // Reset search and badge when room changes
  useEffect(() => {
    setMessageSearchQuery("");
    if (selectedRoom) {
      const key = `${selectedRoom.room_name}-${selectedRoom.platform}`;
      setNewMessageBadges(prev => {
        const newBadges = { ...prev };
        delete newBadges[key];
        return newBadges;
      });
    }
  }, [selectedRoom]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (selectedRoom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomMessages.length, selectedRoom]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRoom || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedRoom.room_name, messageText, selectedRoom.platform);
      setMessageText("");
    } catch (error) {
      alert("Message send failed: " + String(error));
    } finally {
      setIsSending(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (room: RoomInfo, category: "buy" | "sell" | "other") => {
    const key = `${room.room_name}-${room.platform}`;
    setRoomCategories(prev => ({ ...prev, [key]: category }));
  };

  // Get room category
  const getRoomCategory = (room: RoomInfo): "buy" | "sell" | "other" | undefined => {
    const key = `${room.room_name}-${room.platform}`;
    return roomCategories[key] || room.category;
  };

  // Filter rooms
  const filteredRooms = chatRooms.filter((room) => {
    const roomName = room.room_name || "";
    const matchesSearch = roomName.toLowerCase().includes(searchQuery.toLowerCase());
    const roomCategory = getRoomCategory(room);
    const matchesCategory = categoryFilter === "all" || roomCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Platform badge
  const getPlatformBadge = (platform: string) => {
    if (platform === "kakao" || platform === "kakao_talk" || platform === "com.kakao.talk") {
      return <Badge variant="outline" className="bg-yellow-50">KakaoTalk</Badge>;
    }
    if (platform === "kakao_biz" || platform === "com.kakao.yellowid") {
      return <Badge variant="outline" className="bg-orange-50">KakaoBiz</Badge>;
    }
    if (platform === "whatsapp" || platform === "com.whatsapp") {
      return <Badge variant="outline" className="bg-green-50">WhatsApp</Badge>;
    }
    if (platform === "wechat" || platform === "com.wechat") {
      return <Badge variant="outline" className="bg-blue-50">WeChat</Badge>;
    }
    return <Badge variant="outline">Other</Badge>;
  };

  // Category badge
  const getCategoryBadge = (room: RoomInfo) => {
    const category = getRoomCategory(room);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-pointer ${
              category === "buy" ? "bg-blue-50 text-blue-700" :
              category === "sell" ? "bg-green-50 text-green-700" :
              category === "other" ? "bg-gray-50" :
              "bg-gray-200 text-gray-400"
            }`}
          >
            {category === "buy" ? "Buy" :
             category === "sell" ? "Sell" :
             category === "other" ? "Other" : "Unset"}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleCategoryChange(room, "buy")}>
            Buy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCategoryChange(room, "sell")}>
            Sell
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCategoryChange(room, "other")}>
            Other
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <MockupMainLayout>
      <div className="h-[calc(100vh-80px)] flex">
        {/* Chat Room List (Left) */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b space-y-3">
            <h2 className="text-lg font-bold">Chat Rooms</h2>

            {/* Category Filter */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={categoryFilter === "all" ? "default" : "outline"}
                onClick={() => setCategoryFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === "buy" ? "default" : "outline"}
                onClick={() => setCategoryFilter("buy")}
              >
                Buy
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === "sell" ? "default" : "outline"}
                onClick={() => setCategoryFilter("sell")}
              >
                Sell
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === "other" ? "default" : "outline"}
                onClick={() => setCategoryFilter("other")}
              >
                Other
              </Button>
            </div>

            {/* Search */}
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No chat rooms found
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

        {/* Chat Messages (Right) */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Room Header */}
              <div className="p-4 border-b bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedRoom.room_name}</h3>
                    <div className="flex gap-2 mt-2">
                      {getPlatformBadge(selectedRoom.platform)}
                      {getCategoryBadge(selectedRoom)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {filteredMessages.length} messages
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerNewMessage(selectedRoom.room_name)}
                    >
                      Simulate Incoming
                    </Button>
                  </div>
                </div>

                {/* Message Search */}
                <Input
                  placeholder="Search messages or sender..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Message List */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {filteredMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    {messageSearchQuery.trim() ? "No search results" : "No messages"}
                  </div>
                )}

                {filteredMessages.map((msg: ChatMessage, index: number) => {
                  const isOurMessage = isOurCompanySender(msg.sender) || msg.direction === "outgoing";
                  return (
                    <div
                      key={msg.message_id || `msg-${index}`}
                      className={`flex items-end gap-2 ${
                        isOurMessage ? "justify-end" : "justify-start"
                      }`}
                    >
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
                            {new Date(msg.created_at).toLocaleString("en-US", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {msg.reply_to_message && (
                          <div className="mb-2 pl-2 border-l-2 border-gray-300 text-xs text-gray-500">
                            <span className="font-medium">{msg.reply_to_author || "Unknown"}</span>
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

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type a message..."
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
                      Shift+Enter for new line, Enter to send
                    </span>
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !messageText.trim()}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Select a chat room</p>
                <p className="text-sm">Click a room from the left list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MockupMainLayout>
  );
}
