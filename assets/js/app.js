/* 북규슈 여행 플래너 - 화면 로직 (빌드 없이 GitHub Pages 에서 바로 동작) */
(function () {
  "use strict";

  var NK = window.NK;
  var CATS = NK.CATEGORIES;
  var STORAGE_KEY = "nk-trip";
  var DATA_VERSION = 1; // 샘플 데이터 구조가 바뀌면 올린다 (저장본 무효화)
  var WEEK = ["일", "월", "화", "수", "목", "금", "토"];

  var state = {
    plan: null,
    day: 1,
    formCategory: "TOUR",
    lastAddedId: null,
  };

  var $ = function (id) { return document.getElementById(id); };
  var mqMobile = window.matchMedia("(max-width: 1023px)");

  // ───────── storage ─────────
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && saved.v === DATA_VERSION && saved.plan) return saved.plan;
      }
    } catch (e) { /* private mode 등: 샘플로 시작 */ }
    return NK.createSamplePlan();
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: DATA_VERSION, plan: state.plan }));
    } catch (e) { /* 저장 불가 환경에서는 메모리에서만 유지 */ }
  }

  // ───────── helpers ─────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function yen(n) { return "¥" + Number(n || 0).toLocaleString("ko-KR"); }
  function parseDate(ymd) {
    var p = ymd.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function toYmd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dateOfDay(day) {
    var d = parseDate(state.plan.startDate);
    d.setDate(d.getDate() + day - 1);
    return d;
  }
  function mmdd(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }
  function fullDate(d) {
    return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  }
  function to12h(hm) {
    var p = hm.split(":");
    var h = Number(p[0]);
    var ap = h < 12 ? "AM" : "PM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return { hm: h12 + ":" + p[1], ap: ap };
  }
  function itemsOfDay(day) {
    return state.plan.schedules
      .filter(function (s) { return s.day === day; })
      .sort(function (a, b) { return a.time.localeCompare(b.time) || a.id.localeCompare(b.id); });
  }
  function dayCost(day) {
    var r = { total: 0, move: 0, sunq: 0 };
    itemsOfDay(day).forEach(function (s) {
      var c = Number(s.cost) || 0;
      r.total += c;
      if (s.category === "MOVE") {
        r.move += c;
        if (s.sunq) r.sunq += c;
      }
    });
    return r;
  }
  function newId() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function findItem(id) {
    return state.plan.schedules.find(function (s) { return s.id === id; });
  }
  function mapUrl(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }

  var toastTimer;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-show"); }, 2000);
  }

  // ───────── render ─────────
  function renderHeader() {
    var p = state.plan;
    $("tripTitle").textContent = p.title;
    var s = parseDate(p.startDate), e = parseDate(p.endDate);
    $("tripPeriod").textContent =
      fullDate(s) + " ~ " + fullDate(e) + " · " + (p.totalDays - 1) + "박 " + p.totalDays + "일";
    document.title = p.title + " | 여행 플래너";
  }

  function renderTabs() {
    var html = "";
    for (var d = 1; d <= state.plan.totalDays; d++) {
      var dt = dateOfDay(d);
      var sel = d === state.day;
      html +=
        '<button class="tab" role="tab" type="button" data-day="' + d + '" aria-selected="' + sel + '">' +
        '<span class="tab__day">Day ' + d + "</span>" +
        '<span class="tab__date">' + mmdd(dt) + " (" + WEEK[dt.getDay()] + ")</span></button>";
    }
    html += '<button class="tab tab--add" type="button" id="btnAddDay"><span aria-hidden="true">＋</span> 일자 추가</button>';
    $("dayTabs").innerHTML = html;
    var cur = $("dayTabs").querySelector('[aria-selected="true"]');
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function renderDayHead() {
    var dt = dateOfDay(state.day);
    var themes = state.plan.dayThemes || {};
    $("dayDate").textContent = "DAY " + state.day + " · " + fullDate(dt) + " (" + WEEK[dt.getDay()] + ")";
    $("dayHeading").textContent = themes[state.day] || "자유 일정";
    var items = itemsOfDay(state.day);
    var done = items.filter(function (s) { return s.isCompleted; }).length;
    var c = dayCost(state.day);
    $("dayStats").innerHTML =
      '<span class="stat-pill">일정 <b>' + done + "/" + items.length + "</b></span>" +
      '<span class="stat-pill">🚌 교통 <b>' + yen(c.move) + "</b></span>" +
      '<span class="stat-pill">💰 예상 <b>' + yen(c.total) + "</b></span>";
  }

  function cardHtml(s) {
    var cat = CATS[s.category] || CATS.ETC;
    var t = to12h(s.time);
    var meta = '<span class="badge">' + cat.emoji + " " + cat.label + "</span>";
    if (s.cost) meta += '<span class="chip-cost">' + yen(s.cost) + "</span>";
    if (s.category === "MOVE" && s.sunq) meta += '<span class="chip-cost chip-sunq">SunQ</span>';
    if (hasTip(s)) meta += '<button class="tip-btn" type="button" data-act="tip" aria-label="' + esc(s.title) + ' TIP 보기">💡 TIP</button>';
    meta +=
      '<span class="card__actions">' +
      '<button class="icon-btn" type="button" data-act="edit" aria-label="수정" title="수정">✎</button>' +
      '<button class="icon-btn icon-btn--danger" type="button" data-act="delete" aria-label="삭제" title="삭제">🗑</button>' +
      "</span>";

    return (
      '<li class="tl-item cat-' + esc(s.category) + (s.isCompleted ? " is-done" : "") + (s.id === state.lastAddedId ? " is-new" : "") +
      '" data-id="' + esc(s.id) + '">' +
      '<div class="tl-time"><span class="tl-time__hm">' + t.hm + '</span><span class="tl-time__ap">' + t.ap + "</span></div>" +
      '<span class="tl-dot" aria-hidden="true"></span>' +
      '<article class="card"><div class="card__top">' +
      '<input class="card__check" type="checkbox" data-act="toggle" aria-label="완료 표시"' + (s.isCompleted ? " checked" : "") + " />" +
      '<div class="card__body"><h3 class="card__title">' + esc(s.title) + "</h3>" +
      (s.memo ? '<p class="card__memo">' + esc(s.memo) + "</p>" : "") +
      "</div></div>" +
      '<div class="card__meta">' + meta + "</div></article></li>"
    );
  }

  function renderTimeline() {
    var items = itemsOfDay(state.day);
    if (!items.length) {
      $("timeline").innerHTML =
        '<li class="empty"><div class="empty__icon">🍂</div>' +
        '<p class="empty__text">등록된 일정이 없습니다. 새 일정을 추가해보세요!</p>' +
        '<button class="btn btn--primary" type="button" data-act="empty-add">＋ 일정 추가</button></li>';
      return;
    }
    $("timeline").innerHTML = items.map(cardHtml).join("");
    state.lastAddedId = null;
  }

  function renderDayOptions() {
    var sel = $("fDay");
    var cur = sel.value ? Number(sel.value) : state.day;
    var html = "";
    for (var d = 1; d <= state.plan.totalDays; d++) {
      html += '<option value="' + d + '">Day ' + d + " (" + mmdd(dateOfDay(d)) + ")</option>";
    }
    sel.innerHTML = html;
    sel.value = String(Math.min(cur, state.plan.totalDays));
  }

  function render() {
    renderHeader();
    renderTabs();
    renderDayHead();
    renderTimeline();
    renderDayOptions();
  }

  // ───────── TIP layer popup ─────────
  function hasTip(s) {
    var t = s.tip;
    return !!(t && (t.hours || t.closed || t.price || t.caution || t.note || t.mapQuery || (t.extra && t.extra.length)));
  }

  function openTip(s) {
    var t = s.tip || {};
    var rows = [
      ["🕘", "영업 · 운영 시간", t.hours],
      ["📅", "휴무일", t.closed],
      ["💴", "요금", t.price],
      ["⚠️", "주의할 점", t.caution, true],
      ["📝", "참고할 점", t.note],
    ];
    var html = '<dl class="tip-list">';
    rows.forEach(function (r) {
      if (!r[2]) return;
      html += '<div class="tip-row' + (r[3] ? " tip-row--warn" : "") + '"><span class="tip-row__icon">' + r[0] +
        "</span><div><dt>" + r[1] + "</dt><dd>" + esc(r[2]) + "</dd></div></div>";
    });
    (t.extra || []).forEach(function (x) {
      html += '<div class="tip-row"><span class="tip-row__icon">✨</span><div><dt>알아두면 좋은 정보</dt><dd>' + esc(x) + "</dd></div></div>";
    });
    html += "</dl>";
    if (t.mapQuery) {
      html += '<a class="tip-map" href="' + mapUrl(t.mapQuery) + '" target="_blank" rel="noopener">📍 구글 지도에서 보기</a>';
    }
    html += '<p class="note-sm">' + esc(NK.DISCLAIMER) + "</p>";
    openModal("💡 " + s.title, html, false);
  }

  // ───────── 전체 일정 요약 + SunQ 판단 ─────────
  function bestSunq(daily) {
    var P = NK.SUNQ;
    var nDays = daily.length;
    // 디지털권: 개시일부터 windowDays 일 안에서 아무 3일 선택
    var best = { value: 0, days: [] };
    for (var s = 0; s < nDays; s++) {
      var win = daily.slice(s, s + P.windowDays).map(function (d, i) { return { idx: s + i, v: d.sunq }; });
      win.sort(function (a, b) { return b.v - a.v; });
      var pick = win.slice(0, P.days);
      var v = pick.reduce(function (a, b) { return a + b.v; }, 0);
      if (v > best.value) best = { value: v, days: pick.map(function (p) { return p.idx + 1; }) };
    }
    // 종이권: 연속 3일
    var paper = { value: 0, days: [] };
    for (var k = 0; k + P.days <= nDays; k++) {
      var pv = 0, pd = [];
      for (var j = k; j < k + P.days; j++) { pv += daily[j].sunq; pd.push(j + 1); }
      if (pv > paper.value) paper = { value: pv, days: pd };
    }
    return { digital: best, paper: paper };
  }

  function openSummary() {
    var p = state.plan;
    var total = 0, done = 0, count = p.schedules.length;
    var daily = [];
    for (var d = 1; d <= p.totalDays; d++) {
      var c = dayCost(d);
      daily.push(c);
      total += c.total;
    }
    p.schedules.forEach(function (s) { if (s.isCompleted) done++; });
    var moveTotal = daily.reduce(function (a, b) { return a + b.move; }, 0);
    var sunqTotal = daily.reduce(function (a, b) { return a + b.sunq; }, 0);
    var res = bestSunq(daily);
    var P = NK.SUNQ;
    var gain = res.digital.value - P.digitalPrice;

    var html = '<section class="sum-section"><div class="sum-kpis">' +
      '<div class="kpi"><div class="kpi__label">전체 일정</div><div class="kpi__value">' + done + " / " + count + "</div></div>" +
      '<div class="kpi"><div class="kpi__label">예상 총비용 (1인)</div><div class="kpi__value">' + yen(total) + "</div></div>" +
      '<div class="kpi"><div class="kpi__label">교통비 (항공 제외)</div><div class="kpi__value">' + yen(moveTotal) + "</div></div>" +
      "</div></section>";

    // 교통비 & SunQ
    html += '<section class="sum-section"><h4>🚌 교통비 & ' + esc(P.name) + "</h4>" +
      '<table class="tbl"><thead><tr><th>일자</th><th>교통비 (패스 미사용)</th><th>SunQ 적용 구간</th></tr></thead><tbody>';
    daily.forEach(function (c, i) {
      var picked = res.digital.days.indexOf(i + 1) >= 0;
      html += '<tr class="' + (picked ? "is-pick" : "") + '"><td>Day ' + (i + 1) + " (" + mmdd(dateOfDay(i + 1)) + ")" +
        (picked ? " ✔" : "") + "</td><td>" + yen(c.move) + "</td><td>" + yen(c.sunq) + "</td></tr>";
    });
    html += "</tbody><tfoot><tr><td>합계</td><td>" + yen(moveTotal) + "</td><td>" + yen(sunqTotal) + "</td></tr></tfoot></table>";

    var yes = gain > 0;
    html += '<div class="verdict ' + (yes ? "verdict--yes" : "verdict--no") + '"><strong>' +
      (yes ? "✅ SunQ 패스 구매가 이득입니다 (약 " + yen(gain) + " 절약)"
           : "❌ SunQ 패스는 손해입니다 (약 " + yen(-gain) + " 더 지불)") + "</strong>" +
      "디지털 3일권 " + yen(P.digitalPrice) + " vs 패스로 아낄 수 있는 최대 금액 " + yen(res.digital.value) +
      " (Day " + res.digital.days.join(", ") + " 선택 시)" +
      "<ul>" +
      "<li>종이권(" + yen(P.paperPrice) + ", 연속 3일)이라면 최대 " + yen(res.paper.value) + " (Day " + res.paper.days.join("~") + ") 를 아낄 수 있습니다.</li>" +
      "<li>후쿠오카 시내 지하철·JR·니시테츠 전철은 SunQ가 적용되지 않습니다.</li>" +
      "<li>유후인을 빼면(벳푸→하카타 고속버스 직행 ¥3,250) Day 3 적용 금액이 약 ¥1,100 줄어 손해 폭이 커집니다.</li>" +
      "<li>패스 없이 교통 IC카드(Suica·나모카 등)나 현금으로 그때그때 내는 것을 권합니다. 고속버스는 웹 예약을 하세요.</li>" +
      "</ul></div>" +
      '<p class="note-sm">일정 카드의 이동(MOVE) 비용과 SunQ 체크 값으로 자동 계산합니다. 일정을 바꾸면 결과도 바뀝니다. 기준: ' + esc(P.checkedAt) +
      " 공식 가격(2024.10 개정) · 해외 판매처 할인가(약 ¥8,500~9,500)로 사면 차이가 줄어듭니다.</p></section>";

    // Day 별 요약
    html += '<section class="sum-section"><h4>🗓 일자별 일정</h4>';
    for (var k = 1; k <= p.totalDays; k++) {
      var dt = dateOfDay(k);
      var items = itemsOfDay(k);
      html += '<div class="sum-day"><div class="sum-day__head"><span>Day ' + k + " · " + mmdd(dt) + " (" + WEEK[dt.getDay()] + ") " +
        esc((p.dayThemes || {})[k] || "") + "</span><span>" + yen(daily[k - 1].total) + "</span></div><ul>";
      if (!items.length) html += "<li>등록된 일정이 없습니다.</li>";
      items.forEach(function (s) {
        html += '<li class="' + (s.isCompleted ? "is-done" : "") + '"><b>' + s.time + "</b>" + (CATS[s.category] || CATS.ETC).emoji + " " + esc(s.title) + "</li>";
      });
      html += "</ul></div>";
    }
    html += '</section><p class="note-sm">' + esc(NK.DISCLAIMER) + "</p>";
    openModal("전체 일정 요약", html, true);
  }

  // ───────── modal ─────────
  var lastFocus = null;
  function openModal(title, html, wide) {
    lastFocus = document.activeElement;
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = html;
    $("modal").classList.toggle("modal--wide", !!wide);
    $("modal").hidden = false;
    $("modalBody").scrollTop = 0;
    $("btnModalClose").focus();
  }
  function closeModal() {
    $("modal").hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  // ───────── form ─────────
  function renderCategoryChips() {
    $("fCategory").innerHTML = Object.keys(CATS).map(function (k) {
      return '<button type="button" class="chip cat-' + k + '" role="radio" data-cat="' + k + '" aria-checked="' + (k === state.formCategory) + '">' +
        CATS[k].emoji + " " + CATS[k].label + "</button>";
    }).join("");
    $("fSunqWrap").hidden = state.formCategory !== "MOVE";
  }
  function setCategory(cat) {
    state.formCategory = cat;
    renderCategoryChips();
  }

  function resetForm() {
    $("scheduleForm").reset();
    $("fId").value = "";
    $("fDay").value = String(state.day);
    $("fTime").value = "10:00";
    $("fMemoCount").textContent = "0/100";
    $("formTitle").textContent = "새 일정 등록";
    $("btnFormSubmit").textContent = "일정 등록";
    clearError();
    setCategory("TOUR");
    document.querySelector(".tip-fields").open = false;
  }

  function fillForm(s) {
    var t = s.tip || {};
    $("fId").value = s.id;
    $("fDay").value = String(s.day);
    $("fTime").value = s.time;
    $("fTitle").value = s.title;
    $("fCost").value = s.cost != null ? s.cost : "";
    $("fMemo").value = s.memo || "";
    $("fMemoCount").textContent = (s.memo || "").length + "/100";
    $("fSunq").checked = !!s.sunq;
    $("fTipHours").value = t.hours || "";
    $("fTipClosed").value = t.closed || "";
    $("fTipCaution").value = t.caution || "";
    $("fTipNote").value = t.note || "";
    $("fTipMap").value = t.mapQuery || "";
    $("formTitle").textContent = "일정 수정";
    $("btnFormSubmit").textContent = "수정 완료";
    clearError();
    setCategory(s.category);
  }

  function clearError() {
    $("fTitle").classList.remove("is-invalid");
    $("fTitleError").textContent = "";
  }

  function onSubmit(e) {
    e.preventDefault();
    var title = $("fTitle").value.trim();
    if (!title) {
      $("fTitle").classList.add("is-invalid");
      $("fTitleError").textContent = "장소/활동명을 입력해야 일정을 등록할 수 있습니다.";
      $("fTitle").focus();
      return;
    }
    var costRaw = $("fCost").value;
    var id = $("fId").value;
    var existing = id ? findItem(id) : null;
    var tip = Object.assign({}, existing && existing.tip, {
      hours: $("fTipHours").value.trim() || undefined,
      closed: $("fTipClosed").value.trim() || undefined,
      caution: $("fTipCaution").value.trim() || undefined,
      note: $("fTipNote").value.trim() || undefined,
      mapQuery: $("fTipMap").value.trim() || undefined,
    });
    var data = {
      day: Number($("fDay").value) || state.day,
      time: $("fTime").value || "00:00",
      title: title,
      category: state.formCategory,
      cost: costRaw === "" ? undefined : Math.max(0, Math.round(Number(costRaw))),
      memo: $("fMemo").value.trim().slice(0, 100) || undefined,
      sunq: state.formCategory === "MOVE" ? $("fSunq").checked : undefined,
      tip: tip,
    };

    if (existing) {
      Object.assign(existing, data);
      toast("일정을 수정했습니다");
    } else {
      var item = Object.assign({ id: newId(), isCompleted: false }, data);
      state.plan.schedules.push(item);
      state.lastAddedId = item.id;
      toast("일정을 등록했습니다");
    }
    state.day = data.day;
    save();
    resetForm();
    closeSheet();
    render();
  }

  // ───────── mobile bottom sheet ─────────
  function openSheet() {
    if (!mqMobile.matches) { $("fTitle").focus(); return; }
    $("formSheet").classList.add("is-open");
    $("scrim").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () { $("fTitle").focus(); }, 300);
  }
  function closeSheet() {
    $("formSheet").classList.remove("is-open");
    $("scrim").hidden = true;
    document.body.style.overflow = "";
  }

  // ───────── actions ─────────
  function addDay() {
    var p = state.plan;
    p.totalDays += 1;
    var end = parseDate(p.startDate);
    end.setDate(end.getDate() + p.totalDays - 1);
    p.endDate = toYmd(end);
    state.day = p.totalDays;
    save();
    render();
    toast("Day " + p.totalDays + " 를 추가했습니다");
  }

  function onTimelineClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    if (act === "empty-add") { resetForm(); openSheet(); return; }
    var li = btn.closest(".tl-item");
    var s = li && findItem(li.getAttribute("data-id"));
    if (!s) return;

    if (act === "toggle") {
      s.isCompleted = btn.checked;
      li.classList.toggle("is-done", s.isCompleted);
      save();
      renderDayHead();
    } else if (act === "delete") {
      if (!confirm("'" + s.title + "' 일정을 삭제할까요?")) return;
      state.plan.schedules = state.plan.schedules.filter(function (x) { return x.id !== s.id; });
      save();
      render();
      toast("일정을 삭제했습니다");
    } else if (act === "edit") {
      fillForm(s);
      openSheet();
      if (!mqMobile.matches) $("formSheet").scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (act === "tip") {
      openTip(s);
    }
  }

  function bind() {
    $("dayTabs").addEventListener("click", function (e) {
      if (e.target.closest("#btnAddDay")) { addDay(); return; }
      var t = e.target.closest(".tab[data-day]");
      if (!t) return;
      state.day = Number(t.getAttribute("data-day"));
      if (!$("fId").value) $("fDay").value = String(state.day);
      renderTabs();
      renderDayHead();
      renderTimeline();
    });
    $("timeline").addEventListener("click", onTimelineClick);
    $("fCategory").addEventListener("click", function (e) {
      var c = e.target.closest("[data-cat]");
      if (c) setCategory(c.getAttribute("data-cat"));
    });
    $("scheduleForm").addEventListener("submit", onSubmit);
    $("fTitle").addEventListener("input", clearError);
    $("fMemo").addEventListener("input", function () {
      $("fMemoCount").textContent = $("fMemo").value.length + "/100";
    });
    $("btnFormCancel").addEventListener("click", function () { resetForm(); closeSheet(); });
    $("btnSheetClose").addEventListener("click", closeSheet);
    $("scrim").addEventListener("click", closeSheet);
    $("fab").addEventListener("click", function () { resetForm(); openSheet(); });
    $("btnSummary").addEventListener("click", openSummary);
    $("btnReset").addEventListener("click", function () {
      if (!confirm("현재 일정을 지우고 북규슈 샘플 일정으로 초기화할까요?")) return;
      state.plan = NK.createSamplePlan();
      state.day = 1;
      save();
      resetForm();
      render();
      toast("샘플 데이터를 불러왔습니다");
    });
    $("btnModalClose").addEventListener("click", closeModal);
    $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!$("modal").hidden) closeModal();
      else closeSheet();
    });
    mqMobile.addEventListener("change", function () { if (!mqMobile.matches) closeSheet(); });
  }

  // ───────── init ─────────
  state.plan = load();
  $("disclaimer").textContent = "※ " + NK.DISCLAIMER;
  renderCategoryChips();
  bind();
  render();
  resetForm();
})();
