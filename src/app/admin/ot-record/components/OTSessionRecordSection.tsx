"use client";

import { useState } from "react";
import { CalendarDays, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OTFormData, OTSessionRecord } from "../types";

interface Props {
  formData: OTFormData;
  updateFormData: <K extends keyof OTFormData>(key: K, value: OTFormData[K]) => void;
}

const dayOfWeekOptions = ["월", "화", "수", "목", "금", "토", "일"];

export function OTSessionRecordSection({ formData, updateFormData }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addSession = () => {
    const newSession: OTSessionRecord = {
      id: Date.now().toString(),
      sessionNumber: formData.sessionRecords.length + 1,
      date: new Date().toISOString().split("T")[0],
      dayOfWeek: "",
      completed: false,
      exerciseContent: "",
      trainerMemo: "",
    };
    updateFormData("sessionRecords", [...formData.sessionRecords, newSession]);
    setExpandedId(newSession.id);
  };

  const updateSession = (id: string, key: keyof OTSessionRecord, value: string | number | boolean) => {
    updateFormData(
      "sessionRecords",
      formData.sessionRecords.map((session) =>
        session.id === id ? { ...session, [key]: value } : session
      )
    );
  };

  const deleteSession = (id: string) => {
    if (confirm("이 수업 기록을 삭제하시겠습니까?")) {
      updateFormData(
        "sessionRecords",
        formData.sessionRecords.filter((session) => session.id !== id)
      );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 날짜에서 요일 자동 추출
  const getDayOfWeek = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  const handleDateChange = (id: string, dateStr: string) => {
    const dayOfWeek = getDayOfWeek(dateStr);
    updateFormData(
      "sessionRecords",
      formData.sessionRecords.map((session) =>
        session.id === id ? { ...session, date: dateStr, dayOfWeek } : session
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-gray-900">5. OT 회차별 수업 기록</h3>
          <span className="text-sm text-gray-500">({formData.sessionRecords.length}회)</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSession}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          회차 추가
        </Button>
      </div>

      <div className="space-y-3">
        {formData.sessionRecords.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <CalendarDays className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">아직 기록된 OT 수업이 없습니다.</p>
            <p className="text-gray-400 text-xs mt-1">위의 &quot;회차 추가&quot; 버튼을 클릭하여 수업 기록을 시작하세요.</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-blue-100 text-sm font-medium text-gray-700 border-b border-blue-200">
              <div className="col-span-2">OT수업</div>
              <div className="col-span-1 text-center">진행</div>
              <div className="col-span-4">운동 내용</div>
              <div className="col-span-4">트레이너 메모</div>
              <div className="col-span-1"></div>
            </div>

            {/* 테이블 바디 */}
            {formData.sessionRecords.map((session, index) => (
              <div key={session.id} className="border-b border-blue-100 last:border-b-0">
                {/* 요약 행 */}
                <div
                  className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-blue-100/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(session.id)}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
                      {session.sessionNumber || index + 1}
                    </span>
                    <div className="text-sm">
                      <span className="font-medium text-gray-800">
                        {session.date || "날짜 미설정"}
                      </span>
                      {session.dayOfWeek && (
                        <span className="text-gray-500 ml-1">({session.dayOfWeek})</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={session.completed}
                      onCheckedChange={(checked) => updateSession(session.id, "completed", !!checked)}
                    />
                  </div>

                  <div className="col-span-4 text-sm text-gray-600 truncate">
                    {session.exerciseContent || "운동 내용 없음"}
                  </div>

                  <div className="col-span-4 text-sm text-gray-600 truncate">
                    {session.trainerMemo || "메모 없음"}
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedId === session.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* 확장된 상세 입력 */}
                {expandedId === session.id && (
                  <div className="p-4 bg-white border-t border-blue-200 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm text-gray-600">날짜</Label>
                        <Input
                          type="date"
                          value={session.date}
                          onChange={(e) => handleDateChange(session.id, e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-gray-600">요일</Label>
                        <select
                          value={session.dayOfWeek}
                          onChange={(e) => updateSession(session.id, "dayOfWeek", e.target.value)}
                          className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm"
                        >
                          <option value="">선택</option>
                          {dayOfWeekOptions.map((day) => (
                            <option key={day} value={day}>{day}요일</option>
                          ))}
                        </select>
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
                        placeholder="수업 중 진행한 운동 내용을 기록하세요 (예: 스쿼트 3세트x12회, 런지 3세트x10회)"
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm text-gray-600">트레이너 메모 (특이사항, 주의사항)</Label>
                      <Textarea
                        value={session.trainerMemo}
                        onChange={(e) => updateSession(session.id, "trainerMemo", e.target.value)}
                        placeholder="수업 중 특이사항이나 주의사항을 기록하세요"
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
