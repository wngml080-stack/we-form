"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit2, Check, X, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BeforeAfterReview {
  id: string;
  goal: string;
  result: string;
  review: string;
  memberInfo: string; // 예: "김OO님 (30대/직장인/12주)"
  image?: string; // 단일 이미지 (가로로 표시)
  beforeImage?: string; // Before 이미지 (선택사항)
  afterImage?: string; // After 이미지 (선택사항)
}

interface BeforeAfterSectionProps {
  reviews: BeforeAfterReview[];
  onUpdate?: (reviews: BeforeAfterReview[]) => void;
}

export function BeforeAfterSection({ reviews, onUpdate }: BeforeAfterSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReviews, setEditedReviews] = useState(reviews);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedReviews);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedReviews(reviews);
    setIsEditing(false);
  };

  const handleAddReview = () => {
    setEditedReviews([
      ...editedReviews,
      {
        id: Date.now().toString(),
        goal: "",
        result: "",
        review: "",
        memberInfo: "",
      },
    ]);
  };

  const handleRemoveReview = (id: string) => {
    setEditedReviews(editedReviews.filter((review) => review.id !== id));
  };

  const handleImageChange = (reviewId: string, type: "image" | "before" | "after", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditedReviews(
        editedReviews.map((review) =>
          review.id === reviewId
            ? { 
                ...review, 
                ...(type === "image" 
                  ? { image: reader.result as string }
                  : type === "before" 
                  ? { beforeImage: reader.result as string }
                  : { afterImage: reader.result as string }
                )
              }
            : review
        )
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          회원 후기 & 비포/애프터
        </h2>
        {onUpdate && (
          <div className="flex gap-2">
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

      {/* 후기 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(isEditing ? editedReviews : reviews).map((review) => (
          <div
            key={review.id}
            className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow"
          >
            {isEditing ? (
              <div className="space-y-4">
                {/* 목표 */}
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">목표</div>
                  <Input
                    value={review.goal}
                    onChange={(e) => {
                      setEditedReviews(
                        editedReviews.map((r) =>
                          r.id === review.id ? { ...r, goal: e.target.value } : r
                        )
                      );
                    }}
                    className="text-sm h-9"
                    placeholder="목표를 입력하세요"
                  />
                </div>

                {/* 결과 */}
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">결과</div>
                  <Input
                    value={review.result}
                    onChange={(e) => {
                      setEditedReviews(
                        editedReviews.map((r) =>
                          r.id === review.id ? { ...r, result: e.target.value } : r
                        )
                      );
                    }}
                    className="text-sm h-9"
                    placeholder="결과를 입력하세요"
                  />
                </div>

                {/* 후기 */}
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">후기</div>
                  <Textarea
                    value={review.review}
                    onChange={(e) => {
                      setEditedReviews(
                        editedReviews.map((r) =>
                          r.id === review.id ? { ...r, review: e.target.value } : r
                        )
                      );
                    }}
                    className="text-sm min-h-[100px]"
                    placeholder="후기를 입력하세요"
                  />
                </div>

                {/* 회원 정보 */}
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">회원 정보</div>
                  <Input
                    value={review.memberInfo}
                    onChange={(e) => {
                      setEditedReviews(
                        editedReviews.map((r) =>
                          r.id === review.id ? { ...r, memberInfo: e.target.value } : r
                        )
                      );
                    }}
                    className="text-sm h-9"
                    placeholder="예: 김OO님 (30대/직장인/12주)"
                  />
                </div>

                {/* 사진 업로드 (선택사항) */}
                <details className="mt-2">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                    사진 추가 (선택사항)
                  </summary>
                  <div className="mt-2">
                    <label className="block relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageChange(review.id, "image", file);
                        }}
                        className="hidden"
                      />
                      <div className="aspect-video rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors relative overflow-hidden">
                        {review.image ? (
                          <Image
                            src={review.image}
                            alt="후기 사진"
                            fill
                            className="object-cover rounded-lg"
                            unoptimized
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs text-slate-500">사진 추가</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </details>

                {/* Before/After 이미지 (선택사항) */}
                <details className="mt-2">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                    Before/After 사진 추가 (선택사항)
                  </summary>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <div className="text-xs text-slate-500 mb-1 font-medium">Before</div>
                      <label className="block relative group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageChange(review.id, "before", file);
                          }}
                          className="hidden"
                        />
                        <div className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors relative overflow-hidden">
                          {review.beforeImage ? (
                            <Image
                              src={review.beforeImage}
                              alt="Before"
                              fill
                              className="object-cover rounded-lg"
                              unoptimized
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs text-slate-500">Before</span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1 font-medium">After</div>
                      <label className="block relative group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageChange(review.id, "after", file);
                          }}
                          className="hidden"
                        />
                        <div className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors relative overflow-hidden">
                          {review.afterImage ? (
                            <Image
                              src={review.afterImage}
                              alt="After"
                              fill
                              className="object-cover rounded-lg"
                              unoptimized
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs text-slate-500">After</span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </details>

                {/* 삭제 버튼 */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveReview(review.id)}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 목표 */}
                <div>
                  <div className="text-xs text-slate-500 mb-1">목표</div>
                  <div className="text-sm font-bold text-slate-900">{review.goal || "-"}</div>
                </div>

                {/* 결과 */}
                <div>
                  <div className="text-xs text-slate-500 mb-1">결과</div>
                  <div className="text-sm font-bold text-slate-900">{review.result || "-"}</div>
                </div>

                {/* 후기 */}
                {review.review && (
                  <div>
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      "{review.review}"
                    </div>
                  </div>
                )}

                {/* 회원 정보 */}
                {review.memberInfo && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                    {review.memberInfo}
                  </div>
                )}

                {/* 사진 (가로로 표시) */}
                {review.image && (
                  <div className="pt-2">
                    <div className="aspect-video rounded-lg border-2 border-slate-200 bg-slate-100 overflow-hidden relative">
                      <Image
                        src={review.image}
                        alt="후기 사진"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Before/After 이미지 (선택사항 - 둘 다 있을 때만 표시) */}
                {(review.beforeImage || review.afterImage) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {review.beforeImage && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1 text-center">Before</div>
                        <div className="aspect-square rounded-lg border-2 border-slate-200 bg-slate-100 overflow-hidden relative">
                          <Image
                            src={review.beforeImage}
                            alt="Before"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    {review.afterImage && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1 text-center">After</div>
                        <div className="aspect-square rounded-lg border-2 border-slate-200 bg-slate-100 overflow-hidden relative">
                          <Image
                            src={review.afterImage}
                            alt="After"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 새 후기 추가 버튼 (편집 모드일 때만) */}
        {isEditing && (
          <button
            onClick={handleAddReview}
            className="bg-slate-50 rounded-xl p-5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center min-h-[400px]"
          >
            <Plus className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">새 후기 추가</span>
          </button>
        )}
      </div>
    </div>
  );
}

