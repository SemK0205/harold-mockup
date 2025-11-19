/**
 * Chats Page (챗 매니저)
 * 모든 플랫폼 채팅방 통합 관리
 */

"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useChatRooms } from "@/lib/api/queries";
import { Badge } from "@/components/ui/badge";

export default function ChatsPage() {
  const { data: rooms, isLoading, error } = useChatRooms();

  const getPlatformBadge = (roomName: string) => {
    // 채팅방 이름으로 플랫폼 추정 (향후 API에서 제공 예정)
    if (roomName.includes("KakaoTalk") || roomName.includes("카톡")) {
      return <Badge variant="outline">카카오톡</Badge>;
    }
    if (roomName.includes("KakaoBiz") || roomName.includes("비즈")) {
      return <Badge variant="outline">카카오비즈</Badge>;
    }
    if (roomName.includes("WhatsApp")) {
      return <Badge variant="outline">WhatsApp</Badge>;
    }
    if (roomName.includes("WeChat")) {
      return <Badge variant="outline">WeChat</Badge>;
    }
    return <Badge variant="outline">기타</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">챗 매니저</h1>

        {isLoading && <div>로딩 중...</div>}

        {error && <div className="text-red-500">에러 발생: {String(error)}</div>}

        {rooms && rooms.length === 0 && (
          <div className="text-gray-500">채팅방이 없습니다.</div>
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{room}</h3>
                  </div>
                  <div>{getPlatformBadge(room)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
