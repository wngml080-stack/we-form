import { describe, it, expect } from "vitest";
import { salesCreateSchema, salesUpdateSchema, salesQuerySchema } from "./sales";

describe("Sales Validation Schemas", () => {
  describe("salesCreateSchema", () => {
    it("유효한 최소 데이터 통과", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("전체 데이터 통과", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        member_name: "홍길동",
        phone: "010-1234-5678",
        gender: "male",
        birth_date: "1990-01-15",
        sale_type: "신규",
        membership_category: "PT",
        membership_name: "PT 30회",
        amount: 1500000,
        method: "card",
        installment: 3,
        trainer_id: "123e4567-e89b-12d3-a456-426614174002",
        trainer_name: "김트레이너",
        service_sessions: 30,
        bonus_sessions: 5,
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("company_id 누락 시 실패", () => {
      const invalidData = {
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = salesCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("gym_id 누락 시 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = salesCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 UUID 형식 실패", () => {
      const invalidData = {
        company_id: "not-a-uuid",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = salesCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 전화번호 형식 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        phone: "12345",
      };

      const result = salesCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("문자열 금액을 숫자로 변환", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        amount: "1500000",
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1500000);
      }
    });

    it("문자열 PT 횟수를 숫자로 변환", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        service_sessions: "30",
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.service_sessions).toBe(30);
      }
    });

    it("잘못된 sale_type 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        sale_type: "잘못된타입",
      };

      const result = salesCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 method 실패", () => {
      const invalidData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        method: "bitcoin",
      };

      const result = salesCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("하이픈 없는 전화번호 통과", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        phone: "01012345678",
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("빈 문자열 phone 통과 (프론트엔드 호환성)", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        phone: "",
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("빈 문자열 trainer_id 통과 (프론트엔드 호환성)", () => {
      const validData = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        gym_id: "123e4567-e89b-12d3-a456-426614174001",
        trainer_id: "",
      };

      const result = salesCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("salesUpdateSchema", () => {
    it("빈 객체 통과 (모든 필드 선택적)", () => {
      const result = salesUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("일부 필드만 업데이트 통과", () => {
      const result = salesUpdateSchema.safeParse({
        member_name: "김철수",
        amount: 2000000,
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 sale_type 실패", () => {
      const result = salesUpdateSchema.safeParse({
        sale_type: "잘못된타입",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("salesQuerySchema", () => {
    it("유효한 쿼리 통과", () => {
      const result = salesQuerySchema.safeParse({
        gym_id: "123e4567-e89b-12d3-a456-426614174000",
        company_id: "123e4567-e89b-12d3-a456-426614174001",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("필수 gym_id 누락 시 실패", () => {
      const result = salesQuerySchema.safeParse({
        company_id: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(false);
    });

    it("필수 company_id 누락 시 실패", () => {
      const result = salesQuerySchema.safeParse({
        gym_id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });
});
