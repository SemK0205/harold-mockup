/**
 * DealTimeline Component
 * Display deal progress in timeline format
 */

"use client";

import { useState, useMemo } from "react";
import { DealScoreboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Activity,
} from "lucide-react";

interface DealTimelineProps {
  deals: DealScoreboard[];
  onDealClick?: (deal: DealScoreboard) => void;
}

interface TimelineEvent {
  id: string;
  dealId: number;
  type: "created" | "quoted" | "negotiating" | "closed" | "cancelled";
  timestamp: string;
  deal: DealScoreboard;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function DealTimeline({ deals, onDealClick }: DealTimelineProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week");

  // Generate timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    deals.forEach((deal) => {
      // Deal created event
      events.push({
        id: `${deal.id}-created`,
        dealId: deal.id,
        type: "created",
        timestamp: deal.created_at,
        deal,
        title: `New Deal: ${deal.vessel_name || "TBD"}`,
        description: `${deal.customer_room_name} - ${deal.port || "TBD"} - ${deal.fuel_type || ""} ${deal.quantity || ""}`,
        icon: <FileText className="w-4 h-4" />,
        color: "bg-blue-500",
      });

      // Quote received event
      if (deal.total_quotes_received > 0 && deal.last_quote_time) {
        events.push({
          id: `${deal.id}-quoted`,
          dealId: deal.id,
          type: "quoted",
          timestamp: deal.last_quote_time,
          deal,
          title: `Quote Received: ${deal.total_quotes_received}`,
          description: `${deal.vessel_name || "TBD"} - ${deal.customer_room_name}`,
          icon: <MessageSquare className="w-4 h-4" />,
          color: "bg-purple-500",
        });
      }

      // Deal closed event
      if (deal.closed_at) {
        const isSuccess = deal.status === "closed_success";
        events.push({
          id: `${deal.id}-closed`,
          dealId: deal.id,
          type: "closed",
          timestamp: deal.closed_at,
          deal,
          title: isSuccess
            ? `Deal Completed: $${deal.final_price?.toLocaleString() || "0"}`
            : deal.status === "cancelled"
            ? "Deal Cancelled"
            : "Deal Failed",
          description: isSuccess
            ? `${deal.selected_trader} - ${deal.vessel_name || "TBD"}`
            : deal.closing_reason || "No reason provided",
          icon: isSuccess ? (
            <CheckCircle className="w-4 h-4" />
          ) : deal.status === "cancelled" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          ),
          color: isSuccess
            ? "bg-green-500"
            : deal.status === "cancelled"
            ? "bg-gray-500"
            : "bg-red-500",
        });
      }
    });

    // Sort by time (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events;
  }, [deals]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    let filtered = timelineEvents;

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((event) => event.deal.status === selectedStatus);
    }

    // Time range filter
    const now = new Date();
    const getStartDate = () => {
      switch (timeRange) {
        case "today":
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return today;
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return weekAgo;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return monthAgo;
        default:
          return null;
      }
    };

    const startDate = getStartDate();
    if (startDate) {
      filtered = filtered.filter((event) => new Date(event.timestamp) >= startDate);
    }

    return filtered;
  }, [timelineEvents, selectedStatus, timeRange]);

  // Time formatting
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};

    filteredEvents.forEach((event) => {
      const date = new Date(event.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    return groups;
  }, [filteredEvents]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Time Range Selection */}
          <div className="flex gap-2">
            {(["today", "week", "month", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range === "today"
                  ? "Today"
                  : range === "week"
                  ? "1 Week"
                  : range === "month"
                  ? "1 Month"
                  : "All"}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === "all"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus("active")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setSelectedStatus("closed_success")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === "closed_success"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setSelectedStatus("closed_failed")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === "closed_failed"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{filteredEvents.length}</div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredEvents.filter((e) => e.type === "created").length}
            </div>
            <div className="text-xs text-gray-500">New Deals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {filteredEvents.filter((e) => e.type === "quoted").length}
            </div>
            <div className="text-xs text-gray-500">Quotes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {
                filteredEvents.filter(
                  (e) => e.type === "closed" && e.deal.status === "closed_success"
                ).length
              }
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No events match the selected criteria
          </div>
        ) : (
          Object.entries(groupedEvents).map(([date, events]) => (
            <div key={date} className="border-b last:border-b-0">
              {/* Date Header */}
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
              </div>

              {/* Event List */}
              <div className="divide-y">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onDealClick?.(event.deal)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full ${event.color} text-white flex items-center justify-center flex-shrink-0 mt-0.5`}
                      >
                        {event.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>

                            {/* Additional Info */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {event.deal.port && (
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  {event.deal.port}
                                </span>
                              )}
                              {event.deal.total_quotes_received > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {event.deal.total_quotes_received} quotes
                                </span>
                              )}
                              {event.deal.duration_minutes > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.floor(event.deal.duration_minutes / 60)}h{" "}
                                  {Math.floor(event.deal.duration_minutes % 60)}m
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Time */}
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
