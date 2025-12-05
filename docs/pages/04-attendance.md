# 출석 관리 페이지 디자인 가이드

**경로**: `/admin/attendance`
**파일**: `/src/app/admin/attendance/page.tsx`
**상태**: ✅ 완료

---

## 📋 페이지 개요

출석 관리 페이지는 회원의 출석 기록을 조회하고 관리하는 페이지입니다.

### 주요 기능
1. 출석 기록 조회 (필터링: 스케줄, 날짜 범위)
2. 출석 기록 등록 (Dialog 모달)
3. 출석 상태 변경 (Dropdown)
4. 출석 기록 삭제

---

## 🎨 디자인 구성

### 1. 페이지 레이아웃

```tsx
<div className="p-8">
  {/* 헤더 */}
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="text-3xl font-bold">{gymName} - 출석 관리</h1>
      <p className="text-gray-600 mt-1">회원 출석 기록을 관리합니다</p>
    </div>
    <Button>출석 기록 등록</Button>
  </div>

  {/* 필터 섹션 */}
  <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">
    {/* 스케줄 필터, 시작 날짜, 종료 날짜 */}
  </div>

  {/* 출석 기록 테이블 */}
  <div className="bg-white rounded-lg shadow">
    <table className="w-full">
      {/* 테이블 내용 */}
    </table>
  </div>
</div>
```

### 2. 색상 팔레트

| 요소 | 색상 | 비고 |
|------|------|------|
| **페이지 배경** | `#f8fafc` (slate-50) | Admin Layout 배경 |
| **카드 배경** | `#ffffff` | 필터, 테이블 카드 |
| **제목 텍스트** | `#020617` (slate-950) | h1 |
| **서브 텍스트** | `#4b5563` (gray-600) | 설명 텍스트 |
| **Primary 버튼** | `#2F80ED` | 출석 기록 등록 |
| **테이블 헤더** | `#f9fafb` (gray-50) | thead |
| **구분선** | `#e5e7eb` (gray-200) | border |

### 3. 출석 상태 배지 색상

```tsx
// attendance_statuses 테이블 기준
const statusColors = {
  reserved: 'bg-blue-500',         // 예약
  completed: 'bg-emerald-500',     // 출석
  no_show: 'bg-gray-400',          // 노쇼
  no_show_deducted: 'bg-red-500',  // 노쇼(공제)
  service: 'bg-sky-500',           // 서비스
};
```

**사용 예시**
```tsx
<Badge className={record.status?.color || "bg-gray-500"}>
  {record.status?.label || record.status_code}
</Badge>
```

---

## 🧩 컴포넌트 구성

### 1. 헤더 영역

```tsx
<div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-3xl font-bold">{gymName} - 출석 관리</h1>
    <p className="text-gray-600 mt-1">회원 출석 기록을 관리합니다</p>
  </div>

  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogTrigger asChild>
      <Button>출석 기록 등록</Button>
    </DialogTrigger>
    {/* Dialog 내용 */}
  </Dialog>
</div>
```

**디자인 포인트**
- 제목: `text-3xl font-bold` (Paperozi 700)
- 설명: `text-gray-600 mt-1`
- 버튼: Primary Blue 배경

### 2. 필터 섹션

```tsx
<div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">
  <div>
    <Label>스케줄 필터</Label>
    <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
      <SelectTrigger>
        <SelectValue placeholder="전체 스케줄" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체 스케줄</SelectItem>
        {schedules.map(...)}
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label>시작 날짜</Label>
    <Input type="date" value={startDate} onChange={...} />
  </div>

  <div>
    <Label>종료 날짜</Label>
    <Input type="date" value={endDate} onChange={...} />
  </div>
</div>
```

**디자인 포인트**
- 배경: 흰색 카드 (`bg-white rounded-lg shadow`)
- 레이아웃: 3열 그리드 (`grid-cols-3 gap-4`)
- 여백: `p-4 mb-6`

### 3. 출석 기록 등록 Dialog

```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>출석 기록 등록</DialogTitle>
  </DialogHeader>

  <form onSubmit={handleCreateRecord} className="space-y-4">
    {/* 스케줄 선택 */}
    <div>
      <Label htmlFor="schedule_id">스케줄</Label>
      <Select value={newRecord.schedule_id} onValueChange={...}>
        <SelectTrigger>
          <SelectValue placeholder="스케줄 선택" />
        </SelectTrigger>
        <SelectContent>
          {schedules.map(...)}
        </SelectContent>
      </Select>
    </div>

    {/* 회원 선택 */}
    <div>
      <Label htmlFor="member_id">회원</Label>
      <Select value={newRecord.member_id} onValueChange={...}>
        {/* ... */}
      </Select>
    </div>

    {/* 출석 상태 */}
    <div>
      <Label htmlFor="status_code">출석 상태</Label>
      <Select value={newRecord.status_code} onValueChange={...}>
        {statuses.map(...)}
      </Select>
    </div>

    {/* 메모 */}
    <div>
      <Label htmlFor="memo">메모 (선택)</Label>
      <Textarea id="memo" value={newRecord.memo} onChange={...} />
    </div>

    {/* 버튼 */}
    <div className="flex gap-2">
      <Button type="submit" className="flex-1">등록</Button>
      <Button type="button" variant="outline" onClick={...} className="flex-1">
        취소
      </Button>
    </div>
  </form>
</DialogContent>
```

