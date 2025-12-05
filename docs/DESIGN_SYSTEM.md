# We:form 디자인 시스템 명세서

## 📐 디자인 시스템 개요

We:form은 **모던하고 세련된 헬스케어 관리 플랫폼**을 지향합니다.
그라데이션 배경, 소프트 섀도우, 부드러운 애니메이션을 활용하여 사용자에게 편안하고 직관적인 경험을 제공합니다.

---

## 🎨 브랜드 컬러

### Primary Colors (주요 색상)

| 색상 | Hex | HSL | 용도 |
|------|-----|-----|------|
| **Primary Blue** | `#2F80ED` | `214 84% 56%` | 메인 브랜드 컬러, 버튼, 링크 |
| **Accent Orange** | `#F2994A` | `28 90% 62%` | 강조 포인트, 아이콘 |

### Gradient Backgrounds (그라데이션 배경)

```css
/* 메인 그라데이션 (보라-퍼플) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 블루 그라데이션 */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* 핑크 그라데이션 */
background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);

/* 브랜드 그라데이션 (Primary Blue 기반) */
background: linear-gradient(135deg, #2F80ED 0%, #1e5bb8 100%);
```

### Neutral Colors (중립 색상)

| 색상 | Hex | 용도 |
|------|-----|------|
| **Background** | `#f8fafc` (slate-50) | 페이지 배경 |
| **Foreground** | `#020617` (slate-950) | 텍스트 |
| **Gray 50-950** | Slate 계열 | 테두리, 비활성 상태 |

---

## 🖋️ 타이포그래피

### 폰트 패밀리

**Paperozi** - 전체 프로젝트에 적용된 한글 폰트

- **Weight 범위**: 100 (Thin) ~ 900 (Black)
- **주요 사용 Weight**:
  - `400` (Regular): 본문 텍스트
  - `500` (Medium): 버튼, 라벨
  - `700` (Bold): 제목 (h1-h6)

```css
font-family: 'Paperozi', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### 폰트 적용 규칙

```css
/* 본문 텍스트 */
body {
  font-family: var(--font-sans);
  font-weight: 400;
  line-height: 1.6;
}

