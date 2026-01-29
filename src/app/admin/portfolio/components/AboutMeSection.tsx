"use client";

import { useState } from "react";
import Image from "next/image";
import { Phone, Instagram, FileText, MapPin, Trophy, Edit2, Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Certification {
  title: string;
  icon: string;
}

interface CareerHistoryItem {
  period: string;
  content: string;
}

interface AboutMeSectionProps {
  name: string;
  contact: string;
  instagram: string;
  blog: string;
  location: string;
  certifications: Certification[];
  specialties: string[];
  careerHistory: CareerHistoryItem[];
  imageUrl?: string;
  onImageChange?: (imageUrl: string) => void;
  onUpdate?: (data: {
    contact: string;
    instagram: string;
    blog: string;
    location: string;
    certifications: Certification[];
    specialties: string[];
    careerHistory: CareerHistoryItem[];
  }) => void;
}

export function AboutMeSection({
  name,
  contact,
  instagram,
  blog,
  location,
  certifications,
  specialties,
  careerHistory,
  imageUrl,
  onImageChange,
  onUpdate,
}: AboutMeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("About Me");
  const [editedContact, setEditedContact] = useState(contact);
  const [editedInstagram, setEditedInstagram] = useState(instagram);
  const [editedBlog, setEditedBlog] = useState(blog);
  const [editedLocation, setEditedLocation] = useState(location);
  const [editedCertifications, setEditedCertifications] = useState(certifications);
  const [editedSpecialties, setEditedSpecialties] = useState(specialties);
  const [editedCareerHistory, setEditedCareerHistory] = useState(careerHistory);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        contact: editedContact,
        instagram: editedInstagram,
        blog: editedBlog,
        location: editedLocation,
        certifications: editedCertifications,
        specialties: editedSpecialties,
        careerHistory: editedCareerHistory,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle("About Me");
    setEditedContact(contact);
    setEditedInstagram(instagram);
    setEditedBlog(blog);
    setEditedLocation(location);
    setEditedCertifications(certifications);
    setEditedSpecialties(specialties);
    setEditedCareerHistory(careerHistory);
    setIsEditing(false);
  };

  const handleAddCertification = () => {
    setEditedCertifications([...editedCertifications, { title: "", icon: "trophy" }]);
  };

  const handleRemoveCertification = (index: number) => {
    const updated = editedCertifications.filter((_, i) => i !== index);
    setEditedCertifications(updated);
  };

  const handleAddSpecialty = () => {
    setEditedSpecialties([...editedSpecialties, ""]);
  };

  const handleRemoveSpecialty = (index: number) => {
    const updated = editedSpecialties.filter((_, i) => i !== index);
    setEditedSpecialties(updated);
  };

  const handleAddCareerHistory = () => {
    setEditedCareerHistory([...editedCareerHistory, { period: "", content: "" }]);
  };

  const handleRemoveCareerHistory = (index: number) => {
    const updated = editedCareerHistory.filter((_, i) => i !== index);
    setEditedCareerHistory(updated);
  };
  return (
    <div className="space-y-6">
      {/* 프로필 헤더 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">💪</span>
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold h-10 flex-1 max-w-md"
                placeholder="제목을 입력하세요"
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900">{editedTitle}</h2>
            )}
          </div>
          {onUpdate && (
            <div className="flex gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  수정
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 프로필 이미지와 기본 정보 */}
        <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
          {/* 프로필 이미지 */}
          <div className="flex-shrink-0">
            {onImageChange && (
              <label className="block relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onImageChange(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-slate-200 shadow-md relative cursor-pointer hover:opacity-90 transition-opacity">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${name} 트레이너 프로필`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                      <span className="text-sm">이미지 없음</span>
                      <span className="text-xs text-gray-500">클릭하여 업로드</span>
                    </div>
                  )}
                  {/* 업로드 버튼 오버레이 */}
                  <div className="absolute inset-0 bg-gray-200 bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <span className="text-white font-semibold text-sm px-4 py-2 bg-[#2F80ED] rounded-lg shadow-md">
                      {imageUrl ? "이미지 변경" : "이미지 업로드"}
                    </span>
                  </div>
                </div>
              </label>
            )}
            {!onImageChange && (
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-slate-200 shadow-md relative">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`${name} 트레이너 프로필`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-sm">이미지 없음</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 영역: 기본정보와 전문분야 */}
          <div className="flex-1 flex flex-col gap-8">
            {/* 기본정보 섹션 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">📞</span>
                기본정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-3 p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-500 mb-2 font-medium">연락처</div>
                    {isEditing ? (
                      <Input
                        value={editedContact}
                        onChange={(e) => setEditedContact(e.target.value)}
                        className="text-base h-10"
                      />
                    ) : (
                      <div className="text-base font-semibold text-slate-900 truncate">{contact}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="p-3 bg-pink-100 rounded-lg flex-shrink-0">
                    <Instagram className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-500 mb-2 font-medium">인스타그램</div>
                    {isEditing ? (
                      <Input
                        value={editedInstagram}
                        onChange={(e) => setEditedInstagram(e.target.value)}
                        className="text-base h-10"
                        placeholder="인스타그램 계정"
                      />
                    ) : (
                      <div className="text-base font-semibold text-slate-900 truncate">{instagram || "-"}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-500 mb-2 font-medium">블로그</div>
                    {isEditing ? (
                      <Input
                        value={editedBlog}
                        onChange={(e) => setEditedBlog(e.target.value)}
                        className="text-base h-10"
                        placeholder="블로그 URL"
                      />
                    ) : (
                      <div className="text-base font-semibold text-blue-600 hover:underline cursor-pointer truncate">
                        {blog || "-"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-500 mb-2 font-medium">위치</div>
                    {isEditing ? (
                      <Input
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        className="text-base h-10"
                      />
                    ) : (
                      <div className="text-base font-semibold text-slate-900 truncate">{location}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 전문분야 태그들 */}
            <div>
              <div className="flex flex-wrap gap-3 items-center">
                {(isEditing ? editedSpecialties : specialties).map((specialty, index) => (
                  isEditing ? (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={specialty}
                        onChange={(e) => {
                          const updated = [...editedSpecialties];
                          updated[index] = e.target.value;
                          setEditedSpecialties(updated);
                        }}
                        className="text-base h-10 w-40"
                        placeholder="전문분야"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSpecialty(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-10 w-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      key={index}
                      className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-700 font-semibold rounded-lg text-base border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {specialty}
                    </span>
                  )
                ))}
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddSpecialty}
                    className="text-xs h-10"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    추가
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 경력 & 자격증 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            경력 & 자격증
          </h3>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCertification}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              추가
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isEditing ? editedCertifications : certifications).map((cert, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md transition-shadow"
            >
              <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              {isEditing ? (
                <>
                  <Input
                    value={cert.title}
                    onChange={(e) => {
                      const updated = [...editedCertifications];
                      updated[index] = { ...updated[index], title: e.target.value };
                      setEditedCertifications(updated);
                    }}
                    className="text-sm flex-1 h-9"
                    placeholder="자격증명을 입력하세요"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCertification(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <span className="text-sm font-semibold text-slate-700">{cert.title || "-"}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 경력 테이블 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            경력
          </h3>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCareerHistory}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              추가
            </Button>
          )}
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 w-1/4">
                  기간
                </th>
                <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                  내용
                </th>
                {isEditing && (
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700 w-20">
                    삭제
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(isEditing ? editedCareerHistory : careerHistory).map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <Input
                        value={item.period}
                        onChange={(e) => {
                          const updated = [...editedCareerHistory];
                          updated[index] = { ...updated[index], period: e.target.value };
                          setEditedCareerHistory(updated);
                        }}
                        className="text-sm h-9"
                        placeholder="기간"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-700">{item.period}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <Input
                        value={item.content}
                        onChange={(e) => {
                          const updated = [...editedCareerHistory];
                          updated[index] = { ...updated[index], content: e.target.value };
                          setEditedCareerHistory(updated);
                        }}
                        className="text-sm h-9"
                        placeholder="내용"
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-900">{item.content}</span>
                    )}
                  </td>
                  {isEditing && (
                    <td className="px-5 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCareerHistory(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
