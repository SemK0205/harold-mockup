/**
 * Quick Reply Buttons Component
 * 빠른 응답 버튼 - 채팅 입력창 상단에 표시
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { quickReplyAPI, type QuickReplyTemplate } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { Zap, Loader2 } from "lucide-react";

interface QuickReplyButtonsProps {
  roomName: string;
  platform?: string;
  onSend?: (text: string) => void;
  className?: string;
}

export function QuickReplyButtons({
  roomName,
  platform,
  onSend,
  className,
}: QuickReplyButtonsProps) {
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);

  // 템플릿 로드
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await quickReplyAPI.getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch quick reply templates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // 빠른 응답 전송
  const handleSend = async (template: QuickReplyTemplate) => {
    if (!roomName) return;

    setSending(template.id);
    try {
      const result = await quickReplyAPI.send(roomName, template.template_text);
      if (result.success) {
        onSend?.(template.template_text);
      }
    } catch (error) {
      console.error("Failed to send quick reply:", error);
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground text-sm", className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>빠른 응답 로딩...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <Zap className="w-3.5 h-3.5 text-yellow-500 mr-1" />
      {templates.map((template) => (
        <Button
          key={template.id}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-normal hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => handleSend(template)}
          disabled={sending !== null}
        >
          {sending === template.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            template.template_text
          )}
        </Button>
      ))}
    </div>
  );
}
