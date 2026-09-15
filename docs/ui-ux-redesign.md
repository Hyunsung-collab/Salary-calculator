# 급여 관리 서비스 UI/UX 개편 설계

## 1. 현재 화면 구조

현재 진입점은 `src/app/page.tsx`이며 `SalaryCalculator`를 렌더링한다.
`src/features/salary-calculator/SalaryCalculator.tsx`가 `entries`,
`settings`, 엑셀 모달 상태, 저장 상태를 소유하고 화면을 조합한다.

현재 화면은 다음 구조다.

```text
SalaryCalculator
├── 상단 제목 및 엑셀/JSON/초기화 액션
├── 근무 기록 입력 Card
│   ├── SalarySettingsForm
│   └── WorkLogForm
├── WorkTemplateForm
├── SalarySummary
├── 계산 기준 안내
├── PayslipPreview
├── PayslipReport (인쇄 전용)
└── ExcelMapperModal
```

## 2. 현재 데이터 흐름

```text
WorkLogForm / SalarySettingsForm / WorkTemplateForm / ExcelMapperModal
→ SalaryCalculator의 entries 또는 settings 상태 변경
→ useSalary(entries, settings)
→ calculateSalary(entries, settings)
→ SalaryBreakdown 생성
→ SalarySummary / PayslipPreview / PayslipReport 렌더링
→ useEffect가 localStorage에 entries/settings 저장
```

`src/lib/storage.ts`는 `SALARY_STORAGE_KEY`를 사용해 `SavedSalaryData`
형식으로 저장하고, `SalaryCalculator`는 `isHydrated` 이후 자동 저장한다.

## 3. 현재 UX 문제

- 첫 화면에서 설정, 근무 입력, 템플릿, 결과가 동시에 노출되어 첫 행동이 불분명하다.
- `SalarySummary`는 세전 합계를 중심으로 보여 주며, 서비스의 핵심 가치인 실수령액이 충분히 첫 화면의 중심이 되지 않는다.
- 급여 설정과 근무 기록이 같은 입력 카드 안에 섞여 있다.
- 모바일에서는 테이블 대신 카드가 제공되지만, 화면 정보 구조 자체는 데스크톱 입력 중심이다.
- 엑셀, JSON 백업, JSON 복원, 초기화가 핵심 행동과 같은 수준으로 노출된다.
- 근무 기록이 없을 때 사용자가 무엇을 먼저 해야 하는지 안내하는 제품 수준의 빈 상태가 부족하다.
- 상세 지급/공제 내역이 계산 결과와 함께 비교적 일찍 노출된다.
- 입력 오류 표시와 필드 연결이 제한적이다.
- 저장 성공 상태는 있으나 홈 대시보드의 주요 상태 정보로 통합되어 있지 않다.
- 향후 계정, 클라우드 동기화, 오프라인 상태를 넣을 전용 화면 경계가 없다.

## 4. 유지해야 할 기존 기능

- `WorkEntry`, `SalarySettings`, `SalaryBreakdown` 타입
- `calculateSalary`의 계산 공식과 정책값
- `useSalary`의 기존 반환 인터페이스
- `WorkLogForm`의 추가·수정·삭제
- `SalarySettingsForm`의 설정 변경
- `WorkTemplateForm`의 기간·요일별 일괄 추가
- `ExcelMapperModal`의 엑셀 컬럼 매핑
- `PayslipPreview`와 `PayslipReport`의 미리보기·인쇄
- `src/lib/storage.ts`의 localStorage 데이터 형식 및 JSON 백업 형식

## 5. 새로운 사용자 흐름

### 신규 사용자

```text
홈 진입
→ 급여 조건 확인
→ 오늘 근무 추가
→ 실시간 예상 실수령액 확인
→ 필요할 때 지급/공제 상세 열기
```

### 반복 사용자

```text
홈 진입
→ 이번 달 실수령액과 근무 요약 확인
→ 오늘 근무 추가 또는 최근 기록 수정
→ 월말 급여 상세 및 명세서 확인
```

## 6. 정보 구조

### 홈

- 이번 달 예상 실수령액
- 총 지급액 및 예상 공제액
- 근무일 수와 총 근무시간
- 오늘 근무 추가
- 최근 근무 기록
- 저장 상태
- 확인이 필요한 설정 또는 입력 항목

### 근무

- 월간 근무 요약
- 날짜별 근무 기록
- 근무 추가·수정·삭제
- 근무 템플릿
- Excel 불러오기
- 향후 달력 보기 확장 지점

### 급여

- 예상 실수령액
- 총 지급액 및 총 공제액
- 근무시간·연장·야간 요약
- 지급/공제 상세
- 계산 기준
- 급여명세서

### 전체

- 급여 설정
- 근무 템플릿
- Excel
- JSON 백업·복원
- 데이터 초기화
- 향후 계정·동기화
- 개인정보 처리방침·이용약관·지원

