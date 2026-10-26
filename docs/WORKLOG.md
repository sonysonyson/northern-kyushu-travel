# WORKLOG

## 2026-10-26 — 1차 화면 개발 착수

**요청**: `code_artifact.md` 요구사항 정의서를 확인하고 화면 개발 착수

**완료**
- 정적 SPA 구현 (`index.html`, `assets/css/styles.css`, `assets/js/data.js`, `assets/js/app.js`)
  - 헤더: 여행 제목·기간, [전체 일정 요약], [샘플 데이터 불러오기]
  - Day 탭 (날짜·요일 자동 계산), [+ 일자 추가]
  - 타임라인: 시간 오름차순 카드, 카테고리 태그, 메모, 비용, 완료 체크(취소선·흐림), 수정, 삭제, 💡TIP 레이어 팝업(영업시간·휴무·요금·주의·참고·구글지도 링크)
  - 등록/수정 폼: 데스크톱 우측 sticky 패널 / 모바일 바텀 시트 + FAB, 장소명 필수 검증, 메모 100자 카운터, TIP 입력(선택)
  - 빈 일자 Placeholder, localStorage 저장, 다크모드, 375px 대응 확인
- 4박 5일 추천 일정 샘플 데이터 (60개 항목)
  - 필수: 지옥순례 7곳(Day2), 다카사키야마·우미타마고(Day3)
  - 유후인은 Day3 [선택] 표시. 제외 시 플랜 B 안내는 TIP 에 있음
- 교통비 추정 + SunQ 북부 3일권(디지털 ¥10,000) 손익 자동 계산 → 현재 일정 기준 **약 ¥1,930 손해, 구매 비추천**
- 프롬프트 로깅 훅 스크립트 `.claude/hooks/log-prompt.mjs` (동작 테스트 완료)
- git 저장소 초기화, GitHub Pages용 `.nojekyll`

**남은 일 / 사용자 확인 필요**
- `.claude/settings.json` 훅 등록: 자동 권한 정책으로 Claude가 직접 쓰지 못함 → 사용자가 직접 추가 (README 참고)
- GitHub 원격 저장소 `northern-kyushu-travel` 생성·push·Pages 활성화 (gh CLI 미설치)
- 항공편 정확한 도착 시각 반영, 숙소 확정 시 HOTEL 카드 갱신
- 요금은 2026-10-26 기준 추정치 → 출발 전 재확인
