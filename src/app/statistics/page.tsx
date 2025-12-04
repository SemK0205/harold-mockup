/**
 * Statistics Page
 * 통계 대시보드 페이지
 */

"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Ship,
  Anchor,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import {
  statsAPI,
  type StatsOverview,
  type DailyStats,
  type TraderStats,
  type CustomerStats,
  type PortStats,
} from "@/lib/api/endpoints";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [traderStats, setTraderStats] = useState<TraderStats[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats[]>([]);
  const [portStats, setPortStats] = useState<PortStats[]>([]);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, dailyData, traderData, customerData, portData] = await Promise.all([
          statsAPI.getOverview(),
          statsAPI.getDaily(7),
          statsAPI.getTraders(period),
          statsAPI.getCustomers(period),
          statsAPI.getPorts(period),
        ]);

        setOverview(overviewData);
        setDailyStats(dailyData.data.reverse());
        setTraderStats(traderData.traders);
        setCustomerStats(customerData.customers);
        setPortStats(portData.ports);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistics Dashboard</h1>
            <p className="text-gray-500">거래 현황 및 성과 분석</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">활성 세션</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {overview?.overview.active_sessions || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">딜 성공</p>
                  <p className="text-3xl font-bold text-green-600">
                    {overview?.overview.deal_success_sessions || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">딜 성공률</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {overview?.overview.deal_success_rate || 0}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">이번달 거래</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {overview?.period.this_month || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">오늘</p>
              <p className="text-2xl font-bold text-blue-800">{overview?.period.today || 0}건</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-green-600 font-medium">이번주</p>
              <p className="text-2xl font-bold text-green-800">{overview?.period.this_week || 0}건</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-purple-600 font-medium">이번달</p>
              <p className="text-2xl font-bold text-purple-800">{overview?.period.this_month || 0}건</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              일별 거래 추이 (최근 7일)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString("ko-KR")}
                  />
                  <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} name="생성" />
                  <Line type="monotone" dataKey="closed" stroke="#f59e0b" strokeWidth={2} name="완료" />
                  <Line type="monotone" dataKey="deal_success" stroke="#10b981" strokeWidth={2} name="딜 성공" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Detailed Stats */}
        <Tabs defaultValue="traders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="traders" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              트레이더
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-1">
              <Ship className="w-4 h-4" />
              고객사
            </TabsTrigger>
            <TabsTrigger value="ports" className="flex items-center gap-1">
              <Anchor className="w-4 h-4" />
              포트
            </TabsTrigger>
          </TabsList>

          {/* Traders Tab */}
          <TabsContent value="traders">
            <Card>
              <CardHeader>
                <CardTitle>트레이더별 성과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {traderStats.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">데이터가 없습니다</p>
                  ) : (
                    <>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={traderStats.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="trader_room_name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="quote_count" fill="#6366f1" name="견적 수" />
                            <Bar dataKey="selected_count" fill="#10b981" name="선정 수" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">트레이더</th>
                              <th className="text-right py-2">견적 수</th>
                              <th className="text-right py-2">세션 수</th>
                              <th className="text-right py-2">선정 수</th>
                              <th className="text-right py-2">선정률</th>
                            </tr>
                          </thead>
                          <tbody>
                            {traderStats.map((trader) => (
                              <tr key={trader.trader_room_name} className="border-b">
                                <td className="py-2 font-medium">{trader.trader_room_name}</td>
                                <td className="text-right">{trader.quote_count}</td>
                                <td className="text-right">{trader.session_count}</td>
                                <td className="text-right text-green-600">{trader.selected_count}</td>
                                <td className="text-right">
                                  <Badge variant={trader.select_rate >= 50 ? "default" : "secondary"}>
                                    {trader.select_rate}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>고객사별 거래 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerStats.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">데이터가 없습니다</p>
                  ) : (
                    <>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={customerStats.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="customer_room_name" type="category" width={150} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="inquiry_count" fill="#6366f1" name="인쿼리 수" />
                            <Bar dataKey="deal_success_count" fill="#10b981" name="딜 성공" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">고객사</th>
                              <th className="text-right py-2">인쿼리</th>
                              <th className="text-right py-2">딜 성공</th>
                              <th className="text-right py-2">완료</th>
                              <th className="text-right py-2">성공률</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerStats.map((customer) => (
                              <tr key={customer.customer_room_name} className="border-b">
                                <td className="py-2 font-medium">{customer.customer_room_name}</td>
                                <td className="text-right">{customer.inquiry_count}</td>
                                <td className="text-right text-green-600">{customer.deal_success_count}</td>
                                <td className="text-right">{customer.closed_count}</td>
                                <td className="text-right">
                                  <Badge variant={customer.deal_rate >= 50 ? "default" : "secondary"}>
                                    {customer.deal_rate}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ports Tab */}
          <TabsContent value="ports">
            <Card>
              <CardHeader>
                <CardTitle>포트별 거래 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {portStats.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 col-span-2">데이터가 없습니다</p>
                  ) : (
                    <>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={portStats.slice(0, 5) as any}
                              dataKey="inquiry_count"
                              nameKey="port"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry: any) => `${entry.port} (${(entry.percent * 100).toFixed(0)}%)`}
                            >
                              {portStats.slice(0, 5).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">포트</th>
                              <th className="text-right py-2">인쿼리</th>
                              <th className="text-right py-2">딜 성공</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portStats.map((port, index) => (
                              <tr key={port.port} className="border-b">
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium">{port.port}</span>
                                  </div>
                                </td>
                                <td className="text-right">{port.inquiry_count}</td>
                                <td className="text-right text-green-600">{port.deal_success_count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
