/**
 * AI Suggestions Tab
 * AI 제안 UI with FullContext Visualization
 */

"use client";

import { useSessionSuggestions, useApproveSuggestion, useRejectSuggestion } from "@/lib/api/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { AISuggestion, FullContextStatus } from "@/types";

interface AISuggestionsTabProps {
  sessionId: string;
}

export function AISuggestionsTab({ sessionId }: AISuggestionsTabProps) {
  const { data: suggestions, isLoading } = useSessionSuggestions(sessionId);
  const approveMutation = useApproveSuggestion();
  const rejectMutation = useRejectSuggestion();

  const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});
  const [customMessages, setCustomMessages] = useState<Record<number, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string[]>>({});  // suggestionId_optionNum -> targets

  if (isLoading) return <div>로딩 중...</div>;
  if (!suggestions || suggestions.length === 0) {
    return <div className="text-gray-500">AI 제안이 없습니다.</div>;
  }

  const getFullContextStatus = (suggestion: AISuggestion): FullContextStatus => {
    const context = suggestion.trading_context;
    return {
      vessel_name: context?.vessel_name ? "complete" : "missing",
      port: context?.port ? "complete" : "missing",
      delivery_date: (context?.delivery_date || context?.eta) ? "complete" : "missing",
      fuel_type: context?.fuel_type ? "complete" : "missing",
      quantity: context?.quantity ? "complete" : "missing",
    };
  };

  const handleApprove = async (suggestionId: number) => {
    const options = selectedOptions[suggestionId] || [];
    if (options.length === 0) {
      alert("최소 1개 옵션을 선택해주세요");
      return;
    }

    // 선택된 타겟 수집
    const targetsMap: Record<string, string[]> = {};
    options.forEach((optNum) => {
      const key = `${suggestionId}_${optNum}`;
      if (selectedTargets[key] !== undefined) {
        targetsMap[String(optNum)] = selectedTargets[key];
      }
    });

    try {
      await approveMutation.mutateAsync({
        suggestion_id: suggestionId,
        selected_options: options,
        selected_targets: Object.keys(targetsMap).length > 0 ? targetsMap : undefined,
      });
      alert("승인되었습니다");
    } catch (error) {
      alert("승인 실패: " + String(error));
    }
  };

  const handleReject = async (suggestionId: number) => {
    const reason = rejectionReasons[suggestionId] || null;

    try {
      await rejectMutation.mutateAsync({
        suggestion_id: suggestionId,
        rejection_reason: reason,
      });
      alert("거부되었습니다");
    } catch (error) {
      alert("거부 실패: " + String(error));
    }
  };

  const toggleOption = (suggestionId: number, optionNum: number) => {
    setSelectedOptions((prev) => {
      const current = prev[suggestionId] || [];
      if (current.includes(optionNum)) {
        return { ...prev, [suggestionId]: current.filter((n) => n !== optionNum) };
      } else {
        return { ...prev, [suggestionId]: [...current, optionNum] };
      }
    });
  };

  const toggleTarget = (suggestionId: number, optionNum: number, target: string) => {
    const key = `${suggestionId}_${optionNum}`;
    setSelectedTargets((prev) => {
      const current = prev[key] || [];
      if (current.includes(target)) {
        return { ...prev, [key]: current.filter((t) => t !== target) };
      } else {
        return { ...prev, [key]: [...current, target] };
      }
    });
  };

  const getSelectedTargets = (suggestionId: number, optionNum: number, defaultTargets: string[]) => {
    const key = `${suggestionId}_${optionNum}`;
    return selectedTargets[key] !== undefined ? selectedTargets[key] : defaultTargets;
  };

  const initializeTargets = (suggestionId: number, optionNum: number, targets: string[]) => {
    const key = `${suggestionId}_${optionNum}`;
    if (selectedTargets[key] === undefined) {
      setSelectedTargets((prev) => ({ ...prev, [key]: targets }));
    }
  };

  return (
    <div className="space-y-6">
      {suggestions.map((suggestion) => {
        const fullContextStatus = getFullContextStatus(suggestion);

        return (
          <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
            {/* FullContext 시각화 */}
            <div className="bg-gray-50 rounded p-3">
              <h4 className="text-xs font-medium mb-2">FullContext 상태</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(fullContextStatus).map(([key, status]) => (
                  <div
                    key={key}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      status === "complete"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {key.replace("_", " ")}
                  </div>
                ))}
              </div>
            </div>

            {/* 카테고리 및 확신도 */}
            <div className="flex items-center space-x-3">
              <Badge className="text-xs">{suggestion.category}</Badge>
              <span className="text-xs text-gray-500">
                확신도: {(suggestion.confidence * 100).toFixed(0)}%
              </span>
              <Badge variant={suggestion.status === "pending" ? "outline" : "secondary"} className="text-xs">
                {suggestion.status}
              </Badge>
            </div>

            {/* 원본 메시지 */}
            {suggestion.original_message && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                <p className="text-sm text-gray-700">{suggestion.original_message.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {suggestion.original_message.room_name} - {suggestion.original_message.sender}
                </p>
              </div>
            )}

            {/* AI 제안 옵션들 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">AI 제안 옵션</h4>
              {suggestion.suggestions.map((option) => {
                const targets = Array.isArray(option.targets)
                  ? option.targets.map((t: any) => typeof t === 'string' ? t : t.room || t)
                  : [];
                const currentTargets = getSelectedTargets(suggestion.id, option.option, targets);

                return (
                  <div
                    key={option.option}
                    className={`border rounded p-3 transition-colors ${
                      selectedOptions[suggestion.id]?.includes(option.option)
                        ? "bg-blue-50 border-blue-300"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedOptions[suggestion.id]?.includes(option.option) || false}
                        onChange={() => toggleOption(suggestion.id, option.option)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">옵션 {option.option}</span>
                          <Badge variant="outline" className="text-xs">{option.action}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1 whitespace-pre-wrap">{option.message}</p>

                        {/* 트레이더 개별 선택 (send_to_suppliers인 경우) */}
                        {option.action === "send_to_suppliers" && targets.length > 0 && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <p className="text-xs font-medium text-gray-600 mb-1">보낼 대상 선택:</p>
                            <div className="flex flex-wrap gap-1">
                              {targets.map((target: string) => (
                                <label
                                  key={target}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer ${
                                    currentTargets.includes(target)
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={currentTargets.includes(target)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleTarget(suggestion.id, option.option, target);
                                    }}
                                    className="mr-1"
                                  />
                                  {target}
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              선택됨: {currentTargets.length}/{targets.length}
                            </p>
                          </div>
                        )}

                        {/* 다른 액션의 경우 기존 대상 표시 */}
                        {option.action !== "send_to_suppliers" && targets.length > 0 && (
                          <p className="text-xs text-gray-500">
                            대상: {targets.join(", ")}
                          </p>
                        )}

                        <p className="text-xs text-gray-600 mt-1">이유: {option.reason}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 커스텀 옵션 */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium mb-1">커스텀 메시지 (직접 입력)</h4>
              <Input
                placeholder="직접 메시지를 작성하세요..."
                value={customMessages[suggestion.id] || ""}
                onChange={(e) =>
                  setCustomMessages((prev) => ({ ...prev, [suggestion.id]: e.target.value }))
                }
                className="text-sm"
              />
            </div>

            {/* 거부 이유 */}
            <div>
              <h4 className="text-sm font-medium mb-1">거부 이유 (선택사항)</h4>
              <Textarea
                placeholder="거부 이유를 입력하세요 (디버깅용)..."
                value={rejectionReasons[suggestion.id] || ""}
                onChange={(e) =>
                  setRejectionReasons((prev) => ({ ...prev, [suggestion.id]: e.target.value }))
                }
                rows={2}
                className="text-sm"
              />
            </div>

            {/* 승인/거부 버튼 */}
            {suggestion.status === "pending" && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleApprove(suggestion.id)}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-sm"
                  size="sm"
                >
                  승인
                </Button>
                <Button
                  onClick={() => handleReject(suggestion.id)}
                  disabled={rejectMutation.isPending}
                  variant="destructive"
                  size="sm"
                  className="text-sm"
                >
                  거부
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
