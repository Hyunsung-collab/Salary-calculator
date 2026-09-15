# Salary Calculator — UX 보완 및 사용자 행동 피드백 개선 완료 보고

작업 기준: `/Users/kimhyunsung/Downloads/Salary-calculator-main`, `redesign/salary-calculator-astra`, `1bb64e45 refactor : complete SC v2`.

최신 V2 코드 위에서 수정했다. First commit 기반의 다른 worktree에는 쓰기 작업을 하지 않았다. 아래 브라우저 검증은 사용자 데이터와 분리된 임시 Chrome 프로필에서 실행했다.

## 1. 기존 시간 입력 문제

실제 기존 코드에는 시/분 선택과 `type="text"` 직접 입력이 이미 있었다. 키보드 입력을 금지하는 코드는 없었다. 기본 선택 모드와 짧은 안내만으로 입력 방법을 이해하기 어렵고, 타이핑 중 미완성 값에 즉시 오류가 표시되는 문제가 있었다. 기능 부재로 단정하거나 시간 모델을 재구현하지 않았다.

## 2. 수정된 시간 입력 UX

‘시간 입력 방식’ 아래 ‘시간 선택 / 직접 입력’을 명시하고, 현재 모드의 사용법을 표시한다. 선택 상태는 버튼 스타일과 `aria-pressed`로 전달한다. 텍스트 입력은 작성 중 성급한 오류 표시를 줄이고 포커스를 벗어날 때 검사한다.

## 3. 시간 선택 구현

기존 시 00–23 / 분 00–59 선택을 유지했다. 1분 단위의 기존 값을 그대로 선택할 수 있다. 선택 모드의 09:00–18:00 개별 저장을 브라우저에서 확인했다.

## 4. 키보드 직접 입력 구현

native time picker와 분리된 실제 텍스트 입력이다. Chrome 키보드 입력으로 09:30, 18:45를 작성·저장했다. 포커스를 벗어나면 유효한 900 / 930 / 1830을 09:00 / 09:30 / 18:30으로 정규화한다. 잘못된 숫자는 유효한 시간으로 임의 변환하지 않는다.

## 5. 두 모드의 공통 state

각 시간의 기존 값 하나를 두 UI가 사용한다. 모드별 시간 state를 추가하지 않았다. 작성 중 미완성 문자열은 기존 폼 draft에만 있고, 저장하는 WorkEntry는 검증된 HH:mm이다. 반복 폼의 공통 시간과 요일별 시간은 입력 모드 하나를 공유한다. 수요일 1030 입력 → 10:30 선택 표시 → 직접 입력으로 복귀 → 실제 저장을 검증했다.

## 6. 시간 validation

기존 strict HH:mm 검증을 유지했다. 25:00 / 12:75는 실제 브라우저에서 생성이 차단됐다. 단위 테스트에는 00:00 / 23:59 경계와 2430 / 2500 / 1290 / 9abc / abcd 등의 정규화 차단도 포함했다. 기존 휴게시간, 자정 넘김 검증은 그대로 사용한다.

## 7. 사용자 행동 Feedback 개선

| Action | 기존 | 변경 후 |
| --- | --- | --- |
| 급여 조건 확정 | 단계 이동 | 반영 안내와 근무 단계 이동 |
| 개별 근무 추가 | 근무 화면 내부 알림 | 날짜 포함 전역 ActionToast; 최초 Setup 추가에도 연결 |
| 근무 수정 | 화면 내부 알림 | 공통 ActionToast로 결과 전달 |
| 근무 삭제 | 확인 후 목록 변화 | 기존 확인 유지 + 삭제 완료 안내 |
| 반복 근무 생성 | 화면별 완료 안내 | 실제 추가 건수 안내 |
| 부분 성공 | 추가/제외 결과 분리 | 추가·충돌 제외 건수를 한 문장으로 표시 |
| 전체 충돌 | 경고 feedback | 폼 안 role=alert, 입력 화면 유지 |
| Excel import | 수동 열 연결 후 반영 | 양식·자동 연결·성공 건수·Home/해당 월 이동 |
| Excel 실패 | 실패 안내와 행 검증 부족 | 파일/열/행 오류 안내, 전부 무효면 기존 데이터 보존 |
| 월별 급여 조건 수정 | 화면 내부 알림 | 공통 완료 안내 + 무효 값 저장 차단 |
| 전체 초기화 | Setup으로 복귀 | 완료 안내; 저장소 실패 시 데이터 보존과 오류 안내 |

