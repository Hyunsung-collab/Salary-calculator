# Salary Calculator — 핵심 사용자 흐름 개편 결과

작업 위치: `/Users/kimhyunsung/Downloads/Salary-calculator-main`

브랜치: `redesign/salary-calculator-astra`

기준점: `6117c15c385ad9dc4d3ffb96b3eabf735746bd90`. 작업 전 로컬/원격 `design/salary-app-ux`와 동일함을 `git ls-remote`로 확인했다. Astra worktree는 작업 전 clean이었다. First commit 기반 `salary-calculator-bugfix-duplicate-display`의 미커밋 변경은 수정하지 않았다. 파일 이식이나 브랜치 병합은 하지 않았다.

## 1. 기존 사용자 흐름 문제

데이터 복원 전 일반 Home이 잠깐 나타났으며 Setup 중에도 메뉴가 보였다. 근무 생성 후 별도 결과 카드에서 완료 버튼을 눌러야 했다. 시간 선택은 30분 단위였고 Calendar는 없었다.

## 2. 새 전체 사용자 흐름

새 사용자: 급여 조건 → 근무 입력 → 생성 성공 → 일반 Home의 예상 급여와 Calendar.

재방문 사용자: 데이터 복원 → 일반 Home. 전체 초기화: 급여 조건부터 다시 시작.

## 3. 급여조건 첫 화면 구현

복원 중에는 로딩 안내를 표시한다. Setup은 기존 `SalarySettingsForm`을 사용한다. 주요 수당/공제 선택을 펼쳐 보여주며 공제 세부 항목과 배율 설정은 필요할 때 표시한다. 중복 설명을 줄였다.

## 4. 급여조건 → 근무 입력 자동 전환

기존 `setupSettingsDraft`를 유지한다. ‘근무 입력으로 계속’에서만 기본 설정과 선택 월 snapshot에 반영한다. 설정 Form의 오류가 있으면 진행을 차단한다.

## 5. 근무 입력 최종 UX

선택 월 전체를 기본 기간으로 제공한다. 요일 선택, 공통 출퇴근/휴게시간, 휴게 없음, 요일별 예외 설정을 재사용한다. 요일별 설정은 접어도 적용된다. 요일별 휴게 없음 해제 시 이전 휴게시간을 복원한다.

## 6. 시간 선택 방식

브라우저 기본 `<select>`로 시(00–23)와 분(00–59)을 선택한다. 기존 프로젝트의 네이티브 선택 방식에서 1분 단위로 확장했다. 패키지 추가 없음.

## 7. 직접 시간 입력 방식

텍스트 필드에서 `09:00`, `18:30`처럼 24시간 형식으로 입력한다. 숫자만 입력한 `900` 등의 자동 변환은 도입하지 않았다.

## 8. 두 입력 방식의 공통 state 구조

두 UI 모두 기존 template 또는 editor draft의 `startTime`/`endTime`을 읽고 갱신한다. 모드별 시간 state를 따로 저장하지 않는다. 입력 중 불완전한 문자열은 draft에만 존재하며, 유효한 `HH:mm`만 WorkEntry로 저장된다. `09:17`도 모드 전환과 수정 화면에서 유지된다.

## 9. Validation

00:00–23:59 범위를 검증한다. 잘못된 시간, 음수/소수 휴게시간, 휴게를 뺀 근무가 0분 이하인 경우 저장을 막는다. 반복 입력과 개별 수정이 같은 검증 helper를 사용한다. 반복 생성 기간은 선택 월 안으로 제한한다.

## 10. WorkEntry 생성 흐름

기존 WorkTemplateForm 생성 → SalaryCalculator의 전체 entries 대상 conflict 검사 → acceptedEntries 추가 → 월별 snapshot materialization을 유지했다. 급여 계산식은 추가하지 않았다.

## 11. 생성 완료 후 결과 이동

최초 Setup에서 acceptedEntries가 1개 이상이면 setupCompleted와 setupStep을 갱신하고 Home을 표시한다. 0건이면 입력 화면에 남는다. 부분 성공 안내도 Home에 표시된다. 개별 근무로 Setup을 시작하는 흐름도 지원한다.

## 12. 결과/Home 최종 구조

총 예상 실수령액 → 총 지급액/예상 공제 → Calendar → 근무 요약/최근 기록. Setup 전용 결과 카드는 제거했다. Work의 관리 기능, Salary의 지급·공제 상세/계산 기준/Payslip은 유지했다.

## 13. Calendar 구현 방식

React와 CSS Grid 7열, 월요일 시작. 기존 월 시작일/말일/월 이름 helper를 사용한다. 별도 Calendar 패키지나 calendarMonth state는 없다.

## 14. Calendar 데이터 매핑

선택 월 entries를 날짜별 배열로 묶는다. 같은 날짜 여러 기록은 병합하지 않는다. 모바일에서는 근무 여부·건수를, 넓은 화면에서는 단일 근무 시간을 표시한다. 날짜를 누르면 모든 시간/휴게시간을 확인하고 Work 관리로 이동할 수 있다. 출근일 기준이며 야간 근무 상세는 ‘다음 날’로 표시한다.

## 15. existing domain/storage 재사용 내용

`WorkEntry`, `SalarySettings`, `calculateSalary`, `useSalary`, `time.ts`, conflict engine, 월별 snapshot 정책, Storage V2, JSON v1/v2 migration/restore, V2 export, Excel 매핑 코드는 그대로 유지했다.

