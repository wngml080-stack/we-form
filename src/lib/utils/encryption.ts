import crypto from "crypto";

/**
 * API 키, 토큰 등 민감한 정보를 암호화/복호화하는 유틸리티
 * AES-256-GCM 알고리즘 사용
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const _AUTH_TAG_LENGTH = 16;

/**
 * 환경 변수에서 암호화 키 가져오기
 * 32바이트(256비트) 키 필요
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다.");
  }

  // Base64로 인코딩된 32바이트 키 또는 64자 hex 문자열
  if (key.length === 44) {
    // Base64 (32 bytes = 44 base64 chars)
    return Buffer.from(key, "base64");
  } else if (key.length === 64) {
    // Hex (32 bytes = 64 hex chars)
    return Buffer.from(key, "hex");
  } else if (key.length >= 32) {
    // 일반 문자열 (최소 32자)
    return crypto.scryptSync(key, "salt", 32);
  }

  throw new Error("ENCRYPTION_KEY는 최소 32자 이상이어야 합니다.");
}

/**
 * 문자열 암호화
 * @param text 암호화할 평문
 * @returns Base64로 인코딩된 암호문 (iv:authTag:encrypted)
 */
export function encrypt(text: string): string {
  if (!text) return text;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // iv:authTag:encrypted 형식으로 결합
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error) {
    console.error("[Encryption] 암호화 실패:", error);
    throw new Error("암호화에 실패했습니다.");
  }
}

/**
 * 암호문 복호화
 * @param encryptedText Base64로 인코딩된 암호문
 * @returns 복호화된 평문
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  // 암호화되지 않은 평문인지 확인 (콜론이 2개 있어야 암호문)
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    // 암호화되지 않은 평문으로 간주 (하위 호환성)
    console.warn("[Decryption] 암호화되지 않은 데이터입니다. 평문 반환.");
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const [ivBase64, authTagBase64, encrypted] = parts;

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Decryption] 복호화 실패:", error);
    throw new Error("복호화에 실패했습니다. 키가 변경되었거나 데이터가 손상되었을 수 있습니다.");
  }
}

/**
 * 데이터가 이미 암호화되어 있는지 확인
 * @param text 확인할 문자열
 * @returns 암호화 여부
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;

  const parts = text.split(":");
  if (parts.length !== 3) return false;

  // 각 부분이 유효한 Base64인지 확인
  try {
    const [iv, authTag, encrypted] = parts;
    Buffer.from(iv, "base64");
    Buffer.from(authTag, "base64");
    Buffer.from(encrypted, "base64");

    // IV 길이 확인 (16 bytes = 24 base64 chars with padding)
    return Buffer.from(iv, "base64").length === IV_LENGTH;
  } catch {
    return false;
  }
}

/**
 * 암호화 키 생성 (초기 설정용)
 * @returns Base64로 인코딩된 32바이트 랜덤 키
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