기존 ActionToast를 SalaryCalculator에 연결했다. 화면 이동 후에도 안내가 유지되고 5초 후 사라진다. 성공/부분 성공은 polite, 오류는 alert/assertive를 사용한다. 폼 내부 오류는 기존 role=alert로 전달한다. Dialog 제목/설명도 Radix primitive로 연결했다.

## 8. 근무 추가/수정/삭제 Feedback

추가 날짜, 수정 완료, 삭제 완료를 명확하게 알린다. 개별 저장을 같은 브라우저 작업에서 두 번 호출해도 한 건만 저장되는 것을 확인했다. 삭제 확인 Dialog는 유지한다. 동기식 저장에는 인위적인 spinner를 추가하지 않았다.

## 9. 반복 근무 생성/부분 성공 Feedback

실제 `addedCount / skippedCount`를 사용한다. 1건 성공, 1건 추가 + 1건 충돌 제외, 모두 충돌을 검증했다. 모두 충돌하면 폼을 닫지 않는다. Calendar·근무일 수·시간·예상 급여·목록은 기존 entries와 월별 settings에서 함께 파생된다.

## 10. Excel Template 다운로드

설치된 xlsx로 브라우저에서 `급여계산기_근무기록_입력양식.xlsx`를 만든다. 실제 다운로드 파일과 XLSX 재읽기를 검증했다. 첫 시트 ‘근무 기록’에 선택한 달의 예시 2행이 있다. 새 패키지를 추가하지 않았다.

## 11. Excel Template column

| 열 | 예시 | 의미 |
| --- | --- | --- |
| 날짜 | 2026-09-01 | YYYY-MM-DD |
| 출근 | 09:00 | HH:mm |
| 퇴근 | 18:00 | HH:mm |
| 휴게(분) | 60 | 분 단위 숫자 |

기존 FIELD_LABELS/parser와 일치한다. 사용자 파일의 선택적 ‘시급’ 연결은 유지한다. 양식에는 의도치 않은 기본 시급 변경을 피하도록 시급을 넣지 않았다. 날짜·시간 예시 셀은 텍스트로 보존한다.

## 12. Excel Import 안내 UX

다운로드 → 예시 수정 → 파일 불러오기·열 확인의 3단계 안내를 제공한다. 양식 열은 자동 연결하고 기존 사용자 파일은 수동 연결도 가능하다. 필수 열이 없으면 가져오기 버튼을 비활성화한다. 빈/중복 열, 같은 열의 중복 연결, 읽기 실패, 유효하지 않은 행을 안내한다.

읽는 동안 파일 불러오기와 가져오기를 차단한다. 읽기를 취소하고 다시 열었을 때 이전 파일이 뒤늦게 표시되지 않는 것도 검증했다. 일부 무효 행은 실제 제외 건수만 알리며, 전부 무효이면 기존 근무를 교체하지 않는다. 가져오기는 기존대로 전체 근무 목록 교체이며, 이를 화면에 명시했다. 기존 월 snapshot은 유지하고 새 월만 기본 조건으로 만든다. 숫자 Excel 날짜가 한국 시간대에서 하루 앞당겨지던 변환도 날짜 구성요소를 직접 사용하도록 최소 수정하고 확인했다.

## 13. Guided Intro 구조

4단계: 급여 조건 → 이번 달 근무 만들기 → 예상 급여·급여 자세히 보기 → Calendar. 이전/다음/시작하기/건너뛰기를 제공한다. 현재 단계는 n / 4로 표시하고 단계 제목으로 포커스를 이동한다. 배경 클릭은 무시하고 X/Escape는 건너뛰기와 동일하게 완료 처리한다.

## 14. Intro 저장 정책

UI preferences에 `introCompleted`를 추가했다. 시작하기 또는 건너뛰기 후 true로 저장한다. 전체 초기화는 이 값을 유지한다. SalaryData V2 저장 구조에는 필드를 추가하지 않았다.

## 15. Intro와 First Setup 관계

Intro는 사용법 안내만 한다. 실제 급여 조건과 근무를 입력하는 Setup과 독립적이다. 신규 사용자는 Intro 완료 직후 이미 준비된 급여 조건 단계로 이동한다. hydration 전 로딩 분기를 유지하므로 중간 Home을 표시하지 않는다.

## 16. 새로고침/재방문 처리

