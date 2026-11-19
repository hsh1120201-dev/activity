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
    var el = U.$("toast");
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
      '" value="' + U.esc(val || "") + '"' + (req ? " required" : "") + (extra || "") + "></label>";
  };
  U.SETUP_NOTE = '<div class="panel"><p><strong>尚未連接資料庫。</strong></p><p class="note">請照「設定步驟」把 Apps Script 網址填進 config.js，再重新整理這個頁面。</p></div>';
})();