## 7. 모바일 내비게이션

`AppSection = "home" | "work" | "salary" | "more"`를 사용한다.
현재 단계에서는 URL 라우팅보다 `SalaryCalculator`가 소유하는 내부 화면
상태가 적절하다. 계산 데이터 상태와 화면 탭 상태는 분리한다.

모바일 하단에는 다음 탭을 둔다.

```text
홈 | 근무 | 급여 | 전체
```

각 탭은 아이콘과 텍스트를 함께 표시하고 `aria-label`, `aria-current`,
최소 44px 터치 영역을 제공한다. 하단 고정 영역 때문에 콘텐츠가 가려지지
않도록 페이지에 하단 패딩을 둔다. 향후 `env(safe-area-inset-bottom)`을
추가할 수 있도록 내비게이션 래퍼를 별도 컴포넌트로 둔다.

## 8. 데스크톱 구조

1024px 이상에서는 상단 내비게이션 또는 좌측 내비게이션을 사용한다.
현재 규모에서는 화면 상태 로직을 공유하면서 상단 내비게이션을 모바일
하단 내비게이션과 같은 컴포넌트에서 반응형으로 배치하는 방식이 적절하다.

- 중앙 콘텐츠 최대 너비 유지
- 홈은 요약 카드 중심의 2열 레이아웃
- 근무와 급여는 넓은 편집/상세 영역
- 전체는 설정과 관리 기능을 그룹으로 표시

## 9. 컴포넌트 구조 제안

```text
SalaryCalculator
├── SalaryAppNavigation
├── AppSectionRenderer
│   ├── SalaryHome
│   │   ├── SalaryHeroCard
│   │   ├── MonthlyWorkSummary
│   │   ├── RecentWorkEntries
│   │   └── StorageStatus
│   ├── WorkSection
│   │   ├── WorkLogForm
│   │   ├── WorkTemplateForm
│   │   └── ExcelMapperModal
│   ├── SalarySection
│   │   ├── SalarySummary
│   │   ├── PayslipPreview
│   │   └── PayslipReport
│   └── MoreSection
│       ├── SalarySettingsForm
│       ├── WorkTemplateForm
│       └── DataManagement
```

이 구조는 컴포넌트를 지나치게 잘게 나누지 않고, 실제 제품 영역과
향후 서버 동기화 경계를 일치시키는 것을 목표로 한다.

## 10. 상태를 소유할 컴포넌트

- `SalaryCalculator`
  - `entries`, `settings`
  - `mapperOpen`
  - `isHydrated`, 저장 시각 및 저장 오류
  - 현재 `AppSection`
- `SalaryHome`, `WorkSection`, `SalarySection`, `MoreSection`
  - 화면 전용 UI 상태만 소유
- `WorkLogForm`
  - 편집 중인 행을 별도 전역 상태로 소유하지 않고 기존 콜백 흐름 유지
- `storage.ts`
  - 저장 데이터의 직렬화·검증만 담당하며 React 상태는 소유하지 않음

향후 API와 로그인 도입 시 `SalaryCalculator`의 데이터 콜백을 서버 저장
훅 또는 도메인 서비스로 교체할 수 있도록 UI 컴포넌트는 props 기반으로
유지한다.

## 11. 기존 컴포넌트 재사용 계획

- `WorkLogForm`: 근무 화면의 핵심 편집 컴포넌트로 재사용
- `SalarySettingsForm`: 전체 화면의 설정 영역으로 재사용
- `WorkTemplateForm`: 근무 및 전체에서 재사용하되 실제 상태는 상위에서 관리
- `SalarySummary`: 급여 화면의 요약 또는 홈의 일부 카드로 재사용
- `PayslipPreview`, `PayslipReport`: 급여 화면에서 재사용
- `ExcelMapperModal`: 근무 화면의 관리 액션에서 호출
- `src/components/ui/*`: 버튼, 카드, 다이얼로그, 입력 스타일 유지

## 12. 이동·분리·삭제 후보

- 현재 `SalaryCalculator`의 큰 JSX를 `SalaryHome`, `WorkSection`,
  `SalarySection`, `MoreSection`으로 이동
- 저장 상태 표시를 `StorageStatus`로 분리
- 상단 액션에 섞인 백업/복원/초기화를 `DataManagement` 영역으로 이동
- 결과 안내 문구는 `SalarySection`의 계산 기준 영역으로 이동
- 기존 `SalarySummary`를 즉시 삭제하지 않고 홈 카드와 급여 상세에서
  재사용 가능한지 확인
- 계산 공식, 타입, 저장 형식은 삭제·변경하지 않음

## 13. 디자인 시스템 방향

