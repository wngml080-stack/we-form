"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Calendar, User, Building2 } from "lucide-react";
import { HqGym, HqStaff } from "../hooks/useHqData";

type GymWithStaffs = HqGym & {
  staffs?: HqStaff[];
};

interface GymListProps {
  gyms: GymWithStaffs[];
  onCreateClick: () => void;
  onGymDetailClick: (gym: GymWithStaffs) => void;
  onEditClick: (gym: GymWithStaffs) => void;
  onDeleteClick: (gymId: string) => void;
  getCategoryColor: (cat: string) => string;
}

export function GymList({
  gyms,
  onCreateClick,
  onGymDetailClick,
  onEditClick,
  onDeleteClick,
  getCategoryColor
}: GymListProps) {
  return (
    <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-md transition-all duration-500">
      <div className="bg-white px-8 py-6 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">운영 중인 센터</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Branch Operations</p>
          </div>
          <Badge className="ml-2 bg-blue-50 text-blue-600 border-none font-black text-xs px-3 py-1 rounded-lg">
            {gyms.length}개 지점
          </Badge>
        </div>
        <Button
          onClick={onCreateClick}
          className="bg-blue-600 text-white hover:bg-blue-700 font-black h-11 px-6 rounded-xl transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="mr-2 h-5 w-5" /> 지점 생성
        </Button>
      </div>
      <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {gyms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
            <Building2 className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-bold text-sm text-center">등록된 지점이 없습니다.</p>
          </div>
        ) : (
          gyms.map((gym) => {
            const manager = gym.staffs?.find((s) => s.role === 'admin') || gym.staffs?.[0];
            const categories = gym.category ? gym.category.split(", ") : [];

            return (
              <div key={gym.id} className="group border border-gray-100 rounded-[24px] p-6 hover:shadow-xl hover:border-blue-100 transition-all duration-500 bg-slate-50/50 hover:bg-white relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex-1 cursor-pointer" onClick={() => onGymDetailClick(gym)}>
                    <div className="flex items-center gap-3 flex-wrap mb-4">
                      <h4 className="font-black text-slate-900 text-xl tracking-tighter group-hover:text-blue-600 transition-colors">{gym.name}</h4>
                      <div className="flex gap-1.5">
                        {categories.map((cat: string) => (
                          <Badge key={cat} className={cn("font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md border-none", getCategoryColor(cat))}>
                            {cat.toUpperCase()}
                          </Badge>
                        ))}
                        {gym.status === 'pending' && (
                          <Badge className="bg-amber-500 text-white font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md border-none">PENDING</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-slate-500 bg-white/50 p-2 rounded-xl border border-gray-100/50">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold tracking-tight">{gym.size || '-'}평</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 bg-white/50 p-2 rounded-xl border border-gray-100/50">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold tracking-tight">{gym.open_date || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 bg-white/50 p-2 rounded-xl border border-gray-100/50">
                        <User className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-bold tracking-tight">{manager?.name || '미정'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all" onClick={(e) => { e.stopPropagation(); onEditClick(gym); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all" onClick={(e) => { e.stopPropagation(); onDeleteClick(gym.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {gym.memo && (
                  <div className="mt-5 text-xs bg-white/80 border border-gray-100 p-4 rounded-xl text-slate-500 font-medium leading-relaxed shadow-inner">
                    <div className="flex items-center gap-2 mb-1 opacity-40">
                      <div className="w-1 h-3 bg-slate-300 rounded-full"></div>
                      <span className="font-black text-[10px] tracking-widest uppercase">Memo</span>
                    </div>
                    {gym.memo}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