/* 제목 */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
```

---

## 🧩 UI 컴포넌트

### 1. 카드 (Card)

**3D 카드 스타일 (추천)**

```css
.card-3d {
  background: white;
  border-radius: 20px;
  box-shadow:
    0 10px 30px -5px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateZ(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-3d:hover {
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-8px) translateZ(0);
}
```

**사용 예시**
```tsx
<div className="card-3d p-6">
  카드 내용
</div>
```

**기본 카드 스타일**

```css
.card-modern {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.card-modern:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}
```

### 2. 버튼 (Button)

**3D Primary 버튼 (추천)**
```tsx
<Button className="btn-3d bg-[#2F80ED] hover:bg-[#1e5bb8] text-white">
  확인
</Button>
```

```css
.btn-3d {
  position: relative;
  transform-style: preserve-3d;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-3d:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-3d:active {
  transform: translateY(0) scale(0.98);
}
```

**Secondary 버튼**
```tsx
<Button variant="outline" className="btn-3d border-gray-300 text-gray-700">
  취소
</Button>
```

### 3. 배지 (Badge)

**3D 출석 상태 배지 (추천)**
```tsx
<Badge className="badge-3d bg-emerald-500 text-white">출석</Badge>
<Badge className="badge-3d bg-red-500 text-white">노쇼</Badge>
<Badge className="badge-3d bg-blue-500 text-white">예약</Badge>
```

```css
.badge-3d {
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transform: translateZ(0);
  transition: all 0.2s ease;
}

.badge-3d:hover {
  transform: translateY(-1px) translateZ(0);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}
```

### 4. 사이드바 네비게이션

**그라데이션 배경 사이드바**
```tsx
<aside className="w-64 bg-gradient-to-b from-[#2F80ED] via-[#667eea] to-[#764ba2] text-white">
  {/* 메뉴 아이템 */}
</aside>
```

**메뉴 아이템 (활성/비활성)**
```tsx
{/* 활성 */}
<Link className="bg-white text-[#2F80ED] shadow-soft rounded-xl px-4 py-3">
  대시보드
</Link>

{/* 비활성 */}
<Link className="text-white/90 hover:bg-white/20 hover:scale-[1.02] rounded-xl px-4 py-3">
  스케줄
</Link>
```

---

## 📏 스페이싱 & 레이아웃

### Border Radius (모서리 둥글기)

| 클래스 | 값 | 용도 |
|--------|---|------|
| `rounded-xl` | `16px` | 카드, 버튼 |
| `rounded-2xl` | `20px` | 큰 컨테이너 |

### Box Shadow (그림자)

| 클래스 | 값 | 용도 |
|--------|---|------|
| `shadow-soft` | `0 4px 6px rgba(0,0,0,0.1)` | 기본 카드 |
| `shadow-soft-lg` | `0 20px 25px rgba(0,0,0,0.1)` | hover 상태 |

### 간격 (Padding/Margin)

- **페이지 여백**: `p-8` (32px)
- **카드 내부 여백**: `p-6` (24px)
- **버튼 여백**: `px-4 py-3`
- **섹션 간격**: `space-y-6` (24px)

---

## 🎭 애니메이션

### Fade In 애니메이션

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
```

### Float 애니메이션 (3D 효과)

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float-animation {
  animation: float 3s ease-in-out infinite;
}
```

### Pulse 애니메이션 (3D 효과)

```css
@keyframes pulse-3d {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(47, 128, 237, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(47, 128, 237, 0);
  }
}

.pulse-3d {
  animation: pulse-3d 2s ease-in-out infinite;
}
```

### Hover 효과

```css
/* 3D 카드 */
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)]
hover:translate-y-[-8px]

/* 3D 버튼 */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
hover:translate-y-[-2px] hover:scale-[1.02]

