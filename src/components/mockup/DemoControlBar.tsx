/**
 * Demo Control Bar
 * 투자자 시연용 컨트롤 바 - 하단 고정
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMockContext } from "@/lib/mockup/MockProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MessageSquare, FileText, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";

export function DemoControlBar() {
  const {
    deals,
    triggerNewInquiry,
    triggerNewMessage,
    triggerQuoteReceived,
    resetToInitial,
  } = useMockContext();

  const [isExpanded, setIsExpanded] = useState(true);

  // Get active deals for quote trigger
  const activeDeals = deals.filter(d => d.status === "active" && d.stage !== "inquiry");
  const customerRooms = [...new Set(deals.map(d => d.customer_room_name))];

  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur text-white px-4 py-2 z-50 border-t border-gray-700">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
              MOCKUP MODE
            </span>
            <span className="text-xs text-gray-400">
              No real data - Safe for demo
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            Show Controls
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur text-white px-4 py-3 z-50 border-t border-gray-700 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Left: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* New Inquiry Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={triggerNewInquiry}
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Inquiry
            </Button>

            {/* New Customer Message */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Customer Message
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto">
                {customerRooms.slice(0, 10).map(room => (
                  <DropdownMenuItem
                    key={room}
                    onClick={() => triggerNewMessage(room)}
                    className="cursor-pointer"
                  >
                    {room}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quote Received */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 hover:border-purple-400"
                  disabled={activeDeals.length === 0}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Quote Received
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-64 overflow-y-auto w-80">
                {activeDeals.map(deal => (
                  <DropdownMenu key={deal.session_id}>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem className="cursor-pointer flex justify-between">
                        <span className="truncate">{deal.vessel_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{deal.port}</span>
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                      {(deal.requested_traders || ["GS CALTEX", "SK ENERGY"]).map(trader => (
                        <DropdownMenuItem
                          key={trader}
                          onClick={() => triggerQuoteReceived(deal.session_id, trader)}
                          className="cursor-pointer"
                        >
                          {trader}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
                {activeDeals.length === 0 && (
                  <DropdownMenuItem disabled>
                    No active deals
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: Status */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
              MOCKUP MODE
            </span>
            <span className="text-xs text-gray-400">
              All features simulated - No real data
            </span>
          </div>

          {/* Right: Reset & Collapse */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToInitial}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 hover:border-gray-500"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom info row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>
              <span className="text-white font-medium">{deals.length}</span> Deals
            </span>
            <span>
              <span className="text-white font-medium">{deals.filter(d => d.status === "active").length}</span> Active
            </span>
            <span>
              <span className="text-green-400 font-medium">{deals.filter(d => d.status === "closed_success").length}</span> Success
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Press buttons above to simulate events
          </div>
        </div>
      </div>
    </div>
  );
}
