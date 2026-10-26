// UserPromptSubmit 훅: 사용자가 입력한 프롬프트를 docs/prompt-history.md 에 누적 기록한다.
// 실패해도 대화를 막지 않도록 항상 exit 0.
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const prompt = (input.prompt || "").trim();
    if (!prompt) return;

    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const dir = join(root, "docs");
    const file = join(dir, "prompt-history.md");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(file)) writeFileSync(file, "# Prompt History\n\n사용자 프롬프트 원문 기록 (UserPromptSubmit 훅 자동 기록)\n");

    const ts = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }); // YYYY-MM-DD HH:mm:ss
    const session = (input.session_id || "").slice(0, 8);
    const body = prompt.split(/\r?\n/).map((l) => "> " + l).join("\n");
    appendFileSync(file, `\n## ${ts} KST${session ? ` · session ${session}` : ""}\n\n${body}\n`);
  } catch {
    // 기록 실패는 무시
  }
});
