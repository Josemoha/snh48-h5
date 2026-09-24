/* ============================================================================
   compat.js — 兼容性预检（纯 ES5，供老内核浏览器给出明确提示）
   ----------------------------------------------------------------------------
   【为什么存在】游戏样式使用了 CSS 变量、逻辑使用了 ES6+ 语法：
     · 现代浏览器（Chrome/Edge/Firefox 近年版本、国产浏览器「极速模式」）一切正常；
     · 老内核（尤其国产双核浏览器的 IE 兼容模式）会出现「CSS 全崩 + JS 全挂」的
       白屏/错乱，玩家不知道原因。本文件用最保守的 ES5 语法先行检测，
       给出「换浏览器/切极速模式/检查文件是否完整」的明确提示。
   【检测内容】
     1. JS 能力：Promise/Map/Set、Array.prototype.includes/find、Object.assign、
        String.prototype.includes（引擎代码的最低要求）；
     2. CSS 变量支持（CSS.supports 或内联探针）；
     3. style.css 是否成功生效（读取 #css-probe 的计算样式——同时能发现
        「解压不完整/只拷了 index.html」这类路径问题）。
   【注意】本文件必须保持 ES5 语法（var/function，不用箭头函数/let/const/模板串），
           并且始终是 index.html 中第一个加载的脚本。
   ========================================================================== */

"use strict";

(function () {
  function showWarn() {
    try {
      var box = document.getElementById("compat-warn");
      if (!box) return;
      box.style.display = "block";
      var t = document.getElementById("compat-title");
      var d = document.getElementById("compat-detail");
      if (t) t.innerHTML = "浏览器版本过旧，或游戏文件不完整";
      if (d) d.innerHTML =
        "本游戏需要较新的浏览器内核才能运行。<br><br>" +
        "① 请使用最新版 <b>Chrome / Edge / Firefox</b> 打开游戏；<br>" +
        "② 国产浏览器（360 / QQ / 搜狗等）请切换到「<b>极速模式</b>」" +
        "（地址栏旁的内核图标，或设置-浏览设置里关闭兼容模式）；<br>" +
        "③ 请确认游戏是<b>完整解压</b>后打开的：index.html 必须与 css、js " +
        "两个文件夹在同一目录，不要只把 index.html 单独移出来。<br><br>" +
        "换浏览器打开后本提示消失，即可正常游玩。";
    } catch (e) { /* 忽略：预检失败不阻断游戏 */ }
  }

  function check() {
    var ok = true;
    try {
      /* 1. JS 能力（引擎的最低要求） */
      if (!window.Promise || !window.Map || !window.Set) ok = false;
      if (!Array.prototype.includes || !Array.prototype.find) ok = false;
      if (!Object.assign || !String.prototype.includes) ok = false;
      if (!document.querySelectorAll || !window.addEventListener) ok = false;

      /* 2. CSS 变量支持 */
      if (ok && window.CSS && window.CSS.supports) {
        if (!window.CSS.supports("color", "var(--x)")) ok = false;
      } else if (ok) {
        var pv = document.createElement("div");
        try { pv.style.setProperty("--t", "1"); } catch (e2) { pv = null; }
        if (!pv || !pv.style.getPropertyValue("--t")) ok = false;
      }

      /* 3. style.css 生效探针（兼查文件完整性） */
      if (ok) {
        var p = document.getElementById("css-probe");
        if (!p || !window.getComputedStyle) ok = false;
        else {
          var cs = window.getComputedStyle(p, null);
          if (!cs || cs.borderRadius !== "10px") ok = false;   // style.css 中为 #css-probe 定义了 10px
        }
      }
    } catch (e) { ok = false; }
    return ok;
  }

  /* HTML5 标签 shim（老 IE 让 section/header/nav/footer 可设置样式） */
  var tags = ["section", "header", "nav", "footer", "main"];
  for (var i = 0; i < tags.length; i++) {
    try { document.createElement(tags[i]); } catch (e) {}
  }

  function run() {
    try { if (!check()) showWarn(); } catch (e) {}
  }

  /* DOM 就绪后执行；load 后再补一次（确保 CSS 已应用） */
  if (document.readyState === "loading" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  if (window.addEventListener) {
    window.addEventListener("load", function () { setTimeout(run, 300); });
  }
})();
