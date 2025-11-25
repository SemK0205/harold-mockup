/**
 * DealStatistics Component
 * Deal Statistics Dashboard
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { DealStatistics as DealStatisticsType } from "@/types";

interface DealStatisticsProps {
  statistics: DealStatisticsType | null;
  isLoading: boolean;
}

export function DealStatistics({ statistics, isLoading }: DealStatisticsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-gray-500">No statistics data</div>
      </div>
    );
  }

  const { overall, by_port, by_trader } = statistics;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">Overall Statistics</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Deals */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-xs text-blue-600 font-medium mb-1">Total Deals</div>
            <div className="text-2xl font-bold text-blue-700">{overall.total_deals}</div>
          </div>

          {/* Success Rate */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-xs text-green-600 font-medium mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-700">{overall.success_rate?.toFixed(1)}%</div>
          </div>

          {/* Total Revenue */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-xs text-purple-600 font-medium mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-purple-700">
              ${overall.total_revenue?.toLocaleString() || 0}
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-xs text-yellow-600 font-medium mb-1">Today's Revenue</div>
            <div className="text-2xl font-bold text-yellow-700">
              ${overall.today_revenue?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Status Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Active Deals</div>
            <div className="text-xl font-bold text-blue-600">{overall.active_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Quoted</div>
            <div className="text-xl font-bold text-purple-600">{overall.quoted_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Negotiating</div>
            <div className="text-xl font-bold text-yellow-600">{overall.negotiating_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Successful</div>
            <div className="text-xl font-bold text-green-600">{overall.successful_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Failed</div>
            <div className="text-xl font-bold text-red-600">{overall.failed_deals}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Cancelled</div>
            <div className="text-xl font-bold text-gray-600">{overall.cancelled_deals}</div>
          </div>
        </div>

        {/* Average Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Avg Response Time</div>
            <div className="text-lg font-bold text-blue-600">
              {overall.avg_response_time_minutes?.toFixed(1) || 0} min
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Avg Deal Duration</div>
            <div className="text-lg font-bold text-purple-600">
              {overall.avg_deal_duration_minutes?.toFixed(1) || 0} min
            </div>
          </div>
        </div>
      </div>

      {/* Port Statistics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">Port Statistics (Top 5)</h3>

        {by_port && by_port.length > 0 ? (
          <div className="space-y-3">
            {by_port.slice(0, 5).map((port, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <div className="font-medium">{port.port}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total {port.total_deals} deals • {port.successful_deals} successful
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${port.total_revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg ${port.avg_deal_value?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">No data</div>
        )}
      </div>

      {/* Trader Statistics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">Trader Statistics (Top 5)</h3>

        {by_trader && by_trader.length > 0 ? (
          <div className="space-y-3">
            {by_trader.slice(0, 5).map((trader, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <div className="font-medium">{trader.trader}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total {trader.total_deals} deals • Avg {trader.avg_negotiation_rounds?.toFixed(1)} negotiations
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${trader.total_revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg response {trader.avg_response_minutes?.toFixed(1)} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">No data</div>
        )}
      </div>
    </div>
  );
}
