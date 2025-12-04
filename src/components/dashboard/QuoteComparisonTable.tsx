/**
 * Quote Comparison Table Component
 * 견적 비교표 - 세션의 모든 트레이더 견적 비교
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TrendingDown,
  TrendingUp,
  Award,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { quoteComparisonAPI, type QuoteComparison } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

interface QuoteComparisonTableProps {
  sessionId: string;
  className?: string;
  compact?: boolean;
}

export function QuoteComparisonTable({
  sessionId,
  className,
  compact = false,
}: QuoteComparisonTableProps) {
  const [data, setData] = useState<QuoteComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await quoteComparisonAPI.getComparison(sessionId);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch quote comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const handleCopyText = async () => {
    try {
      const textResult = await quoteComparisonAPI.getComparisonText(sessionId);
      await navigator.clipboard.writeText(textResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data || data.quotes.length === 0) {
    return (
      <div className={cn("text-center text-gray-500 p-8", className)}>
        견적이 없습니다
      </div>
    );
  }

  // 간단 버전 (유종별 최저가만 표시)
  if (compact) {
    return (
      <div className={cn("p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">견적 비교</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyText}
            className="h-7 px-2 text-xs"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <div className="space-y-2">
          {Object.entries(data.comparison).map(([fuelType, comp]) => (
            <div key={fuelType} className="p-2 bg-white rounded border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{fuelType}</span>
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-500">{comp.best_trader}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-green-600">${comp.min_price}</span>
                {comp.min_price !== comp.max_price && (
                  <span className="text-xs text-gray-400">
                    ~ ${comp.max_price}
                  </span>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {comp.quote_count}건
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 전체 버전
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Table className="w-5 h-5" />
            견적 비교표
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopyText}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                텍스트 복사
              </>
            )}
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {data.vessel_name} @ {data.port}
        </div>
      </CardHeader>
      <CardContent>
        {/* 유종별 최저가 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Object.entries(data.comparison).map(([fuelType, comp]) => (
            <div
              key={fuelType}
              className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">{fuelType}</span>
                <Award className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-xl font-bold text-green-600">${comp.min_price}</div>
              <div className="text-xs text-gray-500">{comp.best_trader}</div>
            </div>
          ))}
        </div>

        {/* 전체 견적 테이블 */}
        <ScrollArea className="h-[300px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b">
                <th className="text-left py-2 px-2">트레이더</th>
                <th className="text-left py-2 px-2">유종</th>
                <th className="text-right py-2 px-2">수량</th>
                <th className="text-right py-2 px-2">가격</th>
                <th className="text-right py-2 px-2">Barge</th>
                <th className="text-left py-2 px-2">Earliest</th>
                <th className="text-left py-2 px-2">Term</th>
              </tr>
            </thead>
            <tbody>
              {data.quotes.map((quote, index) => {
                const isBest = data.comparison[quote.fuel_type]?.min_price === quote.price;
                return (
                  <tr
                    key={index}
                    className={cn(
                      "border-b hover:bg-gray-50",
                      isBest && "bg-green-50"
                    )}
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        {isBest && <Award className="w-3 h-3 text-yellow-500" />}
                        <span className="font-medium">{quote.trader}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">{quote.fuel_type}</td>
                    <td className="text-right py-2 px-2">
                      {quote.quantity ? `${quote.quantity}MT` : "-"}
                    </td>
                    <td className="text-right py-2 px-2">
                      <span className={cn(
                        "font-medium",
                        isBest ? "text-green-600" : "text-gray-800"
                      )}>
                        ${quote.price}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 text-gray-500">
                      {quote.barge_fee ? `+$${quote.barge_fee}` : "-"}
                    </td>
                    <td className="py-2 px-2 text-gray-500">{quote.earliest || "-"}</td>
                    <td className="py-2 px-2 text-gray-500">{quote.term || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
