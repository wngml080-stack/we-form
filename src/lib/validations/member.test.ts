import { describe, it, expect } from "vitest";
import { memberCreateSchema, memberUpdateSchema, memberQuerySchema } from "./member";

describe("Member Validation Schemas", () => {
  describe("memberCreateSchema", () => {
    it("유효한 최소 데이터 통과", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
      };

      const result = memberCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("전체 데이터 통과", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
        phone: "010-1234-5678",
        birth_date: "1990-01-15",
        gender: "male",
        status: "active",
      };

      const result = memberCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("company_id 누락 시 실패", () => {
      const invalidData = {
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("gym_id 누락 시 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        name: "홍길동",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("name 누락 시 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("빈 name 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 UUID 형식 실패", () => {
      const invalidData = {
        company_id: "not-a-uuid",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 전화번호 형식 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
        phone: "12345",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 gender 값 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
        gender: "unknown",
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("음수 체중 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "홍길동",
        weight: -10,
      };

      const result = memberCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("memberUpdateSchema", () => {
    it("빈 객체 통과 (모든 필드 선택적)", () => {
      const result = memberUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("일부 필드만 업데이트 통과", () => {
      const result = memberUpdateSchema.safeParse({
        name: "김철수",
        status: "paused",
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 status 실패", () => {
      const result = memberUpdateSchema.safeParse({
        status: "deleted",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("memberQuerySchema", () => {
    it("빈 객체 기본값 적용", () => {
      const result = memberQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.status).toBe("all");
      }
    });

    it("문자열 page를 숫자로 변환", () => {
      const result = memberQuerySchema.safeParse({ page: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it("유효한 쿼리 통과", () => {
      const result = memberQuerySchema.safeParse({
        page: 2,
        status: "active",
        gym_id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });
  });
});
