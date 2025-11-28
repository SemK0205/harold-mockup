/**
 * Add Inquiry Modal - 인쿼리 수동 추가
 * 이메일/전화 등으로 받은 인쿼리를 직접 추가
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

interface AddInquiryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (sessionId: string) => void;
}

export function AddInquiryModal({ open, onClose, onSuccess }: AddInquiryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [port, setPort] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fuelType2, setFuelType2] = useState("");
  const [quantity2, setQuantity2] = useState("");
  const [fuelType3, setFuelType3] = useState("");
  const [quantity3, setQuantity3] = useState("");
  const [originalInquiry, setOriginalInquiry] = useState("");

  const resetForm = () => {
    setCustomerName("");
    setVesselName("");
    setPort("");
    setDeliveryDate("");
    setFuelType("");
    setQuantity("");
    setFuelType2("");
    setQuantity2("");
    setFuelType3("");
    setQuantity3("");
    setOriginalInquiry("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setError("고객/선주 이름은 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          vessel_name: vesselName.trim() || null,
          port: port.trim() || null,
          delivery_date: deliveryDate.trim() || null,
          fuel_type: fuelType.trim() || null,
          quantity: quantity.trim() || null,
          fuel_type2: fuelType2.trim() || null,
          quantity2: quantity2.trim() || null,
          fuel_type3: fuelType3.trim() || null,
          quantity3: quantity3.trim() || null,
          original_inquiry: originalInquiry.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "인쿼리 추가에 실패했습니다.");
      }

      const data = await response.json();
      console.log("Manual inquiry created:", data);

      resetForm();
      onClose();
      onSuccess?.(data.session_id);
    } catch (err) {
      console.error("Error creating manual inquiry:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            인쿼리 수동 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 고객/선주 이름 (필수) */}
          <div>
            <Label htmlFor="customerName" className="text-sm font-medium">
              고객/선주 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="예: 오리온, 지성쉬핑"
              className="mt-1"
            />
          </div>

          {/* 선박명 */}
          <div>
            <Label htmlFor="vesselName" className="text-sm font-medium">
              선박명
            </Label>
            <Input
              id="vesselName"
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              placeholder="예: MT SEANERGY"
              className="mt-1"
            />
          </div>

          {/* 포트 + ETA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="port" className="text-sm font-medium">
                Port
              </Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="예: BUSAN, YEOSU"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="deliveryDate" className="text-sm font-medium">
                ETA
              </Label>
              <Input
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                placeholder="예: 12-15 DEC"
                className="mt-1"
              />
            </div>
          </div>

          {/* 유종 1 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fuelType" className="text-sm font-medium">
                유종 1
              </Label>
              <Input
                id="fuelType"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                placeholder="예: VLSFO, LSMGO"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                수량 1
              </Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="예: 500MT"
                className="mt-1"
              />
            </div>
          </div>

          {/* 유종 2 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fuelType2" className="text-sm font-medium">
                유종 2
              </Label>
              <Input
                id="fuelType2"
                value={fuelType2}
                onChange={(e) => setFuelType2(e.target.value)}
                placeholder="예: LSMGO"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quantity2" className="text-sm font-medium">
                수량 2
              </Label>
              <Input
                id="quantity2"
                value={quantity2}
                onChange={(e) => setQuantity2(e.target.value)}
                placeholder="예: 100MT"
                className="mt-1"
              />
            </div>
          </div>

          {/* 유종 3 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fuelType3" className="text-sm font-medium">
                유종 3
              </Label>
              <Input
                id="fuelType3"
                value={fuelType3}
                onChange={(e) => setFuelType3(e.target.value)}
                placeholder="선택사항"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quantity3" className="text-sm font-medium">
                수량 3
              </Label>
              <Input
                id="quantity3"
                value={quantity3}
                onChange={(e) => setQuantity3(e.target.value)}
                placeholder="선택사항"
                className="mt-1"
              />
            </div>
          </div>

          {/* 원본 인쿼리 텍스트 */}
          <div>
            <Label htmlFor="originalInquiry" className="text-sm font-medium">
              원본 인쿼리 (선택)
            </Label>
            <Textarea
              id="originalInquiry"
              value={originalInquiry}
              onChange={(e) => setOriginalInquiry(e.target.value)}
              placeholder="이메일/전화로 받은 원본 내용을 입력하세요..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "추가 중..." : "인쿼리 추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
