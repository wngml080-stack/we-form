"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Building2, Phone, User, Pencil, ChevronRight, ChevronDown, MapPin, Plus, Trash2, Dumbbell, Ruler, Calendar } from "lucide-react";

interface CompanyListProps {
  companies: any[];
  expandedCompanies: Set<string>;
  expandedGyms: Set<string>;
  companyGyms: Record<string, any[]>;
  gymStaffs: Record<string, any[]>;
  onToggleCompany: (id: string) => void;
  onToggleGym: (id: string) => void;
  onStatusChange: (companyId: string, newStatus: string, companyName: string) => void;
  onEditCompany: (e: any, comp: any) => void;
  onCreateGym: (e: any, companyId: string) => void;
  onEditGym: (e: any, gym: any, companyId: string) => void;
  onDeleteGym: (e: any, gymId: string, gymName: string, companyId: string) => void;
  onEditStaff: (e: any, staff: any, companyId: string) => void;
  onDeleteStaff: (e: any, staffId: string, staffName: string, gymId: string) => void;
  getRoleBadge: (role: string) => { label: string; color: string };
}

export function CompanyList({
  companies, expandedCompanies, expandedGyms, companyGyms, gymStaffs,
  onToggleCompany, onToggleGym, onStatusChange, onEditCompany,
  onCreateGym, onEditGym, onDeleteGym, onEditStaff, onDeleteStaff, getRoleBadge
}: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">등록된 고객사가 없습니다</p>
        <p className="text-sm text-gray-500 mt-1">새 고객사를 추가하거나 기존 데이터를 확인해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((comp) => {
        const isCompanyExpanded = expandedCompanies.has(comp.id);
        const gyms = companyGyms[comp.id] || [];

        return (
          <div key={comp.id} className="border rounded-lg bg-white shadow-sm">
            {/* 회사 헤더 */}
            <div
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                comp.status === 'active' ? 'border-l-[#2F80ED]' :
                comp.status === 'pending' ? 'border-l-[#F2994A]' : 'border-l-red-400'
              }`}
              onClick={() => onToggleCompany(comp.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {isCompanyExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  <div className={`p-1.5 rounded-lg ${
                    comp.status === 'active' ? 'bg-blue-100' :
                    comp.status === 'pending' ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    <Building className={`w-4 h-4 ${
                      comp.status === 'active' ? 'text-blue-600' :
                      comp.status === 'pending' ? 'text-orange-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{comp.name}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {comp.representative_name}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {comp.contact_phone || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={comp.status} onValueChange={(newStatus) => onStatusChange(comp.id, newStatus, comp.name)}>
                    <SelectTrigger
                      className={`w-[130px] h-9 ${
                        comp.status === 'active' ? 'bg-[#2F80ED] text-white border-[#2F80ED] hover:bg-[#1c6cd7]' :
                        comp.status === 'pending' ? 'bg-[#F2994A] text-black border-[#F2994A] hover:bg-[#d68238]' :
                        'bg-red-400 text-white border-red-400 hover:bg-red-500'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white" onClick={(e) => e.stopPropagation()}>
                      <SelectItem value="pending">승인대기</SelectItem>
                      <SelectItem value="active">운영중</SelectItem>
                      <SelectItem value="suspended">이용정지</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onEditCompany(e, comp)}>
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#2F80ED]"/>
                  </Button>
                </div>
              </div>
            </div>

            {/* 지점 목록 */}
            {isCompanyExpanded && (
              <div className="border-t bg-gray-50">
                <div className="p-3 border-b bg-white">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => onCreateGym(e, comp.id)}
                    className="w-full border-dashed border-2 hover:border-[#2F80ED] hover:text-[#2F80ED]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 지점 추가
                  </Button>
                </div>

                {gyms.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">등록된 지점이 없습니다.</div>
                ) : (
                  <div className="divide-y">
                    {gyms.map((gym) => {
                      const isGymExpanded = expandedGyms.has(gym.id);
                      const staffs = gymStaffs[gym.id] || [];

                      return (
                        <div key={gym.id}>
                          <div className="p-4 pl-12 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onToggleGym(gym.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {isGymExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                <div className="p-1 bg-emerald-100 rounded-lg">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{gym.name}</span>
                                    <Badge className={`text-xs ${
                                      gym.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                      gym.status === 'closed' ? 'bg-red-100 text-red-700 border-red-200' :
                                      'bg-orange-100 text-orange-700 border-orange-200'
                                    }`}>
                                      {gym.status === 'active' ? '운영중' : gym.status === 'closed' ? '폐업' : '이용중단'}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                    {gym.category && <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {gym.category}</span>}
                                    {gym.size && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {gym.size}평</span>}
                                    {gym.open_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {gym.open_date}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{staffs.length > 0 ? `${staffs.length}명` : '직원 보기'}</Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => onEditGym(e, gym, comp.id)}>
                                  <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-[#2F80ED]"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => onDeleteGym(e, gym.id, gym.name, comp.id)}>
                                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/>
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* 직원 목록 */}
                          {isGymExpanded && (
                            <div className="bg-white border-t">
                              {staffs.length === 0 ? (
                                <div className="p-6 pl-20 text-center text-gray-500 text-sm">등록된 직원이 없습니다.</div>
                              ) : (
                                <div className="divide-y">
                                  {staffs.map((staff) => {
                                    const roleBadge = getRoleBadge(staff.role);
                                    return (
                                      <div key={staff.id} className="p-3 pl-20 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className="p-1 bg-purple-100 rounded-lg">
                                              <User className="w-3.5 h-3.5 text-purple-600" />
                                            </div>
                                            <div>
                                              <div className="font-medium text-sm">{staff.name}</div>
                                              <div className="text-xs text-gray-500">{staff.email}</div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{staff.job_title}</span>
                                            <Badge className={`border-0 text-xs ${roleBadge.color}`}>{roleBadge.label}</Badge>
                                            <Badge
                                              variant="outline"
                                              className={`text-xs ${staff.employment_status === '재직' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                              {staff.employment_status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => onEditStaff(e, staff, comp.id)}>
                                              <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-[#2F80ED]"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => onDeleteStaff(e, staff.id, staff.name, gym.id)}>
                                              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/>
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
