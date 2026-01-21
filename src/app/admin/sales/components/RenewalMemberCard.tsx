"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, User, MessageCircle } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils/phone-format";
import type { RenewalMember, ExpiryType, ActivityStatus } from "../types/renewal";
import {
  getExpiryType,
  getDday,
  activityStatusLabels,
  activityStatusColors,
} from "../utils/renewal";

interface RenewalMemberCardProps {
  member: RenewalMember;
  onAddActivity: (memberId: string, activityNum: 1 | 2 | 3 | 4) => void;
  onEditActivity: (memberId: string, activityNum: 1 | 2 | 3 | 4) => void;
}

// 만기 분류 뱃지 색상
function getExpiryTypeBadge(type: ExpiryType) {
  switch (type) {
    case "this_month":
      return (
        <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px]">
          당월만기
        </Badge>
      );
    case "next_month":
      return (
        <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[10px]">
          익월만기
        </Badge>
      );
    case "after_next_month":
      return (
        <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px]">
          익월이외
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-slate-200 text-slate-500 border-none font-black text-[10px]">
          만료자
        </Badge>
      );
  }
}

// 현재 활동 상태 계산
function getCurrentActivityStatus(
  member: RenewalMember
): { label: string; color: string } {
  if (member.activity4?.content) {
    return { label: "4차 완료", color: "bg-emerald-100 text-emerald-600" };
  }
  if (member.activity3?.content) {
    return { label: "3차 완료", color: "bg-blue-100 text-blue-600" };
  }
  if (member.activity2?.content) {
    return { label: "2차 완료", color: "bg-amber-100 text-amber-600" };
  }
  if (member.activity1?.content) {
    return { label: "1차 완료", color: "bg-violet-100 text-violet-600" };
  }
  return { label: "미연락", color: "bg-slate-100 text-slate-500" };
}

export function RenewalMemberCard({
  member,
  onAddActivity,
  onEditActivity,
}: RenewalMemberCardProps) {
  const expiryType = getExpiryType(member.endDate);
  const dday = getDday(member.endDate);
  const activityStatus = getCurrentActivityStatus(member);
  const nextActivityNum = getNextActivityNum(member);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
            {member.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-900 text-sm">{member.name}</p>
              {getExpiryTypeBadge(expiryType)}
            </div>
            <p className="text-xs font-bold text-slate-400">
              {member.membershipName}
            </p>
          </div>
        </div>
        <div className={`text-sm font-black ${dday.color}`}>{dday.text}</div>
      </div>

      {/* 정보 */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone className="w-3.5 h-3.5" />
          <span className="font-bold">{formatPhoneNumber(member.phone)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span className="font-bold">만료: {member.endDate}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3.5 h-3.5" />
          <span className="font-bold">{member.trainerName}</span>
        </div>
      </div>

      {/* 활동 상태 */}
      <div className="flex items-center justify-between">
        <Badge className={`${activityStatus.color} border-none font-black text-[10px]`}>
          {activityStatus.label}
        </Badge>

        {nextActivityNum && (
          <Button
            onClick={() => onAddActivity(member.id, nextActivityNum)}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            {nextActivityNum}차 기록
          </Button>
        )}
      </div>

      {/* 최근 활동 기록 */}
      {member.activity1 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
            최근 활동
          </p>
          <p className="text-xs text-slate-600 font-bold line-clamp-2">
            {getLatestActivity(member)?.content}
          </p>
          {getLatestActivity(member)?.status && (
            <Badge
              className={`${
                activityStatusColors[getLatestActivity(member)!.status!]
              } border-none font-bold text-[9px] mt-1`}
            >
              {activityStatusLabels[getLatestActivity(member)!.status!]}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// 다음 활동 번호 계산
function getNextActivityNum(member: RenewalMember): 1 | 2 | 3 | 4 | null {
  if (!member.activity1) return 1;
  if (!member.activity2) return 2;
  if (!member.activity3) return 3;
  if (!member.activity4) return 4;
  return null;
}

// 최근 활동 가져오기
function getLatestActivity(member: RenewalMember) {
  if (member.activity4) return member.activity4;
  if (member.activity3) return member.activity3;
  if (member.activity2) return member.activity2;
  if (member.activity1) return member.activity1;
  return null;
}
