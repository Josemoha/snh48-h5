/* ============================================================================
   main.js — 启动入口
   ----------------------------------------------------------------------------
   职责很薄：等 DOM 就绪 → 初始化标题页/标签页/系统页 → 接线开局按钮。
   所有业务流程在 ui.js 中组织，引擎逻辑在 engine.js。
   ======================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // 显式挂到 window：方便作者在控制台调试 / 自动化测试访问
  // （const 声明默认不挂 window，不暴露的话外部拿不到 Game/UI）
  window.DATA = DATA;
  window.STORY = STORY;
  window.Game = Game;
  window.UI = UI;

  // 标题页（含「继续经营」按钮的显隐）
  UI.showTitle();
  // 标签页切换
  UI.initTabs();
  // 系统页按钮
  UI.initSys();

  // 开局页返回标题
  UI.$("btn-back-title").onclick = () => UI.showTitle();

  // 首屏落位
  UI.showScreen("screen-title");

  // 控制台彩蛋（版本号自动取标题页版本行，避免多处维护漂移）
  const vl = document.querySelector(".version-line");
  console.log(
    "%c《塞纳河打工人生》" + (vl ? vl.textContent.trim() : "H5"),
    "color:#ff6e98;font-size:16px;font-weight:bold"
  );
  console.log("粉丝同人作品 · 与现实无关 · 作者ID：南柯十七号");
  console.log("项目结构见 index.html 头部注释；设计文档见 docs/DESIGN.md");
});
