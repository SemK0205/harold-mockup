/**
 * FullContext Settings Page V2
 * Display deal stages and field definitions (read-only reference)
 */

"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  DealStage
} from "@/types";
import {
  STAGE_REQUIREMENTS,
  FIELD_DEFINITIONS,
  INQUIRY_FULLCONTEXT,
  QUOTE_FULLCONTEXT,
  QUESTION_TEMPLATES,
  getNextPossibleStages,
  isTerminalStage
} from "@/lib/fullcontext/config";

export default function FullContextSettingsPage() {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['inquiry']));

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  const stages: DealStage[] = [
    'inquiry',
    'deal_started',
    'quote_collecting',
    'renegotiating',
    'customer_feedback',
    'seller_feedback',
    'no_offer',
    'lost',
    'deal_done'
  ];

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">FullContext Configuration</h1>
        <p className="text-gray-500 mt-1">
          Deal stages and field definitions reference
        </p>
      </div>

      {/* Deal Flow Diagram */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Deal Flow
          </CardTitle>
          <CardDescription>
            inquiry → deal_started → quote_collecting → customer_feedback/seller_feedback → deal_done/lost/no_offer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {stages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <Badge className={DEAL_STAGE_COLORS[stage]}>
                  {DEAL_STAGE_LABELS[stage]}
                </Badge>
                {index < stages.length - 1 && !isTerminalStage(stage) && (
                  <span className="text-gray-400">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Stage Requirements</h2>

        {stages.map((stageName) => {
          const stage = STAGE_REQUIREMENTS[stageName];
          const nextStages = getNextPossibleStages(stageName);

          return (
            <Card key={stageName}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleStage(stageName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedStages.has(stageName) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <CardTitle className="text-lg">{stage.label}</CardTitle>
                    <Badge className={DEAL_STAGE_COLORS[stageName]}>
                      {stageName}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Required: {stage.required.length}
                    </Badge>
                    <Badge variant="outline">
                      Optional: {stage.optional.length}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{stage.description}</CardDescription>
              </CardHeader>

              {expandedStages.has(stageName) && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Required Fields */}
                    <div>
                      <h4 className="font-semibold mb-3 text-red-600">Required Fields</h4>
                      <div className="space-y-2">
                        {stage.required.length === 0 ? (
                          <p className="text-sm text-gray-400">None</p>
                        ) : (
                          stage.required.map(fieldName => {
                            const field = FIELD_DEFINITIONS[fieldName];
                            return (
                              <div
                                key={fieldName}
                                className="flex items-center justify-between p-2 bg-red-50 rounded"
                              >
                                <span>{field?.label || fieldName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {field?.type || 'text'}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">Optional Fields</h4>
                      <div className="space-y-2">
                        {stage.optional.length === 0 ? (
                          <p className="text-sm text-gray-400">None</p>
                        ) : (
                          stage.optional.map(fieldName => {
                            const field = FIELD_DEFINITIONS[fieldName];
                            return (
                              <div
                                key={fieldName}
                                className="flex items-center justify-between p-2 bg-green-50 rounded"
                              >
                                <span>{field?.label || fieldName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {field?.type || 'text'}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Next Stages */}
                  {nextStages.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2 text-blue-600">Next Possible Stages</h4>
                      <div className="flex gap-2">
                        {nextStages.map(nextStage => (
                          <Badge key={nextStage} className={DEAL_STAGE_COLORS[nextStage]}>
                            {DEAL_STAGE_LABELS[nextStage]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Inquiry Types Reference */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Inquiry Types</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(INQUIRY_FULLCONTEXT).map(([type, def]) => (
                <div key={type} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Required: {def.required.join(', ')}
                  </div>
                  {def.format && (
                    <div className="text-xs text-blue-600 mt-1 font-mono">
                      {def.format}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote Types Reference */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Quote Types</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(QUOTE_FULLCONTEXT).map(([type, def]) => (
                <div key={type} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Required: {def.required.join(', ')}
                  </div>
                  <div className="text-xs text-purple-600 mt-1 font-mono">
                    {def.format}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Templates */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Question Templates</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(QUESTION_TEMPLATES).map(([field, template]) => (
                <div key={field} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{field}</div>
                  <div className="text-xs mt-1">
                    <span className="text-gray-500">KO:</span> {template.ko}
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">EN:</span> {template.en}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