- 넓은 여백과 단순한 카드 구조
- 핵심 숫자는 큰 글자와 충분한 대비로 강조
- 금액에는 `tabular-nums` 적용
- 주요 행동은 화면당 하나를 우선 강조
- 보조 행동은 outline 또는 메뉴 그룹으로 낮춤
- 색상만으로 상태를 전달하지 않고 텍스트와 아이콘 병행
- 기존 Slate 계열 Tailwind 색상과 컴포넌트 스타일 재사용
- 상세 정보는 `details`, 접기 영역 또는 별도 화면으로 점진적 공개

## 14. 접근성 기준

- 모든 입력은 연결된 `label`과 고유 `id` 사용
- 탭에는 키보드 포커스와 `aria-current` 제공
- 아이콘 버튼에는 `aria-label` 제공
- 제목은 `h1 → h2 → h3` 순서를 유지
- 선택 상태를 색상뿐 아니라 텍스트, 굵기, 표시선으로 구분
- 최소 44px 터치 영역
- 오류는 입력 근처에 표시하고 색상 외 텍스트도 제공
- 모달 열림 시 포커스 이동과 ESC 닫기 유지

## 15. 반응형 대응 계획

| 폭 | 대응 |
|---:|---|
| 320px | 단일 열, 짧은 버튼 문구, 하단 탭 고정, 금액 줄바꿈 방지 |
| 375px | 홈 카드 세로 배치, 최근 기록 카드 사용 |
| 390px | 핵심 요약 2열까지 허용하되 최소 너비 확인 |
| 768px | 입력과 결과의 2열 전환, 하단 탭에서 상단 탭으로 전환 검토 |
| 1024px 이상 | 최대 너비 콘텐츠와 데스크톱 내비게이션 사용 |

모든 폭에서 `overflow-x-hidden`에 의존하기보다 긴 숫자와 버튼의 실제
너비를 관리한다. 기존 근무 편집은 모바일 카드, 데스크톱 테이블 원칙을
유지한다.

## 16. 향후 4~9단계 확장 지점

- 4단계: `SalaryCalculator`의 계산/저장 콜백 경계에 `/api/calculate`,
  CRUD 요청을 연결한다.
- 5단계: `SalaryCalculator`의 로컬 데이터 소유 위치에 인증 사용자와
  클라우드 데이터 상태를 연결하고 충돌 상태를 별도 표시한다.
- 6단계: `loading`, `error`, `not-found`, 약관·지원 화면을 내비게이션과
  별도 라우트로 추가한다.
- 7단계: 내비게이션과 `StorageStatus`에 온라인·오프라인·동기화 대기
  상태를 표시한다.
- 8단계: 하단 내비게이션에 Safe Area를 적용하고 파일·공유 동작을
  플랫폼 어댑터로 연결한다.
- 9단계: 전체 화면에 계정 삭제, 개인정보, 지원 진입점을 제공한다.

## 17. 단계별 구현 순서

1. `AppSection`과 공통 내비게이션 추가
2. 현재 입력·결과 JSX를 화면별 섹션으로 이동
3. 홈 Hero와 월간 요약 추가
4. 최근 근무 기록과 빈 상태 추가
5. 관리 기능을 전체 화면으로 이동
6. 모바일/데스크톱 내비게이션과 포커스 검증
7. 각 단계마다 급여 계산, 저장, 엑셀, 인쇄 회귀 확인

## 18. 이번 UI 개편에서 구현하지 않을 범위

- 급여 계산 공식 및 정책값 변경
- `WorkEntry`, `SalarySettings`, `SalaryBreakdown` 변경
- API, Supabase, PostgreSQL, 로그인
- PWA, Capacitor, 네이티브 기능
- 서버·클라이언트 계산 불일치 처리
- 새로운 외부 UI 또는 상태관리 라이브러리
- 달력 구현
- 법률 문서의 실제 내용 작성

## 19. 예상 위험과 회귀 테스트 계획

### 위험

- 화면 이동 중 기존 `entries`와 `settings` 상태가 초기화될 위험
- 기존 인쇄용 `print-only` 영역이 내비게이션에 영향을 받을 위험
- 모바일 하단 내비게이션이 Dialog 또는 키보드와 겹칠 위험
- 홈 요약을 위해 계산 공식을 UI에서 중복 구현할 위험
- localStorage 복원 전 기본값 저장이 재발생할 위험

### 회귀 테스트

- 빈 상태에서 첫 근무 추가
- 근무 기록 추가·수정·삭제
- 템플릿 일괄 추가
- 엑셀 매핑 및 임포트
- 연장·야간·주휴·공제 계산
- 급여명세서 미리보기 및 인쇄
- 새로고침 후 localStorage 복원
- JSON 백업·복원 및 잘못된 파일
- 320px, 375px, 390px, 768px, 1024px 화면
- 키보드 탭 이동과 Dialog 포커스

