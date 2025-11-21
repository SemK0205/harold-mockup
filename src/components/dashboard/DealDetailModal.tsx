/**
 * Deal Detail Modal
 * 거래 상세 정보 모달 (햄버거 메뉴 탭 방식)
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TradingSession } from "@/types";
import { AISuggestionsTab } from "./tabs/AISuggestionsTab";
import { ChatTab } from "./tabs/ChatTab";
import { QuotesTab } from "./tabs/QuotesTab";

interface DealDetailModalProps {
  session: TradingSession | null;
  open: boolean;
  onClose: () => void;
}

export function DealDetailModal({ session, open, onClose }: DealDetailModalProps) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[60vw] w-[60vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            거래 상세 - {session.vessel_name || "선박명 미정"} / {session.port || "항구 미정"}
          </DialogTitle>
        </DialogHeader>

        {/* 거래 전광판 스타일 헤더 */}
        <div className="bg-gray-900 text-green-400 font-mono p-4 rounded">
          <div className="flex flex-wrap items-center gap-6 text-sm">
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
          </div>
        </div>

        {/* 햄버거 메뉴 탭 */}
        <Tabs defaultValue="ai" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI 제안</TabsTrigger>
            <TabsTrigger value="chat">채팅</TabsTrigger>
            <TabsTrigger value="quotes">견적 비교</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-4">
            <AISuggestionsTab sessionId={session.session_id} />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <ChatTab
              sessionId={session.session_id}
              customerRoom={session.customer_room_name}
              traderRooms={session.requested_traders}
            />
          </TabsContent>

          <TabsContent value="quotes" className="mt-4">
            <QuotesTab quotes={session.quotes} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
