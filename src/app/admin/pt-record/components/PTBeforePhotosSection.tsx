"use client";

import { useState } from "react";
import { Camera, Plus, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PTFormData, PTBeforePhoto } from "../types";

interface Props {
  formData: PTFormData;
  updateFormData: <K extends keyof PTFormData>(key: K, value: PTFormData[K]) => void;
}

export function PTBeforePhotosSection({ formData, updateFormData }: Props) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const addPhoto = () => {
    const newPhoto: PTBeforePhoto = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      photoUrl: "",
      note: "",
    };
    updateFormData("beforePhotos", [...formData.beforePhotos, newPhoto]);
  };

  const updatePhoto = (id: string, key: keyof PTBeforePhoto, value: string) => {
    updateFormData(
      "beforePhotos",
      formData.beforePhotos.map((photo) =>
        photo.id === id ? { ...photo, [key]: value } : photo
      )
    );
  };

  const deletePhoto = (id: string) => {
    if (confirm("이 사진을 삭제하시겠습니까?")) {
      updateFormData(
        "beforePhotos",
        formData.beforePhotos.filter((photo) => photo.id !== id)
      );
      // Clean up preview URL
      const newPreviewUrls = { ...previewUrls };
      delete newPreviewUrls[id];
      setPreviewUrls(newPreviewUrls);
    }
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrls((prev) => ({ ...prev, [id]: dataUrl }));
        updatePhoto(id, "photoUrl", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-gray-900">비포 사진</h3>
          <span className="text-sm text-gray-500">({formData.beforePhotos.length}장)</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPhoto}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          사진 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formData.beforePhotos.length === 0 ? (
          <div className="col-span-full bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">아직 등록된 비포 사진이 없습니다.</p>
            <p className="text-gray-400 text-xs mt-1">위의 &quot;사진 추가&quot; 버튼을 클릭하여 사진을 등록하세요.</p>
          </div>
        ) : (
          formData.beforePhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-cyan-50 border border-cyan-200 rounded-xl overflow-hidden"
            >
              {/* 사진 미리보기 영역 */}
              <div className="relative aspect-[4/3] bg-gray-100">
                {previewUrls[photo.id] || photo.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrls[photo.id] || photo.photoUrl}
                    alt="비포 사진"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm">사진을 선택하세요</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => deletePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 사진 정보 입력 */}
              <div className="p-3 space-y-3 bg-white">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">사진 선택</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(photo.id, e.target.files?.[0] || null)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">촬영 날짜</Label>
                  <Input
                    type="date"
                    value={photo.date}
                    onChange={(e) => updatePhoto(photo.id, "date", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">메모</Label>
                  <Input
                    type="text"
                    value={photo.note}
                    onChange={(e) => updatePhoto(photo.id, "note", e.target.value)}
                    placeholder="예: 정면, 측면, 후면"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
