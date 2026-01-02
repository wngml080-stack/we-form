"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PTFormData, PTSessionRecord } from "../types";

interface Props {
  formData: PTFormData;
  updateFormData: <K extends keyof PTFormData>(key: K, value: PTFormData[K]) => void;
}

export function PTSessionRecordSection({ formData, updateFormData }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addSession = () => {
    const newSession: PTSessionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      sessionNumber: formData.sessionRecords.length + 1,
      exerciseContent: "",
      trainerNote: "",
      memberFeedback: "",
    };
    updateFormData("sessionRecords", [...formData.sessionRecords, newSession]);
    setExpandedId(newSession.id);
  };

  const updateSession = (id: string, key: keyof PTSessionRecord, value: string | number) => {
    updateFormData(
      "sessionRecords",
      formData.sessionRecords.map((session) =>
        session.id === id ? { ...session, [key]: value } : session
      )
    );
  };

  const deleteSession = (id: string) => {
    if (confirm("이 세션 기록을 삭제하시겠습니까?")) {
      updateFormData(
        "sessionRecords",
        formData.sessionRecords.filter((session) => session.id !== id)
      );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-gray-900">세션 상세 기록</h3>
          <span className="text-sm text-gray-500">({formData.sessionRecords.length}개)</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSession}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          세션 추가
        </Button>
      </div>

      <div className="space-y-3">
        {formData.sessionRecords.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">아직 기록된 세션이 없습니다.</p>
            <p className="text-gray-400 text-xs mt-1">위의 &quot;세션 추가&quot; 버튼을 클릭하여 기록을 시작하세요.</p>
          </div>
        ) : (
          formData.sessionRecords.map((session, index) => (
            <div
              key={session.id}
              className="bg-pink-50 border border-pink-200 rounded-xl overflow-hidden"
            >
              {/* 세션 헤더 */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-pink-100/50 transition-colors"
                onClick={() => toggleExpand(session.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-pink-500 text-white text-sm font-medium flex items-center justify-center">
                    {session.sessionNumber || index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">
                      {session.sessionNumber || index + 1}회차 세션
                    </p>
                    <p className="text-xs text-gray-500">{session.date || "날짜 미설정"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === session.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* 세션 상세 (펼침) */}
              {expandedId === session.id && (
                <div className="border-t border-pink-200 p-4 space-y-4 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-gray-600">날짜</Label>
                      <Input
                        type="date"
                        value={session.date}
                        onChange={(e) => updateSession(session.id, "date", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-gray-600">회차</Label>
                      <Input
                        type="number"
                        min="1"
                        value={session.sessionNumber || ""}
                        onChange={(e) => updateSession(session.id, "sessionNumber", parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600">운동 내용</Label>
                    <Textarea
                      value={session.exerciseContent}
                      onChange={(e) => updateSession(session.id, "exerciseContent", e.target.value)}
                      placeholder="오늘 진행한 운동 내용을 기록하세요"
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600">트레이너 메모</Label>
                    <Textarea
                      value={session.trainerNote}
                      onChange={(e) => updateSession(session.id, "trainerNote", e.target.value)}
                      placeholder="회원에 대한 메모나 다음 세션 계획"
                      className="min-h-[60px] resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600">회원 피드백</Label>
                    <Textarea
                      value={session.memberFeedback}
                      onChange={(e) => updateSession(session.id, "memberFeedback", e.target.value)}
                      placeholder="회원의 피드백이나 컨디션"
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
