import { AuthenticatedStaff } from "./auth";

/**
 * 메신저 접근 권한 확인
 * - system_admin: 무조건 접근 가능
 * - company_admin: gym_id가 null인 경우만 (본사 직원)
 */
export function isHQStaff(staff: AuthenticatedStaff): boolean {
  if (staff.role === "system_admin") return true;
  return staff.gym_id === null && staff.role === "company_admin";
}

/**
 * 채팅방 접근 권한 확인
 */
export function canAccessChatRoom(
  staff: AuthenticatedStaff,
  roomCompanyId: string
): boolean {
  if (!isHQStaff(staff)) return false;
  if (staff.role === "system_admin") return true;
  return staff.company_id === roomCompanyId;
}

/**
 * 채팅 메시지 전송 권한 확인
 */
export function canSendMessage(
  staff: AuthenticatedStaff,
  roomCompanyId: string
): boolean {
  return canAccessChatRoom(staff, roomCompanyId);
}

/**
 * 채팅방 관리 권한 확인 (그룹 설정 변경, 멤버 관리 등)
 */
export function canManageChatRoom(
  staff: AuthenticatedStaff,
  roomCompanyId: string,
  isRoomAdmin: boolean
): boolean {
  if (!isHQStaff(staff)) return false;
  if (staff.role === "system_admin") return true;
  if (staff.role === "company_admin" && staff.company_id === roomCompanyId)
    return true;
  return isRoomAdmin;
}
