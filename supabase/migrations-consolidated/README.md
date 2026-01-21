# We:Form 통합 마이그레이션

기존 40개 마이그레이션 파일을 기능별로 정리한 통합 버전입니다.

## 파일 구조

| 파일 | 설명 | 주요 테이블 |
|------|------|------------|
| `00_core_schema.sql` | 핵심 테이블 | companies, gyms, staffs, members, attendance_statuses |
| `01_membership_schema.sql` | 회원권/매출 | member_memberships, member_payments, membership_products, sale_types, membership_categories, membership_names, payment_methods |
| `02_schedule_schema.sql` | 스케줄/출석 | schedules, monthly_schedule_reports, attendances |
| `03_salary_schema.sql` | 급여 시스템 | salary_components, salary_rules, salary_templates, salary_template_items, staff_salary_settings, calculated_salaries, salary_settings |
| `04_communication_schema.sql` | 문의/채팅 | inquiries, inquiry_messages, reservations, gym_auto_response_settings, gym_kakao_channels, chat_rooms, chat_room_members, chat_messages |
| `05_tracking_schema.sql` | 이력 추적 | member_activity_logs, member_membership_transfers, member_trainers, member_trainer_transfers, signatures |
| `06_settings_schema.sql` | 설정/공지 | announcements, system_announcements, company_events, gym_expenses, expense_categories, user_google_tokens |
| `07_rls_policies.sql` | 보안 정책 | RLS 정책 및 헬퍼 함수 |
| `08_functions.sql` | 유틸리티 함수 | 회원 조회, 전화번호 포맷팅, 마이그레이션 트래커 |

## 사용 방법

### 새 환경 설정 시
Supabase SQL Editor에서 순서대로 실행:
```
00_core_schema.sql → 01 → 02 → ... → 08_functions.sql
```

### 기존 환경
이미 마이그레이션이 적용된 환경에서는 사용하지 마세요.
기존 `migrations/` 폴더의 마이그레이션이 적용된 상태입니다.

## 테이블 관계도

```
companies
    └── gyms
        ├── staffs
        ├── members
        │   ├── member_memberships
        │   ├── member_payments
        │   ├── member_trainers
        │   └── member_activity_logs
        ├── schedules
        │   └── signatures
        ├── inquiries
        │   ├── inquiry_messages
        │   └── reservations
        ├── salary_components
        │   └── salary_rules
        │       └── salary_templates
        │           └── salary_template_items
        ├── announcements
        ├── company_events
        └── gym_expenses
```

## 기존 마이그레이션 (아카이브)

기존 파일들은 `migrations-archive/` 폴더로 이동되었습니다.
