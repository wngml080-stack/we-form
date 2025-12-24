"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Pencil, Activity, Clock, MapPin, Calendar, User } from "lucide-react";
import { Activity as ActivityType } from "../hooks/useHqData";

interface StaffManagementProps {
  allStaffs: any[];
  selectedGymFilter: string;
  onEditClick: (staff: any) => void;
  pendingStaffs: any[];
  recentActivities: ActivityType[];
  formatDate: (value?: string | null) => string;
}

export function StaffManagement({
  allStaffs,
  selectedGymFilter,
  onEditClick,
  pendingStaffs,
  recentActivities,
  formatDate
}: StaffManagementProps) {
  const filteredStaffs = selectedGymFilter === "all"
    ? allStaffs
    : allStaffs.filter(s => s.gym_id === selectedGymFilter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 직원 재직 현황 관리 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">직원 재직 현황</h3>
            </div>
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {filteredStaffs.length}명
            </span>
          </div>
        </div>
        <div className="p-6">
          {filteredStaffs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">등록된 직원이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredStaffs.map((staff: any) => {
                const gymName = staff.gyms?.name || '미배정';
                const roleText = staff.role === 'admin' ? '관리자' : staff.role === 'company_admin' ? '본사 관리자' : '직원';
                const statusColor = staff.employment_status === '재직' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                   staff.employment_status === '퇴사' ? 'bg-red-50 text-red-700 border-red-200' :
                                   'bg-gray-50 text-gray-700 border-gray-200';

                return (
                  <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">{staff.name}</span>
                          <Badge variant="outline" className={`text-xs ${statusColor}`}>
                            {staff.employment_status || '재직'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{staff.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => onEditClick(staff)}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2 border border-gray-200">
                        <div className="text-gray-600 mb-0.5">소속</div>
                        <div className="font-medium text-gray-900">{gymName}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 border border-gray-200">
                        <div className="text-gray-600 mb-0.5">직책</div>
                        <div className="font-medium text-gray-900">{staff.job_title || '-'}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 border border-gray-200">
                        <div className="text-gray-600 mb-0.5">권한</div>
                        <div className="font-medium text-gray-900">{roleText}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">최근 활동</h3>
          </div>
        </div>
        <div className="p-6">
          {recentActivities.length === 0 && pendingStaffs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">최근 활동이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {pendingStaffs.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-amber-100 rounded-lg">
                      <Clock className="w-3 h-3 text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-900">발령 대기</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {pendingStaffs.length}명의 직원이 발령을 기다리고 있습니다
                  </p>
                </div>
              )}
              {recentActivities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{activity.name}</span>
                    <Badge variant="outline" className={`text-xs border-0 ${activity.badgeColor}`}>
                      {activity.activityType}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {activity.gymName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(activity.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> 직책: {activity.jobTitle}
                      </span>
                      <span>•</span>
                      <span>권한: {activity.roleText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