실제 상태: entries / defaultSettings / settingsByMonth / selectedMonth / selectedMonthEntries / selectedMonthSettings / breakdown.

저장 구조: version: 2 / entries / defaultSettings / settingsByMonth / savedAt.

## 16. 새로 만든 컴포넌트

- `TimeInput` 및 `TimeInputModeControl`: 공통 시간 입력과 방식 선택.
- `WorkCalendar`: 월간 근무 가시화와 날짜 상세.

## 17. 수정 파일

| 파일 | 변경 이유 |
| --- | --- |
| `src/features/salary-calculator/SalaryCalculator.tsx` | 복원 전 표시, Setup 완료·초기화·메뉴 흐름 |
| `src/features/salary-calculator/SalaryHome.tsx` | 설정 CTA, 공통 Home 결과, Calendar 연결 |
| `src/features/salary-calculator/SalarySettingsForm.tsx` | 수당/공제 배치 및 Setup validity 전달 |
| `src/features/salary-calculator/WorkTemplateForm.tsx` | 입력 방식, 검증, 요일별 예외 유지·휴게 없음 |
| `src/features/salary-calculator/work/WorkEntryEditor.tsx` | 공통 시간 UI·검증, 분 단위 값 유지 |
| `src/features/salary-calculator/TimeInput.tsx` | 신규 시간 입력 컴포넌트 |
| `src/features/salary-calculator/WorkCalendar.tsx` | 신규 달력 컴포넌트 |
| `src/lib/workTimeValidation.ts` | 신규 공통 시간/휴게 검증 |
| `tests/salary-flow.test.cjs` | 재실행 가능한 입력·계산·충돌·Storage 회귀 검사 |
| `docs/core-flow-redesign.md` | 기준점, 구현 결과, 검증 및 한계 기록 |

## 18. 기존 기능 회귀 여부

별도 프로필의 Chrome에서 검증했다. 사용자의 실제 localStorage는 사용하지 않았다.

| 시나리오 | 결과 |
| --- | --- |
| 새 사용자/초기화 첫 화면=급여 조건, Setup 중 메뉴 숨김 | 통과 |
| 설정 draft 유지, 확정 시 기본값·월 snapshot 저장 및 근무 단계 이동 | 통과 |
| 선택식 09:00–18:00, 직접 입력 월요일 09:30–18:30 | 통과 |
| 09:17 입력 방식 왕복, 개별 수정 22:17 유지 | 통과 |
| 25:70 반복 생성 차단, 25:00 개별 저장 차단 | 통과 |
| 월~금 22건, 수요일 13:00–22:00 적용 | 통과 |
| accepted=0 유지, 부분 성공 4건/충돌 제외 22건 안내 | 통과 |
| Home/Salary/Payslip 예상 실수령액 일치 | 통과 |
| 9월 30일/8월 31일 달력과 월별 급여 동기화 | 통과 |
| 같은 날짜 2건 표시 및 상세, 수정 시 겹침 차단 | 통과 |
| setupCompleted 재방문, 전체 초기화 후 새로고침 | 통과 |
| 실제 JSON v1/v2 파일 복원, V2 파일 다운로드 | 통과 |
| 8월 시급 10,500 / 9월 11,000 snapshot 유지 | 통과 |
| 자정 초과·휴게 없음 첫 근무 생성 | 통과 |
| 요일별 예외 접기 후 값 적용, 45분 휴게 복원 | 통과 |
| 375px 설정/입력/결과/Calendar/메뉴/모달 가로 overflow | 없음 |

추가 검증: TypeScript 및 `git diff --check` 통과. Node 회귀 테스트 6개를 Asia/Seoul과 UTC에서 모두 통과했다.

재실행:

```sh
node --test tests/salary-flow.test.cjs
```

## 19. Build 결과

`npm run build` 1회 실행으로 성공. Turbopack 컴파일, TypeScript, 정적 페이지 생성 모두 통과. 재시도·패키지 설치·캐시 삭제 없음.

개발 실행 중 `next-env.d.ts`가 dev 경로로 자동 변경됐으나 프로덕션 빌드가 원래 경로로 다시 생성했다. 최종 diff에는 생성 파일 변경이 없다. Browserslist의 기존 데이터 갱신 안내가 있었으며 업데이트는 실행하지 않았다.

## 20. 사용자가 직접 확인해야 할 테스트

- 실제 iPhone/Safari 및 Android에서 시·분 선택, 직접 타이핑, 소프트 키보드와 스크롤 감각.
- 실제 급여 조건/근무 패턴으로 결과 확인.
- 실제 Excel 파일과 프린터/PDF 출력 환경 확인. Excel 코드는 변경하지 않았으며 이번 브라우저 검증에 Excel 업로드는 포함하지 않았다.

Chrome의 375px 화면 검증은 실제 모바일 기기 검증을 대체하지 않는다.

## 21. 발견했지만 수정하지 않은 문제

기존 `src/components/ui/dialog.tsx`의 DialogTitle/Description은 Radix primitive 대신 일반 h2/p로 정의되어 있다. 모달의 `aria-labelledby`/`aria-describedby`가 가리키는 요소가 실제로 없는 것을 확인했다. 이번 변경으로 도입된 문제는 아니며, 공통 Dialog 접근성 개선은 별도 과제로 남겼다.

Git add / commit / push / merge / reset / restore / clean 및 파일 삭제 명령은 실행하지 않았다.
