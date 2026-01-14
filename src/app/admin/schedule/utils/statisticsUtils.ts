// 월별 통계 계산 유틸리티

export interface MonthlyStats {
  PT: number;
  OT: number;
  Consulting: number;
  GX: number;
  Personal: number;
  Other: number;
  completed: number;
  no_show_deducted: number;
  no_show: number;
  service: number;
  unregistered: number;
  unregisteredList: any[];
  total: number;
  totalHours: number;
  ptStats: {
    total: number;
    completed: number;
    no_show_deducted: number;
    no_show: number;
    service: number;
    cancelled: number;
    attendanceRate: number;
  };
  otStats: {
    total: number;
    completed: number;
    no_show: number;
    cancelled: number;
    converted: number;
  };
  consultingStats: {
    total: number;
    sales: number;
    info: number;
    status: number;
    other: number;
  };
  personalStats: {
    total: number;
    meal: number;
    conference: number;
    meeting: number;
    rest: number;
    workout: number;
    other: number;
  };
  dailyStats: Record<string, {
    date: string;
    PT: { 
      count: number; 
      hours: number;
      inside: number;
      outside: number;
      weekend: number;
      service: number;
    };
    OT: { 
      count: number; 
      hours: number;
      ot: number;
      inbody: number;
    };
    Consulting: { count: number; hours: number };
    GX: { count: number; hours: number };
    Personal: { 
      count: number; 
      hours: number;
      inside: number;
      outside: number;
    };
    Other: { count: number; hours: number };
    total: { count: number; hours: number };
  }>;
}

