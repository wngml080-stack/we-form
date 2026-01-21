import { describe, it, expect } from "vitest";
import {
  scheduleCreateSchema,
  scheduleStatusSchema,
  scheduleSubmitSchema,
} from "./schedule";

describe("Schedule Validation Schemas", () => {
  describe("scheduleCreateSchema", () => {
    const validBase = {
      gym_id: "123e4567-e89b-12d3-a456-426614174000",
      start_time: "2025-01-20T09:00:00Z",
      end_time: "2025-01-20T10:00:00Z",
    };

    it("유효한 최소 데이터 통과", () => {
      const result = scheduleCreateSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });

    it("전체 데이터 통과", () => {
      const validData = {
        ...validBase,
        member_id: "123e4567-e89b-12d3-a456-426614174001",
        member_name: "홍길동",
        type: "PT",
        title: "개인 레슨",
        schedule_type: "inside",
      };

      const result = scheduleCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("gym_id 누락 시 실패", () => {
      const invalidData = {
        start_time: "2025-01-20T09:00:00Z",
        end_time: "2025-01-20T10:00:00Z",
      };

      const result = scheduleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("start_time 누락 시 실패", () => {
      const invalidData = {
        gym_id: "123e4567-e89b-12d3-a456-426614174000",
        end_time: "2025-01-20T10:00:00Z",
      };

      const result = scheduleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("end_time 누락 시 실패", () => {
      const invalidData = {
        gym_id: "123e4567-e89b-12d3-a456-426614174000",
        start_time: "2025-01-20T09:00:00Z",
      };

      const result = scheduleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("종료 시간이 시작 시간보다 빠르면 실패", () => {
      const invalidData = {
        gym_id: "123e4567-e89b-12d3-a456-426614174000",
        start_time: "2025-01-20T10:00:00Z",
        end_time: "2025-01-20T09:00:00Z",
      };

      const result = scheduleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 type 값 실패", () => {
      const invalidData = {
        ...validBase,
        type: "invalid",
      };

      const result = scheduleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("잘못된 schedule_type 값 실패", () => {
      const invalidData = {
        ...validBase,
        schedule_type: "invalid",
      };

      const result = scheduleCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("기본값 적용", () => {
      const result = scheduleCreateSchema.safeParse(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("PT");
        expect(result.data.schedule_type).toBe("inside");
      }
    });
  });

  describe("scheduleStatusSchema", () => {
    it("유효한 상태 변경 통과", () => {
      const result = scheduleStatusSchema.safeParse({
        schedule_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "completed",
      });
      expect(result.success).toBe(true);
    });

    it("모든 유효한 상태값 통과", () => {
      const validStatuses = ["reserved", "completed", "cancelled", "noshow"];

      validStatuses.forEach((status) => {
        const result = scheduleStatusSchema.safeParse({
          schedule_id: "123e4567-e89b-12d3-a456-426614174000",
          status,
        });
        expect(result.success).toBe(true);
      });
    });

    it("schedule_id 누락 시 실패", () => {
      const result = scheduleStatusSchema.safeParse({
        status: "completed",
      });
      expect(result.success).toBe(false);
    });

    it("status 누락 시 실패", () => {
      const result = scheduleStatusSchema.safeParse({
        schedule_id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });

    it("잘못된 status 값 실패", () => {
      const result = scheduleStatusSchema.safeParse({
        schedule_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "invalid_status",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("scheduleSubmitSchema", () => {
    it("유효한 YYYY-MM 형식 통과", () => {
      const result = scheduleSubmitSchema.safeParse({
        year_month: "2025-01",
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 형식 실패 (YYYY/MM)", () => {
      const result = scheduleSubmitSchema.safeParse({
        year_month: "2025/01",
      });
      expect(result.success).toBe(false);
    });

    it("잘못된 형식 실패 (MM-YYYY)", () => {
      const result = scheduleSubmitSchema.safeParse({
        year_month: "01-2025",
      });
      expect(result.success).toBe(false);
    });

    it("year_month 누락 시 실패", () => {
      const result = scheduleSubmitSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
