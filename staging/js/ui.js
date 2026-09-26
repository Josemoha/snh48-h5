/* ============================================================================
   ui.js — 界面渲染与交互
   ----------------------------------------------------------------------------
   屏幕流：标题 → 开局 → 序章(VN) → 经营主界面 →(月末步骤队列)→ 结局
   引擎联动：
     - Game.monthStart() 返回的 steps 先播（告别等），再交给玩家行动
     - 玩家 AP 用完（或主动）触发 endMonth()，steps 队列依次播放：
       settle 结算表 → vn 事件 → geResult/rtResult 大事件 → ending 结局
     - 播放完 Game.advanceMonth() + Game.monthStart() 进入新月
   所有弹窗复用 modal-root；VN 页面结构见 data_story.js 头部约定。
============================================================================ */

"use strict";

const UI = {

  /* ---------------- 基础工具 ---------------- */

  $(id) { return document.getElementById(id); },

  /* 便捷建元素：<tag class=cls>text</tag>
     text 可为：字符串 / Node / 数组（字符串与 Node 混合均可）。
     注意：不能用 textContent 直接赋值非字符串，否则会得到
     "[object HTMLSpanElement]" 之类的占位文本。 */
  el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) {
      const items = Array.isArray(text) ? text : [text];
      for (const it of items) {
        if (it instanceof Node) e.appendChild(it);
        else e.appendChild(document.createTextNode(String(it)));
      }
    }
    return e;
  },

  showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    this.$(id).classList.remove("hidden");
  },

  toast(msg, ms) {
    const t = this.$("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), ms || 2400);
  },

  /* ---------------- 弹窗系统 ---------------- */

  /* show: (card) => void，card 为 .modal-card 元素；返回关闭函数 */
  modal(card) {
    const root = this.$("modal-root");
    root.innerHTML = "";
    root.classList.remove("hidden");
    root.appendChild(card);
    return () => this.closeModal();
  },

  closeModal() {
    const root = this.$("modal-root");
    root.classList.add("hidden");
    root.innerHTML = "";
  },

  /* 构建通用弹窗卡片 */
  card(title, sub) {
    const c = this.el("div", "modal-card");
    if (title) c.appendChild(this.el("div", "modal-title", title));
    if (sub) c.appendChild(this.el("div", "modal-sub", sub));
    return c;
  },

  /* ---------------- 步骤队列播放器 ---------------- */

  /* 依次播放 steps（月末/月初流程），全部结束后回调 */
  playSteps(steps, onDone) {
    let i = 0;
    const next = () => {
      if (i >= steps.length) { if (onDone) onDone(); return; }
      const step = steps[i++];
      this.playStep(step, next);
    };
    next();
  },

  playStep(step, next) {
    switch (step.type) {
      case "settle": this.stepSettle(step, next); break;
      case "vn": this.stepVN(step, next); break;
      case "chain": this.stepChain(step.events, next); break;
      case "geResult": this.stepGEResult(step, next); break;
      case "rtResult": this.stepRTResult(step, next); break;
      case "ending": this.showEnding(step.grade); break;   // 终局不再回调
      default: next();
    }
  },

  /* 月末结算表 */
  /* 存档码弹窗：textarea 呈现/粘贴存档码。cfg = { title, sub, code, readonly, confirmLabel, onConfirm(ta, close) } */
  showCodeModal(cfg) {
    const c = this.card(cfg.title, cfg.sub);
    const ta = this.el("textarea", "code-area");
    ta.value = cfg.code || "";
    ta.readOnly = !!cfg.readOnly;
    ta.setAttribute("spellcheck", "false");
    c.appendChild(ta);
    const btn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    btn.onclick = () => cfg.onConfirm(ta, () => this.closeModal());
    c.appendChild(btn);
    this.modal(c);
  },

  /* 月度事件惰性链：播放每个事件前才评估其 gate——
     同一月末里，前置事件的选择可以解锁后续事件（如 下一站选SHY48/CKG48 → 开拓者点将） */
  stepChain(events, done) {
    const queue = (events || []).slice();
    const playNext = () => {
      let ev;
      while (queue.length) {
        const e = queue.shift();
        if (!e.gate || e.gate(Game.st)) { ev = e; break; }
      }
      if (!ev) { if (done) done(); return; }
      this.stepVN(Game.buildEventStep(ev, Game.st), playNext);
    };
    playNext();
  },

  /* 月末结算表 */
  stepSettle(step, next) {
    const st = Game.st;
    const c = this.card("月末结算 · " + Game.dateLabel(), "剧场的灯每晚都亮着，账本也是");
    const rows = [
      ["经营收入（公演/商务/分团）", "+" + step.income + " 万", "sr-plus"],
      ["固定运营支出", "-" + step.expense + " 万", "sr-minus"],
      ["本月净收支", (step.net >= 0 ? "+" : "") + step.net + " 万", step.net >= 0 ? "sr-plus" : "sr-minus"],
      ["账面资金", step.money + " 万", ""],
    ];
    for (const [k, v, cls] of rows) {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", k));
      const val = this.el("span", "sr-val " + cls, v);
      r.appendChild(val);
      c.appendChild(r);
    }
    if (step.money <= 60) c.appendChild(this.el("p", "modal-text", "⚠ 资金见底了——再这样下去，董事会要请你喝茶了。"));
    const btn = this.el("button", "btn btn-primary modal-close", "知道了");
    btn.onclick = () => { this.closeModal(); next(); };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 通用 VN 事件弹窗（含 choices 分支）：逐页点击推进，末页出选项/继续 */
  stepVN(step, next) {
    const pages = step.pages.slice();
    const c = this.card(step.title || "", "");
    const body = this.el("div", "vn-body");
    body.style.minHeight = "auto";
    body.style.padding = "0 0 6px";
    c.appendChild(body);
    this.modal(c);

    let idx = 0;
    const finish = () => { this.closeModal(); if (next) next(); };

    const showEnd = () => {
      body.innerHTML = "";
      body.onclick = null;
      if (step.choices && step.choices.length) {
        const box = this.el("div", "vn-choices");
        for (const ch of step.choices) {
          if (ch.gate === false) continue;
          const b = this.el("button", "vn-choice", ch.label + (ch.hint ? "　—— " + ch.hint : ""));
          b.onclick = (e) => {
            e.stopPropagation();
            /* 特殊交互：pickMode="sii5" → Team SII 五人选将窗（宫泽佐江毕业公演）
                          pickMode="sii5m" → Team SII 五人选将窗（玛莉亚东京毕业公演）
                          pickMode="pioneer6" → 开拓者六人点将窗（2017 移籍名单） */
            if (ch.pickMode === "sii5") {
              this.closeModal();
              this.showSIIInvitePicker(finish);
              return;
            }
            if (ch.pickMode === "sii5m") {
              this.closeModal();
              this.showMariaInvitePicker(finish);
              return;
            }
            if (ch.pickMode === "pioneer6") {
              this.closeModal();
              this.showPioneerPicker(finish);
              return;
            }
            if (ch.pickMode === "cgtPromote") {
              this.closeModal();
              this.showCgtPromotePicker(finish);
              return;
            }
            if (ch.pickMode === "p23Promote") {
              this.closeModal();
              this.showP23PromotePicker(finish);
              return;
            }
            const resultText = ch.run();
            // 选择结果作为一段旁白接着播放（再接事件 after 公共剧情），播完再结束本事件
            this.closeModal();
            this.stepVN({ title: "——", pages: [{ nar: true, t: Game.fmt(resultText) }].concat(step.after || []) }, finish);
          };
          box.appendChild(b);
        }
        body.appendChild(box);
      } else {
        const btn = this.el("button", "btn btn-primary modal-close", "继续");
        btn.onclick = finish;
        body.appendChild(btn);
      }
    };

    const renderPage = () => {
      body.innerHTML = "";
      const p = pages[idx];
      if (p.nar) {
        body.appendChild(this.el("div", "vn-text narration", p.t));
      } else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      body.appendChild(this.el("div", "vn-hint", idx < pages.length - 1 ? "点击继续 ▼" : ""));
      body.onclick = () => {
        if (idx < pages.length - 1) { idx++; renderPage(); }
        else showEnd();
      };
    };
    renderPage();
  },

  /* 总选举结果 */
  stepGEResult(step, next) {
    const c = this.card(step.title, "打投、应援与一年的经营，都压在这串名字上");

    /* 单行排名：名次 + 队徽 + 姓名 + （展示用）票数 */
    const mkRow = r => {
      const row = this.el("div", "settle-row");
      row.appendChild(this.el("span", "", "第" + r.rank + "名"));
      const right = this.el("span", "sr-val" + (r.rank === 1 ? " sr-plus" : ""), "");
      right.appendChild(this.el("span", "team-badge tb-" + r.team, r.team));
      right.appendChild(document.createTextNode(r.name));
      right.appendChild(this.el("span", "ge-votes", "　" + (r.votes / 10000).toFixed(1) + " 万票"));
      row.appendChild(right);
      return row;
    };

    /* 完整 TOP48 总名单（滚动） */
    c.appendChild(this.el("p", "ge-sub", "═══ TOP48 总名单 ═══"));
    const list = this.el("div", "ge-list");
    step.top48.forEach(r => list.appendChild(mkRow(r)));
    c.appendChild(list);

    /* 分团 TOP7（史实：2016 分团首次参加总选，各选 TOP7） */
    if (step.bejTop7 && step.bejTop7.length) {
      c.appendChild(this.el("p", "ge-sub", "BEJ48 TOP7"));
      const b = this.el("div", "ge-top7");
      step.bejTop7.forEach((n, i) => b.appendChild(this.el("span", "ge-chip", (i + 1) + ". " + n)));
      c.appendChild(b);
    }
    if (step.gnzTop7 && step.gnzTop7.length) {
      c.appendChild(this.el("p", "ge-sub", "GNZ48 TOP7"));
      const g = this.el("div", "ge-top7");
      step.gnzTop7.forEach((n, i) => g.appendChild(this.el("span", "ge-chip", (i + 1) + ". " + n)));
      c.appendChild(g);
    }

    c.appendChild(this.el("p", "modal-text", "打投与门票为账面带来 " + step.money + " 万收入，全团热度大涨。"));
    const btn = this.el("button", "btn btn-primary modal-close", "见证这一夜");
    btn.onclick = () => {
      this.closeModal();
      this.stepVN({ title: "总选举之夜", pages: step.pagesAfter }, next);
    };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 金曲大赏结果 */
  stepRTResult(step, next) {
    const tierText = { great: "大成功 —— 全场手机灯海，年度舞台没有之一", good: "成功 —— 稳稳的收官，口碑票房双收", normal: "平淡 —— 有惊无险地唱到了最后" }[step.tier];
    const c = this.card(step.title, "舞台质量评价：" + step.score + " / 100");
    c.appendChild(this.el("p", "modal-text", tierText + "\n\n门票与周边为账面带来 " + step.money + " 万。"));
    const btn = this.el("button", "btn btn-primary modal-close", "落幕");
    btn.onclick = () => {
      this.closeModal();
      this.stepVN({ title: "——", pages: step.pagesAfter }, next);
    };
    c.appendChild(btn);
    this.modal(c);
  },

  /* ---------------- 标题 / 开局 ---------------- */

  initTitle() {
    this.$("btn-new").onclick = () => this.showStart();
    /* 读档入口：有存档时显示存档详情卡（年代/进度/资金），点击载入 */
    const cont = this.$("btn-continue");
    let info = null;
    try {
      let raw = localStorage.getItem(Game.SAVE_KEY);
      if (!raw) raw = localStorage.getItem(Game.BACKUP_KEY);   // 主档缺失 → 备份
      if (raw) info = JSON.parse(raw);
    } catch (e) { info = null; }
    const eraName = info && info.era === "2026" ? "革新征程" : info && info.era === "2017" ? "本部新章" : "开辟分团";
    const ok = !!info && Game.hasSave();
    cont.classList.toggle("hidden", !ok);
    if (ok) {
      this.$("sc-line1").textContent = "读取存档 · " + info.era + "「" + eraName + "」线";
      this.$("sc-line2").textContent = info.year + "年" + info.month + "月 · 资金 " + info.money + " 万 · 热度 " + info.heat + " · 士气 " + info.morale;
    }
    cont.onclick = () => {
      const st = Game.load();
      if (!st) { this.toast("存档读取失败（版本不符或已损坏）"); return; }
      this.enterGame(false);
    };
    /* 「从存档码导入」常驻（无存档时它是找回进度的入口之一） */
    const imp = this.$("btn-import-title");
    imp.classList.remove("hidden");
    imp.onclick = () => {
      this.showCodeModal({
        title: "导入存档码",
        sub: "粘贴之前导出的存档码（以 SG48V1. 开头），确认后即可从标题页读档。",
        code: "",
        readonly: false,
        confirmLabel: "确认导入",
        onConfirm: (ta, close) => {
          const r = Game.importCode(ta.value);
          this.toast(r.msg);
          if (r.ok) { close(); this.showTitle(); }   // 重新初始化标题页，读档卡随即出现
        },
      });
    };
    /* 「从文件恢复进度」常驻（实测 360 本地打开不保留 localStorage，文件是最可靠兜底） */
    this.$("btn-file-title").classList.remove("hidden");
    this.$("btn-file-title").onclick = () => this.pickSaveFile(() => { this.showTitle(); this.toast("进度已从文件恢复，请点「读取存档」继续"); });
  },

  /* 保存进度为文件（触发浏览器下载 .sg48save）；file:// 下可用 */
  downloadSaveFile() {
    const f = Game.exportSaveFile();
    if (!f) { this.toast("还没有可导出的存档"); return; }
    try {
      const blob = new Blob([f.text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast("已下载存档文件：" + f.name + "（请勿改名后缀）");
    } catch (e) { this.toast("下载失败，请改用「导出存档码」"); }
  },

  /* 弹出文件选择器并读回存档文件；done 在成功后回调 */
  pickSaveFile(done) {
    const input = this.$("save-file-input");
    input.onchange = () => {
      const file = input.files && input.files[0];
      input.value = "";   // 允许重复选择同一文件
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const r = Game.importSaveText(String(reader.result), "进度已从文件恢复");
        this.toast(r.msg);
        if (r.ok && done) done();
      };
      reader.readAsText(file);
    };
    input.click();
  },

  showStart() {
    this.showScreen("screen-start");
    this._pickedEra = null;
    this.$("btn-start-game").disabled = true;
    this.$("btn-start-game").onclick = () => this.startPrologue();
    this.$("btn-back-title").onclick = () => this.showTitle();
    this.$("input-name").value = "";
    const c2016 = this.$("era-card-2016"), c2026 = this.$("era-card-2026");
    c2016.classList.remove("selected");
    c2026.classList.remove("selected");
    const pick = era => {
      this._pickedEra = era;
      c2016.classList.toggle("selected", era === "2016");
      c2026.classList.toggle("selected", era === "2026");
      this.$("btn-start-game").disabled = this.$("input-name").value.trim() === "";
    };
    c2016.onclick = () => pick("2016");
    c2026.onclick = () => pick("2026");   // v0.4：2026「革新征程」线已实装
  },

  startPrologue() {
    const name = this.$("input-name").value.trim();
    if (!name) { this.toast("先写下你的名字吧"); return; }
    if (this._pickedEra !== "2016" && this._pickedEra !== "2026") { this.toast("请选择一个开局年代"); return; }
    Game.newGame(name, null, this._pickedEra);
    this.showPrologue();
  },

  showPrologue() {
    this.showScreen("screen-vn");
    /* 按 era 取对应序章（2016 任职会议 / 2017 本部新章 / 2026 临危受命） */
    const pro = Game.st.era === "2026" ? STORY.prologue26
      : Game.st.era === "2017" ? STORY.prologue17
      : STORY.prologue;
    const rawPages = typeof pro.pages === "function" ? pro.pages(Game.st) : pro.pages;   // 序章页面支持按状态定制（2017 分团线交接）
    const pages = rawPages.map(p => ({ ...p, t: Game.fmt(p.t), s: p.s ? Game.fmt(p.s) : p.s }));
    const label = this.$("vn-scene-label");
    label.textContent = pro.sceneLabel;
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let idx = 0;

    const renderPage = () => {
      body.innerHTML = "";
      footer.innerHTML = "";
      const p = pages[idx];
      const hint = this.el("div", "vn-hint", "点击画面继续 ▼");
      if (p.nar) {
        body.appendChild(this.el("div", "vn-text narration", p.t));
      } else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(hint);
    };

    const startClosing = () => {
      /* closing 支持数组或函数（2026 线按会后抉择分支） */
      const rawClosing = typeof pro.closing === "function" ? pro.closing(Game.st) : pro.closing;
      const closing = rawClosing.map(p => ({ ...p, t: Game.fmt(p.t) }));
      this.playVNFull(closing, pro.sceneLabel, () => this.enterGame(true));
    };

    /* 序章后的「路线抉择」（2026 线：解散/重建 CGT48）；2016 线无此环节 */
    const showPathChoice = () => {
      const pc = pro.pathChoice;
      if (!pc) { startClosing(); return; }
      body.onclick = null;
      footer.innerHTML = "";
      const box = this.el("div", "vn-choices");
      for (const c of pc.choices) {
        const b = this.el("button", "vn-choice", c.label + "　—— " + (c.hint || ""));
        b.onclick = (e) => {
          e.stopPropagation();
          if (c.tag) Game.recordDecision(c.tag, c.value !== undefined ? c.value : c.id);
          const rt = c.apply(Game.st);
          const resultPages = [{ nar: true, t: rt }].concat((pc.after || []).map(p => ({ ...p, t: Game.fmt(p.t) })));
          this.playVNFull(resultPages, pro.sceneLabel, startClosing);
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };

    const showStyleChoice = () => {
      footer.innerHTML = "";
      body.onclick = null;
      const box = this.el("div", "vn-choices");
      for (const s of pro.styles) {
        const b = this.el("button", "vn-choice", s.label + "　—— " + s.hint);
        b.onclick = (e) => {
          e.stopPropagation();
          Game.applyStyle(s.id);
          if (pro.pathChoice) {
            const pcfg = pro.pathChoice;
            const pcPages = (typeof pcfg.pages === "function" ? pcfg.pages(Game.st) : pcfg.pages).map(p => ({ ...p, t: Game.fmt(p.t), s: p.s ? Game.fmt(p.s) : p.s }));
            this.playVNFull(pcPages, pcfg.sceneLabel || pro.sceneLabel, showPathChoice);
          } else startClosing();
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };

    body.onclick = () => {
      if (idx < pages.length - 1) { idx++; renderPage(); }
      else showStyleChoice();
    };
    renderPage();
  },

  /* 全屏 VN 播放器（序章后半 / 复用屏幕三） */
  playVNFull(pages, sceneLabel, onDone) {
    this.showScreen("screen-vn");
    this.$("vn-scene-label").textContent = sceneLabel || "";
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let idx = 0;
    const render = () => {
      body.innerHTML = ""; footer.innerHTML = "";
      const p = pages[idx];
      if (p.nar) body.appendChild(this.el("div", "vn-text narration", p.t));
      else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(this.el("div", "vn-hint", "点击画面继续 ▼"));
    };
    body.onclick = () => {
      if (idx < pages.length - 1) { idx++; render(); }
      else { body.onclick = null; if (onDone) onDone(); }
    };
    render();
  },

  /* 行动剧情场景播放器（分团主线各阶段、走访小剧场共用）。
     scene 结构：{ label, pages, choices?, after? }
       pages  先播放；播完若有 choices 显示选项（apply(st) 返回结算文本，
              会记入日志），结算文本作为旁白页接在 after 页之前播放。
     播放完毕自动回到经营界面再回调 onDone。 */
  playScene(scene, onDone) {
    const st = Game.st;
    const fmt = t => Game.fmt(t, { city: st.branch.city || "目的地" });
    const rawPages = typeof scene.pages === "function" ? scene.pages(st) : (scene.pages || []);
    const main = rawPages.map(p => ({ ...p, t: fmt(p.t), s: p.s ? fmt(p.s) : p.s }));
    const after = (scene.after || []).map(p => ({ ...p, t: fmt(p.t), s: p.s ? fmt(p.s) : p.s }));
    this.showScreen("screen-vn");
    this.$("vn-scene-label").textContent = scene.label ? fmt(scene.label) : "";
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let queue = main, idx = 0;

    const render = () => {
      body.innerHTML = ""; footer.innerHTML = "";
      const p = queue[idx];
      if (p.nar) body.appendChild(this.el("div", "vn-text narration", p.t));
      else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(this.el("div", "vn-hint", "点击画面继续 ▼"));
      body.onclick = () => {
        if (idx < queue.length - 1) { idx++; render(); return; }
        if (queue === main && scene.choices && scene.choices.length) { showChoices(); return; }
        if (queue === main && after.length) { queue = after; idx = 0; render(); return; }
        this.showScreen("screen-game");
        if (onDone) onDone();
      };
    };
    const showChoices = () => {
      body.onclick = null; footer.innerHTML = "";
      const box = this.el("div", "vn-choices");
      for (const ch of scene.choices) {
        const b = this.el("button", "vn-choice", ch.label + (ch.hint ? "　—— " + ch.hint : ""));
        b.onclick = (e) => {
          e.stopPropagation();
          if (ch.tag) Game.recordDecision(ch.tag, ch.value !== undefined ? ch.value : ch.id);   // 决策标签登记
          const rt = ch.apply(Game.st);   // 选项效果落地
          Game.logChoice(rt);             // 结算文本记入当月日志
          queue = [{ nar: true, t: rt }, ...after];
          idx = 0;
          render();
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };
    render();
  },

  /* ---------------- 经营主界面 ---------------- */

  enterGame(isNew) {
    this.showScreen("screen-game");
    this._memberFilter = "all";
    /* monthStart 有幂等保护：新开局/推进到新月/中途读档三种进入方式都安全 */
    const steps = Game.monthStart();
    this.playSteps(steps, () => this.renderGame());
  },

  renderGame() {
    const st = Game.st;
    this.renderHUD();
    this.renderBoard();
    this.renderMembers();
    this.renderLog();
    this.switchTab("board");
  },

  renderHUD() {
    const st = Game.st;
    this.$("hud-date").textContent = Game.dateLabel();
    // 行动点
    let apHtml = "";
    for (let i = 0; i < 3; i++) apHtml += i < st.ap ? '<span class="ap-on">●</span>' : '<span class="ap-off">○</span>';
    this.$("hud-ap").innerHTML = "行动 " + apHtml;
    // 资源
    const chips = [
      { label: "资金", val: st.money + "万", cls: "v-money", warn: st.money <= 60 },
      { label: "热度", val: st.heat, cls: "v-heat", warn: false },
      { label: "士气", val: st.morale, cls: "v-morale", warn: st.morale < 40 },
      { label: "叶盛负担", val: st.burden, cls: "v-burden", warn: st.burden >= 80 },
      { label: "训练度", val: st.train, cls: "v-train", warn: false },
    ];
    if (st.era === "2017") chips.push({ label: "平均实力", val: Game.avgPwr(st), cls: "v-train", warn: false });
    this.$("hud-res").innerHTML = chips.map(c =>
      '<div class="res-chip"><div class="res-label">' + c.label + '</div><div class="res-value ' + c.cls + (c.warn ? " warn" : "") + '">' + c.val + "</div></div>"
    ).join("");
  },

  renderBoard() {
    const st = Game.st;
    const box = this.$("quest-cards");
    box.innerHTML = "";

    /* ============ 2026 线：四条主线看板 ============ */
    if (st.era === "2026") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 年度活动（总选举 + 金曲大赏，营业不佳会取消） */
      const b1 = this.el("div", "quest-desc",
        (st.geDone ? "总选举 ✔（第一名：" + st.geResult.top1 + "）" : "总选举 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtCancelled ? "金曲大赏 ✘ 已被陶莺取消" : st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线① · 年度活动策划",
        st.geDone && (st.rtDone || st.rtCancelled) ? "✔ 已了结" : "进行中",
        st.geDone && (st.rtDone || st.rtCancelled) ? "q-done" : "q-open", b1));
      /* 主线② 分担叶盛 */
      const b2bar = this.el("div", "mc-bar bond"); b2bar.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b2 = this.el("div", "");
      b2.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b2.appendChild(b2bar);
      box.appendChild(mkCard("主线② · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : st.burden >= 80 ? "q-open" : "", b2));
      /* 主线③ 末位淘汰（陶莺机制） */
      const done3 = st.elim.executed + st.elim.transferred;
      const b3 = this.el("div", "quest-desc",
        "已执行 " + st.elim.executed + " 次 · 调往CGT48 " + st.elim.transferred + " 人 · 缓刑 " + st.elim.defied + " 次"
        + (st.elim.defied >= 2 ? "　⚠ 陶莺的耐心正在耗尽" : ""));
      box.appendChild(mkCard("主线③ · 执行末位淘汰",
        done3 >= 3 ? "✔ 陶总认可" : "评审 ×" + Math.max(0, 3 - done3) + " 待执行", done3 >= 3 ? "q-done" : "q-open", b3));
      /* 主线④ CGT48 重建（解散路线变更为「安置前成员」） */
      if (st.cgt.closed) {
        const n4 = st.cgt.settled || 0;
        const bar4b = this.el("div", "mc-bar bond"); bar4b.innerHTML = "<i style=\"width:" + Math.round(n4 / 3 * 100) + "%\"></i>";
        const b4b = this.el("div", "");
        b4b.appendChild(bar4b);
        b4b.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "安置进度（3批）"), this.el("span", "", n4 + "/3")]));
        b4b.appendChild(this.el("div", "quest-detail",
          st.cgt.settleDone ? "✔ 前成员已全部妥善安置" : "通过「安置CGT48前成员」行动，为前成员安排转型与本部考核"));
        box.appendChild(mkCard("主线④ · 安置CGT48前成员",
          st.cgt.settleDone ? "✔ 安置完成" : "进行中", st.cgt.settleDone ? "q-done" : "q-open", b4b));
        this.renderActions();
        return;
      }
      const dots4 = this.el("div", "quest-progress");
      for (let i = 1; i <= 4; i++) dots4.appendChild(this.el("div", "p-dot" + (st.cgt.stage >= i ? " on" : "")));
      const b4 = this.el("div", "");
      b4.appendChild(dots4);
      b4.appendChild(this.el("div", "quest-detail",
        st.cgt.open ? "✔ 重启首演已于 " + st.cgt.openMonth + " 月落幕" : st.cgt.stage >= 4 ? "重建就绪，本月末重启首演！" : "目标：年内让成都的剧场重新亮灯"));
      box.appendChild(mkCard("主线④ · CGT48 重建",
        st.cgt.open ? "✔ 已重启" : st.cgt.stage >= 4 ? "待首演" : "目标：重启首演", st.cgt.open ? "q-done" : "q-open", b4));
      this.renderActions();
      return;
    }

    /* ============ 2017 线（本部新章）：六条主线看板 ============ */
    if (st.era === "2017") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 双团开设 */
      const b17 = st.branch17;
      const dots17 = this.el("div", "quest-progress");
      for (let i = 1; i <= 4; i++) dots17.appendChild(this.el("div", "p-dot" + (b17.ckg >= i ? " on" : "")));
      const b1 = this.el("div", "");
      b1.appendChild(this.el("div", "quest-detail",
        "SHY48（沈阳）：" + (b17.shyOpen ? "✔ " + b17.shyOpenMonth + " 月开业首演" : b17.shy >= 1 ? "筹备就绪，月末开业" : "剧场筹备中（目标：1月首演）")));
      b1.appendChild(dots17);
      b1.appendChild(this.el("div", "quest-detail",
        "CKG48（重庆）：" + (b17.ckgOpen ? "✔ " + b17.ckgOpenMonth + " 月开业首演" : "筹备阶段 " + b17.ckg + "/3（目标：10月末首演）")));
      box.appendChild(mkCard("主线① · 双团开设",
        b17.shyOpen && b17.ckgOpen ? "✔ 四城灯已亮" : "进行中", b17.shyOpen && b17.ckgOpen ? "q-done" : "q-open", b1));
      /* 主线② 年度活动 */
      const b2 = this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线② · 年度大活动",
        st.geDone && st.rtDone ? "✔ 已了结" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open", b2));
      /* 主线③ 成员实力 */
      const growth = Game.avgPwr(st) - (st.pwrBase || 0);
      const bar3 = this.el("div", "mc-bar pop"); bar3.innerHTML = "<i style=\"width:" + Game.avgPwr(st) + "%\"></i>";
      const b3 = this.el("div", "");
      b3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "全团平均实力"), this.el("span", "", Game.avgPwr(st) + "（较年初 " + (growth >= 0 ? "+" : "") + growth + "）")]));
      b3.appendChild(bar3);
      box.appendChild(mkCard("主线③ · 提升成员实力",
        growth >= 5 ? "✔ 淬炼有成" : "进行中", growth >= 5 ? "q-done" : "q-open", b3));
      /* 主线④ 分担叶盛（分团线：专注对应分团事务） */
      const dutyPost = Game.branchDutyPost(st);
      const bar4 = this.el("div", "mc-bar bond"); bar4.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b4 = this.el("div", "");
      b4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", dutyPost ? dutyPost + "的事务压力" : "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b4.appendChild(bar4);
      box.appendChild(mkCard(dutyPost ? "主线④ · 专注" + dutyPost + "事务" : "主线④ · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : "", b4));
      /* 主线⑤ 团体影响力 */
      const marks = [
        st.flags.tvCny ? "卫视春晚×" + st.flags.tvCny : null,
        st.flags.s7 ? "7SENSES" : null,
        st.flags.aji ? "阿吉资源线" : null,
        st.heat >= 80 ? "热度长红" : null,
      ].filter(Boolean);
      const b5 = this.el("div", "quest-detail", "当前热度 " + st.heat + " / 100" + (marks.length ? "　|　里程碑：" + marks.join(" · ") : "　|　提示：会后找工作人员阿吉谈谈"));
      box.appendChild(mkCard("主线⑤ · 提高团体影响力",
        st.heat >= 80 ? "✔ 影响力出圈" : "进行中", st.heat >= 80 ? "q-done" : "q-open", b5));
      /* 主线⑥ 原创公演（复刻模式：四套新复刻公演） */
      const rep17 = Game.isReplicate(st);
      const b6 = this.el("div", "quest-detail",
        ["SII", "NII", "HII", "X"].map(t => (st.orig[t] ? "✔ " : "○ ") + t).join("　")
        + "　|　已完成 " + Game.origCount(st) + "/4 套（" + (rep17 ? "山本学：让它们像自己的舞台一样立起来" : "王子杰：自己的歌，才是根") + "）");
      box.appendChild(mkCard(rep17 ? "主线⑥ · 四套新复刻公演" : "主线⑥ · 四队原创公演",
        Game.origCount(st) >= 4 ? "✔ 全部首演" : "进行中", Game.origCount(st) >= 4 ? "q-done" : "q-open", b6));
      this.renderActions();
      return;
    }

    /* ============ 2016 线（原版看板） ============ */

    /* 主线① 分团 */
    const q1 = this.el("div", "quest-card");
    q1.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线① · 分团筹备")));
    q1.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.branch.announce ? " q-done" : " q-open"),
      st.branch.announce ? "✔ 已官宣成立（" + st.branch.announceMonth + "月）" : "目标：4月20日官宣"));
    const dots = this.el("div", "quest-progress");
    for (let i = 1; i <= 5; i++) dots.appendChild(this.el("div", "p-dot" + (st.branch.stage >= i ? " on" : "")));
    q1.appendChild(dots);
    const stage = st.branch.stage === 0 ? "尚未启动" : (STORY.branchStages[st.branch.stage - 1].stage <= st.branch.stage ? (st.branch.stage >= 5 ? "筹备完成，静待官宣" : "已完成：" + STORY.branchStages[st.branch.stage - 1].title) : "");
    q1.appendChild(this.el("div", "quest-desc",
      (st.branch.city ? "选址：" + st.branch.city + " · " : "") + stage));
    box.appendChild(q1);

    /* 主线② 总选举 */
    const q2 = this.el("div", "quest-card");
    q2.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线② · 总选举")));
    q2.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.geDone ? " q-done" : " q-open"),
      st.geDone ? "✔ 第一名：" + st.geResult.top1 : "7月30日 · 比翼齐飞"));
    if (!st.geDone) {
      const bar = this.el("div", "mc-bar pop"); bar.innerHTML = "<i style=\"width:" + st.gePlan + "%\"></i>";
      q2.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "筹备度"), this.el("span", "", st.gePlan + "/100")]));
      q2.appendChild(bar);
    }
    box.appendChild(q2);

    /* 主线③ 金曲大赏 */
    const q3 = this.el("div", "quest-card");
    q3.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线③ · 金曲大赏")));
    q3.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.rtDone ? " q-done" : " q-open"),
      st.rtDone ? "✔ 质量评价 " + st.rtScore : "12月30日 · BEST 50"));
    if (!st.rtDone && st.month >= 10) {
      const bar = this.el("div", "mc-bar pop"); bar.innerHTML = "<i style=\"width:" + st.rtPlan + "%\"></i>";
      q3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "筹备度"), this.el("span", "", st.rtPlan + "/100")]));
      q3.appendChild(bar);
    }
    box.appendChild(q3);

    /* 主线④ 叶盛 */
    const q4 = this.el("div", "quest-card");
    q4.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线④ · 分担叶盛")));
    q4.querySelector(".quest-head").appendChild(this.el("span", "quest-tag",
      st.burden >= 80 ? "⚠ 事务积压" : st.burden <= 25 ? "运转顺畅" : "正常运转"));
    const bar4 = this.el("div", "mc-bar bond"); bar4.innerHTML = "<i style=\"width:" + st.burden + "%;background:var(--gold)\"></i>";
    q4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
    q4.appendChild(bar4);
    box.appendChild(q4);
    this.renderActions();
  },

  /* 行动区（两条线共用）：本月行动按钮 + 月末按钮 */
  renderActions() {
    const st = Game.st;
    const grid = this.$("action-grid");
    grid.innerHTML = "";
    for (const a of Game.listActions()) {
      const b = this.el("button", "action-btn" + (a.main ? " q-main" : "") + (st.ap <= 0 ? " ap-zero" : ""));
      b.appendChild(this.el("div", "action-name", a.name));
      b.appendChild(this.el("div", "action-desc", a.disabled && a.disabledTip ? "🔒 " + a.disabledTip : a.desc));
      b.disabled = a.disabled || st.ap <= 0;
      b.onclick = () => this.onAction(a.id);
      grid.appendChild(b);
    }
    this.$("ap-note").textContent = st.ap > 0 ? "（剩余 " + st.ap + " 点）" : "（本日工作已排满）";

    /* 月末按钮（每次重渲染时替换，避免重复追加） */
    const oldEnd = this.$("btn-month-end");
    if (oldEnd) oldEnd.remove();
    const endBtn = this.el("button", "btn " + (st.ap <= 0 ? "btn-primary" : "btn-ghost") + " btn-big");
    endBtn.id = "btn-month-end";
    endBtn.style.marginTop = "14px";
    endBtn.textContent = st.ap <= 0 ? "进入月末结算 →" : "提前进入月末（还有 " + st.ap + " 点行动力）";
    endBtn.onclick = () => this.onMonthEnd();
    grid.parentElement.appendChild(endBtn);
  },

  onAction(id) {
    if (id === "visit") { this.showMemberPicker(); return; }
    if (id === "coach") { this.showCoachPicker(); return; }   // 2017：先选特训对象
    const res = Game.doAction(id);
    if (!res) return;
    this.renderGame();
    /* 安置点将（解散路线）：先播剧情（首批），再弹分批点将窗 */
    if (res.tone === "settlePick") {
      const ids = res.batchList;
      const openPicker = () => this.showSettleBatchPicker(ids);
      if (res.vn) this.playScene(res.vn, openPicker); else openPicker();
      return;
    }
    /* 原创公演（2017）：先弹队伍选择窗，选队后播放制作场景 */
    if (res.tone === "origPick") { this.showOrigPicker(); return; }
    /* 行动附带剧情场景：先播放场景，结束后再弹结算/选址 */
    if (res.vn) {
      this.playScene(res.vn, () => {
        this.renderGame();
        if (res.tone === "pickCity") this.showCityPicker();
        else if (res.text) this.toast(res.text);
      });
      return;
    }
    if (res.tone === "pickCity") { this.showCityPicker(); return; }
    this.toast(res.text);
  },

  showCityPicker() {
    const c = this.card("分团选址", "考察组列出了四座候选城市——这一笔，决定分团未来十年");
    const grid = this.el("div", "modal-choices");
    for (const city of STORY.branchCities) {
      const b = this.el("button", "vn-choice", "");
      b.innerHTML = "<b>" + city.name + "</b>　<span style=\"font-size:12px;color:var(--text-dim)\">" + city.desc + "</span><br><span style=\"font-size:11px;color:var(--gold)\">一次性：资金" + (city.cost + city.moneyBonus >= 0 ? "+" : "") + (city.cost + city.moneyBonus) + "万 · 热度" + (city.heatBonus >= 0 ? "+" : "") + city.heatBonus + "</span>";
      b.onclick = () => {
        const res = Game.pickCity(city.id);
        this.closeModal();
        if (res) { this.toast(res.text); this.renderGame(); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    this.modal(c);   // 不给关闭按钮——选址必须拍板
  },

  /* Team SII 五人选将窗（复刻路线：宫泽佐江毕业公演赴日名单）。
     多选模式：点选/取消，选满 5 人方可确认；生效逻辑在 engine.miyazawaInvite。 */
  /* 通用多选点将窗：cfg = { title, sub, pool, count, confirmLabel, cardInfo(m), onConfirm(ids) }
     （赴日五人 / 开拓者六人等「选 N 人」交互共用） */
  showMultiPick(cfg) {
    const picked = new Set();
    const c = this.card(cfg.title, cfg.sub);
    const counter = this.el("p", "modal-text", "已选 0 / " + cfg.count);
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "已选 " + picked.size + " / " + cfg.count + (picked.size === cfg.count ? "　✔ 可以确认" : "　（点击卡片选择 / 取消）");
      confirmBtn.disabled = picked.size !== cfg.count;
    };
    for (const m of cfg.pool) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + cfg.cardInfo(m) + "</span>";
      b.onclick = () => {
        if (picked.has(m.id)) { picked.delete(m.id); b.classList.remove("on"); }
        else if (picked.size < cfg.count) { picked.add(m.id); b.classList.add("on"); }
        else { this.toast("最多" + cfg.count + "个人——先取消一位再选"); return; }
        refresh();
      };
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      this.closeModal();
      cfg.onConfirm([...picked]);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——必须点将才能继续
  },

  /* Team SII 五人选将窗（复刻路线：宫泽佐江毕业公演赴日名单） */
  showSIIInvitePicker(onDone) {
    this.showMultiPick({
      title: "赴日名单 · 点将五人",
      sub: "宫泽佐江的毕业公演——仅限 Team SII 在籍成员，被选中者羁绊+10 人气+3",
      pool: Game.st.members.filter(m => m.status === "active" && m.team === "SII"),
      count: 5,
      confirmLabel: "名单敲定，出发东京 →",
      cardInfo: m => m.team + " · 羁绊" + m.bond + " 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.miyazawaInvite(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* Team SII 五人选将窗（复刻模式：铃木玛莉亚东京毕业公演赴日名单）。
     生效逻辑在 engine.mariaInvite。 */
  showMariaInvitePicker(onDone) {
    this.showMultiPick({
      title: "铃木玛莉亚毕业公演 · 赴日名单",
      sub: "东京的毕业公演——仅限 Team SII 在籍成员，被选中者羄绊+10 人气+3",
      pool: Game.st.members.filter(m => m.status === "active" && m.team === "SII"),
      count: 5,
      confirmLabel: "名单敲定，出发东京 →",
      cardInfo: m => m.team + " · 羄绊" + m.bond + " 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.mariaInvite(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 开拓者六人点将窗（2017 分团线伏笔：六人随总监移籍 SHY48/CKG48） */
  /* 安置分批点将窗（2026 解散路线）：每批名额 上海3 / 广州2 / 重庆2。
     点击卡片循环分配：未定 → 上海 → 广州 → 重庆 → 未定；名额满后不可再选。
     确认时未分配者协商解约离团（备注「解散安置」）。落地逻辑在 engine.settleBatch。 */
  showSettleBatchPicker(batchIds) {
    const st = Game.st;
    const QUOTA = { sh: 3, gz: 2, cq: 2 };
    const DST = [
      { key: "sh", label: "调往上海 · 预备生", cls: "on-sh" },
      { key: "gz", label: "调往广州 GNZ48 · 预备生", cls: "on-gz" },
      { key: "cq", label: "调往重庆 CKG48 · 预备生", cls: "on-cq" },
    ];
    const dst = {};   // id → "sh"|"gz"|"cq"
    const count = key => Object.values(dst).filter(v => v === key).length;
    const cur0 = id => dst[id];
    const c = this.card("安置名单 · 第" + (st.cgt.settled + 1) + "批",
      "点击卡片循环分配去处：上海 3 人 / 广州 2 人 / 重庆 2 人。未分配者将协商解约离团（解散安置）");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "本批名单敲定 →");
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "上海 " + count("sh") + "/" + QUOTA.sh + " · 广州 " + count("gz") + "/" + QUOTA.gz + " · 重庆 " + count("cq") + "/" + QUOTA.cq;
      confirmBtn.disabled = !(count("sh") === QUOTA.sh && count("gz") === QUOTA.gz && count("cq") === QUOTA.cq);
    };
    for (const id of batchIds) {
      const m = st.members.find(x => x.id === id);
      if (!m) continue;
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        const cur = dst[id];
        DST.forEach(d => b.classList.remove(d.cls));
        let label;
        if (!cur) { label = "点击分配去处"; }
        else {
          const d = DST.find(x => x.key === cur);
          b.classList.add(d.cls);
          label = d.label;
        }
        b.innerHTML = m.name + '<span class="pb-team">' + label + "</span>";
      };
      b.onclick = () => {
        let nextIdx = cur0(id) ? DST.findIndex(x => x.key === cur0(id)) + 1 : 0;
        /* 从下一档开始找有空位的档位；全满则重置为未分配 */
        for (; nextIdx < DST.length; nextIdx++) {
          const k = DST[nextIdx].key;
          if (count(k) < QUOTA[k]) { dst[id] = k; paint(); refresh(); return; }
        }
        delete dst[id]; paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      const dest = { sh: [], gz: [], cq: [] };
      for (const id in dst) dest[dst[id]].push(id);
      const res = Game.settleBatch(dest);
      this.closeModal();
      this.renderGame();
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——本批名单必须敲定
  },

  /* 四队循环分配窗核心（SII→NII→HII→X 点击循环，无名额限制；全员分配后可确认）
     cfg = { title, sub, pool, confirmLabel, onConfirm(dst) } */
  showTeamAssignPicker(cfg) {
    const TEAMS = [
      { key: "SII", label: "升入 Team SII", cls: "on-sii" },
      { key: "NII", label: "升入 Team NII", cls: "on-nii" },
      { key: "HII", label: "升入 Team HII", cls: "on-hii" },
      { key: "X",   label: "升入 Team X",   cls: "on-x" },
    ];
    const targets = cfg.pool;
    const dst = {};   // id → "SII"|"NII"|"HII"|"X"
    const count = key => Object.values(dst).filter(v => v === key).length;
    const c = this.card(cfg.title, cfg.sub);
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "SII " + count("SII") + " · NII " + count("NII") + " · HII " + count("HII") + " · X " + count("X") +
        "（共 " + targets.length + " 人）";
      confirmBtn.disabled = Object.keys(dst).length !== targets.length;
    };
    for (const m of targets) {
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        TEAMS.forEach(t => b.classList.remove(t.cls));
        const cur = dst[m.id];
        let label;
        if (!cur) label = "点击选择队伍";
        else {
          const t = TEAMS.find(x => x.key === cur);
          b.classList.add(t.cls);
          label = t.label;
        }
        b.innerHTML = m.name + '<span class="pb-team">' + label + "</span>";
      };
      b.onclick = () => {
        const nextIdx = dst[m.id] ? TEAMS.findIndex(x => x.key === dst[m.id]) + 1 : 0;
        if (nextIdx >= TEAMS.length) delete dst[m.id];
        else dst[m.id] = TEAMS[nextIdx].key;
        paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      this.closeModal();
      cfg.onConfirm(dst);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——必须完成分配
  },

  /* CGT48 移籍预备生升格窗（2026 解散路线）：落地逻辑在 engine.promoteCgt */
  showCgtPromotePicker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active");
    this.showTeamAssignPicker({
      title: "升格名单 · 选择队伍",
      sub: "为每位 CGT48 移籍预备生选择归队（点击卡片循环切换队伍）；全员分配后可确认",
      pool: targets,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promoteCgt(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 二十三期预备生升格窗（2026 年 2 月，含 22 期应籽言一并转正）；落地在 engine.promoteTeams23。
     注意排除 CGT48 移籍预备生——她们的升格走 5 月联动事件（flags.cgtPromoted 线） */
  showP23PromotePicker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.team === "PREP" && m.status === "active" && m.gen !== "CGT48移籍");
    this.showTeamAssignPicker({
      title: "二十三期升格名单 · 选择队伍",
      sub: "为二十三期预备生选择归队（22 期应籽言一并转正）；点击卡片循环切换队伍",
      pool: targets,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promoteTeams23(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 开拓者六人点将窗（2017 分团线伏笔：六人随总监移籍 SHY48/CKG48） */
  showPioneerPicker(onDone) {
    const st = Game.st;
    const target = st.decisions.branchPost;
    const city = target === "SHY48" ? "沈阳" : "重庆";
    this.showMultiPick({
      title: "开拓者名单 · 点将六人",
      sub: "明年一月随你移籍" + city + "（" + target + "）。BEJ48/GNZ48 成员无影响；SNH48 高人气成员（⚠）可能不满，有概率提出离团",
      pool: st.members.filter(m => m.status === "active" || m.status === "branch"),
      count: 6,
      confirmLabel: "名单敲定，共赴新河 →",
      cardInfo: m => m.status === "branch"
        ? m.branchTeam + " " + (m.branchLabel || "")
        : m.team + " · 人气" + m.pop + (m.pop >= 60 ? " ⚠高人气" : ""),
      onConfirm: ids => {
        const res = Game.pioneerPick(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 2017 线：安排成员特训的成员选择窗（按实力升序：优先补短板，也可反着点） */
  showCoachPicker() {
    const c = this.card("安排成员特训", "选择一名成员进行一对一特训（实力+6 羁绊+4 资金-20万）");
    const grid = this.el("div", "pick-grid");
    for (const m of Game.activeMembers(Game.st).slice().sort((a, b) => (a.pwr || 0) - (b.pwr || 0))) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + m.team + " · 实力" + (m.pwr || 0) + " · 羁绊" + m.bond + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("coach", { memberId: m.id });
        if (!res) return;
        this.renderGame();
        this.toast(res.text);
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "先不练了（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 2017 线：公演制作的队伍选择窗（选队后播放制作/排练场景，选项内落地数值）；复刻模式文案随 jpMode 切换 */
  showOrigPicker() {
    const st = Game.st;
    const rep = Game.isReplicate(st);
    const TEAMS = ["SII", "NII", "HII", "X"].filter(t => !st.orig[t]);
    const c = this.card(rep ? "复刻公演排练 · 选择队伍" : "原创公演制作 · 选择队伍", rep
      ? "排练日方授权的四套新复刻公演（主线⑥）；每套排练成本 40万"
      : "为本部四队各制作一套原创公演（主线⑥）；每套耗资 "
        + (st.decisions.akbSplit === "original" || st.flags.originalSongsStarted ? "60万（源头计划曲库支援）" : "80万"));
    const grid = this.el("div", "pick-grid");
    for (const t of TEAMS) {
      const members = st.members.filter(m => m.status === "active" && m.team === t && m.pwr != null);
      const avg = members.length ? Math.round(members.reduce((s, m) => s + m.pwr, 0) / members.length) : 0;
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = "Team " + t + '<span class="pb-team">队内平均实力 ' + avg + (st.orig[t] ? " · ✔ 已完成" : "") + "</span>";
      b.onclick = () => {
        this.closeModal();
        this.playScene(STORY.scenes17.orig(t), () => this.renderGame());
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  showMemberPicker() {
    const c = this.card("走访成员", "选择一位成员谈心（羁绊+12 士气+3 叶盛负担-8）");
    const grid = this.el("div", "pick-grid");
    for (const m of Game.activeMembers(Game.st).slice().sort((a, b) => b.bond - a.bond)) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + m.team + " · 羁绊" + m.bond + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("visit", { memberId: m.id });
        if (!res) return;
        this.renderGame();
        if (res.vn) this.playScene(res.vn, () => { this.renderGame(); this.toast(res.text); });
        else { this.toast(res.text); this.renderGame(); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "先不聊了（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  onMonthEnd() {
    const st = Game.st;
    if (st.ap > 0 && !confirm("本月还有 " + st.ap + " 点行动力，确定提前进入月末结算？")) return;
    const steps = Game.endMonth();
    this.playSteps(steps, () => {
      if (st.month >= 12) return;          // 12月由结局步骤接管
      Game.advanceMonth();
      const startSteps = Game.monthStart();
      this.playSteps(startSteps, () => this.renderGame());
    });
  },

  /* ---------------- 成员页 ---------------- */

  renderMembers() {
    const st = Game.st;
    const filter = this.$("team-filter");
    filter.innerHTML = "";
    /* 标签页按 era 组装：2016 = 五队 + 分团两页；2017 = 五队+预备生+四分团；2026 = 本部队 + 三分团 */
    let teams;
    if (st.era === "2026") {
      teams = [["all", "全部"]];
      for (const t of DATA2026.teams) teams.push([t.id, t.short]);
      teams.push(["HALL", "荣誉殿堂"]);
      for (const b of DATA2026.branches) teams.push([b.id, b.id]);
      teams.push(["rest", "暂休"], ["left", "已离团"]);
    } else if (st.era === "2017") {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"], ["PREP", "预备生"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["SHY48", "SHY48"], ["CKG48", "CKG48"], ["HALL", "荣誉殿堂"], ["rest", "暂休"], ["left", "已离团"]];
    } else {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["rest", "暂休"], ["left", "已离团"]];
    }
    for (const [k, label] of teams) {
      const chip = this.el("button", "tf-chip" + (this._memberFilter === k ? " on" : ""), label);
      chip.onclick = () => { this._memberFilter = k; this.renderMembers(); };
      filter.appendChild(chip);
    }
    const list = this.$("member-list");
    list.innerHTML = "";
    let members = st.members.slice();
    const isBranchTab = ["BEJ48", "GNZ48", "CKG48", "SHY48", "CGT48"].includes(this._memberFilter);
    if (this._memberFilter === "all") members = members.filter(m => m.status === "active");
    else if (isBranchTab)
      members = members.filter(m => m.status === "branch" && m.branchTeam === this._memberFilter);
    else if (this._memberFilter === "rest") members = members.filter(m => m.status === "rest");
    else if (this._memberFilter === "left") members = members.filter(m => m.status === "left");
    else members = members.filter(m => m.team === this._memberFilter && m.status === "active");

    members.sort((a, b) => b.pop - a.pop);
    for (const m of members) {
      const isBranch = m.status === "branch";
      const isHall = m.team === "HALL" || m.hall;             // 荣誉殿堂/影视部分类
      const badgeTeam = isBranch ? m.branchTeam : m.team;   // 分团成员显示分团队徽
      const badgeText = badgeTeam === "HALL" ? "影视部" : badgeTeam;
      const card = this.el("div", "member-card" + (m.status === "left" ? " mc-left" : isBranch ? " mc-branch" : m.hall ? " mc-hall" : ""));
      const nameRow = this.el("div", "mc-name", "");
      nameRow.appendChild(this.el("span", "team-badge tb-" + badgeTeam, badgeText));
      nameRow.appendChild(document.createTextNode(m.name));
      if (m.hall) nameRow.appendChild(this.el("span", "mc-flag", "殿堂"));
      if (m.captain) nameRow.appendChild(this.el("span", "mc-flag", "队长"));
      else if (m.vice) nameRow.appendChild(this.el("span", "mc-flag", "副队"));
      card.appendChild(nameRow);
      /* 2026 分团成员为简卡：仅姓名 + 队伍标注（用户要求），无人气/羁绊条 */
      const simple = isBranch && !m.pop && !m.bond;
      const metaText = (m.gen || "")
        + (isBranch ? " · " + (m.branchLabel || m.branchTeam) : "")
        + (isHall ? " · 荣誉殿堂 · 影视部" : "")
        + (!isBranch ? (m.status === "rest" ? " · 暂休" : m.status === "left" ? " · 已离团" : "") : "")
        + (!isBranch && m.note && m.status !== "active" ? " · " + m.note : "");
      card.appendChild(this.el("div", "mc-meta", metaText));
      if (simple) { list.appendChild(card); continue; }
      const popBar = this.el("div", "mc-bar pop"); popBar.innerHTML = "<i style=\"width:" + m.pop + "%\"></i>";
      card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "人气"), this.el("span", "", m.pop)]));
      card.appendChild(popBar);
      /* 实力条（2017 线：成员卡新增实力计数） */
      if (m.pwr != null) {
        const pwrBar = this.el("div", "mc-bar pop"); pwrBar.innerHTML = "<i style=\"width:" + m.pwr + "%;background:#6fd7ff\"></i>";
        card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "实力"), this.el("span", "", m.pwr)]));
        card.appendChild(pwrBar);
      }
      if (m.status === "active") {
        const bondBar = this.el("div", "mc-bar bond"); bondBar.innerHTML = "<i style=\"width:" + m.bond + "%\"></i>";
        card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "羁绊"), this.el("span", "", m.bond)]));
        card.appendChild(bondBar);
      }
      list.appendChild(card);
    }
  },

  /* ---------------- 日志页 ---------------- */

  renderLog() {
    const st = Game.st;
    const box = this.$("log-list");
    box.innerHTML = "";
    if (!st.log.length) {
      box.appendChild(this.el("p", "modal-text", "还没有记录。"));
      return;
    }
    for (const entry of st.log) {
      box.appendChild(this.el("div", "log-item t-" + entry.tone, "【" + entry.month + "月】" + entry.text));
    }
  },

  /* ---------------- 标签页 ---------------- */

  switchTab(name) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    ["board", "members", "log", "sys"].forEach(t => {
      this.$("tab-" + t).classList.toggle("hidden", t !== name);
    });
  },

  initTabs() {
    document.querySelectorAll(".tab").forEach(t => {
      t.onclick = () => this.switchTab(t.dataset.tab);
    });
  },

  /* ---------------- 系统页 ---------------- */

  initSys() {
    this.$("btn-save").onclick = () => this.toast(Game.save() ? "已保存" : "保存失败");
    this.$("btn-load").onclick = () => {
      const st = Game.load();
      if (!st) { this.toast("没有找到存档"); return; }
      this.enterGame(false);
    };
    this.$("btn-export-code").onclick = () => {
      const code = Game.exportCode();
      if (!code) { this.toast("还没有可导出的存档"); return; }
      this.showCodeModal({
        title: "导出存档码",
        sub: "复制下面整段文字并保存到别处（备忘录/聊天框均可）。换目录、换浏览器、换电脑时，用它即可恢复进度。",
        code: code,
        readonly: true,
        confirmLabel: "复制到剪贴板",
        onConfirm: (ta, close) => {
          ta.select();
          let okCopy = false;
          try { okCopy = document.execCommand("copy"); } catch (e) {}
          if (!okCopy && navigator.clipboard) { navigator.clipboard.writeText(ta.value); okCopy = true; }
          close();
          this.toast(okCopy ? "已复制到剪贴板——请粘贴保存好" : "已全选，请手动复制（Ctrl+C）");
        },
      });
    };
    this.$("btn-import-code").onclick = () => {
      this.showCodeModal({
        title: "导入存档码",
        sub: "粘贴之前导出的存档码（以 SG48V1. 开头），确认后覆盖当前进度。",
        code: "",
        readonly: false,
        confirmLabel: "确认导入",
        onConfirm: (ta, close) => {
          const r = Game.importCode(ta.value);
          this.toast(r.msg);
          if (r.ok) { this.renderGame(); close(); }
        },
      });
    };
    this.$("btn-export-file").onclick = () => this.downloadSaveFile();
    this.$("btn-import-file").onclick = () => this.pickSaveFile(() => { this.renderGame(); this.toast("可点击「读取存档」继续经营"); });
    this.$("btn-to-title").onclick = () => {
      if (confirm("放弃当前任期并回到标题？（存档会保留，可从标题「继续」）")) {
        Game.save();
        this.showTitle();
      }
    };
  },

  showTitle() {
    this.showScreen("screen-title");
    this.initTitle();
  },

  /* ---------------- 结局 ---------------- */

  showEnding(grade) {
    const st = Game.st;
    const endingsSrc = st.era === "2026" ? STORY.endings26 : st.era === "2017" ? STORY.endings17 : STORY.endings;
    const ending = endingsSrc[grade] || endingsSrc.C;
    Game.clearSave();
    this.$("ending-rank").textContent = ending.rank;
    this.$("ending-title").textContent = ending.title;
    this.$("ending-text").textContent = ending.text;

    const stats = this.$("ending-stats");
    stats.innerHTML = "";
    const styleNames = st.era === "2026"
      ? { steady: "守成派", content: "内容派", people: "人事派" }
      : st.era === "2017"
      ? { stable: "稳进派", content17: "淬炼派", hype: "造势派" }
      : { pragmatic: "实干派", communicator: "沟通派", visionary: "造势派" };
    const rows = st.era === "2026" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["CGT48", st.cgt.closed
        ? (st.cgt.settleDone ? "✔ 已解散·前成员妥善安置" : "✘ 已解散（安置 " + (st.cgt.settled || 0) + "/3）")
        : st.cgt.open ? "✔ " + st.cgt.openMonth + " 月重启首演" : st.cgt.stage >= 1 ? "重建进行到第 " + st.cgt.stage + " 阶段" : "未启动"],
      ["末位淘汰", "执行 " + st.elim.executed + " · 调往CGT " + st.elim.transferred + " · 缓刑 " + st.elim.defied],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtCancelled ? "✘ 已取消" : st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2017" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["双团开设", (st.branch17.shyOpen ? "✔ SHY48 " + st.branch17.shyOpenMonth + " 月开业" : "SHY48 未开业")
        + "　|　" + (st.branch17.ckgOpen ? "✔ CKG48 " + st.branch17.ckgOpenMonth + " 月开业" : "CKG48 未开业")],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏评价", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["原创公演", Game.origCount(st) + " / 4 套"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["分团", st.branch.announce ? "✔ " + st.branch.city + " · " + st.branch.announceMonth + "月官宣" : "未成立"],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏评价", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ];
    for (const [k, v] of rows) {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", k));
      r.appendChild(this.el("span", "sr-val", v));
      stats.appendChild(r);
    }
    this.showScreen("screen-ending");
    this.$("btn-ending-restart").onclick = () => this.showStart();
    this.$("btn-ending-title").onclick = () => this.showTitle();
    /* 【2017「本部新章」线入口】2016 线结局界面追加「进入下一年」：
       继承 2016 年末成员卡与经营状态，开启本部原创路线（破产结局除外）。 */
    if (st.era === "2016" && grade !== "bankrupt") {
      const btnNext = this.el("button", "btn btn-primary", "进入下一年 →");
      btnNext.id = "btn-ending-next";
      btnNext.onclick = () => {
        Game.carryTo2017();
        this.showPrologue();
      };
      this.$("btn-ending-restart").parentElement.insertBefore(btnNext, this.$("btn-ending-title"));
    }
  },
};
