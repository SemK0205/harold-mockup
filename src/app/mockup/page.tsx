/**
 * Mockup Home Page
 * 투자자 시연용 홈페이지 - 시나리오 선택
 */

"use client";

import Link from "next/link";
import { MockupMainLayout } from "@/components/mockup/MockupMainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockContext } from "@/lib/mockup/MockProvider";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Ship,
  Fuel,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function MockupHomePage() {
  const { deals, statistics } = useMockContext();

  const activeDeals = deals.filter(d => d.status === "active" || d.status === "quoted" || d.status === "negotiating");
  const successDeals = deals.filter(d => d.status === "closed_success");
  const lostDeals = deals.filter(d => d.status === "closed_lost" || d.status === "no_offer");

  return (
    <MockupMainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-4">Harold Trading Platform</h1>
          <p className="text-xl text-gray-600 mb-6">
            AI-Powered Marine Fuel Trading Automation
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            MOCKUP MODE - All features simulated
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Deals</p>
                  <p className="text-3xl font-bold text-blue-600">{activeDeals.length}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Deal Success</p>
                  <p className="text-3xl font-bold text-green-600">{successDeals.length}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Lost/No Offer</p>
                  <p className="text-3xl font-bold text-red-600">{lostDeals.length}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{statistics.overall.success_rate}%</p>
                </div>
                <BarChart3 className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/mockup/dashboard">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Deal Board</CardTitle>
                    <CardDescription>Real-time deal scoreboard</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <Ship className="w-4 h-4" /> View all active deals
                  </li>
                  <li className="flex items-center gap-2">
                    <Fuel className="w-4 h-4" /> Track quotes from suppliers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve AI suggestions
                  </li>
                </ul>
                <Button className="w-full mt-4">Open Dashboard</Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/mockup/chats">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Chat Manager</CardTitle>
                    <CardDescription>Multi-platform messaging</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-500">K</span> KakaoTalk integration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">W</span> WhatsApp integration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">W</span> WeChat integration
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">Open Chat Manager</Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/mockup/statistics">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>Analytics & insights</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> KPI dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <Ship className="w-4 h-4" /> Trader performance
                  </li>
                  <li className="flex items-center gap-2">
                    <Fuel className="w-4 h-4" /> Port analysis
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">View Statistics</Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Demo Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Scenarios</CardTitle>
            <CardDescription>Key features to demonstrate to investors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">1. New Inquiry Flow</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Click &quot;New Inquiry&quot; in the control bar to see how a new deal is created and processed by AI.
                </p>
                <Link href="/mockup/dashboard">
                  <Button size="sm" variant="outline">Try it</Button>
                </Link>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">2. AI Suggestion Approval</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Click on an active deal to open the 3-column modal and see AI suggestions.
                </p>
                <Link href="/mockup/dashboard">
                  <Button size="sm" variant="outline">Try it</Button>
                </Link>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">3. Quote Collection</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use &quot;Quote Received&quot; button to simulate receiving quotes from suppliers.
                </p>
                <Link href="/mockup/dashboard">
                  <Button size="sm" variant="outline">Try it</Button>
                </Link>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">4. Real-time Messaging</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Send messages in the chat manager to see how communication flows.
                </p>
                <Link href="/mockup/chats">
                  <Button size="sm" variant="outline">Try it</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-500">
          <p>Harold Trading Platform - Investor Demo</p>
          <p className="mt-1">All data is simulated. No real transactions occur.</p>
        </div>
      </div>
    </MockupMainLayout>
  );
}
