"use client";

import { useState } from "react";
import { CheckSquare, Square, Edit2, Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Recommendation {
  id: string;
  label: string;
  checked: boolean;
}

interface RecommendationSectionProps {
  recommendations: Recommendation[];
  onUpdate?: (recommendations: Recommendation[]) => void;
}

export function RecommendationSection({
  recommendations,
  onUpdate,
}: RecommendationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecommendations, setEditedRecommendations] = useState(recommendations);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedRecommendations);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRecommendations(recommendations);
    setIsEditing(false);
  };

  const handleAddRecommendation = () => {
    const newId = String(Date.now());
    setEditedRecommendations([...editedRecommendations, { id: newId, label: "", checked: false }]);
  };

  const handleRemoveRecommendation = (index: number) => {
    const updated = editedRecommendations.filter((_, i) => i !== index);
    setEditedRecommendations(updated);
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="text-xl">✅</span>
          이런 분들에게 추천해요!
        </h2>
        {onUpdate && (
          <div className="flex gap-2">
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

      {/* 체크리스트 */}
      <div className="space-y-3">
        {(isEditing ? editedRecommendations : recommendations).map((item, index) => (
          <div key={item.id} className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const updated = [...editedRecommendations];
                    updated[index] = { ...updated[index], label: e.target.value };
                    setEditedRecommendations(updated);
                  }}
                  className="text-sm flex-1 h-8"
                  placeholder="추천 항목을 입력하세요"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveRecommendation(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <label className="flex items-center gap-3 cursor-pointer group flex-1">
                {item.checked ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                )}
                <span className="text-sm text-slate-700">
                  {item.label.split(/(\S+)/).map((part, idx) => {
                    const keywords = ["효과가", "반복되는", "불균형이", "고민인"];
                    const isKeyword = keywords.some((kw) => part.includes(kw));
                    return isKeyword ? (
                      <span key={idx} className="underline decoration-2 underline-offset-2">
                        {part}
                      </span>
                    ) : (
                      part
                    );
                  })}
                </span>
              </label>
            )}
          </div>
        ))}
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddRecommendation}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            추가
          </Button>
        )}
      </div>
    </div>
  );
}
