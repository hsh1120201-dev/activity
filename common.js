/* 前台與後台共用的工具 */
(function () {
  "use strict";
  var U = (window.U = {});
  U.$ = function (id) { return document.getElementById(id); };
  U.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  U.STATUS = { open: "報名中", feedback: "回饋中", closed: "已結束" };
  var ORDER = { open: 0, feedback: 1, closed: 2 };
  var WD = ["日", "一", "二", "三", "四", "五", "六"];
  U.dparts = function (d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
    if (!m) return { md: "未定", wd: "", full: "日期未定" };
    var dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return { md: +m[2] + "/" + +m[3], wd: "週" + WD[dt.getDay()], full: m[1] + "/" + m[2] + "/" + m[3] + "（" + WD[dt.getDay()] + "）" };
  };
  U.ftime = function (iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  };
  U.sortActs = function (acts) {
    return acts.slice().sort(function (a, b) {
      var o = (ORDER[a.status] || 0) - (ORDER[b.status] || 0);
      if (o) return o;
      var x = a.date || "", y = b.date || "";
      return a.status === "open" ? (x < y ? -1 : x > y ? 1 : 0) : (x > y ? -1 : x < y ? 1 : 0);
    });
  };
  U.capText = function (a, counts) {
    var n = counts[a.id] || 0;
    return a.capacity > 0 ? "已報名 " + n + " / " + a.capacity + " 人" : "已報名 " + n + " 人";
  };
  var toastT;
  U.toast = function (t) {
    var el = U.$("toast"), d = U.$("dlg");
    var host = d && d.open ? d : document.body; // 對話框開著時，訊息要放進對話框裡才看得到
    if (el.parentNode !== host) host.appendChild(el);
    el.textContent = t;
    el.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove("on"); }, 3600);
  };
  U.configured = function () { return /^https:\/\/script\.google\.com\/.+\/exec$/.test(window.API_URL || ""); };
  /* 用 text/plain 送出，Apps Script 才不會被瀏覽器的跨網域預檢擋下 */
  U.api = function (action, data) {
    var body = JSON.stringify(Object.assign({ action: action }, data || {}));
    return fetch(window.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body })
      .then(function (r) { return r.json(); })
      .catch(function () { throw new Error("連不上伺服器，請檢查網路後再試一次。"); })
      .then(function (j) {
        if (!j.ok) { var e = new Error(j.error || "發生錯誤，請稍後再試。"); e.code = j.code; throw e; }
        return j;
      });
  };
  U.closeDlg = function () { var d = U.$("dlg"); if (d.open) d.close(); };
  U.showDlg = function (html) {
    U.$("dlg-body").innerHTML = html;
    var d = U.$("dlg");
    if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }
  };
  U.head = function (t) {
    return '<div class="dlg-head"><h3 id="dlg-title">' + U.esc(t) + '</h3><button class="x" type="button" data-close aria-label="關閉">✕</button></div>';
  };
  U.fld = function (id, label, val, req, type, extra) {
    return '<label class="f" for="' + id + '"><span>' + label + (req ? " <i>*</i>" : "") + '</span><input id="' + id + '" type="' + (type || "text") +
      '" value="' + U.esc(val == null ? "" : val) + '"' + (req ? " required" : "") + (extra || "") + "></label>";
  };
  /* 課程滿意度調查（與 Code.gs 的 SURVEY 保持一致） */
  U.SCALE = ["非常滿意", "滿意", "普通", "不滿意", "非常不滿意"];
  U.SURVEY = {
    title: "課程滿意度調查",
    intro: "這是本次課程的滿意度調查表，謝謝大家參與課程，祝福您事業順利！",
    contact: "聯絡單位｜新竹社會創新基地（竹北同心樓3樓）\n聯絡電話｜03-5593142 分機 3514",
    items: [
      { type: "single", key: "gender", title: "您的性別：", required: true, options: ["男性", "女性", "其他"] },
      { type: "single", key: "age", title: "您的年齡區間：", required: true, options: ["18歲以下", "18-25歲", "25-35歲", "35-45歲", "45-55歲", "55歲以上"] },
      { type: "matrix", title: "課程內容的安排", required: true, rows: [
        { key: "c_material", label: "課程教材/投影片" }, { key: "c_practical", label: "課程實用性" },
        { key: "c_level", label: "課程難易度" }, { key: "c_hours", label: "課程時數安排" }] },
      { type: "matrix", title: "講師授課的情形", required: true, rows: [
        { key: "t_attend", label: "出席狀況" }, { key: "t_attitude", label: "教學態度" }, { key: "t_express", label: "表達能力" },
        { key: "t_interact", label: "互動方式" }, { key: "t_answer", label: "回答問題能力" }] },
      { type: "matrix", title: "相關行政的處理", required: true, rows: [
        { key: "a_promo", label: "課程宣傳" }, { key: "a_signup", label: "報名方式" },
        { key: "a_venue", label: "場地環境" }, { key: "a_staff", label: "人員服務" }] },
      { type: "text", key: "sugg_host", title: "對於主辦方的建議：" },
      { type: "text", key: "sugg_teacher", title: "對於講師的建議：" },
      { type: "note", text: "為提供更好的課程內容，請讓我們更了解您一點！\n本問卷蒐集來的資訊，僅會作為內部課程改善使用\n絕不外洩也不會作為其他用途使用，敬請放心填寫！" },
      { type: "slider", key: "again", title: "您再次參加主辦方舉辦課程的意願：", required: true, min: 0, max: 100 }
    ]
  };
  U.surveyFields = function () {
    var f = [];
    U.SURVEY.items.forEach(function (it) {
      if (it.type === "matrix") it.rows.forEach(function (r) { f.push({ key: r.key, head: r.label, group: it.title, type: "scale", required: !!it.required }); });
      else if (it.key) f.push({ key: it.key, head: it.title.replace(/[：:]$/, ""), type: it.type, required: !!it.required, options: it.options, min: it.min, max: it.max });
    });
    return f;
  };
  U.scoreOf = function (v) { var i = U.SCALE.indexOf(v); return i < 0 ? null : 5 - i; };
  /* 信件格式（與 Code.gs 的 mailHtml_ 一致）：**粗體**、[文字](網址)、網址自動連結、單獨一行「-」是分隔線 */
  U.mailHtml = function (text) {
    var h = U.esc(text), links = [];
    h = h.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) { links.push('<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"); return "\u0000" + (links.length - 1) + "\u0000"; });
    h = h.replace(/https?:\/\/[^\s<]+/g, function (u) { links.push('<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>"); return "\u0000" + (links.length - 1) + "\u0000"; });
    h = h.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/^[ \t]*-[ \t]*$/gm, "<hr>");
    h = h.replace(/\u0000(\d+)\u0000/g, function (_, i) { return links[+i]; });
    return h.replace(/(<hr>)\n/g, "$1").replace(/\n/g, "<br>");
  };
  U.SETUP_NOTE = '<div class="panel"><p><strong>尚未連接資料庫。</strong></p><p class="note">請照「設定步驟」把 Apps Script 網址填進 config.js，再重新整理這個頁面。</p></div>';
})();
