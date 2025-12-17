# TanStack Table v8 통합 계획

## 🎯 목표

현재 회원 관리 테이블을 TanStack Table로 전환하여 고급 기능 추가
- **유지해야 할 것**: 모든 기존 기능, 모달 연동, 페이지네이션
- **추가할 것**: 정렬, 컬럼 관리, 행 선택, 대량 작업

---

## 📋 현재 구조 분석

### 데이터 플로우
```
1. API/직접 쿼리 → members 배열
2. 필터링 → filteredMembers (구방식) / paginatedData.members (신방식)
3. displayMembers → 실제 렌더링
4. 테이블 행 클릭 → 모달 열기 (selectedMember)
```

### 중요한 의존성
- `openMembershipModal(member)` - 회원권 등록 모달
- `openEditModal(member)` - 회원 수정 모달
- `getStatusBadge(status)` - 상태 뱃지 렌더링
- `displayMembers` - 페이지네이션과 필터링 결과

---

## 🏗️ 통합 아키텍처

### Phase 1: 기본 구조 (위험도: 낮음)

**파일 구조**
```
src/
├── app/admin/members/
│   ├── page.tsx (기존 - 최소 수정)
│   └── components/
│       ├── MembersTable.tsx (새로 생성 - TanStack Table)
│       ├── columns.tsx (새로 생성 - 컬럼 정의)
│       └── RowActions.tsx (새로 생성 - 액션 버튼)
```

**왜 이렇게?**
- 기존 page.tsx는 최대한 보존 (모달, 상태 관리)
- 테이블만 분리된 컴포넌트로 추출
- 점진적 마이그레이션 가능

### Phase 2: 컬럼 정의

**columns.tsx 구조**
```typescript
export const memberColumns = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox />, // 전체 선택
    cell: ({ row }) => <Checkbox />,     // 행 선택
  },
  {
    accessorKey: 'name',
    header: '이름',
    cell: ({ row }) => <span>{row.original.name}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'phone',
    header: '연락처',
    enableSorting: false,
  },
  // ... 나머지 컬럼
  {
    id: 'actions',
    cell: ({ row }) => <RowActions member={row.original} />,
  }
]
```

**기존 로직 재사용**
- `getStatusBadge()` 함수 그대로 사용
- 잔여횟수 계산 로직 유지
- Badge, Button 컴포넌트 동일하게 사용

### Phase 3: 상태 관리

**TanStack Table 상태와 기존 상태 통합**
```typescript
// 기존 유지
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [currentPage, setCurrentPage] = useState(1);

// TanStack Table 추가
const [sorting, setSorting] = useState([]);
const [columnVisibility, setColumnVisibility] = useState({});
const [rowSelection, setRowSelection] = useState({});

const table = useReactTable({
  data: displayMembers,
  columns: memberColumns,
  state: {
    sorting,
    columnVisibility,
    rowSelection,
  },
  onSortingChange: setSorting,
  onColumnVisibilityChange: setColumnVisibility,
  onRowSelectionChange: setRowSelection,
  // 페이지네이션은 서버 사이드 유지
  manualPagination: true,
  pageCount: paginatedData.totalPages,
})
```

### Phase 4: 위험 요소 및 대응

**위험 1: 모달 연동 깨짐**
- **원인**: `member` 객체 참조 방식 변경
- **대응**: `row.original`로 동일한 객체 전달 보장
- **테스트**: 회원권 등록, 수정 모달 모두 테스트

**위험 2: 페이지네이션 충돌**
- **원인**: TanStack Table의 내장 페이지네이션 vs 서버 사이드
- **대응**: `manualPagination: true` 설정
- **기존 Pagination 컴포넌트 그대로 사용**

**위험 3: 필터링 로직 중복**
- **원인**: 서버 사이드 + 클라이언트 사이드 필터
- **대응**: 서버 사이드만 사용 (현재 방식 유지)
- **TanStack Table 필터는 비활성화**

**위험 4: 성능 저하**
- **원인**: 불필요한 리렌더링
- **대응**:
  - `useMemo`로 columns 메모이제이션
  - `getCoreRowModel` 사용
  - Virtual scrolling은 Phase 3에서

---

## 📅 단계별 구현 계획

### Day 1: 준비 및 설치
```bash
# 1. TanStack Table 설치
npm install @tanstack/react-table

# 2. 파일 구조 생성
mkdir -p src/app/admin/members/components
touch src/app/admin/members/components/MembersTable.tsx
touch src/app/admin/members/components/columns.tsx
touch src/app/admin/members/components/RowActions.tsx
```

