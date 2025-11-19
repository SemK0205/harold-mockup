/**
 * Dashboard Page (딜 전광판)
 * 활성 거래 세션 목록
 */

"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DealScoreboard } from "@/components/dashboard/DealScoreboard";
import { DealDetailModal } from "@/components/dashboard/DealDetailModal";
import { useTradingSessions } from "@/lib/api/queries";
import type { TradingSession } from "@/types";

export default function DashboardPage() {
  const { data: sessions, isLoading, error } = useTradingSessions();
  const [selectedSession, setSelectedSession] = useState<TradingSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (session: TradingSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">딜 전광판</h1>
          <div className="text-sm text-gray-500">
            {sessions && `총 ${sessions.length}건`}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">에러 발생: {String(error)}</p>
          </div>
        )}

        {sessions && <DealScoreboard sessions={sessions} onRowClick={handleRowClick} />}
      </div>

      <DealDetailModal
        session={selectedSession}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </MainLayout>
  );
}