/* 메뉴 아이템 */
transition: all 0.2s ease;
hover:bg-white/20 hover:scale-[1.02] hover:shadow-lg
```

---

## 🌈 페이지별 배경 스타일

### Admin Layout (관리자 페이지)

```tsx
<div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
```

- **배경**: 부드러운 그라데이션 (gray-50 → blue-50/30 → purple-50/30)
- **사이드바**: 그라데이션 (Primary Blue → Purple)

### 로그인/회원가입 페이지

```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
```

- **배경**: 밝은 블루-퍼플 그라데이션
- **카드**: 흰색 배경 + shadow-soft-lg

---

## 📱 반응형 디자인

### 브레이크포인트

| 크기 | 화면 | 비고 |
|------|------|------|
| `sm` | 640px | 모바일 |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 큰 화면 |

### 사이드바 반응형

```tsx
{/* 모바일: 숨김, 데스크톱: 표시 */}
<aside className="hidden lg:block w-64">
```

---

## 🔧 Tailwind 커스텀 설정

### tailwind.config.ts

```typescript
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary))",      // #2F80ED
      accent: "hsl(var(--accent))",        // #F2994A
      point: "hsl(var(--point))",
    },
    fontFamily: {
      sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      heading: ["var(--font-heading)", "system-ui", "sans-serif"],
    },
    backgroundImage: {
      'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'gradient-blue': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'gradient-purple': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'gradient-brand': 'linear-gradient(135deg, #2F80ED 0%, #1e5bb8 100%)',
    },
    boxShadow: {
      'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      'soft-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  },
}
```

---

## 📦 컴포넌트 라이브러리

### shadcn/ui 사용

현재 프로젝트에서 사용 중인 shadcn/ui 컴포넌트:

- `Button`
- `Badge`
- `Select`
- `Dialog`
- `Input`
- `Label`
- `Textarea`

**설치 위치**: `/Users/kimsoyeon/Desktop/weform/src/components/ui/`

---

## 🎯 디자인 원칙

### 1. **일관성 (Consistency)**
- 모든 페이지에서 동일한 색상, 폰트, 간격 사용
- 버튼, 카드, 배지 스타일 통일

### 2. **명확성 (Clarity)**
- 계층 구조를 시각적으로 명확하게 표현
- 주요 액션 버튼은 Primary Blue 사용
- 부가 액션은 Outline 스타일 사용

### 3. **접근성 (Accessibility)**
- 충분한 색상 대비 (WCAG AA 기준)
- 텍스트 크기: 최소 14px (text-sm)
- 클릭 가능한 영역: 최소 44x44px

### 4. **반응성 (Responsiveness)**
- 모바일 우선 디자인
- 태블릿, 데스크톱에서 적절한 레이아웃 조정

### 5. **성능 (Performance)**
- 부드러운 애니메이션 (0.2s ~ 0.5s)
- 최소한의 그림자 효과
- 웹 폰트 최적화 (font-display: swap)

---

## 📸 디자인 참고 자료

### 영감 출처
- **그라데이션**: [uigradients.com](https://uigradients.com)
- **색상 조합**: Primary Blue (#2F80ED) + Accent Orange (#F2994A)
- **폰트**: Paperozi (한글 웹폰트)
- **UI 패턴**: shadcn/ui 컴포넌트 라이브러리

### 현재 적용된 디자인 스타일

1. **사이드바**: 세로 그라데이션 (Blue → Purple)
2. **메인 페이지**: 부드러운 배경 그라데이션
3. **카드**: 흰색 배경 + 소프트 섀도우 + hover 효과
4. **버튼**: Primary Blue + hover 시 scale up
5. **배지**: 상태별 색상 구분 (녹색=출석, 빨강=노쇼, 파랑=예약)

---

## 🎨 3D 스타일링 가이드

### 핵심 원칙
1. **깊이감**: 그림자와 inset 효과로 입체감 표현
2. **광택**: 상단에 밝은 그라데이션 오버레이
3. **자연스러운 움직임**: cubic-bezier 곡선 사용
4. **레이어링**: transform: translateZ(0)로 GPU 가속

### 주요 3D 클래스

| 클래스 | 용도 | 효과 |
|--------|------|------|
| `card-3d` | 카드 컨테이너 | 깊은 그림자 + hover 시 떠오름 |
| `btn-3d` | 버튼 | 누를 수 있는 느낌 + 클릭 피드백 |
| `badge-3d` | 배지 | 볼록한 느낌 + inset 하이라이트 |
| `table-3d` | 테이블 | 깊이감 있는 컨테이너 |
| `input-3d` | 입력 필드 | 오목한 느낌 |
| `header-3d` | 헤더 | 그라데이션 + 광택 효과 |

### 사용 예시

```tsx
{/* 3D 헤더 */}
<div className="header-3d">
  <h1 className="text-4xl font-bold text-white drop-shadow-lg">
    제목
  </h1>
</div>

{/* 3D 카드 */}
<div className="card-3d p-6 animate-fade-in">
  내용
</div>

{/* 3D 버튼 */}
<Button className="btn-3d bg-[#2F80ED] text-white">
  클릭
</Button>

{/* 3D 배지 */}
<Badge className="badge-3d bg-emerald-500 text-white">
  출석
</Badge>

{/* 3D 테이블 */}
<div className="table-3d">
  <table>...</table>
</div>

{/* 3D 입력 */}
<Input className="input-3d" />
```

---

## 🚀 다음 단계

이 디자인 시스템을 기반으로 다음 작업을 진행합니다:

1. ✅ **출석 관리 페이지** - 완료 (3D 스타일링 적용)
2. 🔄 **매출 로그 페이지** - 3D 디자인 적용 예정
3. 🔄 **급여 관리 페이지** - 3D 디자인 적용 예정
4. 🔄 **시스템 로그 페이지** - 3D 디자인 적용 예정

각 페이지별 상세 디자인 가이드는 `docs/pages/` 폴더에서 관리합니다.
