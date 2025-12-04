/**
 * Mockup Statistics Page
 * 투자자 시연용 통계 페이지
 */

"use client";

import { MockupMainLayout } from "@/components/mockup/MockupMainLayout";
import { DealStatistics } from "@/components/dashboard/DealStatistics";
import { useMockContext } from "@/lib/mockup/MockProvider";

export default function MockupStatisticsPage() {
  const { statistics } = useMockContext();

  return (
    <MockupMainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Statistics</h1>
        </div>

        <DealStatistics statistics={statistics} isLoading={false} />
      </div>
    </MockupMainLayout>
  );
}