export function calculateMonthlyStats(allSchedules: any[], selectedDate: string): MonthlyStats {
  const current = new Date(selectedDate);
  const targetYear = current.getFullYear();
  const targetMonth = current.getMonth();

  const monthlySchedules = allSchedules.filter(s => {
    const d = new Date(s.start_time);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  // 실제로 완료된(또는 정산 대상인) 수업만 통계에 포함
  const completedSchedules = monthlySchedules.filter(s => 
    s.status === 'completed' || s.status === 'no_show_deducted' || s.status === 'service'
  );

  const unregistered = monthlySchedules.filter(s => !s.status);

  const stats: MonthlyStats = {
    PT: 0,
    OT: 0,
    Consulting: 0,
    GX: 0,
    Personal: 0,
    Other: 0,
    completed: completedSchedules.filter(s => s.status === 'completed').length,
    no_show_deducted: completedSchedules.filter(s => s.status === 'no_show_deducted').length,
    no_show: monthlySchedules.filter(s => s.status === 'no_show').length,
    service: completedSchedules.filter(s => s.status === 'service').length,
    unregistered: unregistered.length,
    unregisteredList: unregistered,
    total: completedSchedules.length,
    totalHours: 0,
    ptStats: { total: 0, completed: 0, no_show_deducted: 0, no_show: 0, service: 0, cancelled: 0, attendanceRate: 0 },
    otStats: { total: 0, completed: 0, no_show: 0, cancelled: 0, converted: 0 },
    consultingStats: { total: 0, sales: 0, info: 0, status: 0, other: 0 },
    personalStats: { total: 0, meal: 0, conference: 0, meeting: 0, rest: 0, workout: 0, other: 0 },
    dailyStats: {}
  };

  monthlySchedules.forEach(s => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const dateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

    if (!stats.dailyStats[dateKey]) {
      stats.dailyStats[dateKey] = {
        date: dateKey,
        PT: { count: 0, hours: 0, inside: 0, outside: 0, weekend: 0, service: 0 },
        OT: { count: 0, hours: 0, ot: 0, inbody: 0 },
        Consulting: { count: 0, hours: 0 },
        GX: { count: 0, hours: 0 },
        Personal: { count: 0, hours: 0, inside: 0, outside: 0 },
        Other: { count: 0, hours: 0 },
        total: { count: 0, hours: 0 }
      };
    }

    const scheduleType = (s.type || '').toLowerCase();
    const scheduleStatus = s.status || '';
    const scheduleSubKind = s.schedule_type || ''; // inside, outside, weekend, holiday
    const subType = (s.sub_type || s.title || '').toLowerCase();

    // 리포트용 일자별 통계에는 완료된 건만 집계 (Personal 제외)
    const isCompletedForReport = ['completed', 'no_show_deducted', 'service'].includes(scheduleStatus);

    if (scheduleType === 'pt') {
      stats.ptStats.total++;
      if (scheduleStatus === 'completed') stats.ptStats.completed++;
      else if (scheduleStatus === 'no_show_deducted') stats.ptStats.no_show_deducted++;
      else if (scheduleStatus === 'no_show') stats.ptStats.no_show++;
      else if (scheduleStatus === 'service') stats.ptStats.service++;
      else if (scheduleStatus === 'cancelled') stats.ptStats.cancelled++;

      if (isCompletedForReport) {
        stats.PT++;
        stats.dailyStats[dateKey].PT.count++;
        stats.dailyStats[dateKey].PT.hours += durationHours;
        
        if (scheduleStatus === 'service') {
          stats.dailyStats[dateKey].PT.service++;
        } else if (scheduleSubKind === 'inside') {
          stats.dailyStats[dateKey].PT.inside++;
        } else if (scheduleSubKind === 'outside') {
          stats.dailyStats[dateKey].PT.outside++;
        } else if (scheduleSubKind === 'weekend' || scheduleSubKind === 'holiday') {
          stats.dailyStats[dateKey].PT.weekend++;
        }

        stats.dailyStats[dateKey].total.count++;
        stats.dailyStats[dateKey].total.hours += durationHours;
        stats.totalHours += durationHours;
      }
    } else if (scheduleType === 'ot') {
      stats.otStats.total++;
      if (scheduleStatus === 'completed') stats.otStats.completed++;
      else if (scheduleStatus === 'no_show') stats.otStats.no_show++;
      else if (scheduleStatus === 'cancelled') stats.otStats.cancelled++;
      else if (scheduleStatus === 'converted' || subType.includes('pt전환')) stats.otStats.converted++;

      if (isCompletedForReport) {
        stats.OT++;
        stats.dailyStats[dateKey].OT.count++;
        stats.dailyStats[dateKey].OT.hours += durationHours;

        if (s.inbody_checked) {
          stats.dailyStats[dateKey].OT.inbody++;
        } else {
          stats.dailyStats[dateKey].OT.ot++;
        }

        stats.dailyStats[dateKey].total.count++;
        stats.dailyStats[dateKey].total.hours += durationHours;
        stats.totalHours += durationHours;
      }
    } else if (scheduleType === 'consulting' || scheduleType === '상담') {
      stats.consultingStats.total++;
      if (subType.includes('세일즈') || subType.includes('sales')) stats.consultingStats.sales++;
      else if (subType.includes('안내') || subType.includes('info')) stats.consultingStats.info++;
      else if (subType.includes('현황') || subType.includes('status')) stats.consultingStats.status++;
      else stats.consultingStats.other++;

      if (isCompletedForReport) {
        stats.Consulting++;
        stats.dailyStats[dateKey].Consulting.count++;
        stats.dailyStats[dateKey].Consulting.hours += durationHours;

        stats.dailyStats[dateKey].total.count++;
        stats.dailyStats[dateKey].total.hours += durationHours;
        stats.totalHours += durationHours;
      }
    } else if (scheduleType === 'gx') {
      if (isCompletedForReport) {
        stats.GX++;
        stats.dailyStats[dateKey].GX.count++;
        stats.dailyStats[dateKey].GX.hours += durationHours;

        stats.dailyStats[dateKey].total.count++;
        stats.dailyStats[dateKey].total.hours += durationHours;
        stats.totalHours += durationHours;
      }
    } else if (scheduleType === '개인' || scheduleType === 'personal') {
      // 개인 일정은 상태에 관계없이 집계 (보통 자동 완료됨)
      stats.Personal++;
      stats.dailyStats[dateKey].Personal.count++;
      stats.dailyStats[dateKey].Personal.hours += durationHours;

      if (scheduleSubKind === 'inside') {
        stats.dailyStats[dateKey].Personal.inside += durationHours;
      } else if (scheduleSubKind === 'outside') {
        stats.dailyStats[dateKey].Personal.outside += durationHours;
      }

      stats.personalStats.total++;
      if (subType.includes('점심') || subType.includes('lunch') || subType.includes('식사') || subType.includes('meal')) stats.personalStats.meal++;
      else if (subType.includes('회의') || subType.includes('conference')) stats.personalStats.conference++;
      else if (subType.includes('미팅') || subType.includes('meeting')) stats.personalStats.meeting++;
      else if (subType.includes('휴식') || subType.includes('rest') || subType.includes('휴게')) stats.personalStats.rest++;
      else if (subType.includes('운동') || subType.includes('workout') || subType.includes('헬스')) stats.personalStats.workout++;
      else stats.personalStats.other++;

      // 개인 일정은 total count/hours에는 포함하되, 주 수업 통계에서는 분리
      stats.dailyStats[dateKey].total.count++;
      stats.dailyStats[dateKey].total.hours += durationHours;
      stats.totalHours += durationHours;
    } else {
      if (isCompletedForReport) {
        stats.Other++;
        stats.dailyStats[dateKey].Other.count++;
        stats.dailyStats[dateKey].Other.hours += durationHours;

        stats.dailyStats[dateKey].total.count++;
        stats.dailyStats[dateKey].total.hours += durationHours;
        stats.totalHours += durationHours;
      }
    }
  });

  // PT 출석률 계산
  if (stats.ptStats.total > 0) {
    const attended = stats.ptStats.completed + stats.ptStats.service;
    stats.ptStats.attendanceRate = Math.round((attended / stats.ptStats.total) * 100);
  }

  return stats;
}

// 스케줄에 세션 정보 추가 (PT/OT)
export function enrichSchedulesWithSessionInfo(allSchedules: any[], memberMemberships: Record<string, any[]>): any[] {
  const memberSchedules: Record<string, { pt: any[]; ot: any[] }> = {};

  allSchedules.forEach(s => {
    if (!s.member_id) return;
    const type = (s.type || '').toLowerCase();
    if (type !== 'pt' && type !== 'ot') return;

    if (!memberSchedules[s.member_id]) {
      memberSchedules[s.member_id] = { pt: [], ot: [] };
    }
    if (type === 'pt') {
      memberSchedules[s.member_id].pt.push(s);
    } else if (type === 'ot') {
      memberSchedules[s.member_id].ot.push(s);
    }
  });

  // 회차 차감되는 상태만: completed, no_show_deducted (service는 차감 없음)
  const isCompleted = (status: string) => status === 'completed' || status === 'no_show_deducted';

  Object.values(memberSchedules).forEach(({ pt, ot }) => {
    pt.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    let ptSessionCount = 0;
    pt.forEach((schedule) => {
      const membership = memberMemberships[schedule.member_id]?.find(
        (m: any) => m.name?.toLowerCase().includes('pt')
      );
      if (membership) {
        schedule.total_sessions = membership.total_sessions;
      }

      if (isCompleted(schedule.status)) {
        ptSessionCount++;
        schedule.session_number = ptSessionCount;
      } else {
        schedule.session_number = ptSessionCount + 1;
        schedule.is_not_completed = true;
      }
    });

    ot.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    let otSessionCount = 0;
    ot.forEach((schedule) => {
      if (isCompleted(schedule.status)) {
        otSessionCount++;
        schedule.session_number = otSessionCount;
      } else {
        schedule.session_number = otSessionCount + 1;
        schedule.is_not_completed = true;
      }
    });
  });

  return allSchedules;
}

// 회차로 카운트되는 수업인지 확인 (실제 차감되는 수업만)
// completed, no_show_deducted만 차감 / service, no_show, cancelled는 차감 없음
export function isCompletedSession(status: string): boolean {
  return status === 'completed' || status === 'no_show_deducted';
}

// 특정 회원의 PT/OT 회차 계산
export function getSessionNumber(
  schedules: any[],
  memberId: string,
  scheduleType: 'pt' | 'ot',
  scheduleId?: string
): number {
  const type = scheduleType.toLowerCase();
  const memberSchedules = schedules
    .filter(s => s.member_id === memberId && (s.type || '').toLowerCase() === type)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  if (scheduleId) {
    const scheduleIndex = memberSchedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex < 0) return 1;

    let completedBefore = 0;
    for (let i = 0; i < scheduleIndex; i++) {
      if (isCompletedSession(memberSchedules[i].status)) {
        completedBefore++;
      }
    }
    return completedBefore + 1;
  }

  const completedCount = memberSchedules.filter(s => isCompletedSession(s.status)).length;
  return completedCount + 1;
}