신규 Intro, 완료 후 미표시, work 단계 Setup 이어하기, 실제 첫 근무 저장 후 Home, 전체 초기화 후 settings 단계 이어하기를 확인했다. introCompleted 필드가 없는 이전 preferences 또는 근무만 저장된 구사용자는 안내를 강제로 다시 보지 않는다.

## 17. 수정 파일

| 파일 | 변경 이유 |
| --- | --- |
| src/features/salary-calculator/TimeInput.tsx | 모드 설명·입력 도중 오류·정규화 |
| src/lib/workTimeValidation.ts | 유효한 숫자 시간 정규화 |
| src/features/salary-calculator/SalaryCalculator.tsx | 전역 feedback·Intro·Excel 결과 반영·초기화 오류 |
| src/features/salary-calculator/SalaryHome.tsx | Setup 성공 feedback 연결 |
| src/features/salary-calculator/SalaryResultSection.tsx | 월별 저장 feedback·유효성 |
| src/features/salary-calculator/WorkTemplateForm.tsx | 생성·부분 성공·전체 충돌 문구 |
| src/features/salary-calculator/work/WorkSection.tsx | 추가·수정·삭제 feedback |
| src/features/salary-calculator/work/WorkEntryEditor.tsx | 중복 저장 방지 |
| src/components/ui/action-toast.tsx | 기존 알림의 오류 톤·접근성 |
| src/components/ui/dialog.tsx | Radix 제목·설명 접근성 연결 |
| src/components/ExcelMapperModal.tsx | 양식·안내·로딩·파일 및 행 오류 |
| src/lib/excelTemplate.ts | 기존 xlsx 기반 입력 양식 |
| src/features/salary-calculator/GuidedIntro.tsx | 4단계 사용법 안내 |
| src/lib/uiPreferences.ts | Intro 완료 상태·기존 사용자 호환 |
| tests/salary-flow.test.cjs | 정규화·preferences·XLSX 회귀 테스트 |
| docs/ux-feedback-improvements.md | 이 완료 보고 |
| next-env.d.ts | Next.js 빌드가 routes 타입 경로를 dev/types에서 types로 자동 변경 |

## 18. 기존 Domain/Storage 회귀 여부

calculateSalary, WorkEntry/SalarySettings 모델, Storage V2, month/time helpers, useSalary, conflict engine은 변경하지 않았다. 단위 테스트 9개가 통과했다. 기존 V1 복원 → V2 월 snapshot, V2 왕복 저장, 동일 날짜 복수 근무, overnight 월 경계 충돌, 인접 근무 허용, 휴게 처리 및 계산 결과를 포함한다. 브라우저에서는 월별 시급 변경 후 다른 기본 시급 보존, import 후 기존 snapshot 보존도 확인했다.

## 19. Build 결과

`npm run build` 1회 실행 성공. Next.js 16.1.5 Turbopack 컴파일·TypeScript·정적 페이지 생성이 완료됐다. 별도 `tsc --noEmit --incremental false`, `git diff --check`, Node 테스트도 통과했다. 캐시/의존성 삭제나 재설치는 하지 않았다.

## 20. 사용자가 직접 확인해야 할 테스트

요청 A–N에 해당하는 동작을 격리 Chrome에서 DOM 조작·실제 키보드 입력·다운로드·파일 업로드로 검증했다. 375px Intro, 입력 모드/요일별 입력, Excel, Toast, Calendar 스크린샷을 확인하고 문서/Dialog 가로 폭을 검사했다. 긴 Dialog는 내부 세로 스크롤로 버튼까지 접근한다.

실제 기기에서 추가 확인할 항목:

- iPhone Safari / Android 키보드로 09:30 입력과 모드 전환.
- Excel 또는 Numbers에서 다운로드 양식을 편집·저장한 후 가져오기.
- VoiceOver / TalkBack으로 Intro 포커스, 입력 오류와 완료 알림 읽기.

위 실제 기기·스크린리더·데스크톱 Excel 앱은 이 환경에서 직접 실행하지 않았다.

## 21. 발견했지만 수정하지 않은 문제

빌드가 caniuse-lite 데이터가 8개월 오래됐다는 Browserslist 경고를 냈다. 빌드는 성공했고 새 패키지 설치 금지에 따라 갱신하지 않았다. Excel 가져오기의 전체 교체·첫 시트·기존 충돌 처리 정책은 유지했다. 가져오기에서 별도 중복 근무 제거 기능은 추가하지 않았다.

Git add / commit / push를 실행하지 않았다. 다른 worktree의 미커밋 변경을 되돌리거나 덮어쓰지 않았다.
