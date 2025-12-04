/**
 * Customers Page
 * 고객 목록 및 히스토리 페이지
 */

"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Search,
  Building2,
  Ship,
  TrendingUp,
  Anchor,
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  customerAPI,
  orderHistoryAPI,
  type CustomerInfo,
  type CustomerHistory,
  type CustomerVessel,
  type OrderHistoryItem,
} from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerHistory | null>(null);
  const [customerVessels, setCustomerVessels] = useState<CustomerVessel[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [period, setPeriod] = useState(90);

  // 고객 목록 로드
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await customerAPI.getList(period);
        setCustomers(data.customers);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [period]);

  // 고객 상세 정보 로드
  const handleSelectCustomer = async (customerRoomName: string) => {
    setSelectedCustomer(customerRoomName);
    setDetailLoading(true);

    try {
      const [historyData, vesselsData, orderData] = await Promise.all([
        customerAPI.getHistory(customerRoomName, 180),
        customerAPI.getVessels(customerRoomName, 365),
        orderHistoryAPI.getByCustomer(customerRoomName, 10),
      ]);

      setCustomerDetail(historyData);
      setCustomerVessels(vesselsData.vessels);
      setOrderHistory(orderData.orders);
    } catch (error) {
      console.error("Failed to fetch customer detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 검색 필터
  const filteredCustomers = customers.filter((c) =>
    c.customer_room_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-500">고객 관리 및 거래 히스토리</p>
          </div>
          <div className="flex gap-2">
            {[30, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  period === days
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {days}일
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="고객명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                고객 목록
                <Badge variant="secondary">{filteredCustomers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.customer_room_name}
                        onClick={() => handleSelectCustomer(customer.customer_room_name)}
                        className={cn(
                          "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                          selectedCustomer === customer.customer_room_name && "bg-blue-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                              {customer.customer_room_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {customer.customer_room_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                인쿼리 {customer.inquiry_count}건 · 성공 {customer.deal_success_count}건
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant={customer.deal_rate >= 50 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            성공률 {customer.deal_rate}%
                          </Badge>
                          {customer.last_inquiry_at && (
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(customer.last_inquiry_at), {
                                addSuffix: true,
                                locale: ko,
                              })}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Customer Detail */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                고객 상세 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCustomer ? (
                <div className="text-center text-gray-500 py-12">
                  좌측에서 고객을 선택하세요
                </div>
              ) : detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : customerDetail ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {customerDetail.summary.total_inquiries}
                      </div>
                      <div className="text-xs text-gray-500">총 인쿼리</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {customerDetail.summary.deal_success}
                      </div>
                      <div className="text-xs text-gray-500">딜 성공</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {customerDetail.summary.deal_failed}
                      </div>
                      <div className="text-xs text-gray-500">딜 실패</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {customerDetail.summary.deal_rate}%
                      </div>
                      <div className="text-xs text-gray-500">성공률</div>
                    </div>
                  </div>

                  {/* Preferred Traders & Ports */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">선호 트레이더</span>
                      </div>
                      <div className="space-y-2">
                        {customerDetail.preferred_traders.length === 0 ? (
                          <span className="text-sm text-gray-400">데이터 없음</span>
                        ) : (
                          customerDetail.preferred_traders.map((t, i) => (
                            <div key={t.trader} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {i + 1}. {t.trader}
                              </span>
                              <Badge variant="outline">{t.deal_count}건</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Anchor className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">자주 이용 포트</span>
                      </div>
                      <div className="space-y-2">
                        {customerDetail.frequent_ports.length === 0 ? (
                          <span className="text-sm text-gray-400">데이터 없음</span>
                        ) : (
                          customerDetail.frequent_ports.map((p, i) => (
                            <div key={p.port} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {i + 1}. {p.port}
                              </span>
                              <Badge variant="outline">{p.count}건</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vessels */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Ship className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">인쿼리한 선박</span>
                      <Badge variant="secondary">{customerVessels.length}</Badge>
                    </div>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {customerVessels.map((v) => (
                          <div
                            key={v.vessel_name}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="font-medium text-sm">{v.vessel_name}</span>
                              {v.imo && (
                                <span className="text-xs text-gray-400 ml-2">IMO: {v.imo}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {v.inquiry_count}건
                              </Badge>
                              {v.deal_success_count > 0 && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Recent Sessions */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">최근 거래</span>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {customerDetail.sessions.map((s) => (
                          <div
                            key={s.session_id}
                            className="p-3 bg-gray-50 rounded flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{s.vessel_name || "N/A"}</span>
                                <Badge
                                  variant={
                                    s.status === "deal_success"
                                      ? "default"
                                      : s.status === "active"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {s.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {s.port} · {s.fuel_types || "N/A"}
                              </div>
                            </div>
                            <div className="text-right">
                              {s.selected_trader && (
                                <div className="text-xs text-green-600">{s.selected_trader}</div>
                              )}
                              <div className="text-xs text-gray-400">
                                {new Date(s.created_at).toLocaleDateString("ko-KR")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* SEANERGY Order History */}
                  {orderHistory.length > 0 && (
                    <div className="p-4 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-800">SEANERGY 과거 주문</span>
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          {orderHistory.length}건
                        </Badge>
                      </div>
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-2">
                          {orderHistory.map((order) => (
                            <div
                              key={order.order_id}
                              className="p-2 bg-white rounded border border-orange-100"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{order.vessel_name}</span>
                                <span className="text-xs text-gray-400">
                                  {order.order_date ? new Date(order.order_date).toLocaleDateString("ko-KR") : "N/A"}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.port} · {order.fuel_info || "N/A"}
                              </div>
                              {order.supplier_name && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Supplier: {order.supplier_name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
