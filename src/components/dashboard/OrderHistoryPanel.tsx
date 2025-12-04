/**
 * Order History Panel Component
 * 과거 주문 이력 패널 - SEANERGY_PARTNER 연동
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ship,
  Building2,
  Calendar,
  Anchor,
  DollarSign,
  Loader2,
  History,
} from "lucide-react";
import { orderHistoryAPI, type OrderHistoryItem } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

interface OrderHistoryPanelProps {
  sessionId?: string;
  imo?: string;
  customerName?: string;
  className?: string;
  compact?: boolean;
}

export function OrderHistoryPanel({
  sessionId,
  imo,
  customerName,
  className,
  compact = false,
}: OrderHistoryPanelProps) {
  const [vesselHistory, setVesselHistory] = useState<OrderHistoryItem[]>([]);
  const [customerHistory, setCustomerHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (sessionId) {
          // 세션 기반 자동 조회
          const data = await orderHistoryAPI.getBySession(sessionId);
          setVesselHistory(data.vessel_history || []);
          setCustomerHistory(data.customer_history || []);
        } else {
          // 개별 조회
          const [vesselData, customerData] = await Promise.all([
            imo ? orderHistoryAPI.getByVessel(imo) : Promise.resolve({ orders: [] }),
            customerName ? orderHistoryAPI.getByCustomer(customerName) : Promise.resolve({ orders: [] }),
          ]);
          setVesselHistory(vesselData.orders);
          setCustomerHistory(customerData.orders);
        }
      } catch (error) {
        console.error("Failed to fetch order history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId || imo || customerName) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [sessionId, imo, customerName]);

  const hasVesselHistory = vesselHistory.length > 0;
  const hasCustomerHistory = customerHistory.length > 0;
  const hasAnyHistory = hasVesselHistory || hasCustomerHistory;

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">과거 이력 조회 중...</span>
      </div>
    );
  }

  if (!hasAnyHistory) {
    return (
      <div className={cn("text-center text-gray-500 p-4", className)}>
        <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">과거 주문 이력이 없습니다</p>
      </div>
    );
  }

  const OrderItem = ({ order, type }: { order: OrderHistoryItem; type: "vessel" | "customer" }) => (
    <div className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {type === "vessel" ? (
            <Ship className="w-4 h-4 text-blue-500" />
          ) : (
            <Building2 className="w-4 h-4 text-purple-500" />
          )}
          <span className="font-medium text-sm">{order.vessel_name}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          #{order.order_id}
        </Badge>
      </div>

      <div className="mt-2 space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Anchor className="w-3 h-3" />
          <span>{order.port || "N/A"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>
            {order.order_date
              ? new Date(order.order_date).toLocaleDateString("ko-KR")
              : "N/A"}
          </span>
        </div>
        {order.fuel_info && (
          <div className="text-gray-700 font-medium">{order.fuel_info}</div>
        )}
        {order.total_amount && (
          <div className="flex items-center gap-1 text-green-600">
            <DollarSign className="w-3 h-3" />
            <span>${order.total_amount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Buyer:</span>
          <span className="text-gray-600">{order.buyer_name || "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Supplier:</span>
          <span className="text-blue-600">{order.supplier_name || "N/A"}</span>
        </div>
      </div>
    </div>
  );

  // Compact 버전
  if (compact) {
    return (
      <div className={cn("p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg", className)}>
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-semibold text-orange-700">과거 이력</span>
          <Badge variant="outline" className="text-xs border-orange-200">
            {vesselHistory.length + customerHistory.length}건
          </Badge>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {vesselHistory.slice(0, 3).map((order) => (
              <OrderItem key={`v-${order.order_id}`} order={order} type="vessel" />
            ))}
            {customerHistory.slice(0, 3).map((order) => (
              <OrderItem key={`c-${order.order_id}`} order={order} type="customer" />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // 전체 버전
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          과거 주문 이력 (SEANERGY)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasVesselHistory ? "vessel" : "customer"}>
          <TabsList className="mb-4">
            <TabsTrigger value="vessel" className="flex items-center gap-1" disabled={!hasVesselHistory}>
              <Ship className="w-4 h-4" />
              선박 이력
              <Badge variant="secondary" className="ml-1 text-xs">
                {vesselHistory.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-1" disabled={!hasCustomerHistory}>
              <Building2 className="w-4 h-4" />
              고객 이력
              <Badge variant="secondary" className="ml-1 text-xs">
                {customerHistory.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vessel">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {vesselHistory.map((order) => (
                  <OrderItem key={order.order_id} order={order} type="vessel" />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="customer">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {customerHistory.map((order) => (
                  <OrderItem key={order.order_id} order={order} type="customer" />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
