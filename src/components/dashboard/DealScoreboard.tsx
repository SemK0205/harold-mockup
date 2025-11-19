/**
 * Deal Scoreboard Component
 * 거래 전광판 - 활성 거래 목록
 */

"use client";

import { TradingSession } from "@/types";
import { Badge } from "@/components/ui/badge";

interface DealScoreboardProps {
  sessions: TradingSession[];
  onRowClick?: (session: TradingSession) => void;
}

export function DealScoreboard({ sessions, onRowClick }: DealScoreboardProps) {
  const getPlatformBadge = (roomName: string) => {
    // 채팅방 이름으로 플랫폼 추정 (향후 DB 필드 추가 예정)
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                선박명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ETA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                항구
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                연료 1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                연료 2
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                고객사
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                플랫폼
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                견적수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr
                key={session.session_id}
                onClick={() => onRowClick?.(session)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {session.vessel_name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {session.delivery_date || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {session.port || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {session.fuel_type ? (
                    <div>
                      <div className="font-medium">{session.fuel_type}</div>
                      <div className="text-xs text-gray-500">{session.quantity || ""}</div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {/* TODO: fuel_type2, quantity2 필드 추가 예정 */}
                  -
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {session.customer_room_name}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getPlatformBadge(session.customer_room_name)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant="secondary">
                    {session.quotes.length}개
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">활성 거래가 없습니다</p>
        </div>
      )}
    </div>
  );
}
