/**
 * Margin Calculator Component
 * 마진 계산기 - 매입가/매출가로 마진 계산
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, TrendingUp, Percent } from "lucide-react";
import { marginAPI, type MarginCalculateResult } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

interface MarginCalculatorProps {
  defaultBuyPrice?: number;
  defaultSellPrice?: number;
  defaultQuantity?: number;
  className?: string;
  compact?: boolean;
}

export function MarginCalculator({
  defaultBuyPrice = 0,
  defaultSellPrice = 0,
  defaultQuantity = 0,
  className,
  compact = false,
}: MarginCalculatorProps) {
  const [buyPrice, setBuyPrice] = useState(defaultBuyPrice);
  const [sellPrice, setSellPrice] = useState(defaultSellPrice);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [bargeFee, setBargeFee] = useState(0);
  const [additionalCost, setAdditionalCost] = useState(0);
  const [result, setResult] = useState<MarginCalculateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!buyPrice || !sellPrice || !quantity) return;

    setLoading(true);
    try {
      const data = await marginAPI.calculate({
        buy_price: buyPrice,
        sell_price: sellPrice,
        quantity,
        barge_fee: bargeFee || undefined,
        additional_cost: additionalCost || undefined,
      });
      setResult(data);
    } catch (error) {
      console.error("Failed to calculate margin:", error);
    } finally {
      setLoading(false);
    }
  };

  // 간단 버전 (Compact mode)
  if (compact) {
    return (
      <div className={cn("p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg", className)}>
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">마진 계산</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <Label className="text-xs text-gray-500">매입가</Label>
            <Input
              type="number"
              value={buyPrice || ""}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              placeholder="$"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">매출가</Label>
            <Input
              type="number"
              value={sellPrice || ""}
              onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              placeholder="$"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">수량(MT)</Label>
            <Input
              type="number"
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              placeholder="MT"
            />
          </div>
        </div>
        <Button
          onClick={handleCalculate}
          disabled={loading || !buyPrice || !sellPrice || !quantity}
          className="w-full h-8 text-sm"
          variant="default"
        >
          {loading ? "계산 중..." : "계산하기"}
        </Button>
        {result && (
          <div className="mt-2 p-2 bg-white rounded border border-green-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">총 마진:</span>
              <span className={cn("font-bold", result.result.net_margin >= 0 ? "text-green-600" : "text-red-600")}>
                ${result.result.net_margin.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>마진율: {result.result.margin_rate}%</span>
              <span>MT당: ${result.result.margin_per_mt}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 전체 버전
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          마진 계산기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              매입가 ($/MT)
            </Label>
            <Input
              type="number"
              value={buyPrice || ""}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              placeholder="예: 450"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              매출가 ($/MT)
            </Label>
            <Input
              type="number"
              value={sellPrice || ""}
              onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
              placeholder="예: 460"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>수량 (MT)</Label>
            <Input
              type="number"
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="예: 500"
            />
          </div>
          <div>
            <Label>Barge Fee ($/MT)</Label>
            <Input
              type="number"
              value={bargeFee || ""}
              onChange={(e) => setBargeFee(parseFloat(e.target.value) || 0)}
              placeholder="선택"
            />
          </div>
          <div>
            <Label>추가 비용 ($)</Label>
            <Input
              type="number"
              value={additionalCost || ""}
              onChange={(e) => setAdditionalCost(parseFloat(e.target.value) || 0)}
              placeholder="선택"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={loading || !buyPrice || !sellPrice || !quantity}
          className="w-full"
        >
          {loading ? "계산 중..." : "마진 계산"}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">매입 총액</div>
                <div className="text-lg font-bold text-gray-800">
                  ${result.result.buy_total.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">매출 총액</div>
                <div className="text-lg font-bold text-gray-800">
                  ${result.result.sell_total.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-3 rounded-lg border",
                result.result.net_margin >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  순 마진
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  result.result.net_margin >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  ${result.result.net_margin.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  (MT당 ${result.result.margin_per_mt})
                </div>
              </div>
              <div className={cn(
                "p-3 rounded-lg border",
                result.result.margin_rate >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Percent className="w-3 h-3" />
                  마진율
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  result.result.margin_rate >= 0 ? "text-blue-600" : "text-red-600"
                )}>
                  {result.result.margin_rate}%
                </div>
              </div>
            </div>

            {bargeFee > 0 && (
              <div className="text-xs text-gray-500 text-center">
                * Barge Fee 비용: ${result.result.barge_total.toLocaleString()} 공제됨
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
