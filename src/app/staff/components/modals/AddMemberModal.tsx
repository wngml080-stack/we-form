"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, X, User, Phone, Search, Info, PlusCircle, CheckCircle2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewMemberData {
  name: string;
  phone: string;
  memo: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Option 1: Object-based props
  newMemberData?: NewMemberData;
  setNewMemberData?: (data: NewMemberData) => void;
  // Option 2: Individual props (backward compatibility)
  newMemberName?: string;
  setNewMemberName?: (name: string) => void;
  newMemberPhone?: string;
  setNewMemberPhone?: (phone: string) => void;
  onSubmit: () => void;
  isSearchingMembers?: boolean;
  memberSearchResults?: any[];
  onSelectExistingMember?: (member: any) => void;
  searchMembers?: (query: string) => void;
}

export function AddMemberModal({
  isOpen, onOpenChange,
  newMemberData,
  setNewMemberData,
  newMemberName: propName,
  setNewMemberName: propSetName,
  newMemberPhone: propPhone,
  setNewMemberPhone: propSetPhone,
  onSubmit,
  isSearchingMembers = false,
  memberSearchResults = [],
  onSelectExistingMember,
  searchMembers
}: AddMemberModalProps) {
  // Handle both object-based and individual props
  const newMemberName = newMemberData?.name ?? propName ?? '';
  const newMemberPhone = newMemberData?.phone ?? propPhone ?? '';

  const setNewMemberName = (name: string) => {
    if (setNewMemberData) {
      setNewMemberData({ name, phone: newMemberPhone, memo: newMemberData?.memo ?? '' });
    } else if (propSetName) {
      propSetName(name);
    }
  };

  const setNewMemberPhone = (phone: string) => {
    if (setNewMemberData) {
      setNewMemberData({ name: newMemberName, phone, memo: newMemberData?.memo ?? '' });
    } else if (propSetPhone) {
      propSetPhone(phone);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-8 py-6 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <DialogTitle className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">회원 추가</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Add New Member</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">새로운 회원을 등록합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group z-10"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#f8fafc]">
          {/* 검색 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-700">회원 검색</h3>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="이름 또는 전화번호로 검색"
                onChange={(e) => searchMembers?.(e.target.value)}
                className="h-14 pl-12 bg-white border-2 border-transparent focus:border-blue-100 rounded-2xl font-bold shadow-sm transition-all"
              />
            </div>

            {memberSearchResults.length > 0 && (
              <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {memberSearchResults.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onSelectExistingMember?.(member)}
                      className="w-full px-5 py-4 flex items-center gap-4 hover:bg-blue-50/50 transition-colors text-left border-b border-slate-50 last:border-none group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-black text-slate-900">{member.name}</span>
                          <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">{member.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f8fafc] px-4 font-black text-slate-400 tracking-widest">OR REGISTER NEW</span>
            </div>
          </div>

          {/* 직접 입력 섹션 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                <PlusCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900">새 회원 정보 입력</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="회원 이름"
                    className="h-11 pl-10 bg-slate-50 border-none rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="h-11 pl-10 bg-slate-50 border-none rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                신규 회원은 현재 지점에 자동으로 소속됩니다. 등록 후 회원 상세 페이지에서 추가 정보를 입력할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-white border-t flex items-center justify-end flex-shrink-0">
          <Button
            onClick={onSubmit}
            className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all gap-2"
          >
            신규 회원으로 등록하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
