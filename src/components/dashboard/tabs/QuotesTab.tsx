/**
 * Quotes Tab
 * Quote Comparison View
 */

"use client";

import { Badge } from "@/components/ui/badge";
import type { Quote } from "@/types";

interface QuotesTabProps {
  quotes: Quote[];
}

export function QuotesTab({ quotes }: QuotesTabProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        No quotes received
      </div>
    );
  }

  // 가격 파싱 (숫자만 추출)
  const parsePrice = (priceStr: string): number | null => {
    const match = priceStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  // 최저가 찾기
  const prices = quotes.map((q) => parsePrice(q.price)).filter((p) => p !== null) as number[];
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

  return (
    <div className="space-y-6">
      {/* Quote Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Quotes</div>
          <div className="text-2xl font-bold text-blue-600">{quotes.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Lowest Price</div>
          <div className="text-2xl font-bold text-green-600">
            {lowestPrice !== null ? `$${lowestPrice}` : "-"}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Price Range</div>
          <div className="text-2xl font-bold text-orange-600">
            {prices.length >= 2
              ? `$${(Math.max(...prices) - Math.min(...prices)).toFixed(2)}`
              : "-"}
          </div>
        </div>
      </div>

      {/* Quote Comparison Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trader
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Received
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.map((quote, index) => {
              const price = parsePrice(quote.price);
              const isLowest = price !== null && price === lowestPrice;

              return (
                <tr
                  key={index}
                  className={isLowest ? "bg-green-50" : "hover:bg-gray-50"}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {quote.trader}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={isLowest ? "font-bold text-green-600" : ""}>
                        {quote.price}
                      </span>
                      {isLowest && (
                        <Badge variant="default" className="bg-green-600">
                          Lowest
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{quote.status || "Pending Review"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(quote.received_at).toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {quote.notes || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quote Details */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Quote Details</h3>
        {quotes.map((quote, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{quote.trader}</h4>
              <Badge>{quote.price}</Badge>
            </div>
            {quote.details && (
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {quote.details}
              </div>
            )}
            <div className="text-xs text-gray-500">
              Received: {new Date(quote.received_at).toLocaleString("en-US")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
