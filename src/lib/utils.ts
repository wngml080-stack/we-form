import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Shadcn UI에서 사용하는 표준 클래스 머지 함수.
 * - 여러 조건부 클래스들을 깔끔하게 합치고
 * - Tailwind 클래스 충돌을 자동으로 정리해 줍니다.
 *
 * 사용 예:
 *   cn("px-2", isActive && "bg-primary", "px-4") // => "bg-primary px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


