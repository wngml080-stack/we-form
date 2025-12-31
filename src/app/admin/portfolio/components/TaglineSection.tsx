"use client";

import { useState } from "react";
import { Lightbulb, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Tagline {
  main: string;
  sub: string;
  tip: string;
}

interface TaglineSectionProps {
  tagline: Tagline;
  onUpdate?: (tagline: Tagline) => void;
}

export function TaglineSection({ tagline, onUpdate }: TaglineSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTagline, setEditedTagline] = useState(tagline);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedTagline);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTagline(tagline);
    setIsEditing(false);
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* 헤더 - 제목과 수정 버튼 */}
      <div className="flex items-center justify-between mb-4">
        {/* 메인 슬로건 */}
        {isEditing ? (
          <Input
            value={editedTagline.main}
            onChange={(e) => setEditedTagline({ ...editedTagline, main: e.target.value })}
            className="text-xl font-bold flex-1 mr-4"
            placeholder="메인 슬로건"
          />
        ) : (
          <h2 className="text-xl font-bold text-slate-900 flex-1">{(isEditing ? editedTagline : tagline).main}</h2>
        )}
        {onUpdate && (
          <div className="flex gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                수정
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 서브 텍스트 */}
      {isEditing ? (
        <Textarea
          value={editedTagline.sub}
          onChange={(e) => setEditedTagline({ ...editedTagline, sub: e.target.value })}
          className="text-sm mb-4 min-h-[60px]"
          placeholder="서브 텍스트"
        />
      ) : (
        <p className="text-sm text-slate-600 whitespace-pre-line mb-4">
          {(isEditing ? editedTagline : tagline).sub}
        </p>
      )}

      {/* 팁 */}
      {isEditing ? (
        <Input
          value={editedTagline.tip}
          onChange={(e) => setEditedTagline({ ...editedTagline, tip: e.target.value })}
          className="text-sm"
          placeholder="팁"
        />
      ) : (
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <span>
            {(isEditing ? editedTagline : tagline).tip}
          </span>
        </div>
      )}
    </div>
  );
}
