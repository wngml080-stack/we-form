"use client";

import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Building2, Phone, User, Pencil, ChevronRight, ChevronDown, MapPin, Plus, Trash2, Dumbbell, Ruler, Calendar, FileText } from "lucide-react";

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
      <div className="bg-white rounded-[32px] p-20 text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-slate-200" />
        </div>
        <p className="text-slate-900 font-black text-xl tracking-tight mb-2">등록된 고객사가 없습니다</p>
        <p className="text-slate-400 font-bold text-sm">새 고객사를 추가하여 서비스를 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {companies.map((comp) => {
        const isCompanyExpanded = expandedCompanies.has(comp.id);
        const gyms = companyGyms[comp.id] || [];

        return (
          <div key={comp.id} className="group bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-xl">
            {/* 회사 헤더 */}
            <div
              className={cn(
                "p-8 cursor-pointer transition-all duration-500 relative",
                isCompanyExpanded ? "bg-slate-50/50" : "hover:bg-slate-50/30"
              )}
              onClick={() => onToggleCompany(comp.id)}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6 flex-1">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 shadow-sm",
                    comp.status === 'active' ? 'bg-blue-50 text-blue-600' :
                    comp.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  )}>
                    <Building className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-slate-900 text-2xl tracking-tighter">{comp.name}</h3>
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        comp.status === 'active' ? 'bg-emerald-500' :
                        comp.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                      )}></div>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-xs font-bold tracking-tight">{comp.representative_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-xs font-bold tracking-tight">{comp.contact_phone ? formatPhoneNumber(comp.contact_phone) : "-"}</span>
                      </div>
                      {comp.business_number && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-bold tracking-tight">{comp.business_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1.5" onClick={e => e.stopPropagation()}>
                    <Select value={comp.status} onValueChange={(newStatus) => onStatusChange(comp.id, newStatus, comp.name)}>
                      <SelectTrigger
                        className={cn(
                          "w-[140px] h-10 border-none rounded-xl font-black text-[10px] tracking-widest shadow-sm",
                          comp.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                          comp.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl border-none shadow-2xl p-2">
                        <SelectItem value="pending" className="rounded-lg font-bold py-2.5">PENDING</SelectItem>
                        <SelectItem value="active" className="rounded-lg font-bold py-2.5">ACTIVE</SelectItem>
                        <SelectItem value="suspended" className="rounded-lg font-bold py-2.5">SUSPENDED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all" onClick={(e) => onEditCompany(e, comp)}>
                      <Pencil className="w-4 h-4"/>
                    </Button>
                    <div className={cn("transition-transform duration-500", isCompanyExpanded ? "rotate-180" : "")}>
                      <ChevronDown className="w-6 h-6 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 지점 및 직원 목록 */}
            {isCompanyExpanded && (
              <div className="border-t border-slate-50 bg-slate-50/30 p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                <Button
                  onClick={(e) => onCreateGym(e, comp.id)}
                  className="w-full h-14 bg-white border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all font-black"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  새 지점 추가하기
                </Button>

                {gyms.length === 0 ? (
                  <div className="py-12 text-center text-slate-300 font-bold text-sm bg-white rounded-2xl border border-gray-100 border-dashed">등록된 지점이 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {gyms.map((gym) => {
                      const isGymExpanded = expandedGyms.has(gym.id);
                      const staffs = gymStaffs[gym.id] || [];

                      return (
                        <div key={gym.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                          <div className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => onToggleGym(gym.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", gym.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                  <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900 text-lg tracking-tight">{gym.name}</span>
                                    <Badge className={cn("font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md border-none", 
                                      gym.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                      gym.status === 'closed' ? 'bg-rose-100 text-rose-700' :
                                      'bg-amber-100 text-amber-700'
                                    )}>
                                      {(gym.status === 'active' ? 'operating' : gym.status === 'closed' ? 'closed' : 'suspended').toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    {gym.category && <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold"><Dumbbell className="w-3 h-3 text-slate-300" /> {gym.category}</div>}
                                    {gym.size && <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold"><Ruler className="w-3 h-3 text-slate-300" /> {gym.size}평</div>}
                                    {gym.open_date && <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold"><Calendar className="w-3 h-3 text-slate-300" /> {gym.open_date} OPEN</div>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className="bg-slate-50 text-slate-500 border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">
                                  {staffs.length} Staffs
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all" onClick={(e) => onEditGym(e, gym, comp.id)}>
                                    <Pencil className="w-3.5 h-3.5"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" onClick={(e) => onDeleteGym(e, gym.id, gym.name, comp.id)}>
                                    <Trash2 className="w-3.5 h-3.5"/>
                                  </Button>
                                  <div className={cn("transition-transform duration-300 ml-1", isGymExpanded ? "rotate-180" : "")}>
                                    <ChevronDown className="w-5 h-5 text-slate-300" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 직원 목록 */}
                          {isGymExpanded && (
                            <div className="bg-slate-50/30 border-t border-slate-50 divide-y divide-white">
                              {staffs.length === 0 ? (
                                <div className="p-8 text-center text-slate-300 font-bold text-xs">등록된 직원이 없습니다.</div>
                              ) : (
                                staffs.map((staff) => {
                                  const roleBadge = getRoleBadge(staff.role);
                                  return (
                                    <div key={staff.id} className="p-4 pl-20 hover:bg-white transition-all duration-300 group/staff">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm text-sm font-black text-slate-400 group-hover/staff:border-blue-200 group-hover/staff:text-blue-600 transition-all">
                                            {staff.name[0]}
                                          </div>
                                          <div>
                                            <div className="font-black text-slate-900 text-sm tracking-tight">{staff.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400">{staff.email}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{staff.job_title}</span>
                                            <Badge className={cn("font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md border-none", roleBadge.color)}>
                                              {roleBadge.label.toUpperCase()}
                                            </Badge>
                                            <Badge className={cn("font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md border-none", staff.employment_status === '재직' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500')}>
                                              {staff.employment_status === '재직' ? 'ACTIVE' : 'LEFT'}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover/staff:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white text-slate-400 hover:text-blue-600 shadow-sm" onClick={(e) => onEditStaff(e, staff, comp.id)}>
                                              <Pencil className="w-3 h-3"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white text-slate-400 hover:text-rose-600 shadow-sm" onClick={(e) => onDeleteStaff(e, staff.id, staff.name, gym.id)}>
                                              <Trash2 className="w-3 h-3"/>
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
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
