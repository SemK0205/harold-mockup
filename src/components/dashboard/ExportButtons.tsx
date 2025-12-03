/**
 * ExportButtons Component
 * CSV/PDF export buttons
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/api/client";

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
        `${getApiUrl()}/deals/export/csv?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename or set default
      const contentDisposition = response.headers["content-disposition"];
      const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `deals_export_${Date.now()}.csv`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("CSV export completed");
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("Failed to export CSV.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType("pdf");

    try {
      // PDF generation logic (client-side)
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      // Fetch data from API
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.port) params.append("port", filters.port);
      if (filters.customer) params.append("customer", filters.customer);

      const response = await axios.get(
        `${getApiUrl()}/deals/scoreboard?${params.toString()}`
      );

      const deals = response.data.data || [];

      // Generate PDF
      const doc = new jsPDF({ orientation: "landscape" });

      // Title
      doc.setFontSize(18);
      doc.text("Deal Scoreboard Report", 14, 20);

      // Generated date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, 14, 30);

      // Filter info
      const filterText = [];
      if (filters.status) filterText.push(`Status: ${filters.status}`);
      if (filters.port) filterText.push(`Port: ${filters.port}`);
      if (filters.customer) filterText.push(`Customer: ${filters.customer}`);
      if (filterText.length > 0) {
        doc.text(`Filters: ${filterText.join(", ")}`, 14, 36);
      }

      // Prepare table data
      const tableData = deals.map((deal: any) => [
        deal.customer_room_name || "-",
        deal.vessel_name || "-",
        deal.port || "-",
        deal.fuel_type && deal.quantity ? `${deal.fuel_type} ${deal.quantity}` : "-",
        deal.delivery_date || "-",
        deal.status === "active"
          ? "Active"
          : deal.status === "quoted"
          ? "Quoted"
          : deal.status === "negotiating"
          ? "Negotiating"
          : deal.status === "closed_success"
          ? "Success"
          : deal.status === "closed_lost"
          ? "Failed"
          : "Cancelled",
        deal.total_quotes_received || 0,
        deal.final_price ? `$${deal.final_price.toLocaleString()}` : "-",
        deal.selected_trader || "-",
        deal.created_at ? new Date(deal.created_at).toLocaleDateString("en-US") : "-",
      ]);

      // Generate table
      (doc as any).autoTable({
        head: [
          [
            "Customer",
            "Vessel",
            "Port",
            "Fuel/Qty",
            "ETA",
            "Status",
            "Quotes",
            "Final Price",
            "Trader",
            "Created",
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

      // Summary statistics
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      doc.setFontSize(10);
      doc.text(`Total ${deals.length} deals`, 14, finalY + 10);

      const successCount = deals.filter((d: any) => d.status === "closed_success").length;
      const activeCount = deals.filter((d: any) => d.status === "active").length;
      doc.text(
        `Success: ${successCount} | Active: ${activeCount}`,
        14,
        finalY + 16
      );

      // Save PDF
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      doc.save(`deals_report_${timestamp}.pdf`);

      console.log("PDF export completed");
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF.");
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
        Export CSV
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
        Export PDF
      </Button>
    </div>
  );
}
