import { describe, it, expect } from "vitest";
import {
  salarySettingCreateSchema,
  salarySettingUpdateSchema,
  salaryQuerySchema,
} from "./salary";

describe("Salary Validation Schemas", () => {
  describe("salarySettingCreateSchema", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("고정급 유효 데이터 통과", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "fixed",
        amount: 50000,
      });
      expect(result.success).toBe(true);
    });

    it("비율급 유효 데이터 통과", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "rate",
        rate: 30,
      });
      expect(result.success).toBe(true);
    });

    it("전체 데이터 통과", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        attendance_code: "PT-BASIC",
        pay_type: "fixed",
        amount: 50000,
        memo: "PT 기본 급여",
      });
      expect(result.success).toBe(true);
    });

    it("gym_id 누락 시 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        pay_type: "fixed",
        amount: 50000,
      });
      expect(result.success).toBe(false);
    });

    it("잘못된 gym_id 형식 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: "invalid-uuid",
        pay_type: "fixed",
        amount: 50000,
      });
      expect(result.success).toBe(false);
    });

    it("고정급에서 amount 누락 시 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "fixed",
      });
      expect(result.success).toBe(false);
    });

    it("비율급에서 rate 누락 시 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "rate",
      });
      expect(result.success).toBe(false);
    });

    it("음수 amount 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "fixed",
        amount: -1000,
      });
      expect(result.success).toBe(false);
    });

    it("100 초과 rate 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "rate",
        rate: 150,
      });
      expect(result.success).toBe(false);
    });

    it("음수 rate 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "rate",
        rate: -10,
      });
      expect(result.success).toBe(false);
    });

    it("잘못된 pay_type 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "invalid",
        amount: 50000,
      });
      expect(result.success).toBe(false);
    });

    it("memo 500자 초과 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "fixed",
        amount: 50000,
        memo: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("attendance_code 50자 초과 실패", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "fixed",
        amount: 50000,
        attendance_code: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("기본값 pay_type fixed 적용", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        amount: 50000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pay_type).toBe("fixed");
      }
    });

    it("rate 경계값 0 통과", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "rate",
        rate: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rate 경계값 100 통과", () => {
      const result = salarySettingCreateSchema.safeParse({
        gym_id: validUUID,
        pay_type: "rate",
        rate: 100,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("salarySettingUpdateSchema", () => {
    it("빈 객체 통과 (부분 업데이트)", () => {
      const result = salarySettingUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("amount만 업데이트 통과", () => {
      const result = salarySettingUpdateSchema.safeParse({
        amount: 60000,
      });
      expect(result.success).toBe(true);
    });

    it("rate만 업데이트 통과", () => {
      const result = salarySettingUpdateSchema.safeParse({
        rate: 25,
      });
      expect(result.success).toBe(true);
    });

    it("pay_type 변경 통과", () => {
      const result = salarySettingUpdateSchema.safeParse({
        pay_type: "rate",
        rate: 30,
      });
      expect(result.success).toBe(true);
    });

    it("memo 업데이트 통과", () => {
      const result = salarySettingUpdateSchema.safeParse({
        memo: "업데이트된 메모",
      });
      expect(result.success).toBe(true);
    });

    it("attendance_code 업데이트 통과", () => {
      const result = salarySettingUpdateSchema.safeParse({
        attendance_code: "PT-PREMIUM",
      });
      expect(result.success).toBe(true);
    });

    it("null 값 허용 (필드 초기화)", () => {
      const result = salarySettingUpdateSchema.safeParse({
        amount: null,
        rate: null,
        memo: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("salaryQuerySchema", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("유효한 gym_id 통과", () => {
      const result = salaryQuerySchema.safeParse({
        gym_id: validUUID,
      });
      expect(result.success).toBe(true);
    });

    it("gym_id 누락 시 실패", () => {
      const result = salaryQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("잘못된 gym_id 형식 실패", () => {
      const result = salaryQuerySchema.safeParse({
        gym_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("빈 문자열 gym_id 실패", () => {
      const result = salaryQuerySchema.safeParse({
        gym_id: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
