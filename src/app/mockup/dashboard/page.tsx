/**
 * Mockup Dashboard Page (Deal Scoreboard)
 * 투자자 시연용 대시보드
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { MockupMainLayout } from "@/components/mockup/MockupMainLayout";
import { DealStatistics } from "@/components/dashboard/DealStatistics";
import { DealTimeline } from "@/components/dashboard/DealTimeline";
import { MockupDealDetailModal } from "@/components/mockup/MockupDealDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Ship, Fuel, Plus } from "lucide-react";
import { DealScoreboard as DealScoreboardType } from "@/types";
import { useMockContext } from "@/lib/mockup/MockProvider";

// Status options
const STATUS_OPTIONS: { value: DealScoreboardType["status"]; label: string; color: string }[] = [
  { value: "active", label: "In Progress", color: "bg-blue-500" },
  { value: "quoted", label: "Quote Received", color: "bg-purple-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-yellow-500" },
  { value: "closed_success", label: "Deal Done", color: "bg-green-500" },
  { value: "closed_lost", label: "Lost", color: "bg-red-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-500" },
  { value: "no_offer", label: "No Offer", color: "bg-orange-500" },
];

type SortField = "created_at" | "updated_at" | "vessel_name" | "port" | "delivery_date" | "status";
type SortDirection = "asc" | "desc";

export default function MockupDashboardPage() {
  const { deals, statistics, isConnected, updateDealStatus, deleteDeal, triggerNewInquiry } = useMockContext();

  const [viewMode, setViewMode] = useState<"table" | "timeline" | "statistics">("table");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [portFilter, setPortFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Table state
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  // Track new deals for NEW badge
  const [viewedDeals, setViewedDeals] = useState<Set<string>>(new Set());
  const [knownDealIds, setKnownDealIds] = useState<Set<string>>(new Set());

  // Initialize known deals
  useEffect(() => {
    const currentIds = new Set(deals.map(d => d.session_id));
    if (knownDealIds.size === 0) {
      setKnownDealIds(currentIds);
      setViewedDeals(currentIds);
    } else {
      // Check for new deals
      deals.forEach(deal => {
        if (!knownDealIds.has(deal.session_id)) {
          setKnownDealIds(prev => new Set([...prev, deal.session_id]));
        }
      });
    }
  }, [deals, knownDealIds]);

  // Check if deal is new
  const isNewDeal = (sessionId: string) => {
    return knownDealIds.has(sessionId) && !viewedDeals.has(sessionId);
  };

  // Mark deal as viewed
  const markAsViewed = (sessionId: string) => {
    setViewedDeals(prev => new Set([...prev, sessionId]));
  };

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (statusFilter && deal.status !== statusFilter) return false;
      if (portFilter && (!deal.port || !deal.port.toLowerCase().includes(portFilter.toLowerCase()))) return false;
      if (customerFilter && !deal.customer_room_name.toLowerCase().includes(customerFilter.toLowerCase())) return false;
      return true;
    });
  }, [deals, statusFilter, portFilter, customerFilter]);

  // Sort deals
  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredDeals, sortField, sortDirection]);

  const selectedDeal = selectedDealId
    ? deals.find(d => d.session_id === selectedDealId) || null
    : null;

  const handleDealClick = (deal: DealScoreboardType) => {
    markAsViewed(deal.session_id);
    setSelectedDealId(deal.session_id);
    setIsModalOpen(true);
  };

  const handleStatusChange = (sessionId: string, newStatus: DealScoreboardType["status"]) => {
    updateDealStatus(sessionId, newStatus);
    setStatusDropdownOpen(null);
  };

  const handleDelete = async (sessionId: string, vesselName: string) => {
    if (!confirm(`Delete deal "${vesselName}"?`)) return;
    await deleteDeal(sessionId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };


  // Status badge helpers
  const getStatusRowClass = (status: DealScoreboardType["status"]) => {
    const classes: Record<DealScoreboardType["status"], string> = {
      active: "bg-blue-50 hover:bg-blue-100",
      quoted: "bg-purple-50 hover:bg-purple-100",
      negotiating: "bg-yellow-50 hover:bg-yellow-100",
      closed_success: "bg-green-50 hover:bg-green-100",
      closed_lost: "bg-red-50 hover:bg-red-100",
      cancelled: "bg-gray-50 hover:bg-gray-100",
      no_offer: "bg-orange-50 hover:bg-orange-100",
    };
    return classes[status];
  };

  const getStatusBadge = (status: DealScoreboardType["status"]) => {
    const badges: Record<DealScoreboardType["status"], React.ReactNode> = {
      active: <Badge className="bg-blue-500 text-white">In Progress</Badge>,
      quoted: <Badge className="bg-purple-500 text-white">Quote Received</Badge>,
      negotiating: <Badge className="bg-yellow-500 text-black">Negotiating</Badge>,
      closed_success: <Badge className="bg-green-500 text-white">Deal Done</Badge>,
      closed_lost: <Badge className="bg-red-500 text-white">Lost</Badge>,
      cancelled: <Badge className="bg-gray-500 text-white">Cancelled</Badge>,
      no_offer: <Badge className="bg-orange-500 text-white">No Offer</Badge>,
    };
    return badges[status];
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300">&#x25B2;&#x25BC;</span>;
    return sortDirection === "asc" ? <span>&#x25B2;</span> : <span>&#x25BC;</span>;
  };

  return (
    <MockupMainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Deal Scoreboard</h1>

            {/* Real-time connection status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-600">
                {isConnected ? "Live" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Inquiry Button */}
            <Button
              variant="default"
              size="sm"
              onClick={triggerNewInquiry}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Inquiry
            </Button>

            <div className="text-sm text-gray-500">
              Total {filteredDeals.length} deals
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                Timeline
              </Button>
              <Button
                variant={viewMode === "statistics" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("statistics")}
              >
                Statistics
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {(viewMode === "table" || viewMode === "timeline") && (
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Port</label>
                <Input
                  placeholder="Filter by port (e.g. Busan)"
                  value={portFilter}
                  onChange={(e) => setPortFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Customer</label>
                <Input
                  placeholder="Filter by customer"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Status</label>
                <select
                  className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="quoted">Quoted</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="no_offer">No Offer</option>
                  <option value="closed_success">Success</option>
                  <option value="closed_lost">Lost</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            {(portFilter || customerFilter || statusFilter) && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPortFilter("");
                    setCustomerFilter("");
                    setStatusFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort("vessel_name")}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Vessel <SortIcon field="vessel_name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort("port")}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Port <SortIcon field="port" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort("delivery_date")}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        ETA <SortIcon field="delivery_date" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Fuel</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Quotes</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Status <SortIcon field="status" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        Created <SortIcon field="created_at" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeals.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        No deals found
                      </td>
                    </tr>
                  )}

                  {sortedDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => handleDealClick(deal)}
                      className={`border-b cursor-pointer transition-colors ${getStatusRowClass(deal.status)}`}
                    >
                      {/* Vessel Name */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {deal.vessel_name || "-"}
                          {isNewDeal(deal.session_id) && (
                            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                              NEW
                            </Badge>
                          )}
                          {(deal.buyer_unread_count ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                              <Ship className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">{deal.buyer_unread_count}</span>
                            </span>
                          )}
                          {(deal.seller_unread_count ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                              <Fuel className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">{deal.seller_unread_count}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Port */}
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{deal.port || "-"}</div>
                      </td>

                      {/* ETA */}
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{deal.delivery_date || "-"}</div>
                      </td>

                      {/* Fuel */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {deal.fuel_type && (
                            <div className="text-gray-700">
                              {deal.fuel_type} {deal.quantity}
                            </div>
                          )}
                          {deal.fuel_type2 && (
                            <div className="text-gray-700">
                              {deal.fuel_type2} {deal.quantity2}
                            </div>
                          )}
                          {!deal.fuel_type && !deal.fuel_type2 && "-"}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="text-gray-700 truncate max-w-[150px]">
                          {deal.customer_room_name}
                        </div>
                      </td>

                      {/* Quotes */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {deal.total_quotes_received > 0 ? (
                            <>
                              <div className="text-xs text-gray-600">
                                {deal.total_quotes_received} received
                              </div>
                              {deal.selected_trader && (
                                <div className="text-xs font-medium text-green-700">
                                  {deal.selected_trader}
                                </div>
                              )}
                              {deal.final_price && (
                                <div className="text-xs font-bold text-green-600">
                                  ${deal.final_price.toLocaleString()}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-gray-400">Waiting</div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusDropdownOpen(statusDropdownOpen === deal.session_id ? null : deal.session_id);
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {getStatusBadge(deal.status)}
                          </button>
                          {statusDropdownOpen === deal.session_id && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[140px]">
                              {STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(deal.session_id, option.value);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2 ${
                                    deal.status === option.value ? "bg-gray-50 font-medium" : ""
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${option.color}`} />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500">
                          {new Date(deal.created_at).toLocaleString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deal.session_id, deal.vessel_name || "Unknown");
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete deal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary */}
            <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
              <div>
                Total: <span className="font-bold text-gray-900">{filteredDeals.length}</span>
              </div>
              <div className="flex gap-4">
                <span>
                  In Progress: <span className="font-medium text-blue-600">
                    {filteredDeals.filter(d => d.status === "active").length}
                  </span>
                </span>
                <span>
                  Quoted: <span className="font-medium text-purple-600">
                    {filteredDeals.filter(d => d.status === "quoted").length}
                  </span>
                </span>
                <span>
                  Deal Done: <span className="font-medium text-green-600">
                    {filteredDeals.filter(d => d.status === "closed_success").length}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <DealTimeline deals={filteredDeals} onDealClick={handleDealClick} />
        )}

        {/* Statistics View */}
        {viewMode === "statistics" && (
          <DealStatistics statistics={statistics} isLoading={false} />
        )}
      </div>

      {/* Deal Detail Modal */}
      <MockupDealDetailModal
        deal={selectedDeal}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </MockupMainLayout>
  );
}
