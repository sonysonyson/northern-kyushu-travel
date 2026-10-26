# northern-kyushu-travel ♨️

2026.11.26(목) ~ 11.30(월) **북규슈 4박 5일** (벳푸 · 유후인 · 후쿠오카) 여행 스케줄 플래너.

| Day | 날짜 | 테마 |
|---|---|---|
| 1 | 11/26 (목) | 인천 11:05 → 오이타공항, 벳푸 온천 산책 |
| 2 | 11/27 (금) | 벳푸 지옥순례 7곳 · 칸나와 온천 |
| 3 | 11/28 (토) | 다카사키야마 · 우미타마고 → (유후인) → 후쿠오카 |
| 4 | 11/29 (일) | 다자이후 단풍 · 오호리 공원 · 텐진 |
| 5 | 11/30 (월) | 하카타 자유 일정 · 후쿠오카 21:30 → 인천 |

## 기능
- 날짜별 탭, 시간순 타임라인 카드, 완료 체크, 추가 / 수정 / 삭제
- 💡 TIP 레이어 팝업: 영업시간 · 휴무일 · 요금 · 주의할 점 · 구글 지도 링크
- 전체 일정 요약: 예상 비용, 일자별 교통비, **SunQ 패스 손익 자동 계산**
- 반응형 (데스크톱 우측 패널 / 모바일 바텀 시트), 다크모드, 브라우저 저장(localStorage)

## 실행
빌드 과정이 없습니다. `index.html` 을 브라우저로 열면 됩니다.

## GitHub Pages 배포
```bash
# 1) GitHub 에서 빈 저장소 northern-kyushu-travel 생성 (README 추가하지 않음)
git remote add origin https://github.com/<계정>/northern-kyushu-travel.git
git push -u origin main
# 2) 저장소 Settings → Pages → Source: "Deploy from a branch", Branch: main / (root)
# 3) https://<계정>.github.io/northern-kyushu-travel/ 접속
```
> 무료 플랜의 Pages 는 **공개 저장소**에서만 동작합니다. 일정·항공편 정보가 공개되는 점에 유의하세요.

## 프롬프트 로깅 훅
`.claude/settings.json` 에 아래 내용을 넣으면 프롬프트가 `docs/prompt-history.md` 에 자동 기록됩니다.
```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/log-prompt.mjs\"" } ] }
    ]
  }
}
```

※ 요금·영업시간은 2026-10-26 기준 추정치입니다. 방문 전에 다시 확인하세요.
