/**
 * Quotes Tab
 * 견적 비교 뷰
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
        받은 견적이 없습니다
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
      {/* 견적 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">총 견적 수</div>
          <div className="text-2xl font-bold text-blue-600">{quotes.length}개</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">최저가</div>
          <div className="text-2xl font-bold text-green-600">
            {lowestPrice !== null ? `$${lowestPrice}` : "-"}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">가격 차이</div>
          <div className="text-2xl font-bold text-orange-600">
            {prices.length >= 2
              ? `$${(Math.max(...prices) - Math.min(...prices)).toFixed(2)}`
              : "-"}
          </div>
        </div>
      </div>

      {/* 견적 비교 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                트레이더
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                가격
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                받은 시간
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                비고
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
                          최저가
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{quote.status || "확인 필요"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(quote.received_at).toLocaleString("ko-KR", {
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

      {/* 견적 상세 정보 */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">견적 상세</h3>
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
              받은 시간: {new Date(quote.received_at).toLocaleString("ko-KR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
