/**
 * FullContext 설정 관리 페이지
 * 필드, 단계, 질문 템플릿을 편집할 수 있는 UI
 */

"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  type FullContextConfig,
  type FieldDefinition,
  type SessionPhase,
  type QuestionTemplate,
  getFullContextConfig,
  saveFullContextConfig,
  resetFullContextConfig,
  DEFAULT_FULLCONTEXT_CONFIG
} from "@/lib/fullcontext/config";

export default function FullContextSettingsPage() {
  const [config, setConfig] = useState<FullContextConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['deal_inquiry']));
  const [editingField, setEditingField] = useState<string | null>(null);

  // 초기 로드
  useEffect(() => {
    setConfig(getFullContextConfig());
  }, []);

  const handleSave = () => {
    if (config) {
      saveFullContextConfig(config);
      setHasChanges(false);
      alert('설정이 저장되었습니다.');
    }
  };

  const handleReset = () => {
    if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
      resetFullContextConfig();
      setConfig(DEFAULT_FULLCONTEXT_CONFIG);
      setHasChanges(false);
    }
  };

  const updateConfig = (updates: Partial<FullContextConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
    setHasChanges(true);
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phase)) {
        newSet.delete(phase);
      } else {
        newSet.add(phase);
      }
      return newSet;
    });
  };

  if (!config) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">FullContext 설정</h1>
          <p className="text-gray-500 mt-1">
            단계별 필수/선택 필드와 질문 템플릿을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </div>
      </div>

      {/* 변경사항 알림 */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            저장되지 않은 변경사항이 있습니다.
          </p>
        </div>
      )}

      {/* 탭 */}
      <Tabs defaultValue="phases">
        <TabsList className="mb-6">
          <TabsTrigger value="phases">단계별 설정</TabsTrigger>
          <TabsTrigger value="fields">필드 관리</TabsTrigger>
          <TabsTrigger value="questions">질문 템플릿</TabsTrigger>
        </TabsList>

        {/* 단계별 설정 탭 */}
        <TabsContent value="phases">
          <div className="space-y-4">
            {Object.entries(config.phases).map(([phaseName, phase]) => (
              <Card key={phaseName}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => togglePhase(phaseName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expandedPhases.has(phaseName) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <CardTitle className="text-lg">{phase.label}</CardTitle>
                      <Badge variant="secondary">{phaseName}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        필수: {phase.required.length}개
                      </Badge>
                      <Badge variant="outline">
                        선택: {phase.optional.length}개
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{phase.description}</CardDescription>
                </CardHeader>

                {expandedPhases.has(phaseName) && (
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {/* 필수 필드 */}
                      <div>
                        <h4 className="font-semibold mb-3 text-red-600">필수 필드</h4>
                        <div className="space-y-2">
                          {phase.required.map(fieldName => (
                            <div
                              key={fieldName}
                              className="flex items-center justify-between p-2 bg-red-50 rounded"
                            >
                              <span>{config.fields[fieldName]?.label || fieldName}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newRequired = phase.required.filter(f => f !== fieldName);
                                  const newOptional = [...phase.optional, fieldName];
                                  updateConfig({
                                    phases: {
                                      ...config.phases,
                                      [phaseName]: {
                                        ...phase,
                                        required: newRequired,
                                        optional: newOptional
                                      }
                                    }
                                  });
                                }}
                              >
                                선택으로 이동
                              </Button>
                            </div>
                          ))}

                          {/* 필드 추가 */}
                          <select
                            className="w-full p-2 border rounded text-sm"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const fieldName = e.target.value;
                                updateConfig({
                                  phases: {
                                    ...config.phases,
                                    [phaseName]: {
                                      ...phase,
                                      required: [...phase.required, fieldName],
                                      optional: phase.optional.filter(f => f !== fieldName)
                                    }
                                  }
                                });
                              }
                            }}
                          >
                            <option value="">필수 필드 추가...</option>
                            {Object.keys(config.fields)
                              .filter(f => !phase.required.includes(f) && !phase.optional.includes(f))
                              .map(fieldName => (
                                <option key={fieldName} value={fieldName}>
                                  {config.fields[fieldName].label}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* 선택 필드 */}
                      <div>
                        <h4 className="font-semibold mb-3 text-green-600">선택 필드</h4>
                        <div className="space-y-2">
                          {phase.optional.map(fieldName => (
                            <div
                              key={fieldName}
                              className="flex items-center justify-between p-2 bg-green-50 rounded"
                            >
                              <span>{config.fields[fieldName]?.label || fieldName}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newOptional = phase.optional.filter(f => f !== fieldName);
                                    const newRequired = [...phase.required, fieldName];
                                    updateConfig({
                                      phases: {
                                        ...config.phases,
                                        [phaseName]: {
                                          ...phase,
                                          required: newRequired,
                                          optional: newOptional
                                        }
                                      }
                                    });
                                  }}
                                >
                                  필수로 이동
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    updateConfig({
                                      phases: {
                                        ...config.phases,
                                        [phaseName]: {
                                          ...phase,
                                          optional: phase.optional.filter(f => f !== fieldName)
                                        }
                                      }
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          {/* 필드 추가 */}
                          <select
                            className="w-full p-2 border rounded text-sm"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const fieldName = e.target.value;
                                updateConfig({
                                  phases: {
                                    ...config.phases,
                                    [phaseName]: {
                                      ...phase,
                                      optional: [...phase.optional, fieldName]
                                    }
                                  }
                                });
                              }
                            }}
                          >
                            <option value="">선택 필드 추가...</option>
                            {Object.keys(config.fields)
                              .filter(f => !phase.required.includes(f) && !phase.optional.includes(f))
                              .map(fieldName => (
                                <option key={fieldName} value={fieldName}>
                                  {config.fields[fieldName].label}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 필드 관리 탭 */}
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>필드 목록</CardTitle>
                <Button
                  onClick={() => {
                    const fieldName = prompt('새 필드 이름 (영문, 언더스코어)');
                    if (fieldName && !config.fields[fieldName]) {
                      updateConfig({
                        fields: {
                          ...config.fields,
                          [fieldName]: {
                            name: fieldName,
                            label: fieldName,
                            type: 'text'
                          }
                        }
                      });
                      setEditingField(fieldName);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  필드 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(config.fields).map(([fieldName, field]) => (
                  <div
                    key={fieldName}
                    className="border rounded-lg p-4"
                  >
                    {editingField === fieldName ? (
                      <FieldEditor
                        field={field}
                        onSave={(updated) => {
                          updateConfig({
                            fields: {
                              ...config.fields,
                              [fieldName]: updated
                            }
                          });
                          setEditingField(null);
                        }}
                        onCancel={() => setEditingField(null)}
                      />
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{field.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <code className="text-xs text-gray-500">{fieldName}</code>
                          </div>
                          {field.description && (
                            <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                          )}
                          {field.options && (
                            <div className="mt-2 flex gap-1">
                              {field.options.map(opt => (
                                <Badge key={opt} variant="secondary" className="text-xs">
                                  {opt}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingField(fieldName)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('이 필드를 삭제하시겠습니까?')) {
                                const { [fieldName]: _, ...rest } = config.fields;
                                updateConfig({ fields: rest });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 질문 템플릿 탭 */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>질문 템플릿</CardTitle>
              <CardDescription>
                각 필드별 구매자/판매자 질문을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(config.questions).map(([fieldName, question]) => (
                  <div key={fieldName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {config.fields[fieldName]?.label || fieldName}
                        </span>
                        <Badge variant="outline">우선순위: {question.priority}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-blue-600">구매자 질문</label>
                        <Input
                          value={question.buyerQuestion}
                          onChange={(e) => {
                            updateConfig({
                              questions: {
                                ...config.questions,
                                [fieldName]: {
                                  ...question,
                                  buyerQuestion: e.target.value
                                }
                              }
                            });
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-green-600">판매자 질문</label>
                        <Input
                          value={question.sellerQuestion}
                          onChange={(e) => {
                            updateConfig({
                              questions: {
                                ...config.questions,
                                [fieldName]: {
                                  ...question,
                                  sellerQuestion: e.target.value
                                }
                              }
                            });
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 필드 편집기 컴포넌트
interface FieldEditorProps {
  field: FieldDefinition;
  onSave: (field: FieldDefinition) => void;
  onCancel: () => void;
}

function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const [editedField, setEditedField] = useState(field);
  const [optionsText, setOptionsText] = useState(field.options?.join(', ') || '');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">라벨</label>
          <Input
            value={editedField.label}
            onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">타입</label>
          <select
            className="w-full p-2 border rounded"
            value={editedField.type}
            onChange={(e) => setEditedField({
              ...editedField,
              type: e.target.value as FieldDefinition['type']
            })}
          >
            <option value="text">텍스트</option>
            <option value="number">숫자</option>
            <option value="date">날짜</option>
            <option value="select">선택</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">설명</label>
        <Input
          value={editedField.description || ''}
          onChange={(e) => setEditedField({ ...editedField, description: e.target.value })}
        />
      </div>
      {editedField.type === 'select' && (
        <div>
          <label className="text-sm font-medium">옵션 (쉼표로 구분)</label>
          <Input
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder="옵션1, 옵션2, 옵션3"
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          취소
        </Button>
        <Button
          size="sm"
          onClick={() => {
            const updated = {
              ...editedField,
              options: editedField.type === 'select'
                ? optionsText.split(',').map(s => s.trim()).filter(Boolean)
                : undefined
            };
            onSave(updated);
          }}
        >
          <Check className="h-4 w-4 mr-1" />
          저장
        </Button>
      </div>
    </div>
  );
}