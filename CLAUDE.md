# CLAUDE.md — northern-kyushu-travel

2026.11.26 ~ 11.30 북규슈(벳푸·유후인·후쿠오카) 4박 5일 여행 스케줄 플래너. 정적 웹 화면이며 GitHub Pages로 배포한다.

## 기준 문서
- `code_artifact.md` — 화면개발 요구사항 정의서 (원본, 수정하지 않음)
- `docs/WORKLOG.md` — 작업 이력. 작업을 마칠 때마다 날짜·변경 내용·남은 일을 추가한다.
- `docs/prompt-history.md` — 사용자 프롬프트 원문 기록 (`.claude/settings.json` 의 UserPromptSubmit 훅이 자동으로 추가)

## 구조
```
index.html              화면 마크업 (Header / Day Tabs / Timeline / Form / Modal)
assets/css/styles.css   November Pastel 테마, 반응형(≥1024 우측 패널, <1024 바텀 시트), 다크모드
assets/js/data.js       데이터 모델(JSDoc) + 샘플 일정(window.NK)
assets/js/app.js        렌더링·이벤트·localStorage·SunQ 손익 계산
.claude/hooks/log-prompt.mjs   프롬프트 로깅 훅 스크립트
```

## 규칙
- 빌드 도구 없이 동작해야 한다 (classic script, file:// 에서도 열려야 함). ES module·npm 의존성을 추가하지 않는다.
- 데이터 스키마는 요구사항 4장 `ScheduleItem`/`TripPlan` 을 따른다. 확장 필드: `tip`(TIP 팝업), `sunq`(SunQ 적용 노선), `TripPlan.dayThemes`.
- 샘플 데이터 구조를 바꾸면 `app.js` 의 `DATA_VERSION` 을 올린다 (저장된 localStorage 무효화).
- 비용은 엔화(¥), 1인 기준. 교통비 = `category: "MOVE"` 항목 cost 합계, SunQ 판단 = `sunq: true` 항목 기준 자동 계산.
- 요금·영업시간은 추정치이므로 TIP 에 출처 성격(변동 가능)을 밝히고, 갱신 시 `NK.SUNQ.checkedAt`·`DISCLAIMER` 날짜를 함께 바꾼다.
- 사용자 표시 문구는 한국어.

## 로컬 확인
`index.html` 을 브라우저로 바로 열면 된다.