**디자인 포인트**
- 폼 간격: `space-y-4`
- 버튼 레이아웃: `flex gap-2`, `flex-1` (동일 너비)
- Primary 버튼: 등록
- Outline 버튼: 취소

### 4. 출석 기록 테이블

```tsx
<div className="bg-white rounded-lg shadow">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            출석 일시
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            회원명
          </th>
          {/* ... */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {records.map((record) => (
          <tr key={record.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {new Date(record.attended_at).toLocaleString("ko-KR")}
            </td>
            {/* ... */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**테이블 컬럼**
1. 출석 일시
2. 회원명
3. 스케줄
4. 담당 직원
5. 상태 (Badge + Dropdown)
6. 메모
7. 작업 (삭제 버튼)

**디자인 포인트**
- 테이블 헤더: `bg-gray-50 border-b`
- 헤더 텍스트: `text-xs font-medium text-gray-500 uppercase`
- 바디 텍스트: `text-sm`
- 행 구분선: `divide-y divide-gray-200`
- 셀 여백: `px-6 py-4`

### 5. 출석 상태 변경 Dropdown

```tsx
<Select
  value={record.status_code}
  onValueChange={(value) => handleStatusChange(record.id, value)}
>
  <SelectTrigger className="w-32">
    <SelectValue>
      <Badge className={record.status?.color || "bg-gray-500"}>
        {record.status?.label || record.status_code}
      </Badge>
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {statuses.map((status) => (
      <SelectItem key={status.code} value={status.code}>
        {status.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**디자인 포인트**
- Trigger 너비: `w-32` (128px)
- Badge 색상: 동적 적용 (`record.status?.color`)
- Dropdown 항목: 모든 출석 상태 표시

---

## 📐 레이아웃 치수

### 페이지 여백
- 전체 패딩: `p-8` (32px)

### 섹션 간격
- 헤더 → 필터: `mb-6` (24px)
- 필터 → 테이블: `mb-6` (24px)

### 카드 여백
- 필터 카드: `p-4` (16px)
- 테이블 셀: `px-6 py-4` (24px 좌우, 16px 상하)

### 그리드 간격
- 필터 그리드: `grid-cols-3 gap-4` (16px)

---

## 🎭 인터랙션

### 1. 출석 기록 등록 플로우

```
1. "출석 기록 등록" 버튼 클릭
   ↓
2. Dialog 모달 열림
   ↓
3. 스케줄, 회원, 상태 선택
   ↓
4. "등록" 버튼 클릭
   ↓
5. API 요청 (POST /api/attendance/records)
   ↓
6. 성공 시: Dialog 닫힘 + 테이블 새로고침
   실패 시: 에러 메시지 표시
```

### 2. 출석 상태 변경 플로우

```
1. 테이블에서 상태 Dropdown 클릭
   ↓
2. 새로운 상태 선택
   ↓
3. API 요청 (PATCH /api/attendance/records/[id])
   ↓
4. 성공 시: 테이블 새로고침
   실패 시: 에러 메시지 표시
```

### 3. 필터 적용 플로우

```
1. 스케줄/날짜 필터 변경
   ↓
2. useEffect 트리거
   ↓
3. API 요청 (GET /api/attendance/records?...)
   ↓
4. 테이블 업데이트
```

---

## 🔧 API 엔드포인트

### 1. 출석 상태 조회
```
GET /api/attendance/statuses
Response: { data: AttendanceStatus[] }
```

### 2. 출석 기록 조회
```
GET /api/attendance/records?gym_id={id}&schedule_id={id}&start_date={date}&end_date={date}
Response: { data: AttendanceRecord[] }
```

### 3. 출석 기록 생성
```
POST /api/attendance/records
Body: { gym_id, schedule_id, member_id, status_code, memo }
Response: { data: AttendanceRecord }
```

### 4. 출석 상태 변경
```
PATCH /api/attendance/records/[id]
Body: { status_code, memo }
Response: { data: AttendanceRecord }
```

### 5. 출석 기록 삭제
```
DELETE /api/attendance/records/[id]
Response: { success: true }
```

---

## 📱 반응형 고려사항

### 모바일 (< 768px)
- 테이블 → 카드 리스트로 변경 권장
- 필터 그리드 → 세로 스택 (`grid-cols-1`)

### 태블릿 (768px ~ 1024px)
- 필터 그리드 → 2열 (`grid-cols-2`)

### 데스크톱 (>= 1024px)
- 현재 레이아웃 유지 (`grid-cols-3`)

---

## 🚀 개선 예정 사항

### 단기
- [ ] 출석 기록 일괄 등록 기능
- [ ] 출석 통계 대시보드 (출석률, 노쇼율)
- [ ] 출석 기록 Excel 내보내기

### 장기
- [ ] 모바일 반응형 레이아웃
- [ ] 출석 캘린더 뷰
- [ ] 회원별 출석 히스토리 페이지

---

## 📝 참고 파일

- **페이지**: `/src/app/admin/attendance/page.tsx`
- **API**:
  - `/src/app/api/attendance/statuses/route.ts`
  - `/src/app/api/attendance/records/route.ts`
  - `/src/app/api/attendance/records/[id]/route.ts`
- **스키마**: `/weform-schema.sql` (attendances, attendance_statuses 테이블)
- **RLS 정책**: `/scripts/apply-rls-policies.sql`
