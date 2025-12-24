"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Calendar, User, Building2 } from "lucide-react";

interface GymListProps {
  gyms: any[];
  onCreateClick: () => void;
  onGymDetailClick: (gym: any) => void;
  onEditClick: (gym: any) => void;
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">운영 중인 센터</h3>
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {gyms.length}개
            </span>
          </div>
        </div>
        <Button
          onClick={onCreateClick}
          size="sm"
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          <Plus className="mr-1 h-4 w-4" /> 지점 생성
        </Button>
      </div>
      <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
        {gyms.map((gym) => {
          const manager = gym.staffs?.find((s: any) => s.role === 'admin') || gym.staffs?.[0];
          const categories = gym.category ? gym.category.split(", ") : [];

          return (
            <div key={gym.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => onGymDetailClick(gym)}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-gray-900">{gym.name}</span>
                    {categories.map((cat: string) => (
                      <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>{cat}</Badge>
                    ))}
                    {gym.status === 'pending' && <Badge className="bg-amber-500">승인대기</Badge>}
                  </div>
                  <div className="text-xs text-gray-600 flex gap-3 items-center flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {gym.size || '-'}평
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {gym.open_date || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {manager?.name || '미정'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onEditClick(gym); }}>
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onDeleteClick(gym.id); }}>
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
              {gym.memo && (
                <div className="mt-3 text-xs bg-gray-50 border-l-2 border-gray-300 p-2 rounded text-gray-600">
                  {gym.memo}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
