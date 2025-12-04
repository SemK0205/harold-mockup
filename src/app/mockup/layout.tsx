/**
 * Mockup Layout
 * 투자자 시연용 목업 레이아웃
 */

import { MockProvider } from "@/lib/mockup/MockProvider";
import { DemoControlBar } from "@/components/mockup/DemoControlBar";

export const metadata = {
  title: "Harold Trading - Investor Demo",
  description: "Interactive demo for investors",
};

export default function MockupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockProvider>
      <div className="min-h-screen pb-24">
        {children}
      </div>
      <DemoControlBar />
    </MockProvider>
  );
}
