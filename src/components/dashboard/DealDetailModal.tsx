/**
 * Deal Detail Modal
 * Deal Detail Modal (Hamburger Menu Tab Style)
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
            Deal Details - {session.vessel_name || "Vessel TBD"} / {session.port || "Port TBD"}
          </DialogTitle>
        </DialogHeader>

        {/* Deal Header */}
        <div className="bg-gray-900 text-green-400 font-mono p-4 rounded">
          <div className="flex flex-wrap items-center gap-6 text-sm">
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
          </div>
        </div>

        {/* Tab Menu */}
        <Tabs defaultValue="ai" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
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