**검증**:
- ✅ 패키지 설치 확인
- ✅ TypeScript 에러 없음

### Day 2: 컬럼 정의
**작업**:
1. `columns.tsx` 작성
2. 기존 렌더링 로직을 cell 함수로 이동
3. `getStatusBadge` 재사용 확인

**검증**:
- ✅ 모든 컬럼 표시됨
- ✅ 스타일 동일
- ✅ Badge, Button 정상 작동

### Day 3: MembersTable 컴포넌트
**작업**:
1. `useReactTable` 훅 설정
2. 기본 테이블 렌더링
3. 기존 스타일 클래스 적용

**검증**:
- ✅ 데이터 표시 정상
- ✅ 로딩 상태 처리
- ✅ 빈 상태 메시지

### Day 4: 액션 통합
**작업**:
1. `RowActions` 컴포넌트 생성
2. `openMembershipModal`, `openEditModal` 연결
3. props drilling 최소화 (컨텍스트 고려)

**검증**:
- ✅ 회원권 등록 모달 열림
- ✅ 회원 수정 모달 열림
- ✅ 모든 데이터 정상 전달

### Day 5: 정렬 기능
**작업**:
1. `enableSorting` 활성화
2. 정렬 UI 추가 (화살표 아이콘)
3. 서버 사이드 정렬 vs 클라이언트 결정

**검증**:
- ✅ 이름, 생년월일, 상태 정렬
- ✅ 다중 정렬 지원
- ✅ 정렬 상태 유지

### Day 6: page.tsx 통합
**작업**:
1. 기존 `<table>` 태그를 `<MembersTable>` 로 교체
2. props 전달 (members, onEdit, onAddMembership)
3. Feature Flag 추가 (롤백 가능)

**검증**:
- ✅ 모든 기능 정상 작동
- ✅ 페이지네이션 유지
- ✅ 검색/필터 유지
- ✅ 통계 카드 정상

---

## 🔄 롤백 계획

### Feature Flag 사용
```typescript
const useTanStackTable = process.env.NEXT_PUBLIC_USE_TANSTACK_TABLE === "true";

return (
  <>
    {useTanStackTable ? (
      <MembersTable
        data={displayMembers}
        onEdit={openEditModal}
        onAddMembership={openMembershipModal}
      />
    ) : (
      // 기존 테이블
      <table>...</table>
    )}
  </>
)
```

### 문제 발생 시
1. `.env.local`에서 플래그를 `false`로 변경
2. 개발 서버 재시작
3. 기존 테이블로 즉시 복구

---

## 🎨 추가 기능 (Phase 2-3)

### Week 2: 고급 기능
- [ ] 행 선택 (체크박스)
- [ ] 전체 선택 / 해제
- [ ] 선택된 행 개수 표시
- [ ] 컬럼 표시/숨김 토글
- [ ] 컬럼 순서 변경 (드래그)

### Week 3: 대량 작업
- [ ] 선택된 회원 일괄 상태 변경
- [ ] 선택된 회원 Excel 내보내기
- [ ] 선택된 회원 트레이너 할당
- [ ] 작업 확인 모달

---

## ✅ 성공 기준

**Phase 1 완료**:
- [x] TanStack Table로 모든 데이터 표시
- [x] 기존 모달 연동 정상
- [x] 페이지네이션 유지
- [x] 성능 저하 없음

**Phase 2 완료**:
- [ ] 모든 컬럼 정렬 가능
- [ ] 행 선택 기능
- [ ] 컬럼 관리 UI

**Phase 3 완료**:
- [ ] Excel 내보내기
- [ ] 대량 작업 완성
- [ ] 10,000명 이상 처리 가능

---

## 🚨 주의사항

### 절대 변경 금지
1. `member` 객체 구조
2. 모달 컴포넌트 (`Dialog`, 폼 상태)
3. API 엔드포인트 응답 형식
4. `displayMembers` 데이터 소스

### 최소 변경
1. page.tsx - 테이블 부분만 컴포넌트화
2. 상태 관리 - TanStack Table 상태만 추가
3. 스타일 - 기존 클래스 최대한 재사용

### 점진적 접근
1. 기본 테이블 → 정렬 → 선택 → 대량작업 순서
2. 각 단계마다 철저한 테스트
3. Feature Flag로 안전망 확보

---

## 📚 참고 자료

- [TanStack Table v8 Docs](https://tanstack.com/table/v8)
- [React Table Examples](https://tanstack.com/table/v8/docs/examples/react/basic)
- [현재 구현 - SWR + 페이지네이션](src/lib/hooks/usePaginatedMembers.ts)
