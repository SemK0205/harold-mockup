/**
 * ExportButtons 컴포넌트
 * CSV/PDF 내보내기 버튼
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import axios from "axios";

interface ExportButtonsProps {
  filters?: {
    status?: string;
    port?: string;
    customer?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function ExportButtons({ filters = {} }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "pdf" | null>(null);

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportType("csv");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.port) params.append("port", filters.port);
      if (filters.customer) params.append("customer", filters.customer);
      if (filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (filters.dateTo) params.append("date_to", filters.dateTo);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/export/csv?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // 다운로드 링크 생성
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 파일명 추출 또는 기본값 설정
      const contentDisposition = response.headers["content-disposition"];
      const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `deals_export_${Date.now()}.csv`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 성공 알림 (선택사항)
      console.log("CSV 내보내기 완료");
    } catch (error) {
      console.error("CSV 내보내기 실패:", error);
      alert("CSV 내보내기에 실패했습니다.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType("pdf");

    try {
      // PDF 생성 로직 (클라이언트 사이드)
      // jsPDF 또는 다른 라이브러리 사용
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      // API에서 데이터 가져오기
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.port) params.append("port", filters.port);
      if (filters.customer) params.append("customer", filters.customer);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/scoreboard?${params.toString()}`
      );

      const deals = response.data.data || [];

      // PDF 생성
      const doc = new jsPDF({ orientation: "landscape" });

      // 제목
      doc.setFontSize(18);
      doc.text("딜 전광판 리포트", 14, 20);

      // 생성 일시
      doc.setFontSize(10);
      doc.text(`생성일시: ${new Date().toLocaleString("ko-KR")}`, 14, 30);

      // 필터 정보
      const filterText = [];
      if (filters.status) filterText.push(`상태: ${filters.status}`);
      if (filters.port) filterText.push(`항구: ${filters.port}`);
      if (filters.customer) filterText.push(`고객: ${filters.customer}`);
      if (filterText.length > 0) {
        doc.text(`필터: ${filterText.join(", ")}`, 14, 36);
      }

      // 테이블 데이터 준비
      const tableData = deals.map((deal: any) => [
        deal.customer_room_name || "-",
        deal.vessel_name || "-",
        deal.port || "-",
        deal.fuel_type && deal.quantity ? `${deal.fuel_type} ${deal.quantity}` : "-",
        deal.delivery_date || "-",
        deal.status === "active"
          ? "진행중"
          : deal.status === "quoted"
          ? "견적수신"
          : deal.status === "negotiating"
          ? "협상중"
          : deal.status === "closed_success"
          ? "성사"
          : deal.status === "closed_failed"
          ? "실패"
          : "취소",
        deal.total_quotes_received || 0,
        deal.final_price ? `$${deal.final_price.toLocaleString()}` : "-",
        deal.selected_trader || "-",
        deal.created_at ? new Date(deal.created_at).toLocaleDateString("ko-KR") : "-",
      ]);

      // 테이블 생성
      (doc as any).autoTable({
        head: [
          [
            "고객사",
            "선박명",
            "항구",
            "연료/수량",
            "배송일",
            "상태",
            "견적수",
            "최종가격",
            "거래처",
            "생성일",
          ],
        ],
        body: tableData,
        startY: 45,
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // 요약 통계
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      doc.setFontSize(10);
      doc.text(`총 ${deals.length}건의 딜`, 14, finalY + 10);

      const successCount = deals.filter((d: any) => d.status === "closed_success").length;
      const activeCount = deals.filter((d: any) => d.status === "active").length;
      doc.text(
        `성사: ${successCount}건 | 진행중: ${activeCount}건`,
        14,
        finalY + 16
      );

      // PDF 저장
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      doc.save(`deals_report_${timestamp}.pdf`);

      console.log("PDF 내보내기 완료");
    } catch (error) {
      console.error("PDF 내보내기 실패:", error);
      alert("PDF 내보내기에 실패했습니다.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={isExporting}
        className="flex items-center gap-1.5"
      >
        {isExporting && exportType === "csv" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        CSV 내보내기
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-1.5"
      >
        {isExporting && exportType === "pdf" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        PDF 내보내기
      </Button>
    </div>
  );
}