-- 기존 전화번호를 000-0000-0000 형식으로 통일
-- 2025-12-19

-- 회원(members) 테이블 전화번호 포맷팅
UPDATE members
SET phone =
  CASE
    -- 이미 하이픈이 있는 경우 숫자만 추출 후 재포맷
    WHEN phone ~ '[0-9]' THEN
      CASE
        -- 11자리 (010-0000-0000)
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 11 THEN
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 3) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 4, 4) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 8, 4)
        -- 10자리 (02로 시작하면 02-0000-0000, 아니면 031-000-0000)
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 10 THEN
          CASE
            WHEN REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '02%' THEN
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 2) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 4) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 7, 4)
            ELSE
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 3) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 4, 3) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 7, 4)
          END
        -- 9자리 (02-000-0000)
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 9 AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '02%' THEN
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 2) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 3) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 6, 4)
        ELSE phone
      END
    ELSE phone
  END
WHERE phone IS NOT NULL AND phone != '';

-- 직원(staffs) 테이블 전화번호 포맷팅
UPDATE staffs
SET phone =
  CASE
    WHEN phone ~ '[0-9]' THEN
      CASE
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 11 THEN
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 3) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 4, 4) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 8, 4)
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 10 THEN
          CASE
            WHEN REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '02%' THEN
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 2) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 4) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 7, 4)
            ELSE
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 3) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 4, 3) || '-' ||
              SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 7, 4)
          END
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 9 AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '02%' THEN
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1, 2) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 3, 3) || '-' ||
          SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 6, 4)
        ELSE phone
      END
    ELSE phone
  END
WHERE phone IS NOT NULL AND phone != '';
